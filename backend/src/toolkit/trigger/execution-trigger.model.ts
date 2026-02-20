/**
 * =============================================================================
 * Execution Trigger Model
 * =============================================================================
 *
 * Core control plane for starting alert executions.
 *
 * Design Principles:
 * - Stateless: No instance state between triggers
 * - Deterministic: Same input → same output
 * - Serializable: JSON-safe, can be logged/queued
 * - Transport-agnostic: No CLI/HTTP/WS logic
 * - No scheduling: Time-agnostic
 * - No persistence: No database concerns
 *
 * Responsibility:
 * - Define HOW an execution is triggered
 * - Track execution lifecycle
 * - Provide execution context
 *
 * Non-Responsibility:
 * - WHEN to trigger (scheduling)
 * - WHERE to trigger (transport)
 * - WHAT to evaluate (domain logic)
 * =============================================================================
 */

// =============================================================================
// Trigger Types
// =============================================================================

/**
 * Type of trigger that initiated an execution
 */
export type TriggerType = 'MANUAL' | 'PROGRAMMATIC';

/**
 * Human-readable trigger type labels
 */
export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
    MANUAL: 'Manual execution by user',
    PROGRAMMATIC: 'Programmatic execution via API/code',
};

// =============================================================================
// Execution Status Lifecycle
// =============================================================================

/**
 * Execution lifecycle states
 *
 * State Machine:
 * CREATED → STARTED → COMPLETED
 *                   → FAILED
 *                   → CANCELLED (from any state)
 */
export type ExecutionStatus =
    | 'CREATED'   // Execution request created, not yet started
    | 'STARTED'   // Execution has begun
    | 'COMPLETED' // Execution finished successfully
    | 'FAILED'    // Execution failed
    | 'CANCELLED'; // Execution was cancelled before/during

/**
 * Terminal statuses - no further transitions possible
 */
export const TERMINAL_STATUSES: ExecutionStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

/**
 * Check if a status is terminal
 */
export function isTerminalStatus(status: ExecutionStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
}

/**
 * Valid status transitions
 */
export const VALID_TRANSITIONS: Record<ExecutionStatus, ExecutionStatus[]> = {
    CREATED: ['STARTED', 'CANCELLED'],
    STARTED: ['COMPLETED', 'FAILED', 'CANCELLED'],
    COMPLETED: [], // Terminal
    FAILED: [], // Terminal
    CANCELLED: [], // Terminal
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
    from: ExecutionStatus,
    to: ExecutionStatus
): boolean {
    return VALID_TRANSITIONS[from].includes(to);
}

// =============================================================================
// Execution Trigger
// =============================================================================

/**
 * A request to start an alert execution
 *
 * This is the PRIMARY INPUT to the trigger system.
 * Transport layers (CLI, HTTP, etc.) create this object.
 */
export interface ExecutionTrigger {
    /**
     * Unique identifier for this execution
     * Generated at creation time
     */
    readonly executionId: string;

    /**
     * Tenant scope for execution
     */
    readonly tenantId: string;

    /**
     * Type of trigger
     */
    readonly triggerType: TriggerType;

    /**
     * Who/what requested the execution
     * - For MANUAL: user identifier
     * - For PROGRAMMATIC: service/component name
     */
    readonly requestedBy: string;

    /**
     * If true, no side effects should occur
     * Used for dry-run / preview mode
     */
    readonly dryRun: boolean;

    /**
     * When the trigger was created
     */
    readonly createdAt: Date;

    /**
     * Optional metadata for debugging/auditing
     */
    readonly metadata?: {
        readonly correlationId?: string;
        readonly sourceIp?: string;
        readonly userAgent?: string;
        readonly reason?: string;
        readonly [key: string]: unknown;
    };
}

// =============================================================================
// Execution Start Request
// =============================================================================

/**
 * Input boundary for starting an execution
 *
 * This is what callers provide to ExecutionTriggerService.
 * The service creates an ExecutionTrigger from this.
 */
export interface ExecutionStartRequest {
    /**
     * Tenant scope
     */
    readonly tenantId: string;

    /**
     * Type of trigger
     */
    readonly triggerType: TriggerType;

    /**
     * Who/what is requesting
     */
    readonly requestedBy: string;

    /**
     * Dry run mode (optional, default false)
     */
    readonly dryRun?: boolean;

    /**
     * Optional metadata
     */
    readonly metadata?: ExecutionTrigger['metadata'];
}

// =============================================================================
// Execution Start Result
// =============================================================================

/**
 * Result of attempting to start an execution
 *
 * This is the PRIMARY OUTPUT from the trigger system.
 */
export interface ExecutionStartResult {
    /**
     * Whether the start was accepted
     */
    readonly accepted: boolean;

    /**
     * Execution identifier
     * Present if accepted, may be present if rejected (for tracking)
     */
    readonly executionId?: string;

    /**
     * Current status of the execution
     */
    readonly status: ExecutionStatus;

    /**
     * When the result was produced
     */
    readonly timestamp: Date;

    /**
     * Failure reason (if not accepted)
     */
    readonly rejectionReason?: string;

    /**
     * Validation errors (if validation failed)
     */
    readonly validationErrors?: string[];
}

// =============================================================================
// Execution State
// =============================================================================

/**
 * Current state of an execution
 *
 * Used for tracking in-progress executions.
 */
export interface ExecutionState {
    /**
     * Execution identifier
     */
    readonly executionId: string;

    /**
     * Current status
     */
    readonly status: ExecutionStatus;

    /**
     * Original trigger
     */
    readonly trigger: ExecutionTrigger;

    /**
     * When the execution started (null if not started)
     */
    readonly startedAt: Date | null;

    /**
     * When the execution completed/failed/cancelled (null if not terminal)
     */
    readonly completedAt: Date | null;

    /**
     * Error message (if failed)
     */
    readonly errorMessage?: string;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Generate a unique execution ID
 */
export function generateExecutionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `exec-${timestamp}-${random}`;
}

/**
 * Create an ExecutionTrigger from a start request
 */
export function createExecutionTrigger(
    request: ExecutionStartRequest
): ExecutionTrigger {
    return {
        executionId: generateExecutionId(),
        tenantId: request.tenantId,
        triggerType: request.triggerType,
        requestedBy: request.requestedBy,
        dryRun: request.dryRun ?? false,
        createdAt: new Date(),
        metadata: request.metadata,
    };
}

/**
 * Create initial execution state
 */
export function createExecutionState(
    trigger: ExecutionTrigger
): ExecutionState {
    return {
        executionId: trigger.executionId,
        status: 'CREATED',
        trigger,
        startedAt: null,
        completedAt: null,
    };
}

/**
 * Create a successful start result
 */
export function createStartSuccess(
    executionId: string,
    initialStatus: ExecutionStatus = 'CREATED'
): ExecutionStartResult {
    return {
        accepted: true,
        executionId,
        status: initialStatus,
        timestamp: new Date(),
    };
}

/**
 * Create a rejected start result
 */
export function createStartRejection(
    reason: string,
    validationErrors?: string[],
    executionId?: string
): ExecutionStartResult {
    return {
        accepted: false,
        executionId,
        status: 'CANCELLED',
        timestamp: new Date(),
        rejectionReason: reason,
        validationErrors,
    };
}

// =============================================================================
// Status Transitions
// =============================================================================

/**
 * Transition execution state to a new status
 * Returns null if transition is invalid
 */
export function transitionState(
    state: ExecutionState,
    newStatus: ExecutionStatus,
    errorMessage?: string
): ExecutionState | null {
    if (!isValidTransition(state.status, newStatus)) {
        return null;
    }

    const now = new Date();

    return {
        ...state,
        status: newStatus,
        startedAt: newStatus === 'STARTED' ? now : state.startedAt,
        completedAt: isTerminalStatus(newStatus) ? now : state.completedAt,
        errorMessage: newStatus === 'FAILED' ? errorMessage : state.errorMessage,
    };
}
