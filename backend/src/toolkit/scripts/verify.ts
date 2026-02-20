import 'reflect-metadata';
import { container } from 'tsyringe';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
    loadConfiguration,
    initializeContainer,
    disposeContainer,
    ServiceLocator,
    TOKENS,
    ExecutionContextFactory,
    createTenantId,
} from '../core';
import { PinoLogger } from '../infrastructure';
import { CommandRegistry } from '../core/command-registry';
import { VerifyScenarioCommandHandler, VerifyScenarioCommand } from '../commands/verify-scenario.command';
import { ScenarioLoader } from '../scenarios/scenario-loader';
import { FixtureProvider } from '../fixtures/fixture-provider';
import { PinoOpsLogger } from '../core/observability/ops-logger';
import { ConsoleUiPrinter } from '../core/observability/ui-printer';
import { RunLogger } from '../core/observability/run-logger';
import * as path from 'path';
import { OutputPathPolicyError, resolveOutputDir } from '../core/output-path-policy';
import { VerificationRepository } from '../../modules/verification/verification.repository';
import { VerificationService } from '../../modules/verification/verification.service';
import { AlertRuleEvaluator } from '../../modules/verification/rules/alert-rule.evaluator';
import { ReportWriter } from '../../modules/verification/report-writer';

async function main() {
    const args = process.argv.slice(2);
    const flags: Record<string, string | boolean> = {};

    // Simple args parsing
    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const parts = arg.substring(2).split('=');
            flags[parts[0]] = parts.length > 1 ? parts[1] : true;
        } else if (!flags['_positional']) {
            flags['_positional'] = arg;
        }
    });

    const scenarioId = (flags['_positional'] as string) || (flags['scenario'] as string);
    const tenantId = flags['tenant'] as string | undefined;

    // Default to dry-run (safe) unless --no-dry-run is specified
    const dryRun = !flags['no-dry-run'];

    if (!scenarioId || !tenantId) {
        console.error('Usage: verify.ts <scenario-id> --tenant=<tenant-id> [--no-dry-run] [--output-dir=<dir>]');
        process.exit(2);
    }

    try {
        const config = loadConfiguration();
        initializeContainer(config);

        ServiceLocator.register(TOKENS.Logger, PinoLogger);
        ServiceLocator.register(TOKENS.CommandRegistry, CommandRegistry);

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

        const handler = container.resolve(VerifyScenarioCommandHandler);
        const runId = randomUUID();
        const env = process.env.TOOLKIT_ENV === 'CI' ? 'CI' : 'LOCAL';
        const runLogger = new RunLogger(
            new ConsoleUiPrinter(env),
            new PinoOpsLogger(env, { runId, command: 'verify-scenario', tenantId }),
        );
        const context = ExecutionContextFactory.create({
            tenantId: createTenantId(tenantId),
            dryRun,
            verbose: true,
            runId,
            logger: runLogger.ops,
            printer: runLogger.printer,
        });

        const requestedOutputDir = (flags['output-dir'] as string) || path.join(process.cwd(), 'artifacts/reports');
        let outputDir: string;
        try {
            outputDir = resolveOutputDir('report', requestedOutputDir);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Verification Error: ${message}`);
            process.exit(error instanceof OutputPathPolicyError ? error.exitCode : 78);
            return;
        }

        const command = new VerifyScenarioCommand({
            scenarioId,
            tenantId,
            dryRun,
            outputDir
        });

        console.log(`Starting verification for scenario: ${scenarioId} (Tenant: ${tenantId})`);
        if (dryRun) console.log('Mode: DRY-RUN (No artifacts will be written)');

        const result = await handler.execute(command, context);

        if (result.kind === 'success') {
            const { status, reportPath, summary } = result.value;
            console.log(`Verification Status: ${status}`);
            console.log(`Report: ${reportPath}`);
            if (status === 'FAIL') process.exit(10); // FAIL = 10 per Contract
            if (status === 'PASS' || status === 'WARN') process.exit(0);
        } else {
            console.error(`Verification Error: ${result.error.message}`);
            process.exit(1);
        }

    } catch (e: any) {
        console.error('Fatal Error:', e.message);
        process.exit(1);
    } finally {
        await disposeContainer();
    }
}

main();
