import {
    CommandPipelineResult,
    CommandClassification,
    executeWithManifest,
} from '../manifest';
import { PrismaClient } from '@prisma/client';
import {
    IExecutionContext,
    Result,
    ToolkitError,
} from './contracts';
import {
    assertToolkitWriteSchemaParity,
    SchemaParityPreflightError,
} from './write-schema-preflight';

const MANIFEST_WRAPPED_COMMANDS = new Set([
    'seed-data',
    'seed-google-ads',
    'alert-scenario',
    'reset-tenant',
    'reset-tenant-hard',
    'seed-unified-scenario', // Added unified seed to safety list
    'verify-scenario', // Added verify to safety list
]);

class SafetyBlockedError extends ToolkitError {
    readonly code = 'SAFETY_BLOCK';
    readonly isRecoverable = false;
}

class PipelineExecutionError extends ToolkitError {
    readonly code = 'PIPELINE_EXECUTION_FAILED';
    readonly isRecoverable = false;
}

class SchemaParityBlockedError extends ToolkitError {
    readonly code = 'SCHEMA_PARITY_VIOLATION';
    readonly isRecoverable = false;
}

function classifyCommand(commandName: string): CommandClassification {
    if (commandName === 'reset-tenant' || commandName === 'reset-tenant-hard') {
        return 'DESTRUCTIVE';
    }
    return 'WRITE';
}

export function shouldUseManifestSafety(commandName: string): boolean {
    return MANIFEST_WRAPPED_COMMANDS.has(commandName);
}

async function assertSchemaParityPreflight(prisma: PrismaClient): Promise<void> {
    await assertToolkitWriteSchemaParity(prisma);
}

export async function executeWithSafetyManifest<TResult>(params: {
    commandName: string;
    executionMode: 'CLI' | 'INTERNAL_API';
    context: IExecutionContext;
    prisma: PrismaClient;
    args?: Record<string, unknown>;
    skipSchemaParityPreflight?: boolean;
    execute: () => Promise<Result<TResult>>;
}): Promise<{ result: Result<TResult>; pipeline: CommandPipelineResult | null }> {
    const {
        commandName,
        executionMode,
        context,
        args,
        execute,
        prisma,
        skipSchemaParityPreflight = false,
    } = params;

    if (!shouldUseManifestSafety(commandName)) {
        return { result: await execute(), pipeline: null };
    }

    let handlerResult: Result<TResult> | null = null;

    const pipeline = await executeWithManifest({
        config: {
            executionMode,
            commandName,
            commandClassification: classifyCommand(commandName),
            args: {
                tenantId: context.tenantId,
                ...args,
            },
            flags: {
                dryRun: context.dryRun,
                noDryRun: !context.dryRun,
                verbose: context.verbose,
            },
        },
        execute: async (builder) => {
            builder.setTenant({
                tenantId: context.tenantId,
                tenantSlug: null,
                tenantDisplayName: null,
                tenantResolution: 'EXPLICIT',
            });

            const preflightStep = builder.startStep('VALIDATE_INPUT');
            if (skipSchemaParityPreflight) {
                preflightStep.close({
                    status: 'SKIPPED',
                    summary: 'Schema parity preflight skipped by test override',
                });
            } else {
                try {
                    await assertSchemaParityPreflight(prisma);
                    preflightStep.close({
                        status: 'SUCCESS',
                        summary: 'Schema parity preflight passed',
                    });
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    const code =
                        error instanceof SchemaParityPreflightError
                            ? error.code
                            : 'SCHEMA_PARITY_VIOLATION';

                    preflightStep.close({
                        status: 'FAILED',
                        summary: message,
                        error: {
                            code,
                            message,
                            isRecoverable: false,
                        },
                    });
                    builder.addError({
                        code,
                        message,
                        isRecoverable: false,
                    });
                    return { status: 'BLOCKED', exitCode: 78 };
                }
            }

            const executeStep = builder.startStep('EXECUTE');

            try {
                handlerResult = await execute();

                if (handlerResult.kind === 'success') {
                    executeStep.close({
                        status: 'SUCCESS',
                        summary: 'Command completed successfully',
                    });
                    return { status: 'SUCCESS', exitCode: 0 };
                }

                executeStep.close({
                    status: 'FAILED',
                    summary: handlerResult.error.message,
                    error: {
                        code: handlerResult.error.code || 'COMMAND_FAILED',
                        message: handlerResult.error.message,
                        isRecoverable: Boolean(handlerResult.error.isRecoverable),
                    },
                });
                builder.addError(handlerResult.error);
                return { status: 'FAILED', exitCode: 1 };
            } catch (error) {
                builder.addError(error);
                executeStep.close({
                    status: 'FAILED',
                    summary: error instanceof Error ? error.message : String(error),
                    error: {
                        code: 'UNEXPECTED_ERROR',
                        message: error instanceof Error ? error.message : String(error),
                        isRecoverable: false,
                    },
                });
                return { status: 'FAILED', exitCode: 1 };
            }
        },
    });

    if (pipeline.status === 'BLOCKED') {
        const blockedStepSummary = pipeline.manifest?.steps
            ?.find((step) => step.status === 'FAILED')
            ?.summary;
        const blockedStepName = pipeline.manifest?.steps
            ?.find((step) => step.status === 'FAILED')
            ?.name;
        const reason = blockedStepSummary ?? 'Execution blocked by safety gate';

        if (blockedStepName === 'VALIDATE_INPUT') {
            return {
                result: Result.failure(new SchemaParityBlockedError(reason)),
                pipeline,
            };
        }

        return {
            result: Result.failure(new SafetyBlockedError(reason)),
            pipeline,
        };
    }

    if (handlerResult) {
        return { result: handlerResult, pipeline };
    }

    return {
        result: Result.failure(
            new PipelineExecutionError('Pipeline completed without command result'),
        ),
        pipeline,
    };
}
