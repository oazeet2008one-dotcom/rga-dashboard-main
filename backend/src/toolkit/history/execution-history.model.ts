/**
 * =============================================================================
 * Execution History Model
 * =============================================================================
 *
 * Domain model for durable execution history tracking.
 *
 * Design Principles:
 * - Passive & append-only
 * - No execution logic
 * - No scheduling logic
 * - Tenant-isolated
 * - Serializable
 *
 * Responsibility:
 * - Record what executions happened
 * - Record when and why they ran
 * - Record final outcomes
 * - Enable cooldown logic, rate limiting, auditing
 *
 * Non-Responsibility:
 * - Trigger executions
 * - Decide scheduling
 * - Business logic
 * - Affect execution results
 * =============================================================================
 */

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Status of a completed execution
 */
export type ExecutionHistoryStatus = 'COMPLETED' | 'FAILED' | 'CANCELLED';

/**
 * Type of trigger that initiated the execution
 */
export type ExecutionHistoryTriggerType = 'MANUAL' | 'PROGRAMMATIC';

// =============================================================================
// Execution History Record
// =============================================================================

/**
 * Represents one completed execution attempt.
 *
 * This is an immutable record of what happened.
 * It is NOT the same as ExecutionTrigger (which is the request).
 * This is the historical outcome.
 */
export interface ExecutionHistoryRecord {
    /**
     * Unique execution identifier
     */
    readonly executionId: string;

    /**
     * Tenant that owned this execution
     */
    readonly tenantId: string;

    /**
     * Type of trigger that initiated execution
     */
    readonly triggerType: ExecutionHistoryTriggerType;

    /**
     * Who/what requested the execution
     */
    readonly requestedBy: string;

    /**
     * Final status of execution
     */
    readonly status: ExecutionHistoryStatus;

    /**
     * When execution started
     */
    readonly startedAt: Date;

    /**
     * When execution finished
     */
    readonly finishedAt: Date;

    /**
     * Duration in milliseconds
     */
    readonly durationMs: number;

    /**
     * Whether this was a dry run
     */
    readonly dryRun: boolean;

    /**
     * Number of rules evaluated
     */
    readonly ruleCount: number;

    /**
     * Number of alerts triggered
     */
    readonly triggeredAlertCount: number;

    /**
     * Reason for failure (if status is FAILED)
     */
    readonly failureReason?: string;

    /**
     * Error code (if status is FAILED)
     */
    readonly errorCode?: string;

    /**
     * Optional metadata for debugging/auditing
     */
    readonly metadata?: {
        readonly correlationId?: string;
        readonly executionMode?: string;
        readonly snapshotCount?: number;
        readonly triggeredRuleIds?: string[];
        readonly [key: string]: unknown;
    };
}

// =============================================================================
// Query Options
// =============================================================================

/**
 * Options for querying execution history
 */
export interface HistoryQueryOptions {
    /**
     * Maximum number of records to return
     * Default: 100
     */
    readonly limit?: number;

    /**
     * Offset for pagination
     * Default: 0
     */
    readonly offset?: number;

    /**
     * Start of time range (inclusive)
     */
    readonly startTime?: Date;

    /**
     * End of time range (inclusive)
     */
    readonly endTime?: Date;

    /**
     * Filter by status
     */
    readonly status?: ExecutionHistoryStatus;

    /**
     * Filter by dry run flag
     */
    readonly dryRun?: boolean;

    /**
     * Order by finishedAt
     * Default: 'desc'
     */
    readonly order?: 'asc' | 'desc';
}

/**
 * Result of a history query
 */
export interface HistoryQueryResult {
    /**
     * Records matching query
     */
    readonly records: ExecutionHistoryRecord[];

    /**
     * Total count (for pagination)
     */
    readonly totalCount: number;

    /**
     * Whether more records exist
     */
    readonly hasMore: boolean;
}

// =============================================================================
// Execution Summary
// =============================================================================

/**
 * Summary of recent execution activity
 * Used for cooldown and rate limit calculations
 */
export interface ExecutionSummary {
    /**
     * Total executions in window
     */
    readonly totalExecutions: number;

    /**
     * Successful executions
     */
    readonly completedCount: number;

    /**
     * Failed executions
     */
    readonly failedCount: number;

    /**
     * Cancelled executions
     */
    readonly cancelledCount: number;

    /**
     * Most recent execution timestamp
     */
    readonly lastExecutionAt?: Date;

    /**
     * Average duration in milliseconds
     */
    readonly averageDurationMs: number;

    /**
     * Window start time
     */
    readonly windowStartAt: Date;

    /**
     * Window end time
     */
    readonly windowEndAt: Date;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an execution history record from execution result
 */
export function createExecutionHistoryRecord(params: {
    executionId: string;
    tenantId: string;
    triggerType: ExecutionHistoryTriggerType;
    requestedBy: string;
    status: ExecutionHistoryStatus;
    startedAt: Date;
    finishedAt: Date;
    dryRun: boolean;
    ruleCount: number;
    triggeredAlertCount: number;
    failureReason?: string;
    errorCode?: string;
    metadata?: ExecutionHistoryRecord['metadata'];
}): ExecutionHistoryRecord {
    const durationMs = params.finishedAt.getTime() - params.startedAt.getTime();

    return {
        ...params,
        durationMs,
    };
}

/**
 * Create default query options
 */
export function createQueryOptions(
    options?: Partial<HistoryQueryOptions>
): HistoryQueryOptions {
    return {
        limit: 100,
        offset: 0,
        order: 'desc',
        ...options,
    };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if an execution is within cooldown period
 */
export function isInCooldownPeriod(
    lastExecutionAt: Date | undefined,
    cooldownMs: number,
    now: Date
): boolean {
    if (!lastExecutionAt) {
        return false;
    }
    const elapsed = now.getTime() - lastExecutionAt.getTime();
    return elapsed < cooldownMs;
}

/**
 * Calculate remaining cooldown time in milliseconds
 */
export function getRemainingCooldownMs(
    lastExecutionAt: Date,
    cooldownMs: number,
    now: Date
): number {
    const elapsed = now.getTime() - lastExecutionAt.getTime();
    return Math.max(0, cooldownMs - elapsed);
}

/**
 * Filter records by time window
 */
export function filterByTimeWindow(
    records: ExecutionHistoryRecord[],
    windowMs: number,
    now: Date
): ExecutionHistoryRecord[] {
    const cutoff = new Date(now.getTime() - windowMs);
    return records.filter((r) => r.finishedAt >= cutoff);
}

/**
 * Calculate execution summary from records
 */
export function calculateExecutionSummary(
    records: ExecutionHistoryRecord[],
    windowStart: Date,
    windowEnd: Date
): ExecutionSummary {
    const completed = records.filter((r) => r.status === 'COMPLETED');
    const failed = records.filter((r) => r.status === 'FAILED');
    const cancelled = records.filter((r) => r.status === 'CANCELLED');

    const durations = records.map((r) => r.durationMs);
    const averageDurationMs =
        durations.length > 0
            ? durations.reduce((a, b) => a + b, 0) / durations.length
            : 0;

    // Find most recent execution
    const sorted = [...records].sort(
        (a, b) => b.finishedAt.getTime() - a.finishedAt.getTime()
    );
    const lastExecutionAt = sorted[0]?.finishedAt;

    return {
        totalExecutions: records.length,
        completedCount: completed.length,
        failedCount: failed.length,
        cancelledCount: cancelled.length,
        lastExecutionAt,
        averageDurationMs: Math.round(averageDurationMs),
        windowStartAt: windowStart,
        windowEndAt: windowEnd,
    };
}
