/**
 * =============================================================================
 * Pino Logger Implementation
 * =============================================================================
 * 
 * Design Principles:
 * - Structured Logging: JSON output for production, pretty for dev
 * - Contextual: Every log includes correlation ID and tenant
 * - Lazy Evaluation: Don't compute expensive meta unless needed
 * =============================================================================
 */

import pino from 'pino';
import { injectable, inject } from 'tsyringe';
import { ILogger, IToolkitConfiguration } from '../core/contracts';
import { TOKENS } from '../core/container';

@injectable()
export class PinoLogger implements ILogger {
    private readonly logger: pino.Logger;
    
    constructor(
        @inject(TOKENS.Config) private config: IToolkitConfiguration
    ) {
        // Create transport that writes to stderr explicitly
        // This prevents logs from interfering with inquirer's stdout-based UI
        const transport = config.logging.format === 'pretty' 
            ? pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
                worker: {
                    stdout: false,
                    stderr: true,
                },
            })
            : undefined;
        
        this.logger = pino({
            level: config.logging.level,
            base: {
                env: config.environment,
            },
        }, transport || process.stderr);
    }
    
    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(meta, message);
    }
    
    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(meta, message);
    }
    
    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(meta, message);
    }
    
    error(message: string, error?: Error, meta?: Record<string, unknown>): void {
        const errorMeta = error ? {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...meta,
        } : meta;
        
        this.logger.error(errorMeta, message);
    }
    
    child(bindings: Record<string, unknown>): ILogger {
        const childLogger = this.logger.child(bindings);
        return new PinoLoggerChild(childLogger);
    }
}

/**
 * Child logger wrapper - delegates to pino child instance
 */
class PinoLoggerChild implements ILogger {
    constructor(private readonly logger: pino.Logger) {}
    
    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(meta, message);
    }
    
    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(meta, message);
    }
    
    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(meta, message);
    }
    
    error(message: string, error?: Error, meta?: Record<string, unknown>): void {
        const errorMeta = error ? {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            ...meta,
        } : meta;
        
        this.logger.error(errorMeta, message);
    }
    
    child(bindings: Record<string, unknown>): ILogger {
        return new PinoLoggerChild(this.logger.child(bindings));
    }
}
