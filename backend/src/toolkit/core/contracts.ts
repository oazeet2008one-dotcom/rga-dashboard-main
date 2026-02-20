/**
 * =============================================================================
 * Core Contracts - The "Spine" of the Toolkit
 * =============================================================================
 * 
 * Design Principles:
 * - Interface Segregation: แยก interface ตามความรับผิดชอบ
 * - Explicit Contracts: ทุก dependency ต้องประกาศผ่าน interface
 * - No Concrete Dependencies: ไม่มี import จาก implementation
 * 
 * These contracts define WHAT the toolkit can do, not HOW.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// Observability Contracts
// -----------------------------------------------------------------------------

export interface IUiPrinter {
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    header(text: string): void;
    spinner(text: string): { start: () => void; succeed: (text?: string) => void; fail: (text?: string) => void; stop: () => void };
}

// -----------------------------------------------------------------------------
// Domain Primitives (Value Objects)
// -----------------------------------------------------------------------------

/**
 * Tenant Identifier - Branded type for type safety
 * Prevents accidentally passing wrong string as tenantId
 */
export type TenantId = string & { readonly __brand: 'TenantId' };

export function createTenantId(id: string): TenantId {
    if (typeof id !== 'string') {
        throw new InvalidTenantIdError(`Invalid tenant ID: ${id}`);
    }

    const normalized = id.trim();

    if (!normalized || normalized.length > 128 || /\s/.test(normalized)) {
        throw new InvalidTenantIdError(`Invalid tenant ID: ${id}`);
    }
    return normalized as TenantId;
}

/**
 * Command Name - Branded type for command identifiers
 */
export type CommandName = string & { readonly __brand: 'CommandName' };

export function createCommandName(name: string): CommandName {
    if (!name || !/^[a-z0-9-]+$/.test(name)) {
        throw new InvalidCommandNameError(
            `Command name must be lowercase alphanumeric with hyphens: ${name}`
        );
    }
    return name as CommandName;
}

// -----------------------------------------------------------------------------
// Result Pattern (Railway-Oriented Programming)
// -----------------------------------------------------------------------------

/**
 * Represents an operation that can succeed or fail
 * Eliminates need for try-catch in business logic
 * Reference: https://fsharpforfunandprofit.com/rop/
 */
export type Result<T, E = ToolkitError> =
    | { readonly kind: 'success'; readonly value: T }
    | { readonly kind: 'failure'; readonly error: E };

export const Result = {
    success<T>(value: T): Result<T, never> {
        return { kind: 'success', value };
    },

    failure<E>(error: E): Result<never, E> {
        return { kind: 'failure', error };
    },

    /**
     * Unwrap with explicit error handling
     */
    match<T, E, R>(
        result: Result<T, E>,
        handlers: {
            success: (value: T) => R;
            failure: (error: E) => R;
        }
    ): R {
        if (result.kind === 'success') {
            return handlers.success(result.value);
        }
        return handlers.failure(result.error);
    }
} as const;

// -----------------------------------------------------------------------------
// Execution Context (Request Context Pattern)
// -----------------------------------------------------------------------------

/**
 * Immutable context passed through the entire execution pipeline
 * Contains all cross-cutting concerns in one place
 */
export interface IExecutionContext {
    readonly tenantId: TenantId;
    readonly correlationId: string;
    readonly startedAt: Date;
    readonly dryRun: boolean;
    readonly verbose: boolean;

    // Observability
    readonly runId: string;
    readonly logger: ILogger;
    readonly printer: IUiPrinter;

    /**
     * Create child context with modifications
     * Immutable pattern - returns new context
     */
    with(props: Partial<IExecutionContext>): IExecutionContext;

    /**
     * Calculate elapsed time from start
     */
    elapsedMs(): number;
}

// -----------------------------------------------------------------------------
// Command Pattern (CQRS Light)
// -----------------------------------------------------------------------------

/**
 * A command represents an intent to perform an action
 * Commands are named in imperative form (e.g., "SeedGoogleAds")
 */
export interface ICommand {
    readonly name: CommandName;
    readonly description: string;
    readonly requiresConfirmation: boolean;
}

/**
 * Metadata for displaying command in UI
 */
export interface ICommandMetadata {
    readonly name: string;
    readonly displayName: string;
    readonly description: string;
    readonly icon: string;
    readonly category: 'data' | 'testing' | 'maintenance' | 'diagnostics';
    readonly estimatedDurationSeconds: number;
    readonly risks: ReadonlyArray<string>;
}

/**
 * Handler for a specific command type
 * Single Responsibility: One handler per command
 */
export interface ICommandHandler<TCommand extends ICommand = ICommand, TResult = unknown> {
    /**
     * Check if this handler can handle the given command
     */
    canHandle(command: ICommand): command is TCommand;

    /**
     * Execute the command
     * Returns Result to force explicit error handling
     */
    execute(command: TCommand, context: IExecutionContext): Promise<Result<TResult>>;

    /**
     * Get metadata for UI display
     */
    getMetadata(): ICommandMetadata;

    /**
     * Validate command before execution
     * Early validation = Fail Fast
     */
    validate(command: TCommand): Result<void>;
}

/**
 * Registry for discovering and executing commands
 * Open/Closed Principle: Add commands without modifying registry
 */
export interface ICommandRegistry {
    /**
     * Register a command handler
     */
    register(handler: ICommandHandler): void;

    /**
     * Get handler for a command
     * Returns null if not found (explicit null over exception)
     */
    resolve(commandName: CommandName): ICommandHandler | null;

    /**
     * List all available commands
     */
    listAll(): ReadonlyArray<{ command: ICommand; handler: ICommandHandler }>;

    /**
     * Check if command exists
     */
    has(commandName: CommandName): boolean;
}

// -----------------------------------------------------------------------------
// Cross-Cutting Concerns
// -----------------------------------------------------------------------------

/**
 * Structured logging interface
 * Abstracts away console/logging implementation
 */
export interface ILogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;

    /**
     * Create child logger with bound context
     */
    child(bindings: Record<string, unknown>): ILogger;
}

/**
 * Configuration with strong typing
 * Fail-fast validation at startup
 */
export interface IToolkitConfiguration {
    readonly environment: 'development' | 'staging' | 'production';
    readonly database: {
        readonly url: string;
        readonly timeoutMs: number;
        readonly maxRetries: number;
    };
    readonly api: {
        readonly baseUrl: string;
        readonly timeoutMs: number;
        readonly retryAttempts: number;
        readonly retryDelayMs: number;
    };
    readonly logging: {
        readonly level: 'debug' | 'info' | 'warn' | 'error';
        readonly format: 'json' | 'pretty';
    };
    readonly features: {
        readonly enableDryRun: boolean;
        readonly confirmDestructiveActions: boolean;
        readonly maxConcurrentCommands: number;
    };
}

/**
 * State persistence interface
 * Abstracts storage mechanism (SQLite, JSON, etc.)
 */
export interface ISessionStore {
    /**
     * Get last used tenant
     */
    getLastTenantId(): Promise<TenantId | null>;

    /**
     * Save tenant selection
     */
    setLastTenantId(tenantId: TenantId): Promise<void>;

    /**
     * Cache API response with TTL
     */
    getCache<T>(key: string): Promise<T | null>;
    setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

    /**
     * Command history for replay/debugging
     */
    addToHistory(entry: CommandHistoryEntry): Promise<void>;
    getHistory(limit: number): Promise<ReadonlyArray<CommandHistoryEntry>>;
}

export interface CommandHistoryEntry {
    readonly timestamp: Date;
    readonly commandName: CommandName;
    readonly tenantId: TenantId;
    readonly success: boolean;
    readonly durationMs: number;
    readonly errorMessage?: string;
}

// -----------------------------------------------------------------------------
// Error Types (Explicit Error Hierarchy)
// -----------------------------------------------------------------------------

export abstract class ToolkitError extends Error {
    abstract readonly code: string;
    abstract readonly isRecoverable: boolean;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class InvalidTenantIdError extends ToolkitError {
    readonly code = 'INVALID_TENANT_ID';
    readonly isRecoverable = false;
}

export class InvalidCommandNameError extends ToolkitError {
    readonly code = 'INVALID_COMMAND_NAME';
    readonly isRecoverable = false;
}

export class CommandNotFoundError extends ToolkitError {
    readonly code = 'COMMAND_NOT_FOUND';
    readonly isRecoverable = true;
}

export class ValidationError extends ToolkitError {
    readonly code = 'VALIDATION_ERROR';
    readonly isRecoverable = true;
    constructor(
        message: string,
        public readonly fieldErrors: ReadonlyArray<{ field: string; message: string }>
    ) {
        super(message);
    }
}

export class DatabaseConnectionError extends ToolkitError {
    readonly code = 'DB_CONNECTION_FAILED';
    readonly isRecoverable = true;
}

export class ApiConnectionError extends ToolkitError {
    readonly code = 'API_CONNECTION_FAILED';
    readonly isRecoverable = true;
}
