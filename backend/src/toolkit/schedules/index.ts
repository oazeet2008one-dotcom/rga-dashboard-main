/**
 * =============================================================================
 * Schedules Module - Public API
 * =============================================================================
 *
 * Schedule Provider Layer (Phase 2.4.1)
 *
 * Provides scheduled executions for the SchedulerRunner.
 * No business logic. No time evaluation. Pure data access.
 *
 * Usage:
 * ```typescript
 * import {
 *   IScheduleProvider,
 *   ScheduledExecution,
 *   FixtureScheduleProvider,
 *   InMemoryScheduleProvider,
 * } from './schedules';
 *
 * const schedules = await provider.getSchedulesForTenant('tenant-1');
 * ```
 * =============================================================================
 */

// Domain Model
export {
    // Types
    ExecutionParams,
    ScheduledExecution,
    IScheduleProvider,
    
    // Factory Functions
    createExecutionParams,
    createScheduledExecution,
    
    // Validation
    validateScheduledExecution,
} from './scheduled-execution.model';

// Providers
export {
    FixtureScheduleProvider,
    FixtureScheduleProviderConfig,
} from './fixture-schedule.provider';

export {
    InMemoryScheduleProvider,
} from './inmemory-schedule.provider';
