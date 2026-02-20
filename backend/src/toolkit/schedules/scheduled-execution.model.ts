/**
 * =============================================================================
 * Scheduled Execution Model
 * =============================================================================
 *
 * Domain model for scheduled executions.
 *
 * This represents a schedule ready to be executed by the SchedulerRunner.
 * It combines the schedule definition, policy, and execution parameters.
 *
 * Design Principles:
 * - Pure data structures
 * - No business logic
 * - No time-based evaluation
 * - Tenant-isolated
 * - Deterministic for same fixtures
 *
 * Responsibility:
 * - Define what a scheduled execution IS
 * - Provide schedule configuration
 * - Provide execution parameters
 *
 * Non-Responsibility:
 * - WHEN to execute (scheduling logic)
 * - HOW to execute (triggering logic)
 * - Evaluating time windows
 * - Checking cooldowns
 * =============================================================================
 */

import {
    ScheduleDefinition,
    SchedulePolicy,
} from '../schedule/schedule.model';
import { TriggerType } from '../trigger/execution-trigger.model';

// =============================================================================
// Execution Parameters
// =============================================================================

/**
 * Parameters for executing a scheduled alert check.
 *
 * These parameters are used when the schedule triggers an execution.
 * They define HOW the execution should be initiated.
 */
export interface ExecutionParams {
    /**
     * Default trigger type for executions from this schedule.
     * Default: 'PROGRAMMATIC'
     */
    readonly triggerType: TriggerType;

    /**
     * Who/what is requesting the execution.
     * Default: 'scheduler'
     */
    readonly requestedBy: string;

    /**
     * Default dry run mode.
     * Default: false
     */
    readonly dryRunDefault: boolean;

    /**
     * Optional metadata passed to execution.
     */
    readonly metadata?: {
        readonly source?: string;
        readonly scheduleId?: string;
        readonly reason?: string;
        readonly [key: string]: unknown;
    };
}

// =============================================================================
// Scheduled Execution
// =============================================================================

/**
 * A scheduled execution ready to be run.
 *
 * This combines:
 * - The schedule definition (when it should run)
 * - The schedule policy (constraints on execution)
 * - Execution parameters (how to run)
 */
export interface ScheduledExecution {
    /**
     * Unique identifier for this scheduled execution
     */
    readonly id: string;

    /**
     * Tenant that owns this schedule
     */
    readonly tenantId: string;

    /**
     * Schedule definition (when to run)
     */
    readonly schedule: ScheduleDefinition;

    /**
     * Schedule policy (constraints)
     */
    readonly policy: SchedulePolicy;

    /**
     * Execution parameters (how to run)
     */
    readonly executionParams: ExecutionParams;

    /**
     * Whether the schedule is enabled
     */
    readonly enabled: boolean;
}

// =============================================================================
// Provider Interface
// =============================================================================

/**
 * Provider interface for loading scheduled executions.
 *
 * Implementations load schedules from various sources (fixtures, memory, DB).
 */
export interface IScheduleProvider {
    /**
     * Get all scheduled executions for a tenant.
     *
     * Returns only enabled schedules that belong to the tenant.
     * Does NOT evaluate schedules or check if they should trigger.
     *
     * @param tenantId The tenant to load schedules for
     * @returns Array of scheduled executions
     */
    getSchedulesForTenant(tenantId: string): Promise<ScheduledExecution[]>;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create execution parameters with defaults.
 */
export function createExecutionParams(
    params?: Partial<ExecutionParams>
): ExecutionParams {
    return {
        triggerType: params?.triggerType ?? 'PROGRAMMATIC',
        requestedBy: params?.requestedBy ?? 'scheduler',
        dryRunDefault: params?.dryRunDefault ?? false,
        metadata: params?.metadata,
    };
}

/**
 * Create a scheduled execution.
 */
export function createScheduledExecution(
    params: Omit<ScheduledExecution, 'id'> & { id?: string }
): ScheduledExecution {
    return {
        id: params.id ?? generateScheduleExecutionId(),
        tenantId: params.tenantId,
        schedule: params.schedule,
        policy: params.policy,
        executionParams: params.executionParams,
        enabled: params.enabled ?? true,
    };
}

/**
 * Generate a unique scheduled execution ID.
 */
function generateScheduleExecutionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sched-exec-${timestamp}-${random}`;
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a scheduled execution has required fields.
 */
export function validateScheduledExecution(
    execution: unknown
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof execution !== 'object' || execution === null) {
        return { valid: false, errors: ['Must be an object'] };
    }

    const e = execution as Record<string, unknown>;

    // Required fields
    if (!e.id || typeof e.id !== 'string') {
        errors.push('id is required and must be a string');
    }
    if (!e.tenantId || typeof e.tenantId !== 'string') {
        errors.push('tenantId is required and must be a string');
    }
    if (!e.schedule || typeof e.schedule !== 'object') {
        errors.push('schedule is required and must be an object');
    }
    if (!e.policy || typeof e.policy !== 'object') {
        errors.push('policy is required and must be an object');
    }
    if (!e.executionParams || typeof e.executionParams !== 'object') {
        errors.push('executionParams is required and must be an object');
    }

    return { valid: errors.length === 0, errors };
}
