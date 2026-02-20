/**
 * =============================================================================
 * Execution Trigger Service
 * =============================================================================
 *
 * Core control plane for starting alert executions.
 *
 * Design Principles:
 * - Stateless: No instance state
 * - Deterministic: Same input → same output
 * - Transport-agnostic: No CLI/HTTP/WS logic
 * - No scheduling: No time-based logic
 * - No persistence: In-memory tracking only
 *
 * Responsibility:
 * - Accept execution start requests
 * - Validate preconditions
 * - Create execution context
 * - Delegate to AlertExecutionService
 * - Track execution lifecycle
 *
 * Non-Responsibility:
 * - WHEN to trigger (scheduling)
 * - WHERE to trigger (transport)
 * - WHAT to evaluate (delegated to AlertExecutionService)
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { ILogger, TOKENS } from '../core';
import {
    AlertExecutionService,
    ExecutionContext,
    ExecutionMode,
    IRuleProvider,
    IMetricProvider,
    ExecutionResult,
} from '../services/alert-execution.service';
import {
    ExecutionTrigger,
    ExecutionStartRequest,
    ExecutionStartResult,
    ExecutionState,
    ExecutionStatus,
    TriggerType,
    createExecutionTrigger,
    createExecutionState,
    createStartSuccess,
    createStartRejection,
    transitionState,
    isTerminalStatus,
} from './execution-trigger.model';
import { ExecutionHistoryService } from '../history/execution-history.service';

// =============================================================================
// Service Configuration
// =============================================================================

export interface TriggerServiceConfig {
    /**
     * Maximum number of concurrent executions per tenant
     * 0 = unlimited
     */
    readonly maxConcurrentPerTenant: number;

    /**
     * Whether to allow dry-run executions
     */
    readonly allowDryRun: boolean;
}

const DEFAULT_CONFIG: TriggerServiceConfig = {
    maxConcurrentPerTenant: 0, // Unlimited
    allowDryRun: true,
};

// =============================================================================
// Validation Result
// =============================================================================

interface ValidationResult {
    readonly valid: boolean;
    readonly errors: string[];
}

// =============================================================================
// Execution Trigger Service
// =============================================================================

@injectable()
export class ExecutionTriggerService {
    /**
     * In-memory tracking of execution states
     * This is NOT persistence - just active execution tracking
     */
    private executionStates: Map<string, ExecutionState> = new Map();

    constructor(
        @inject(AlertExecutionService)
        private readonly alertExecutionService: AlertExecutionService,
        @inject(TOKENS.Logger) private readonly logger: ILogger,
        @inject('ExecutionHistoryService')
        private readonly historyService?: ExecutionHistoryService,
        private readonly config: TriggerServiceConfig = DEFAULT_CONFIG
    ) { }

    // =========================================================================
    // Core API
    // =========================================================================

    /**
     * Start a new execution
     *
     * FLOW:
     * 1. Validate request
     * 2. Create execution trigger
     * 3. Create execution state (CREATED)
     * 4. Check preconditions
     * 5. Transition to STARTED
     * 6. Delegate to AlertExecutionService
     * 7. Transition to COMPLETED/FAILED
     * 8. Return result
     *
     * This is the SINGLE ENTRY POINT for execution starts.
     */
    async startExecution(
        request: ExecutionStartRequest,
        ruleProvider: IRuleProvider,
        metricProvider: IMetricProvider
    ): Promise<ExecutionStartResult> {
        this.logger.info('Execution start requested', {
            tenantId: request.tenantId,
            triggerType: request.triggerType,
            requestedBy: request.requestedBy,
        });

        // Step 1: Validate request
        const validation = this.validateRequest(request);
        if (!validation.valid) {
            this.logger.warn('Execution request validation failed', {
                errors: validation.errors,
                tenantId: request.tenantId,
            });
            return createStartRejection(
                'Validation failed',
                validation.errors
            );
        }

        // Step 2: Create execution trigger
        const trigger = createExecutionTrigger(request);

        // Step 3: Create initial state
        let state = createExecutionState(trigger);
        this.executionStates.set(trigger.executionId, state);

        // Step 4: Check preconditions
        const preconditions = this.checkPreconditions(trigger);
        if (!preconditions.valid) {
            this.logger.warn('Execution preconditions not met', {
                executionId: trigger.executionId,
                errors: preconditions.errors,
            });
            state = this.updateState(
                trigger.executionId,
                'CANCELLED',
                preconditions.errors.join(', ')
            )!;
            return createStartRejection(
                preconditions.errors.join(', '),
                preconditions.errors,
                trigger.executionId
            );
        }

        // Step 5: Transition to STARTED
        state = this.updateState(trigger.executionId, 'STARTED')!;
        this.logger.info('Execution started', {
            executionId: trigger.executionId,
            tenantId: trigger.tenantId,
        });

        try {
            // Step 6: Delegate to AlertExecutionService
            const executionContext = this.buildExecutionContext(trigger);

            const result = await this.alertExecutionService.execute(
                executionContext,
                ruleProvider,
                metricProvider
            );

            // Step 7: Transition based on result
            const finalStatus: ExecutionStatus =
                result.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED';

            state = this.updateState(
                trigger.executionId,
                finalStatus,
                result.error?.message
            )!;

            this.logger.info('Execution completed', {
                executionId: trigger.executionId,
                status: finalStatus,
                triggeredAlerts: result.summary.triggeredCount,
            });

            // Step 8: Record execution history (best effort)
            if (this.historyService) {
                try {
                    await this.historyService.recordExecution(state, result);
                } catch (historyError) {
                    // History failure should not fail execution
                    this.logger.warn('Failed to record execution history', {
                        executionId: trigger.executionId,
                        error: (historyError as Error).message,
                    });
                }
            }

            // Step 9: Return success
            return createStartSuccess(
                trigger.executionId,
                finalStatus
            );
        } catch (error) {
            // Handle unexpected errors
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            state = this.updateState(
                trigger.executionId,
                'FAILED',
                errorMessage
            )!;

            this.logger.error(
                'Execution failed with unexpected error',
                error instanceof Error ? error : new Error(String(error)),
                { executionId: trigger.executionId }
            );

            // Record failure in history (best effort)
            if (this.historyService) {
                try {
                    const failedResult: ExecutionResult = {
                        runId: trigger.executionId,
                        context: this.buildExecutionContext(trigger),
                        timing: {
                            startedAt: state.startedAt ?? trigger.createdAt,
                            completedAt: state.completedAt ?? state.startedAt ?? trigger.createdAt,
                            durationMs: 0,
                        },
                        summary: {
                            totalRules: 0,
                            enabledRules: 0,
                            triggeredCount: 0,
                            notTriggeredCount: 0,
                            snapshotsEvaluated: 0,
                        },
                        triggeredAlerts: [],
                        status: 'FAILED',
                        error: {
                            message: errorMessage,
                            code: 'EXECUTION_FAILED',
                        },
                    };
                    await this.historyService.recordExecution(state, failedResult);
                } catch (historyError) {
                    // History failure should not fail execution
                    this.logger.warn('Failed to record execution history', {
                        executionId: trigger.executionId,
                        error: (historyError as Error).message,
                    });
                }
            }

            return createStartRejection(
                errorMessage,
                [errorMessage],
                trigger.executionId
            );
        }
    }

    /**
     * Cancel an in-progress execution
     *
     * Can only cancel executions that are not in terminal state.
     */
    cancelExecution(
        executionId: string,
        reason: string,
        cancelledBy: string
    ): boolean {
        const state = this.executionStates.get(executionId);

        if (!state) {
            this.logger.warn('Cannot cancel: execution not found', {
                executionId,
            });
            return false;
        }

        if (isTerminalStatus(state.status)) {
            this.logger.warn(
                'Cannot cancel: execution already in terminal state',
                { executionId, status: state.status }
            );
            return false;
        }

        const newState = this.updateState(
            executionId,
            'CANCELLED',
            `Cancelled by ${cancelledBy}: ${reason}`
        );

        if (newState) {
            this.logger.info('Execution cancelled', {
                executionId,
                cancelledBy,
                reason,
            });
            return true;
        }

        return false;
    }

    /**
     * Get current state of an execution
     */
    getExecutionState(executionId: string): ExecutionState | null {
        return this.executionStates.get(executionId) ?? null;
    }

    /**
     * Get all active (non-terminal) executions for a tenant
     */
    getActiveExecutions(tenantId: string): ExecutionState[] {
        return Array.from(this.executionStates.values()).filter(
            (state) =>
                state.trigger.tenantId === tenantId &&
                !isTerminalStatus(state.status)
        );
    }

    /**
     * Clean up terminal executions from memory
     * Call periodically to prevent memory growth
     */
    cleanupTerminalExecutions(maxAgeMs: number = 3600000, now?: Date): number {
        const currentTime = now ?? new Date();
        const nowMs = currentTime.getTime();
        let cleaned = 0;

        for (const [id, state] of this.executionStates) {
            if (
                isTerminalStatus(state.status) &&
                state.completedAt &&
                nowMs - state.completedAt.getTime() > maxAgeMs
            ) {
                this.executionStates.delete(id);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.debug(`Cleaned up ${cleaned} terminal executions`);
        }

        return cleaned;
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    /**
     * Validate the start request
     */
    private validateRequest(request: ExecutionStartRequest): ValidationResult {
        const errors: string[] = [];

        if (!request.tenantId || request.tenantId.trim() === '') {
            errors.push('tenantId is required');
        }

        if (!request.requestedBy || request.requestedBy.trim() === '') {
            errors.push('requestedBy is required');
        }

        const validTriggerTypes: TriggerType[] = ['MANUAL', 'PROGRAMMATIC'];
        if (!validTriggerTypes.includes(request.triggerType)) {
            errors.push(
                `triggerType must be one of: ${validTriggerTypes.join(', ')}`
            );
        }

        if (request.dryRun && !this.config.allowDryRun) {
            errors.push('Dry run is not allowed');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Check preconditions before starting
     */
    private checkPreconditions(trigger: ExecutionTrigger): ValidationResult {
        const errors: string[] = [];

        if (this.config.maxConcurrentPerTenant > 0) {
            const activeExecutions = this.getActiveExecutions(trigger.tenantId);
            const otherActiveCount = activeExecutions.filter(
                e => e.executionId !== trigger.executionId
            ).length;

            if (otherActiveCount >= this.config.maxConcurrentPerTenant) {
                errors.push(
                    `Maximum concurrent executions (${this.config.maxConcurrentPerTenant}) ` +
                    `reached for tenant ${trigger.tenantId}`
                );
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Build execution context for AlertExecutionService
     */
    private buildExecutionContext(
        trigger: ExecutionTrigger
    ): ExecutionContext {
        const executionMode: ExecutionMode =
            trigger.triggerType === 'MANUAL' ? 'MANUAL' : 'SCHEDULED';

        return {
            tenantId: trigger.tenantId,
            executionTime: trigger.createdAt,
            dryRun: trigger.dryRun,
            executionMode,
            correlationId: trigger.metadata?.correlationId,
            triggeredBy: trigger.requestedBy,
        };
    }

    /**
     * Update execution state with new status
     */
    private updateState(
        executionId: string,
        newStatus: ExecutionStatus,
        errorMessage?: string
    ): ExecutionState | null {
        const currentState = this.executionStates.get(executionId);
        if (!currentState) {
            return null;
        }

        const newState = transitionState(currentState, newStatus, errorMessage);
        if (!newState) {
            this.logger.warn(
                `Invalid state transition: ${currentState.status} → ${newStatus}`,
                { executionId }
            );
            return null;
        }

        this.executionStates.set(executionId, newState);
        return newState;
    }
}
