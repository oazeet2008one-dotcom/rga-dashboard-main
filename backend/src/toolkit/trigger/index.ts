/**
 * =============================================================================
 * Trigger Module - Public API
 * =============================================================================
 *
 * Execution Trigger Control Plane
 *
 * This module provides:
 * - Execution trigger model (types, states, lifecycle)
 * - Execution trigger service (start, cancel, track)
 *
 * Usage:
 * ```typescript
 * import {
 *   ExecutionTriggerService,
 *   ExecutionStartRequest,
 *   createExecutionTrigger,
 * } from './trigger';
 * ```
 * =============================================================================
 */

// Domain Model
export {
    // Types
    TriggerType,
    TRIGGER_TYPE_LABELS,
    ExecutionStatus,
    TERMINAL_STATUSES,
    VALID_TRANSITIONS,
    
    // Core Models
    ExecutionTrigger,
    ExecutionStartRequest,
    ExecutionStartResult,
    ExecutionState,
    
    // Validation Functions
    isTerminalStatus,
    isValidTransition,
    
    // Factory Functions
    generateExecutionId,
    createExecutionTrigger,
    createExecutionState,
    createStartSuccess,
    createStartRejection,
    transitionState,
} from './execution-trigger.model';

// Service
export {
    ExecutionTriggerService,
    TriggerServiceConfig,
} from './execution-trigger.service';
