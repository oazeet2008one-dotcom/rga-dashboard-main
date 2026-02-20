/**
 * =============================================================================
 * Scheduler Runner Model
 * =============================================================================
 *
 * Domain model for the SchedulerRunner.
 *
 * Design Principles:
 * - Pure data structures
 * - Deterministic with injected time
 * - No side effects in model
 * - Tenant-isolated
 *
 * Responsibility:
 * - Define tick options
 * - Define tick results
 * - Define trigger candidates
 * - Define schedule decisions (simplified for runner output)
 *
 * Non-Responsibility:
 * - Business logic
 * - Time evaluation
 * - Schedule evaluation (delegated to SchedulePolicyService)
 * =============================================================================
 */

import { ExecutionParams } from '../schedules/scheduled-execution.model';

// =============================================================================
// Tick Options
// =============================================================================

/**
 * Options for a scheduler tick.
 */
export interface TickOptions {
    /**
     * If true, evaluate without side effects.
     * Default: false
     */
    readonly dryRun?: boolean;

    /**
     * Maximum number of triggers to return.
     * Default: 10
     */
    readonly maxTriggers?: number;

    /**
     * Whether to include detailed decisions in result.
     * Default: true
     */
    readonly includeDecisions?: boolean;

    /**
     * Optional correlation ID for tracing.
     */
    readonly correlationId?: string;
}

// =============================================================================
// Schedule Decision (Runner Output)
// =============================================================================

/**
 * Decision result for a single schedule during a tick.
 *
 * This is a simplified/transformed version of ScheduleDecision
 * suitable for TickResult output.
 */
export interface RunnerScheduleDecision {
    /**
     * The schedule ID that was evaluated
     */
    readonly scheduleId: string;

    /**
     * Whether the schedule should trigger
     */
    readonly shouldTrigger: boolean;

    /**
     * Human-readable reason for the decision
     */
    readonly reason: string;

    /**
     * If not triggering, why it was blocked
     */
    readonly blockedBy?: string;

    /**
     * When the schedule is next eligible (ISO string or null)
     */
    readonly nextEligibleAt: string | null;
}

// =============================================================================
// Trigger Candidate
// =============================================================================

/**
 * A schedule that has been evaluated and should trigger.
 *
 * This represents a candidate for execution. The actual execution
 * is performed by the caller (or Phase 2.4.3).
 */
export interface TriggerCandidate {
    /**
     * The schedule ID
     */
    readonly scheduleId: string;

    /**
     * The tenant ID
     */
    readonly tenantId: string;

    /**
     * Execution parameters from the scheduled execution
     */
    readonly executionParams: ExecutionParams;

    /**
     * Derived execution request info.
     * Contains minimal info needed to start execution later.
     */
    readonly derivedRequest: {
        /**
         * Trigger type for execution
         */
        readonly triggerType: 'MANUAL' | 'PROGRAMMATIC';

        /**
         * Who is requesting
         */
        readonly requestedBy: string;

        /**
         * Whether to run in dry mode
         */
        readonly dryRun: boolean;
    };
}

// =============================================================================
// Tick Result
// =============================================================================

/**
 * Result of a scheduler tick for a tenant.
 */
export interface TickResult {
    /**
     * The tenant that was ticked
     */
    readonly tenantId: string;

    /**
     * The time at which the tick was evaluated (ISO string)
     */
    readonly now: string;

    /**
     * Number of schedules evaluated
     */
    readonly evaluatedCount: number;

    /**
     * Number of schedules that should trigger (candidates count)
     * This is NOT the number actually executed.
     */
    readonly triggeredCount: number;

    /**
     * Whether this was a dry run
     */
    readonly dryRun: boolean;

    /**
     * Detailed decisions for each schedule (if requested)
     */
    readonly decisions: RunnerScheduleDecision[];

    /**
     * Candidates that should trigger.
     * Callers should pass these to ExecutionTriggerService.
     */
    readonly triggerCandidates: TriggerCandidate[];
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create tick options with defaults.
 */
export function createTickOptions(options?: Partial<TickOptions>): TickOptions {
    return {
        dryRun: options?.dryRun ?? false,
        maxTriggers: options?.maxTriggers ?? 10,
        includeDecisions: options?.includeDecisions ?? true,
        correlationId: options?.correlationId,
    };
}

/**
 * Create a tick result.
 */
export function createTickResult(params: {
    tenantId: string;
    now: Date;
    dryRun: boolean;
    evaluatedCount: number;
    decisions: RunnerScheduleDecision[];
    triggerCandidates: TriggerCandidate[];
}): TickResult {
    return {
        tenantId: params.tenantId,
        now: params.now.toISOString(),
        dryRun: params.dryRun,
        evaluatedCount: params.evaluatedCount,
        triggeredCount: params.triggerCandidates.length,
        decisions: params.decisions,
        triggerCandidates: params.triggerCandidates,
    };
}

/**
 * Create a schedule decision.
 */
export function createRunnerScheduleDecision(params: {
    scheduleId: string;
    shouldTrigger: boolean;
    reason: string;
    blockedBy?: string;
    nextEligibleAt: Date | null;
}): RunnerScheduleDecision {
    return {
        scheduleId: params.scheduleId,
        shouldTrigger: params.shouldTrigger,
        reason: params.reason,
        blockedBy: params.blockedBy,
        nextEligibleAt: params.nextEligibleAt?.toISOString() ?? null,
    };
}

/**
 * Create a trigger candidate.
 */
export function createTriggerCandidate(params: {
    scheduleId: string;
    tenantId: string;
    executionParams: ExecutionParams;
}): TriggerCandidate {
    return {
        scheduleId: params.scheduleId,
        tenantId: params.tenantId,
        executionParams: params.executionParams,
        derivedRequest: {
            triggerType: params.executionParams.triggerType,
            requestedBy: params.executionParams.requestedBy,
            dryRun: params.executionParams.dryRunDefault,
        },
    };
}
