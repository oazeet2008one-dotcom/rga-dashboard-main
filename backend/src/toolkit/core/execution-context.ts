/**
 * =============================================================================
 * Execution Context Implementation
 * =============================================================================
 * 
 * Design Principles:
 * - Immutable: Context never changes, always create new
 * - Explicit: All context data passed explicitly
 * - Traceable: Every operation has correlation ID for logging
 * =============================================================================
 */

import { randomUUID } from 'crypto';
import {
    IExecutionContext,
    TenantId,
    createTenantId,
    ILogger,
    IUiPrinter
} from './contracts';

/**
 * Factory for creating execution contexts
 * Ensures consistent initialization
 */
export class ExecutionContextFactory {
    /**
     * Create root context for a new command execution
     */
    static create(params: {
        tenantId: TenantId | string;
        logger: ILogger;
        printer: IUiPrinter;
        runId: string;
        dryRun?: boolean;
        verbose?: boolean;
    }): IExecutionContext {
        const tenantId = typeof params.tenantId === 'string'
            ? createTenantId(params.tenantId)
            : params.tenantId;

        return new ExecutionContextImpl({
            tenantId,
            correlationId: randomUUID(),
            startedAt: new Date(),
            dryRun: params.dryRun ?? false,
            verbose: params.verbose ?? false,
            runId: params.runId,
            logger: params.logger,
            printer: params.printer,
        });
    }
}

/**
 * Private implementation - encapsulated
 */
class ExecutionContextImpl implements IExecutionContext {
    readonly tenantId: TenantId;
    readonly correlationId: string;
    readonly startedAt: Date;
    readonly dryRun: boolean;
    readonly verbose: boolean;
    readonly runId: string;
    readonly logger: ILogger;
    readonly printer: IUiPrinter;

    constructor(props: {
        tenantId: TenantId;
        correlationId: string;
        startedAt: Date;
        dryRun: boolean;
        verbose: boolean;
        runId: string;
        logger: ILogger;
        printer: IUiPrinter;
    }) {
        this.tenantId = props.tenantId;
        this.correlationId = props.correlationId;
        this.startedAt = props.startedAt;
        this.dryRun = props.dryRun;
        this.verbose = props.verbose;
        this.runId = props.runId;
        this.logger = props.logger;
        this.printer = props.printer;

        // Freeze to prevent accidental mutation
        Object.freeze(this);
    }

    with(props: Partial<IExecutionContext>): IExecutionContext {
        return new ExecutionContextImpl({
            tenantId: props.tenantId ?? this.tenantId,
            correlationId: props.correlationId ?? this.correlationId,
            startedAt: props.startedAt ?? this.startedAt,
            dryRun: props.dryRun ?? this.dryRun,
            verbose: props.verbose ?? this.verbose,
            runId: props.runId ?? this.runId,
            logger: props.logger ?? this.logger,
            printer: props.printer ?? this.printer,
        });
    }

    elapsedMs(): number {
        return Date.now() - this.startedAt.getTime();
    }
}
