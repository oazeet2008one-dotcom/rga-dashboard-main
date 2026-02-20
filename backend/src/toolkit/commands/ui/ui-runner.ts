/**
 * =============================================================================
 * UI Runner - Shared Execution Logic
 * =============================================================================
 * 
 * Encapsulates the common boilerplate for executing a command in the CLI:
 * - Setting up observability (Logger, Printer)
 * - Creating ExecutionContext
 * - Resolving Handler
 * - Wrapping execution with Safety Manifest
 * - Handling top-level errors
 */

import { randomUUID } from 'crypto';
import chalk from 'chalk';
import { PrismaClient } from '@prisma/client';
import {
    ICommand,
    TenantId,
    ICommandRegistry,
    ExecutionContextFactory,
    executeWithSafetyManifest,
    ServiceLocator,
    TOKENS
} from '../../core';
import { PinoOpsLogger } from '../../core/observability/ops-logger';
import { ConsoleUiPrinter } from '../../core/observability/ui-printer';
import { RunLogger } from '../../core/observability/run-logger';
import * as Redactor from '../../manifest/redactor';
import { printActionableHints } from '../../core/hints';

export interface RunResult {
    success: boolean;
    data?: unknown;
}

export async function runCommandSafe(
    command: ICommand,
    tenantId: TenantId,
    registry: ICommandRegistry,
    options: { dryRun: boolean }
): Promise<RunResult> {
    const commandName = command.name;
    const runId = randomUUID();
    const env = process.env.TOOLKIT_ENV === 'CI' ? 'CI' : 'LOCAL';

    // 1. Ops Logger
    const opsLogger = new PinoOpsLogger(env, {
        runId,
        command: commandName,
        tenantId: tenantId ? tenantId : 'unknown',
    });

    // 2. UI Printer
    const printer = new ConsoleUiPrinter(env);

    // 3. Facade
    const runLogger = new RunLogger(printer, opsLogger);

    // Create execution context
    const context = ExecutionContextFactory.create({
        tenantId,
        dryRun: options.dryRun,
        verbose: true,
        runId,
        logger: runLogger.ops,
        printer: runLogger.printer,
    });

    // Resolve Handler
    const handler = registry.resolve(command.name);
    if (!handler) {
        console.log(chalk.red(`\nERROR: No handler found for command: ${commandName}\n`));
        return { success: false };
    }

    // Resolve PrismaClient for Safety Manifest
    const prisma = ServiceLocator.resolve<PrismaClient>(TOKENS.PrismaClient);

    // Execute
    runLogger.printer.log('');
    const spinner = runLogger.printer.spinner('Executing...');
    spinner.start();

    try {
        const { result, pipeline } = await executeWithSafetyManifest({
            commandName,
            executionMode: 'CLI',
            context,
            prisma,
            args: {
                dryRun: options.dryRun,
            },
            // @ts-ignore - The types are compatible but TS complains about generic matching
            execute: () => handler.execute(command, context),
        });

        if (result.kind === 'success') {
            spinner.succeed('Command completed successfully');
            if (pipeline?.manifestPath) {
                console.log(chalk.gray(`Manifest: ${pipeline.manifestPath}`));
            }
            return { success: true, data: result.value };
        } else {
            spinner.fail('Command failed');
            console.log(chalk.red(`\nError: ${result.error.message}\n`));
            printActionableHints(commandName, result.error.message);
            if (pipeline?.manifestPath) {
                console.log(chalk.gray(`Manifest: ${pipeline.manifestPath}`));
            }
            return { success: false };
        }
    } catch (error) {
        spinner.fail('Unexpected error');
        runLogger.ops.error('Command execution failed', error instanceof Error ? error : undefined);
        const sanitizedError = Redactor.sanitizeError(error).message;
        runLogger.printer.error(`\n${sanitizedError}\n`);
        printActionableHints(commandName, sanitizedError);
        return { success: false };
    }
}
