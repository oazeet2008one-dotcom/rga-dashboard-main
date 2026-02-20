/**
 * =============================================================================
 * RGA Toolkit CLI - Unified Entry Point
 * =============================================================================
 * 
 * Usage:
 *   npm run dev:toolkit
 * 
 * Unified CLI for toolkit command execution.
 * =============================================================================
 */

import 'reflect-metadata';
import inquirer from 'inquirer';
import * as util from 'node:util'; // New Import
import { emergencyFinalizeAndWrite } from './manifest';
import * as Redactor from './manifest/redactor';
import chalk from 'chalk';
import ora from 'ora';
import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import {
    loadConfiguration,
    initializeContainer,
    disposeContainer,
    ServiceLocator,
    TOKENS,
    runToolkitPreflight,
} from './core';
import { ICommandRegistry, ISessionStore, TenantId } from './core/contracts'; // Added TenantId
import { PinoLogger, FileSessionStore } from './infrastructure';
import { CommandRegistry } from './core/command-registry';

// Service Imports
import { GoogleAdsSeederService, AlertEngine, AlertScenarioService, TenantResetService } from './services';
import {
    SeedDataCommandHandler,
    SeedGoogleAdsCommandHandler,
    AlertScenarioCommandHandler,
    ResetTenantCommandHandler,
    ResetTenantHardCommandHandler,
    SeedUnifiedCommandHandler,
    VerifyScenarioCommandHandler
} from './commands';
import { ScenarioLoader } from './scenarios/scenario-loader';
import { FixtureProvider } from './fixtures/fixture-provider';
import { VerificationRepository } from '../modules/verification/verification.repository';
import { VerificationService } from '../modules/verification/verification.service';
import { AlertRuleEvaluator } from '../modules/verification/rules/alert-rule.evaluator';
import { ReportWriter } from '../modules/verification/report-writer';

// UI Imports (New Architecture)
import { CommandUi } from './commands/ui/command-ui.interface';
import { SeedDataUi } from './commands/ui/seed-data.ui';
import { SeedGoogleAdsUi } from './commands/ui/seed-google-ads.ui';
import { AlertScenarioUi } from './commands/ui/alert-scenario.ui';
import { ResetTenantUi } from './commands/ui/reset-tenant.ui';
import { ResetTenantHardUi } from './commands/ui/reset-tenant-hard.ui';
import { SeedUnifiedUi } from './commands/ui/seed-unified.ui';
import { VerifyScenarioUi } from './commands/ui/verify-scenario.ui';
import { promptForTenant } from './commands/ui/prompts';

const ACTION_CHANGE_TENANT = '__CHANGE_TENANT__';
const ACTION_PREFLIGHT = '__PREFLIGHT__';
const ACTION_EXIT = '__EXIT__';
const REQUIRED_NODE_MAJOR = 20;

function assertSupportedNodeVersion(requiredMajor: number): void {
    const detected = process.versions.node || '';
    const major = Number.parseInt(detected.split('.')[0] || '', 10);
    if (!Number.isFinite(major) || major < requiredMajor) {
        console.error(
            chalk.red(
                `Unsupported Node.js runtime ${detected}. ` +
                `Toolkit CLI requires Node ${requiredMajor}+ (see .nvmrc).`,
            ),
        );
        process.exit(1);
    }
}

async function main(): Promise<void> {
    assertSupportedNodeVersion(REQUIRED_NODE_MAJOR);

    // Install unified crash handlers ONCE before any work
    installProcessHandlers();

    console.clear();
    console.log(chalk.cyan.bold(`
=================================================================
${chalk.white.bold('RGA Dev Toolkit')} (v2.0 - Modular)
${chalk.gray('Production-Grade Developer CLI')}
=================================================================
`));

    // Step 0: Parse Arguments
    const { values, positionals } = util.parseArgs({
        args: process.argv.slice(2),
        options: {
            tenant: { type: 'string', short: 't' },
            headless: { type: 'boolean' },
            nonInteractive: { type: 'boolean' },
            dryRun: { type: 'boolean' }, // Global dry-run flag
            // Command-specific args (passed through)
            scenario: { type: 'string' },
            mode: { type: 'string' },
            seed: { type: 'string' },
            days: { type: 'string' },
            platforms: { type: 'string' },
            allowReal: { type: 'string' },
        },
        allowPositionals: true,
        strict: false // Allow unknown args for flexibility
    });

    const targetCommand = positionals[0];
    const isHeadless = values.headless || values.nonInteractive || !!targetCommand;

    // Step 1: Load Configuration (Fail Fast)
    const spinner = ora('Initializing...').start();

    let config;
    try {
        config = loadConfiguration();
        spinner.succeed('Configuration loaded');
    } catch (error) {
        spinner.fail('Configuration error');
        console.error(chalk.red(Redactor.sanitizeError(error).message));
        process.exit(1);
    }

    // Step 2: Initialize DI Container
    spinner.start('Initializing services...');

    try {
        initializeContainer(config);

        // ... (Register Services - SAME AS BEFORE) ...

        // Register infrastructure implementations
        ServiceLocator.register(TOKENS.Logger, PinoLogger);
        // Use factory for SessionStore to avoid DI issues with optional fs
        container.register(TOKENS.SessionStore, { useFactory: () => new FileSessionStore() });
        ServiceLocator.register(TOKENS.CommandRegistry, CommandRegistry);

        // Register services with DI
        container.register(GoogleAdsSeederService, { useClass: GoogleAdsSeederService });
        container.register(AlertEngine, { useClass: AlertEngine });
        container.register(AlertScenarioService, { useClass: AlertScenarioService });
        container.register(TenantResetService, { useClass: TenantResetService });

        // Register command handlers with DI
        container.register(SeedDataCommandHandler, { useClass: SeedDataCommandHandler });
        container.register(SeedGoogleAdsCommandHandler, { useClass: SeedGoogleAdsCommandHandler });
        container.register(AlertScenarioCommandHandler, { useClass: AlertScenarioCommandHandler });
        container.register(ResetTenantCommandHandler, { useClass: ResetTenantCommandHandler });
        container.register(ResetTenantHardCommandHandler, { useClass: ResetTenantHardCommandHandler });
        container.register(SeedUnifiedCommandHandler, { useClass: SeedUnifiedCommandHandler });
        container.register(VerifyScenarioCommandHandler, { useClass: VerifyScenarioCommandHandler });
        container.register(ScenarioLoader, { useClass: ScenarioLoader });
        container.registerInstance(FixtureProvider, new FixtureProvider());
        const prismaClient = ServiceLocator.resolve<PrismaClient>(TOKENS.PrismaClient);
        const scenarioLoader = container.resolve(ScenarioLoader);
        const verificationRepository = new VerificationRepository(prismaClient);
        const verificationService = new VerificationService(
            verificationRepository,
            scenarioLoader,
            new AlertRuleEvaluator(),
        );
        container.registerInstance(TOKENS.VerificationService, verificationService);
        container.registerInstance(TOKENS.ReportWriter, new ReportWriter());

        // Get registry and register all handlers
        const registry = ServiceLocator.resolve<ICommandRegistry>(TOKENS.CommandRegistry);

        // Register new architecture commands
        const seedDataHandler = container.resolve(SeedDataCommandHandler);
        const seedGoogleAdsHandler = container.resolve(SeedGoogleAdsCommandHandler);
        const alertScenarioHandler = container.resolve(AlertScenarioCommandHandler);
        const resetTenantHandler = container.resolve(ResetTenantCommandHandler);
        const resetTenantHardHandler = container.resolve(ResetTenantHardCommandHandler);
        const seedUnifiedHandler = container.resolve(SeedUnifiedCommandHandler);
        const verifyScenarioHandler = container.resolve(VerifyScenarioCommandHandler);

        registry.register(seedUnifiedHandler);
        registry.register(verifyScenarioHandler);
        registry.register(seedDataHandler);
        registry.register(seedGoogleAdsHandler);
        registry.register(alertScenarioHandler);
        registry.register(resetTenantHandler);
        registry.register(resetTenantHardHandler);

        spinner.succeed('Services initialized');
    } catch (error) {
        spinner.fail('Initialization error');
        console.error(chalk.red(Redactor.sanitizeError(error).message));
        process.exit(1);
    }

    // Step 3: Register UI Handlers
    const uiRegistry = new Map<string, CommandUi>();
    const registerUi = (ui: CommandUi) => uiRegistry.set(ui.name, ui);

    registerUi(new SeedUnifiedUi());
    registerUi(new VerifyScenarioUi());
    registerUi(new SeedDataUi());
    registerUi(new SeedGoogleAdsUi());
    registerUi(new AlertScenarioUi());
    registerUi(new ResetTenantUi());
    registerUi(new ResetTenantHardUi());

    // Step 4: Restore/Resolve Tenant
    const sessionStore = ServiceLocator.resolve<ISessionStore>(TOKENS.SessionStore);
    const prisma = ServiceLocator.resolve<PrismaClient>(TOKENS.PrismaClient);

    let tenantId = values.tenant as TenantId | undefined;
    if (!tenantId) {
        tenantId = (await sessionStore.getLastTenantId()) as TenantId;
    }

    // Step 5: Execute (Headless or Interactive)
    if (targetCommand) {
        // HEADLESS MODE
        if (!uiRegistry.has(targetCommand)) {
            console.error(chalk.red(`Error: Unknown command "${targetCommand}"`));
            console.log('Available commands:', Array.from(uiRegistry.keys()).join(', '));
            await disposeContainer();
            process.exit(1);
        }

        if (!tenantId) {
            console.error(chalk.red('Error: Tenant ID is required. Use --tenant <id> or set a default.'));
            await disposeContainer();
            process.exit(1);
        }

        const ui = uiRegistry.get(targetCommand)!;
        try {
            await ui.execute(tenantId, ServiceLocator.resolve(TOKENS.CommandRegistry), values);
            await disposeContainer();
            process.exit(0);
        } catch (error) {
            console.error(chalk.red(`\nCommand execution failed: ${Redactor.sanitizeError(error).message}\n`));
            await disposeContainer();
            process.exit(1);
        }
    }

    // INTERACTIVE MODE (Fallback loop)
    let continueLoop = true;

    while (continueLoop) {
        // Show available commands
        const registry = ServiceLocator.resolve<ICommandRegistry>(TOKENS.CommandRegistry);
        const commands = registry.listAll();

        const choices = [
            ...commands.map(({ command, handler }) => ({
                name: `${handler.getMetadata().displayName}${['seed-unified-scenario', 'verify-scenario'].includes(command.name)
                    ? ' (Recommended)'
                    : ''
                    }`,
                value: command.name,
            })),
            new inquirer.Separator(chalk.gray('-'.repeat(45))),
            { name: '[Preflight] Toolkit Preflight (GO/NO-GO)', value: ACTION_PREFLIGHT },
            { name: '[Tenant] Change Tenant', value: ACTION_CHANGE_TENANT },
            { name: '[Exit] Exit', value: ACTION_EXIT },
        ];

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: tenantId
                    ? `What would you like to do? (Tenant: ${chalk.cyan(tenantId)})`
                    : 'Select an action:',
                choices,
                pageSize: 12,
            },
        ]);

        if (action === ACTION_EXIT) {
            continueLoop = false;
            console.log(chalk.cyan('\nGoodbye!\n'));
            break;
        }

        if (action === ACTION_PREFLIGHT) {
            await runPreflightAndDisplay(prisma);
            continue;
        }

        if (action === ACTION_CHANGE_TENANT) {
            tenantId = await promptForTenant(prisma);
            if (tenantId) {
                await sessionStore.setLastTenantId(tenantId);
            }
            continue;
        }

        if (!tenantId) {
            console.log(chalk.yellow('\nWARNING: Please select a tenant first\n'));
            tenantId = await promptForTenant(prisma);
            if (tenantId) {
                await sessionStore.setLastTenantId(tenantId);
            }
            continue;
        }

        // Execute selected command via UI Registry
        if (uiRegistry.has(action)) {
            const ui = uiRegistry.get(action)!;
            try {
                await ui.execute(tenantId, registry);
            } catch (error) {
                console.error(chalk.red(`\nCommand execution failed: ${Redactor.sanitizeError(error).message}\n`));
            }
        } else {
            console.log(chalk.yellow(`\nWARNING: Command "${action}" implemented in registry but missing UI handler.\n`));
        }
    }

    // Cleanup
    await disposeContainer();
    process.exit(0);
}

async function runPreflightAndDisplay(prisma: PrismaClient): Promise<void> {
    const spinner = ora('Running toolkit preflight checks...').start();
    try {
        const result = await runToolkitPreflight(prisma, { requiredNodeMajor: 20 });
        spinner.stop();

        console.log(chalk.cyan('\nToolkit Preflight Summary'));
        for (const check of result.checks) {
            const icon = check.status === 'PASS' ? chalk.green('PASS') : chalk.red('FAIL');
            console.log(`- ${icon} ${check.id}: ${check.message}`);
        }

        console.log(chalk.cyan('\nRecommended Actions'));
        for (const action of result.actions) {
            console.log(`- ${action}`);
        }

        console.log(
            result.ok
                ? chalk.green('\nGO: Toolkit environment is ready.\n')
                : chalk.red('\nNO-GO: Fix failed checks before running write commands.\n'),
        );
    } catch (error) {
        spinner.fail('Preflight failed unexpectedly');
        console.log(chalk.red(Redactor.sanitizeError(error).message));
    }

    await inquirer.prompt([
        {
            type: 'input',
            name: 'continue',
            message: chalk.gray('Press Enter to continue...'),
        },
    ]);
}

// Unified process crash handlers - installed ONCE at startup
let processHandlersInstalled = false;

function installProcessHandlers(): void {
    if (processHandlersInstalled) return;
    processHandlersInstalled = true;

    process.on('SIGINT', () => {
        // Best-effort manifest emergency finalize (never throws)
        emergencyFinalizeAndWrite('SIGINT');
        console.error('\n[cli] SIGINT received - exiting with code 130');
        process.exit(130);
    });

    process.on('uncaughtException', (err: Error) => {
        console.error(`[cli] uncaughtException: ${Redactor.sanitizeError(err).message}`);
        emergencyFinalizeAndWrite('uncaughtException');
        process.exit(1);
    });

    process.on('unhandledRejection', (reason: unknown) => {
        const msg = Redactor.sanitizeError(reason).message;
        console.error(`[cli] unhandledRejection: ${msg}`);
        emergencyFinalizeAndWrite('unhandledRejection');
        process.exit(1);
    });
}

// Run
main().catch(async (error) => {
    console.error(chalk.red('Fatal error:'), Redactor.sanitizeError(error).message);
    await disposeContainer();
    process.exit(1);
});
