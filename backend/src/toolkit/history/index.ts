/**
 * =============================================================================
 * History Module - Public API
 * =============================================================================
 *
 * Execution History Persistence Layer
 *
 * Durable, append-only execution history tracking.
 * No execution logic. No scheduling logic.
 *
 * Usage:
 * ```typescript
 * import {
 *   ExecutionHistoryService,
 *   ExecutionHistoryRepository,
 *   InMemoryExecutionHistoryRepository,
 *   ExecutionHistoryRecord,
 * } from './history';
 *
 * // Record execution
 * await historyService.recordExecution(state, result);
 *
 * // Query history
 * const recent = await historyService.findRecent('tenant-1', { limit: 10 });
 *
 * // Check cooldown
 * const inCooldown = await historyService.isInCooldown('tenant-1', 60000, now);
 * ```
 * =============================================================================
 */

// Domain Model
export {
    // Types
    ExecutionHistoryStatus,
    ExecutionHistoryTriggerType,
    
    // Core Models
    ExecutionHistoryRecord,
    HistoryQueryOptions,
    HistoryQueryResult,
    ExecutionSummary,
    
    // Factory Functions
    createExecutionHistoryRecord,
    createQueryOptions,
    
    // Utilities
    isInCooldownPeriod,
    getRemainingCooldownMs,
    filterByTimeWindow,
    calculateExecutionSummary,
} from './execution-history.model';

// Repository Interface
export {
    ExecutionHistoryRepository,
    Clock,
    SystemClock,
    HistoryPersistenceError,
    HistoryQueryError,
} from './execution-history.repository';

// In-Memory Implementation
export {
    InMemoryExecutionHistoryRepository,
    InMemoryRepositoryConfig,
} from './execution-history.inmemory';

// Service
export {
    ExecutionHistoryService,
    ExecutionHistoryServiceConfig,
} from './execution-history.service';
