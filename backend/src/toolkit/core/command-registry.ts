/**
 * =============================================================================
 * Command Registry Implementation
 * =============================================================================
 * 
 * Design Principles:
 * - Open/Closed Principle: Add commands without modifying this file
 * - Fail-Fast: Duplicate registration throws immediately
 * - Thread-Safe: Uses immutable internal state
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { 
    ICommandRegistry, 
    ICommandHandler, 
    ICommand, 
    CommandName, 
    CommandNotFoundError,
    ToolkitError,
    ILogger
} from './contracts';
import { TOKENS } from './container';

@injectable()
export class CommandRegistry implements ICommandRegistry {
    private handlers = new Map<string, ICommandHandler>();
    
    constructor(
        @inject(TOKENS.Logger) private logger: ILogger
    ) {}
    
    register(handler: ICommandHandler): void {
        const metadata = handler.getMetadata();
        const name = metadata.name;
        
        if (this.handlers.has(name)) {
            throw new DuplicateCommandError(
                `Command "${name}" is already registered. ` +
                `Each command must have a unique name.`
            );
        }
        
        this.handlers.set(name, handler);
        this.logger.debug(`Registered command: ${name}`, {
            command: name,
            category: metadata.category,
        });
    }
    
    resolve(commandName: CommandName): ICommandHandler | null {
        return this.handlers.get(commandName) ?? null;
    }
    
    has(commandName: CommandName): boolean {
        return this.handlers.has(commandName);
    }
    
    listAll(): ReadonlyArray<{ command: ICommand; handler: ICommandHandler }> {
        return Array.from(this.handlers.entries()).map(([name, handler]) => ({
            command: {
                name: name as CommandName,
                description: handler.getMetadata().description,
                requiresConfirmation: this.isDestructive(handler),
            },
            handler,
        }));
    }
    
    private isDestructive(handler: ICommandHandler): boolean {
        const metadata = handler.getMetadata();
        return metadata.risks.some(r => 
            r.toLowerCase().includes('delete') || 
            r.toLowerCase().includes('remove') ||
            r.toLowerCase().includes('clear')
        );
    }
}

class DuplicateCommandError extends ToolkitError {
    readonly code = 'DUPLICATE_COMMAND';
    readonly isRecoverable = false;
    
    constructor(message: string) {
        super(message);
    }
}
