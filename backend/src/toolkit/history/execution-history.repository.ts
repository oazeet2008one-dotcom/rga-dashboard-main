/**
 * =============================================================================
 * Execution History Repository
 * =============================================================================
 *
 * Repository abstraction for execution history persistence.
 *
 * Design Principles:
 * - Interface-driven (no concrete DB decisions)
 * - Tenant-scoped
 * - Append-only
 * - No execution logic
 * - No scheduling logic
 *
 * Responsibility:
 * - Persist execution history records
 * - Query execution history
 * - Support cooldown/rate-limit calculations
 *
 * Non-Responsibility:
 * - Business logic
 * - Execution orchestration
 * - Scheduling decisions
 * =============================================================================
 */

import {
    ExecutionHistoryRecord,
    HistoryQueryOptions,
    HistoryQueryResult,
    ExecutionSummary,
} from './execution-history.model';

// =============================================================================
// Repository Interface
// =============================================================================

/**
 * Clock interface for time-based operations.
 * Allows injection of deterministic time for testing.
 */
export interface Clock {
    now(): Date;
}

/**
 * System clock implementation (default).
 */
export const SystemClock: Clock = {
    now: () => new Date(),
};

/**
 * Repository for execution history persistence.
 *
 * Implementations handle the actual storage mechanism.
 * Domain code depends on this interface, not concrete implementations.
 */
export interface ExecutionHistoryRepository {
    /**
     * Record a completed execution.
     *
     * This is append-only. Records cannot be modified or deleted.
     *
     * @param record The execution history record to persist
     * @param now Optional current time (for deterministic testing)
     */
    record(record: ExecutionHistoryRecord, now?: Date): Promise<void>;

    /**
     * Find recent executions by tenant.
     *
     * @param tenantId The tenant to query
     * @param options Query options (limit, time range, filters)
     * @returns Query result with records and metadata
     */
    findRecentByTenant(
        tenantId: string,
        options?: HistoryQueryOptions
    ): Promise<HistoryQueryResult>;

    /**
     * Count executions within a time window.
     *
     * Used for rate limiting calculations.
     *
     * @param tenantId The tenant to query
     * @param windowMs Time window in milliseconds (from now backwards)
     * @param now Optional current time (for deterministic testing)
     * @returns Number of executions in the window
     */
    countExecutionsInWindow(tenantId: string, windowMs: number, now?: Date): Promise<number>;

    /**
     * Get the most recent execution for a tenant.
     *
     * Used for cooldown calculations.
     *
     * @param tenantId The tenant to query
     * @returns Most recent execution or null if none
     */
    getMostRecent(tenantId: string): Promise<ExecutionHistoryRecord | null>;

    /**
     * Get execution summary for a time window.
     *
     * @param tenantId The tenant to query
     * @param windowMs Time window in milliseconds
     * @param now Optional current time (for deterministic testing)
     * @returns Summary of executions in the window
     */
    getExecutionSummary(
        tenantId: string,
        windowMs: number,
        now?: Date
    ): Promise<ExecutionSummary>;
}

// =============================================================================
// Repository Error Types
// =============================================================================

/**
 * Error thrown when history persistence fails.
 *
 * IMPORTANT: Failure to persist should NOT fail the execution.
 * The execution has already completed. History is best-effort.
 */
export class HistoryPersistenceError extends Error {
    constructor(
        message: string,
        public readonly executionId: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'HistoryPersistenceError';
    }
}

/**
 * Error thrown when query parameters are invalid.
 */
export class HistoryQueryError extends Error {
    constructor(message: string, public readonly invalidParams?: Record<string, unknown>) {
        super(message);
        this.name = 'HistoryQueryError';
    }
}
