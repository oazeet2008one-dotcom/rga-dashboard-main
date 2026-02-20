/**
 * =============================================================================
 * Schedule Model
 * =============================================================================
 *
 * Domain model for scheduling semantics.
 *
 * Design Principles:
 * - Pure data structures
 * - Deterministic evaluation
 * - Side-effect free
 * - Infrastructure-agnostic
 * - Timezone-aware
 *
 * Responsibility:
 * - Define what a schedule IS
 * - Define scheduling policy
 * - Define evaluation context
 * - Define decision output
 *
 * Non-Responsibility:
 * - WHEN to check (no timers)
 * - HOW to execute (no triggers)
 * - WHERE to store (no persistence)
 * =============================================================================
 */

// =============================================================================
// Schedule Types
// =============================================================================

/**
 * Type of schedule recurrence
 */
export type ScheduleType = 'ONCE' | 'INTERVAL' | 'CALENDAR';

/**
 * Human-readable schedule type labels
 */
export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
    ONCE: 'Execute once at a specific time',
    INTERVAL: 'Execute at regular intervals',
    CALENDAR: 'Execute based on calendar rules',
};

// =============================================================================
// Interval Configuration
// =============================================================================

/**
 * Interval-based schedule configuration
 *
 * Example: every 15 minutes
 * { minutes: 15 }
 *
 * Example: every 2 hours
 * { hours: 2 }
 */
export interface IntervalConfig {
    /**
     * Interval in minutes
     */
    readonly minutes?: number;

    /**
     * Interval in hours
     */
    readonly hours?: number;

    /**
     * Interval in days
     */
    readonly days?: number;
}

// =============================================================================
// Calendar Configuration
// =============================================================================

/**
 * Symbolic calendar rule (cron-like, semantic only)
 *
 * This is NOT a cron expression parser.
 * It represents calendar rules symbolically.
 *
 * Example: Daily at 9:00 AM
 * { hour: 9, minute: 0 }
 *
 * Example: Every Monday at 2:30 PM
 * { dayOfWeek: 1, hour: 14, minute: 30 }
 */
export interface CalendarConfig {
    /**
     * Day of week (0 = Sunday, 6 = Saturday)
     * If not specified, matches any day
     */
    readonly dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

    /**
     * Day of month (1-31)
     * If not specified, matches any day
     */
    readonly dayOfMonth?: number;

    /**
     * Hour of day (0-23)
     * If not specified, matches any hour
     */
    readonly hour?: number;

    /**
     * Minute of hour (0-59)
     * If not specified, defaults to 0
     */
    readonly minute?: number;
}

// =============================================================================
// Schedule Definition
// =============================================================================

/**
 * A schedule definition describes when executions should be triggered.
 *
 * This is PURE SEMANTICS - no timers, no execution logic.
 */
export interface ScheduleDefinition {
    /**
     * Unique identifier for this schedule
     */
    readonly scheduleId: string;

    /**
     * Tenant that owns this schedule
     */
    readonly tenantId: string;

    /**
     * Human-readable name
     */
    readonly name: string;

    /**
     * Type of schedule
     */
    readonly type: ScheduleType;

    /**
     * Type-specific configuration
     */
    readonly config: IntervalConfig | CalendarConfig | { targetDate: string };

    /**
     * Timezone for schedule evaluation
     * Default: 'UTC'
     */
    readonly timezone: string;

    /**
     * Whether the schedule is enabled
     */
    readonly enabled: boolean;

    /**
     * Optional description
     */
    readonly description?: string;

    /**
     * Metadata for debugging/auditing
     */
    readonly metadata?: {
        readonly createdBy?: string;
        readonly createdAt?: string;
        readonly updatedAt?: string;
        readonly version?: number;
    };
}

// =============================================================================
// Schedule Policy
// =============================================================================

/**
 * Time window specification
 */
export interface TimeWindow {
    /**
     * Start time in HH:MM format (24-hour)
     */
    readonly startTime: string;

    /**
     * End time in HH:MM format (24-hour)
     */
    readonly endTime: string;

    /**
     * Days of week this window applies to (0-6)
     * If not specified, applies to all days
     */
    readonly daysOfWeek?: number[];
}

/**
 * Schedule policy constrains when executions can be triggered.
 *
 * Even if the schedule definition says "every 15 minutes",
 * the policy may restrict it to business hours only.
 */
export interface SchedulePolicy {
    /**
     * Allowed time windows
     * If empty, all times are allowed
     */
    readonly allowedTimeWindows?: TimeWindow[];

    /**
     * Excluded dates (ISO date strings: YYYY-MM-DD)
     * No executions on these dates
     */
    readonly excludedDates?: string[];

    /**
     * Excluded days of week (0-6)
     * No executions on these days
     */
    readonly excludedDaysOfWeek?: number[];

    /**
     * Cooldown period in milliseconds
     * Minimum time between executions
     */
    readonly cooldownPeriodMs?: number;

    /**
     * Maximum executions per time window
     * 0 = unlimited
     */
    readonly maxExecutionsPerWindow?: number;

    /**
     * Time window duration for maxExecutions limit (in milliseconds)
     * Default: 24 hours (86400000 ms)
     */
    readonly executionWindowMs?: number;

    /**
     * Whether to skip missed executions
     * If true, only trigger at next valid time
     * If false, trigger immediately if missed
     */
    readonly skipMissed?: boolean;
}

// =============================================================================
// Execution History Summary
// =============================================================================

/**
 * Summary of recent execution history
 * Used for policy evaluation (cooldowns, limits)
 */
export interface ExecutionHistorySummary {
    /**
     * Last execution timestamp
     */
    readonly lastExecutionAt?: Date;

    /**
     * Number of executions in current window
     */
    readonly executionsInWindow: number;

    /**
     * Window start time for execution count
     */
    readonly windowStartAt?: Date;

    /**
     * History of recent execution times (for pattern analysis)
     */
    readonly recentExecutions: Date[];
}

// =============================================================================
// Schedule Evaluation Context
// =============================================================================

/**
 * Context for evaluating a schedule.
 *
 * All time-based decisions are made relative to this context.
 * No system clock dependencies.
 */
export interface ScheduleEvaluationContext {
    /**
     * Current time (injected, never use system clock directly)
     */
    readonly now: Date;

    /**
     * Summary of recent execution history
     */
    readonly executionHistory: ExecutionHistorySummary;

    /**
     * If true, evaluate without side effects
     */
    readonly dryRun: boolean;

    /**
     * Optional correlation ID for tracing
     */
    readonly correlationId?: string;
}

// =============================================================================
// Schedule Decision
// =============================================================================

/**
 * Reason for blocking a schedule trigger
 */
export type BlockReason =
    | 'COOLDOWN'      // Still in cooldown period
    | 'WINDOW'        // Outside allowed time window
    | 'LIMIT'         // Max executions reached
    | 'EXCLUDED_DATE' // Date is excluded
    | 'EXCLUDED_DAY'  // Day of week is excluded
    | 'DISABLED'      // Schedule is disabled
    | 'NOT_YET'       // For ONCE schedules, target time not reached
    | 'ALREADY_RAN';  // For ONCE schedules, already executed

/**
 * Decision result from schedule evaluation.
 *
 * This is a PURE VALUE - no side effects, fully deterministic.
 */
export interface ScheduleDecision {
    /**
     * Whether an execution should be triggered
     */
    readonly shouldTrigger: boolean;

    /**
     * Human-readable reason for the decision
     */
    readonly reason: string;

    /**
     * When the schedule is next eligible to trigger
     * Null if no future trigger is possible
     */
    readonly nextEligibleAt: Date | null;

    /**
     * If shouldTrigger is false, why it was blocked
     */
    readonly blockedBy?: BlockReason;

    /**
     * Additional context for debugging
     */
    readonly details?: {
        readonly cooldownRemainingMs?: number;
        readonly currentWindow?: TimeWindow;
        readonly executionsInWindow?: number;
        readonly maxExecutions?: number;
    };

    /**
     * Evaluation timestamp
     */
    readonly evaluatedAt: Date;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a schedule definition
 */
export function createScheduleDefinition(
    params: Omit<ScheduleDefinition, 'scheduleId' | 'metadata'> & {
        scheduleId?: string;
        metadata?: ScheduleDefinition['metadata'];
    }
): ScheduleDefinition {
    return {
        scheduleId: params.scheduleId ?? generateScheduleId(),
        tenantId: params.tenantId,
        name: params.name,
        type: params.type,
        config: params.config,
        timezone: params.timezone ?? 'UTC',
        enabled: params.enabled ?? true,
        description: params.description,
        metadata: params.metadata ?? {
            createdAt: new Date().toISOString(),
            version: 1,
        },
    };
}

/**
 * Create a schedule policy
 */
export function createSchedulePolicy(
    params: SchedulePolicy
): SchedulePolicy {
    return {
        maxExecutionsPerWindow: 0, // Unlimited by default
        executionWindowMs: 24 * 60 * 60 * 1000, // 24 hours
        skipMissed: true,
        ...params,
    };
}

/**
 * Create an evaluation context
 */
export function createEvaluationContext(
    params: Omit<ScheduleEvaluationContext, 'now'> & { now?: Date }
): ScheduleEvaluationContext {
    return {
        now: params.now ?? new Date(),
        executionHistory: params.executionHistory,
        dryRun: params.dryRun ?? false,
        correlationId: params.correlationId,
    };
}

/**
 * Create a positive decision (should trigger)
 */
export function createTriggerDecision(
    context: ScheduleEvaluationContext,
    reason: string,
    nextEligibleAt: Date | null
): ScheduleDecision {
    return {
        shouldTrigger: true,
        reason,
        nextEligibleAt,
        evaluatedAt: context.now,
    };
}

/**
 * Create a negative decision (should not trigger)
 */
export function createBlockDecision(
    context: ScheduleEvaluationContext,
    reason: string,
    blockedBy: BlockReason,
    nextEligibleAt: Date | null,
    details?: ScheduleDecision['details']
): ScheduleDecision {
    return {
        shouldTrigger: false,
        reason,
        blockedBy,
        nextEligibleAt,
        details,
        evaluatedAt: context.now,
    };
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate a unique schedule ID
 */
function generateScheduleId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `sched-${timestamp}-${random}`;
}

/**
 * Convert a date to the target timezone
 * Returns a new Date object representing the same instant
 * but useful for timezone-aware comparisons
 */
export function toTimezone(date: Date, timezone: string): Date {
    // For now, simple implementation using toLocaleString
    // In production, use a proper timezone library like date-fns-tz
    const tzDate = new Date(
        date.toLocaleString('en-US', { timeZone: timezone })
    );
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offset = tzDate.getTime() - utcDate.getTime();
    return new Date(date.getTime() + offset);
}

/**
 * Get the start of day in a specific timezone
 */
export function getStartOfDay(date: Date, timezone: string): Date {
    const tzDate = toTimezone(date, timezone);
    tzDate.setHours(0, 0, 0, 0);
    return new Date(tzDate.getTime() - (tzDate.getTime() - date.getTime()));
}

/**
 * Parse HH:MM string to minutes since midnight
 */
export function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Check if a date is in an excluded date list
 */
export function isExcludedDate(date: Date, excludedDates: string[]): boolean {
    const dateStr = formatDateISO(date);
    return excludedDates.includes(dateStr);
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0]!;
}
