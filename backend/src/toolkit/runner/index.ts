/**
 * =============================================================================
 * Runner Module - Public API
 * =============================================================================
 *
 * Scheduler Runner Core (Phase 2.4.2)
 *
 * Single-shot scheduler evaluation.
 * No timers. No background loops. Pure evaluation.
 *
 * Usage:
 * ```typescript
 * import {
 *   SchedulerRunner,
 *   RunnerDependencies,
 *   TickOptions,
 *   TickResult,
 *   TriggerCandidate,
 * } from './runner';
 *
 * const runner = new SchedulerRunner(deps);
 * const result = await runner.tickTenant('tenant-1', new Date());
 * 
 * // Process trigger candidates
 * for (const candidate of result.triggerCandidates) {
 *   // Execute via ExecutionTriggerService (Phase 2.4.3)
 * }
 * ```
 * =============================================================================
 */

// Domain Model
export {
    // Types
    TickOptions,
    RunnerScheduleDecision,
    TriggerCandidate,
    TickResult,
    
    // Factory Functions
    createTickOptions,
    createTickResult,
    createRunnerScheduleDecision,
    createTriggerCandidate,
} from './scheduler-runner.model';

// Runner
export {
    RunnerDependencies,
    SchedulerRunner,
} from './scheduler-runner';
