import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommandRegistry } from '../core/command-registry';
import {
    CommandName,
    ICommand,
    ICommandHandler,
    ILogger,
    IToolkitConfiguration,
    IUiPrinter,
    Result,
    ToolkitError,
} from '../core/contracts';
import { ExecutionContextFactory } from '../core/execution-context';
import { executeWithSafetyManifest } from '../core/safety-execution';
import { TenantResetService } from '../services/tenant-reset.service';
import { PrismaService } from '../../modules/prisma/prisma.service';
import {
    TOOLKIT_INTERNAL_COMMAND_REGISTRY,
    TOOLKIT_INTERNAL_CONFIG,
    TOOLKIT_INTERNAL_LOGGER,
    TOOLKIT_INTERNAL_UI_PRINTER,
} from './toolkit-internal.tokens';

@Injectable()
export class ToolkitCommandExecutorService {
    private readonly maxConcurrentCommands: number;
    private inFlightCommands = 0;

    constructor(
        @Inject(TOOLKIT_INTERNAL_COMMAND_REGISTRY)
        private readonly commandRegistry: CommandRegistry,
        @Inject(TOOLKIT_INTERNAL_CONFIG)
        private readonly config: IToolkitConfiguration,
        @Inject(TOOLKIT_INTERNAL_LOGGER)
        private readonly logger: ILogger,
        @Inject(TOOLKIT_INTERNAL_UI_PRINTER)
        private readonly printer: IUiPrinter,
        private readonly resetService: TenantResetService,
        private readonly prisma: PrismaService,
    ) {
        this.maxConcurrentCommands = this.resolveMaxConcurrentCommands(
            this.config.features.maxConcurrentCommands,
        );
    }

    issueHardResetToken(tenantId: string): { token: string; expiresAt: Date } {
        return this.resetService.generateConfirmationToken(tenantId);
    }

    async executeCommand<TCommand extends ICommand, TResult>(
        command: TCommand,
        params: {
            tenantId: string;
            dryRun: boolean;
        },
    ): Promise<Result<TResult>> {
        if (!this.tryAcquireExecutionSlot()) {
            this.logger.warn('Toolkit command rejected due to concurrency limit', {
                limit: this.maxConcurrentCommands,
                inFlight: this.inFlightCommands,
                commandName: command.name as string,
            });
            return Result.failure(
                new ToolkitConcurrencyLimitError(
                    `Maximum concurrent toolkit commands reached (${this.maxConcurrentCommands}). Retry later.`,
                ),
            );
        }

        try {
            const handler = this.commandRegistry.resolve(command.name as CommandName);
            if (!handler) {
                throw new Error(`Handler not found for command: ${command.name as string}`);
            }

            const context = ExecutionContextFactory.create({
                tenantId: params.tenantId,
                logger: this.logger,
                printer: this.printer,
                runId: randomUUID(),
                dryRun: params.dryRun,
                verbose: true,
            });

            const { result } = await executeWithSafetyManifest({
                commandName: command.name as string,
                executionMode: 'INTERNAL_API',
                context,
                prisma: this.prisma,
                args: {
                    dryRun: params.dryRun,
                },
                execute: async () => (
                    (handler as ICommandHandler<TCommand, TResult>).execute(command, context)
                ),
            });

            return result;
        } finally {
            this.releaseExecutionSlot();
        }
    }

    private resolveMaxConcurrentCommands(configuredLimit: number): number {
        if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) {
            return 5;
        }
        return configuredLimit;
    }

    private tryAcquireExecutionSlot(): boolean {
        if (this.inFlightCommands >= this.maxConcurrentCommands) {
            return false;
        }
        this.inFlightCommands += 1;
        return true;
    }

    private releaseExecutionSlot(): void {
        this.inFlightCommands = Math.max(0, this.inFlightCommands - 1);
    }
}

class ToolkitConcurrencyLimitError extends ToolkitError {
    readonly code = 'CONCURRENCY_LIMIT';
    readonly isRecoverable = true;

    constructor(message: string) {
        super(message);
    }
}
