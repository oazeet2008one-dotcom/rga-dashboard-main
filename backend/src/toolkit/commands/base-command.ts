/**
 * =============================================================================
 * Base Command - Abstract Class for Reduced Boilerplate
 * =============================================================================
 * 
 * Design Principles:
 * - Template Method Pattern: Common flow in base class
 * - Open/Closed: Subclasses override specific parts
 * - Type Safety: Generic types ensure correct implementation
 * - Constructor Injection: Explicit dependencies, testable
 * =============================================================================
 */

import { 
    ICommand, 
    ICommandHandler, 
    ICommandMetadata,
    IExecutionContext,
    CommandName,
    Result,
    ValidationError,
    ILogger,
    ToolkitError
} from '../core/contracts';

/**
 * Base command with common metadata
 */
export abstract class BaseCommand implements ICommand {
    abstract readonly name: CommandName;
    abstract readonly description: string;
    readonly requiresConfirmation: boolean;
    
    constructor(requiresConfirmation = false) {
        this.requiresConfirmation = requiresConfirmation;
    }
}

/**
 * Dependencies required by BaseCommandHandler
 * Explicit interface for constructor injection
 */
export interface IBaseCommandHandlerDeps {
    logger: ILogger;
}

/**
 * Abstract base handler with template method
 * Subclasses implement: validate(), executeCore(), getMetadata()
 * Dependencies passed through constructor (Explicit Dependency Principle)
 */
export abstract class BaseCommandHandler<TCommand extends ICommand, TResult>
    implements ICommandHandler<TCommand, TResult> {
    
    protected readonly logger: ILogger;
    
    /**
     * Constructor injection - dependencies are explicit and required
     * No magic, no hidden dependencies
     */
    constructor(deps: IBaseCommandHandlerDeps) {
        this.logger = deps.logger.child({ handler: this.constructor.name });
    }
    
    /**
     * Template method - orchestrates execution flow
     * Subclasses should NOT override this
     */
    async execute(command: TCommand, context: IExecutionContext): Promise<Result<TResult>> {
        const startTime = Date.now();
        
        this.logger.info('Command started', {
            command: command.name,
            tenantId: context.tenantId,
            correlationId: context.correlationId,
            dryRun: context.dryRun,
        });
        
        try {
            // Step 1: Validate
            const validation = this.validate(command);
            if (validation.kind === 'failure') {
                this.logger.warn('Command validation failed', {
                    command: command.name,
                    error: validation.error,
                });
                return validation as Result<TResult>;
            }
            
            // Step 2: Execute (subclass implementation)
            const result = await this.executeCore(command, context);
            
            const duration = Date.now() - startTime;
            this.logger.info('Command completed', {
                command: command.name,
                durationMs: duration,
                success: result.kind === 'success',
            });
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            this.logger.error('Command failed unexpectedly', error instanceof Error ? error : undefined, {
                command: command.name,
                durationMs: duration,
            });
            
            return Result.failure(new CommandExecutionError(errorMessage));
        }
    }
    
    /**
     * Type guard - check if this handler can handle the command
     */
    abstract canHandle(command: ICommand): command is TCommand;
    
    /**
     * Get metadata for UI display
     */
    abstract getMetadata(): ICommandMetadata;
    
    /**
     * Validate command before execution
     * Return Result.failure() if invalid
     */
    abstract validate(command: TCommand): Result<void>;
    
    /**
     * Core execution logic - implement in subclass
     */
    protected abstract executeCore(command: TCommand, context: IExecutionContext): Promise<Result<TResult>>;
}

class CommandExecutionError extends ToolkitError {
    readonly code = 'COMMAND_EXECUTION_FAILED';
    readonly isRecoverable = false;
    
    constructor(message: string) {
        super(message);
    }
}
