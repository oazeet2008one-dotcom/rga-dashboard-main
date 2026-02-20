/**
 * =============================================================================
 * Schedule Module - Public API
 * =============================================================================
 *
 * Scheduling Semantics Layer
 *
 * Pure, deterministic scheduling evaluation.
 * No timers. No execution. No persistence.
 *
 * Usage:
 * ```typescript
 * import {
 *   SchedulePolicyService,
 *   ScheduleDefinition,
 *   SchedulePolicy,
 *   createScheduleDefinition,
 *   createEvaluationContext,
 * } from './schedule';
 *
 * const decision = policyService.evaluateSchedule(definition, policy, context);
 * if (decision.shouldTrigger) {
 *   // Trigger execution
 * }
 * ```
 * =============================================================================
 */

// Domain Model
export {
    // Types
    ScheduleType,
    SCHEDULE_TYPE_LABELS,
    ExecutionHistorySummary,
    BlockReason,
    
    // Configuration
    IntervalConfig,
    CalendarConfig,
    TimeWindow,
    
    // Core Models
    ScheduleDefinition,
    SchedulePolicy,
    ScheduleEvaluationContext,
    ScheduleDecision,
    
    // Factory Functions
    createScheduleDefinition,
    createSchedulePolicy,
    createEvaluationContext,
    createTriggerDecision,
    createBlockDecision,
    
    // Utilities
    toTimezone,
    getStartOfDay,
    parseTime,
    isExcludedDate,
} from './schedule.model';

// Service
export {
    SchedulePolicyService,
} from './schedule-policy.service';
