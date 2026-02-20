/**
 * =============================================================================
 * Execution History Service
 * =============================================================================
 *
 * Orchestration service for execution history.
 *
 * Design Principles:
 * - Stateless
 * - Deterministic
 * - Side-effect limited to persistence
 * - Tenant-isolated
 *
 * Responsibility:
 * - Accept completed execution results
 * - Normalize into ExecutionHistoryRecord
 * - Persist via repository
 * - Expose read-only query helpers
 *
 * Non-Responsibility:
 * - Trigger executions
 * - Make scheduling decisions
 * - Business logic
 * - Affect execution results
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { ILogger, TOKENS } from '../core';
import {
    ExecutionHistoryRecord,
    HistoryQueryOptions,
    HistoryQueryResult,
    ExecutionSummary,
    ExecutionHistoryStatus,
    ExecutionHistoryTriggerType,
    createExecutionHistoryRecord,
    isInCooldownPeriod,
    getRemainingCooldownMs,
} from './execution-history.model';
import { ExecutionHistoryRepository } from './execution-history.repository';
import { ExecutionResult } from '../services/alert-execution.service';
import { ExecutionTrigger, ExecutionState } from '../trigger/execution-trigger.model';

// =============================================================================
// Service Configuration
// =============================================================================

export interface ExecutionHistoryServiceConfig {
    /**
     * Whether to log history persistence failures as warnings.
     * Default: true
     */
    readonly logPersistenceFailures: boolean;

    /**
     * Whether to include triggered rule IDs in metadata.
     * Default: true
     */
    readonly includeTriggeredRules: boolean;
}

const DEFAULT_CONFIG: ExecutionHistoryServiceConfig = {
    logPersistenceFailures: true,
    includeTriggeredRules: true,
};

// =============================================================================
// Service Implementation
// =============================================================================

@injectable()
export class ExecutionHistoryService {
    constructor(
        @inject('ExecutionHistoryRepository')
        private readonly repository: ExecutionHistoryRepository,
        @inject(TOKENS.Logger) private readonly logger: ILogger,
        private readonly config: ExecutionHistoryServiceConfig = DEFAULT_CONFIG
    ) {}

    // =========================================================================
    // Recording API
    // =========================================================================

    /**
     * Record a completed execution.
     *
     * This is called AFTER execution finishes and status is known.
     * It is passive - it does not affect the execution result.
     *
     * FAILURE TO PERSIST DOES NOT FAIL THE EXECUTION.
     *
     * @param state The final execution state
     * @param result The execution result from AlertExecutionService
     * @returns The created history record (even if persistence fails)
     */
    async recordExecution(
        state: ExecutionState,
        result: ExecutionResult
    ): Promise<ExecutionHistoryRecord> {
        // Normalize into history record
        const record = this.normalizeToRecord(state, result);

        // Persist (best effort)
        try {
            await this.repository.record(record);
            this.logger.debug('Execution history recorded', {
                executionId: record.executionId,
                tenantId: record.tenantId,
                status: record.status,
            });
        } catch (error) {
            // Log but don't fail - history is best-effort
            if (this.config.logPersistenceFailures) {
                this.logger.warn('Failed to record execution history', {
                    executionId: record.executionId,
                    error: (error as Error).message,
                });
            }
        }

        return record;
    }

    // =========================================================================
    // Query API (Read-Only)
    // =========================================================================

    /**
     * Find recent executions for a tenant.
     */
    async findRecent(
        tenantId: string,
        options?: HistoryQueryOptions
    ): Promise<HistoryQueryResult> {
        return this.repository.findRecentByTenant(tenantId, options);
    }

    /**
     * Get the most recent execution for a tenant.
     */
    async getMostRecent(
        tenantId: string
    ): Promise<ExecutionHistoryRecord | null> {
        return this.repository.getMostRecent(tenantId);
    }

    /**
     * Count executions in a time window.
     */
    async countInWindow(
        tenantId: string,
        windowMs: number,
        now?: Date
    ): Promise<number> {
        return this.repository.countExecutionsInWindow(tenantId, windowMs, now);
    }

    /**
     * Get execution summary for a time window.
     */
    async getSummary(
        tenantId: string,
        windowMs: number,
        now?: Date
    ): Promise<ExecutionSummary> {
        return this.repository.getExecutionSummary(tenantId, windowMs, now);
    }

    // =========================================================================
    // Helper API (for scheduling/cooldown)
    // =========================================================================

    /**
     * Check if tenant is in cooldown period.
     *
     * @param tenantId The tenant to check
     * @param cooldownMs Cooldown period in milliseconds
     * @param now Current time (required for determinism)
     * @returns True if in cooldown period
     */
    async isInCooldown(
        tenantId: string,
        cooldownMs: number,
        now: Date
    ): Promise<boolean> {
        const mostRecent = await this.repository.getMostRecent(tenantId);
        return isInCooldownPeriod(mostRecent?.finishedAt, cooldownMs, now);
    }

    /**
     * Get remaining cooldown time.
     *
     * @param tenantId The tenant to check
     * @param cooldownMs Cooldown period in milliseconds
     * @param now Current time
     * @returns Remaining cooldown in milliseconds (0 if not in cooldown)
     */
    async getRemainingCooldown(
        tenantId: string,
        cooldownMs: number,
        now: Date
    ): Promise<number> {
        const mostRecent = await this.repository.getMostRecent(tenantId);
        if (!mostRecent) {
            return 0;
        }
        return getRemainingCooldownMs(mostRecent.finishedAt, cooldownMs, now);
    }

    /**
     * Check if execution would exceed rate limit.
     *
     * @param tenantId The tenant to check
     * @param maxExecutions Maximum allowed executions
     * @param windowMs Time window in milliseconds
     * @param now Optional current time (for deterministic testing)
     * @returns True if rate limit would be exceeded
     */
    async wouldExceedRateLimit(
        tenantId: string,
        maxExecutions: number,
        windowMs: number,
        now?: Date
    ): Promise<boolean> {
        if (maxExecutions <= 0) {
            return false; // Unlimited
        }
        const count = await this.repository.countExecutionsInWindow(
            tenantId,
            windowMs,
            now
        );
        return count >= maxExecutions;
    }

    // =========================================================================
    // Private Implementation
    // =========================================================================

    /**
     * Normalize execution state and result into a history record.
     */
    private normalizeToRecord(
        state: ExecutionState,
        result: ExecutionResult
    ): ExecutionHistoryRecord {
        const status = this.mapStatus(state.status);
        const triggerType = this.mapTriggerType(state.trigger.triggerType);

        // Build metadata
        const metadata: ExecutionHistoryRecord['metadata'] = {
            correlationId: state.trigger.metadata?.correlationId,
            executionMode: result.context.executionMode,
            snapshotCount: result.summary.snapshotsEvaluated,
            triggeredRuleIds: this.config.includeTriggeredRules
                ? result.triggeredAlerts.map((a) => a.rule.id)
                : undefined,
        };

        return createExecutionHistoryRecord({
            executionId: state.executionId,
            tenantId: state.trigger.tenantId,
            triggerType,
            requestedBy: state.trigger.requestedBy,
            status,
            startedAt: state.startedAt ?? state.trigger.createdAt,
            finishedAt: state.completedAt ?? state.trigger.createdAt,
            dryRun: state.trigger.dryRun,
            ruleCount: result.summary.enabledRules,
            triggeredAlertCount: result.summary.triggeredCount,
            failureReason: state.errorMessage ?? result.error?.message,
            errorCode: result.error?.code,
            metadata,
        });
    }

    /**
     * Map execution status to history status.
     */
    private mapStatus(
        status: ExecutionState['status']
    ): ExecutionHistoryStatus {
        switch (status) {
            case 'COMPLETED':
                return 'COMPLETED';
            case 'FAILED':
                return 'FAILED';
            case 'CANCELLED':
                return 'CANCELLED';
            case 'CREATED':
            case 'STARTED':
                // These should not be recorded (execution not finished)
                return 'FAILED';
            default:
                return 'FAILED';
        }
    }

    /**
     * Map trigger type to history trigger type.
     */
    private mapTriggerType(
        triggerType: ExecutionTrigger['triggerType']
    ): ExecutionHistoryTriggerType {
        return triggerType;
    }
}
