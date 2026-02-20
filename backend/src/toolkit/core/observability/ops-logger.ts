/**
 * =============================================================================
 * Ops Logger Implementation (Pino)
 * =============================================================================
 * Enforces:
 * 1. JSON Lines in CI (stdout)
 * 2. Pretty Print in LOCAL (stderr/file)
 * 3. Redaction at Sink (via Serializers)
 * =============================================================================
 */

import pino from 'pino';
import { IOpsLogger, ToolkitEnv } from './contracts';
import * as Redactor from '../../manifest/redactor';

export class PinoOpsLogger implements IOpsLogger {
    private readonly logger: pino.Logger;

    constructor(
        env: ToolkitEnv,
        bindings: Record<string, unknown> = {}
    ) {
        // CI = stdout (JSON), LOCAL = stderr (Pretty)
        // This strictly follows LOGGING_CONTRACT_PHASE4B
        const destination = env === 'CI' ? pino.destination(1) : pino.destination(2); // 1=stdout, 2=stderr

        const transport = env === 'LOCAL'
            ? pino.transport({
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            })
            : undefined;

        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            base: {
                env,
                ...bindings, // Initial bindings (like runId if passed early)
            },
            serializers: {
                // Redact Error objects
                err: (err) => {
                    const sanitized = Redactor.sanitizeError(err);
                    return {
                        type: 'Error',
                        message: sanitized.message,
                        code: sanitized.code,
                        // We do not include stack in logs to avoid accidental leakage of paths/values in frames
                        // unless explicitly debug level (which sanitization strips anyway for now)
                    };
                },
                // Redact 'meta' object (the object merged into log)
                // Pino doesn't have a direct "redact all merged objects" hook easily without overhead,
                // so we use the `formatters` hook or `hooks`.
            },
            hooks: {
                logMethod(inputArgs, method, level) {
                    // inputArgs is [msg, ...args] or [obj, msg, ...args]
                    if (inputArgs.length >= 2 && typeof inputArgs[0] === 'object' && inputArgs[0] !== null) {
                        // We have an object as the first arg: log.info({ key: val }, 'msg')
                        // We must redact it.
                        const originalObj = inputArgs[0] as Record<string, unknown>;
                        // Using redactArgs as a proxy for object redaction
                        inputArgs[0] = Redactor.redactArgs(originalObj);
                    }
                    return method.apply(this, inputArgs);
                }
            }
        }, transport || destination);
    }

    info(message: string, meta?: unknown): void;
    info(meta: object, message?: string): void;
    info(arg1: string | object, arg2?: unknown): void {
        this.logger.info(arg1 as any, arg2 as any);
    }

    warn(message: string, meta?: unknown): void;
    warn(meta: object, message?: string): void;
    warn(arg1: string | object, arg2?: unknown): void {
        this.logger.warn(arg1 as any, arg2 as any);
    }

    error(message: string, meta?: unknown): void;
    error(meta: object, message?: string): void;
    error(arg1: string | object, arg2?: unknown): void {
        this.logger.error(arg1 as any, arg2 as any);
    }

    debug(message: string, meta?: unknown): void;
    debug(meta: object, message?: string): void;
    debug(arg1: string | object, arg2?: unknown): void {
        this.logger.debug(arg1 as any, arg2 as any);
    }

    child(bindings: Record<string, string | number | boolean>): IOpsLogger {
        // Redact bindings too just in case
        const redactedBindings = Redactor.redactArgs(bindings as Record<string, unknown>);
        const childPino = this.logger.child(redactedBindings);

        // Wrap the child back in our class to maintain the contract
        // We cheat slightly by casting, but for this implementation we essentially 
        // need to return a new instance of this class wrapping the child.
        // However, pino.child returns a pino Logger. 
        // Simpler: Reuse this class but with a "fromLogger" constructor or similar.
        // For now, let's just make a private constructor public-ish or use a factory method.
        return new PinoLoggerWrapper(childPino);
    }
}

// Helper wrapper to handle the child() return type
class PinoLoggerWrapper implements IOpsLogger {
    constructor(private logger: pino.Logger) { }

    info(message: string, meta?: unknown): void;
    info(meta: object, message?: string): void;
    info(arg1: string | object, arg2?: unknown): void {
        this.logger.info(arg1 as any, arg2 as any);
    }

    warn(message: string, meta?: unknown): void;
    warn(meta: object, message?: string): void;
    warn(arg1: string | object, arg2?: unknown): void {
        this.logger.warn(arg1 as any, arg2 as any);
    }

    error(message: string, meta?: unknown): void;
    error(meta: object, message?: string): void;
    error(arg1: string | object, arg2?: unknown): void {
        this.logger.error(arg1 as any, arg2 as any);
    }

    debug(message: string, meta?: unknown): void;
    debug(meta: object, message?: string): void;
    debug(arg1: string | object, arg2?: unknown): void {
        this.logger.debug(arg1 as any, arg2 as any);
    }

    child(bindings: Record<string, string | number | boolean>): IOpsLogger {
        const redactedBindings = Redactor.redactArgs(bindings as Record<string, unknown>);
        return new PinoLoggerWrapper(this.logger.child(redactedBindings));
    }
}
