/**
 * =============================================================================
 * Reset Tenant Command Handler
 * =============================================================================
 *
 * Handles both partial and hard reset commands.
 * Delegates to TenantResetService for actual operations.
 *
 * Design Principles:
 * - Safety First: Multiple confirmation layers for destructive operations
 * - Clear Feedback: Detailed reporting of what was deleted
 * - Explicit Intent: Hard reset requires confirmation token flow
 *
 * MVP Scope (Locked):
 * - Two separate commands for two modes
 * - Confirmation token generation for hard reset
 * - Pretty display of deletion results
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { ICommandHandler, IExecutionContext, Result, ILogger } from '../core/contracts';
import { BaseCommandHandler } from './base-command';
import {
    ResetTenantCommand,
    ResetTenantHardCommand,
    RESET_TENANT_COMMAND,
    RESET_TENANT_HARD_COMMAND,
} from './definitions/reset-tenant.command';
import {
    TenantResetService,
    ResetResult,
} from '../services/tenant-reset.service';
import { TOKENS } from '../core/container';

// ============================================================================
// Handler for Partial Reset (Default)
// ============================================================================

@injectable()
export class ResetTenantCommandHandler
    extends BaseCommandHandler<ResetTenantCommand, ResetResult>
    implements ICommandHandler<ResetTenantCommand, ResetResult>
{
    readonly commandName = RESET_TENANT_COMMAND;

    private readonly resetService: TenantResetService;

    constructor(
        @inject(TOKENS.Logger) logger: ILogger,
        @inject(TenantResetService) resetService: TenantResetService
    ) {
        super({ logger });
        this.resetService = resetService;
    }

    canHandle(command: unknown): command is ResetTenantCommand {
        return (
            typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === RESET_TENANT_COMMAND
        );
    }

    getMetadata() {
        return {
            name: RESET_TENANT_COMMAND,
            displayName: 'Reset Tenant (Partial)',
            description: 'Remove operational data while preserving campaigns and alert definitions',
            icon: '🧹',
            category: 'maintenance' as const,
            estimatedDurationSeconds: 10,
            risks: [
                'Deletes all metrics and historical data',
                'Deletes triggered alerts and their history',
                'Preserves campaigns and alert rule definitions',
            ],
        };
    }

    validate(command: ResetTenantCommand): Result<void> {
        if (!command.tenantId || typeof command.tenantId !== 'string') {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'tenantId is required and must be a string',
                    isRecoverable: true,
                },
            };
        }

        return { kind: 'success', value: undefined };
    }

    protected async executeCore(
        command: ResetTenantCommand,
        context: IExecutionContext
    ): Promise<Result<ResetResult>> {
        this.logger.info('Starting partial tenant reset', {
            tenantId: command.tenantId,
            dryRun: context.dryRun,
        });

        if (context.dryRun) {
            this.logger.info('Dry run mode - no data will be deleted');
            return {
                kind: 'success',
                value: {
                    success: true,
                    mode: 'PARTIAL',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        deletedMetrics: 0,
                        deletedAlerts: 0,
                        durationMs: 0,
                    },
                },
            };
        }

        const result = await this.resetService.partialReset(command.tenantId);

        if (result.success) {
            this.logger.info('Partial reset completed', {
                tenantId: command.tenantId,
                deletedMetrics: result.data?.deletedMetrics ?? 0,
                deletedAlerts: result.data?.deletedAlerts ?? 0,
                durationMs: result.data?.durationMs ?? 0,
            });
            return { kind: 'success', value: result };
        } else {
            const error = new Error(result.message);
            this.logger.error('Partial reset failed', error, {
                tenantId: command.tenantId,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'ResetError',
                    code: 'RESET_FAILED',
                    message: result.message,
                    isRecoverable: true,
                },
            };
        }
    }
}

// ============================================================================
// Handler for Hard Reset (Destructive)
// ============================================================================

@injectable()
export class ResetTenantHardCommandHandler
    extends BaseCommandHandler<ResetTenantHardCommand, ResetResult>
    implements ICommandHandler<ResetTenantHardCommand, ResetResult>
{
    readonly commandName = RESET_TENANT_HARD_COMMAND;

    private readonly resetService: TenantResetService;

    constructor(
        @inject(TOKENS.Logger) logger: ILogger,
        @inject(TenantResetService) resetService: TenantResetService
    ) {
        super({ logger });
        this.resetService = resetService;
    }

    canHandle(command: unknown): command is ResetTenantHardCommand {
        return (
            typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === RESET_TENANT_HARD_COMMAND
        );
    }

    getMetadata() {
        return {
            name: RESET_TENANT_HARD_COMMAND,
            displayName: 'Reset Tenant (HARD)',
            description: 'DELETE ALL DATA including campaigns and alert definitions - DESTRUCTIVE',
            icon: '☠️',
            category: 'maintenance' as const,
            estimatedDurationSeconds: 15,
            risks: [
                'DELETES ALL METRICS - historical data lost',
                'DELETES ALL CAMPAIGNS - campaign definitions lost',
                'DELETES ALL ALERT RULES - must recreate from scratch',
                'DELETES ALL ALERT HISTORY',
                'TENANT IDENTITY AND USERS PRESERVED',
                'THIS ACTION CANNOT BE UNDONE',
            ],
        };
    }

    validate(command: ResetTenantHardCommand): Result<void> {
        if (!command.tenantId || typeof command.tenantId !== 'string') {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'tenantId is required and must be a string',
                    isRecoverable: true,
                },
            };
        }

        if (!command.confirmation) {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'MISSING_CONFIRMATION',
                    message: 'Hard reset requires confirmation token. Generate token first.',
                    isRecoverable: true,
                },
            };
        }

        return { kind: 'success', value: undefined };
    }

    protected async executeCore(
        command: ResetTenantHardCommand,
        context: IExecutionContext
    ): Promise<Result<ResetResult>> {
        this.logger.info('Starting HARD tenant reset', {
            tenantId: command.tenantId,
            confirmedAt: command.confirmation.confirmedAt,
            dryRun: context.dryRun,
        });

        if (context.dryRun) {
            this.logger.info('Dry run mode - no data will be deleted');
            return {
                kind: 'success',
                value: {
                    success: true,
                    mode: 'HARD',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        deletedMetrics: 0,
                        deletedAlerts: 0,
                        deletedCampaigns: 0,
                        deletedAlertDefinitions: 0,
                        durationMs: 0,
                    },
                },
            };
        }

        const result = await this.resetService.hardReset(
            command.tenantId,
            command.confirmation
        );

        if (result.success) {
            this.logger.info('Hard reset completed', {
                tenantId: command.tenantId,
                deletedMetrics: result.data?.deletedMetrics ?? 0,
                deletedCampaigns: result.data?.deletedCampaigns ?? 0,
                deletedAlertDefinitions: result.data?.deletedAlertDefinitions ?? 0,
                durationMs: result.data?.durationMs ?? 0,
            });
            return { kind: 'success', value: result };
        } else {
            const error = new Error(result.message);
            this.logger.error('Hard reset failed', error, {
                tenantId: command.tenantId,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'ResetError',
                    code: 'RESET_FAILED',
                    message: result.message,
                    isRecoverable: result.error?.includes('expired') ?? true,
                },
            };
        }
    }

    /**
     * Generate confirmation token for hard reset
     * Call this before executing hard reset
     */
    generateConfirmationToken(tenantId: string): { token: string; expiresAt: Date } {
        return this.resetService.generateConfirmationToken(tenantId);
    }
}
