/**
 * =============================================================================
 * Phase 4B Observability Contracts
 * =============================================================================
 * Defines the strict interfaces for Logging, Printing, and Context.
 * =============================================================================
 */

import { ILogger } from '../contracts';

export type ToolkitEnv = 'LOCAL' | 'CI';

export interface IUiPrinter {
    /**
     * Print a normal message to the UI stream.
     * In CI: This may be suppressed or directed to stderr.
     * In LOCAL: This goes to stdout (Rich).
     */
    log(message: string): void;

    /**
     * Print a warning to the UI stream.
     * In CI: Goes to stderr.
     */
    warn(message: string): void;

    /**
     * Print an error to the UI stream.
     * MUST be sanitized before calling, but implementations should define a fail-safe.
     */
    error(message: string): void;

    /**
     * Print a header/banner.
     * In CI: Suppressed.
     */
    header(text: string): void;

    /**
     * Create a spinner or return a no-op proxy.
     */
    spinner(text: string): { start: () => void; succeed: (text?: string) => void; fail: (text?: string) => void; stop: () => void };
}

export interface IOpsLogger extends ILogger {
    /**
     * Create a child logger with bound string properties.
     * Used for binding tenantId, commandName, etc.
     */
    child(bindings: Record<string, string | number | boolean>): IOpsLogger;
}

export interface IRunLogger {
    readonly printer: IUiPrinter;
    readonly ops: IOpsLogger;
}

export interface IObservabilityContext {
    readonly runId: string;
    readonly commandName: string;
    readonly env: ToolkitEnv;
    readonly tenantId?: string;
    readonly scenarioId?: string;
    readonly seed?: number;
    readonly mode?: string;
}
