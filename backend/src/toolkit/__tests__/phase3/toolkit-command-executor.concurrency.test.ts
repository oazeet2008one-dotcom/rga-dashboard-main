import 'reflect-metadata';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ToolkitCommandExecutorService } from '../../api/toolkit-command-executor.service';
import { CommandRegistry } from '../../core/command-registry';
import {
    ICommand,
    ICommandHandler,
    ILogger,
    IToolkitConfiguration,
    IUiPrinter,
    Result,
    createCommandName,
} from '../../core/contracts';

class DelayCommand implements ICommand {
    readonly name = createCommandName('delay-cmd');
    readonly description = 'Delay command';
    readonly requiresConfirmation = false;
}

class DelayHandler implements ICommandHandler<DelayCommand, { ok: boolean }> {
    canHandle(command: ICommand): command is DelayCommand {
        return command.name === createCommandName('delay-cmd');
    }

    async execute(): Promise<Result<{ ok: boolean }>> {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return Result.success({ ok: true });
    }

    getMetadata() {
        return {
            name: 'delay-cmd',
            displayName: 'Delay',
            description: 'Delay command',
            icon: 'D',
            category: 'testing' as const,
            estimatedDurationSeconds: 1,
            risks: [],
        };
    }

    validate(_command: DelayCommand): Result<void> {
        return Result.success(undefined);
    }
}

const logger: ILogger = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    child: () => logger,
};

const printer: IUiPrinter = {
    log: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    header: () => undefined,
    spinner: () => ({
        start: () => undefined,
        succeed: () => undefined,
        fail: () => undefined,
        stop: () => undefined,
    }),
};

describe('ToolkitCommandExecutorService concurrency limit', () => {
    const config: IToolkitConfiguration = {
        environment: 'development',
        database: { url: 'postgresql://localhost/db', timeoutMs: 5000, maxRetries: 3 },
        api: { baseUrl: 'http://localhost:3000', timeoutMs: 5000, retryAttempts: 3, retryDelayMs: 1000 },
        logging: { level: 'info', format: 'pretty' },
        features: { enableDryRun: true, confirmDestructiveActions: true, maxConcurrentCommands: 1 },
    };

    it('rejects a command when in-flight executions reach maxConcurrentCommands', async () => {
        const registry = new CommandRegistry(logger);
        registry.register(new DelayHandler());

        const service = new ToolkitCommandExecutorService(
            registry,
            config,
            logger,
            printer,
            { generateConfirmationToken: () => ({ token: 'x', expiresAt: new Date() }) } as any,
            {} as any, // Mock PrismaService
        );

        const command = new DelayCommand();
        const firstExecution = service.executeCommand(command, {
            tenantId: 'tenant-1',
            dryRun: true,
        });

        const secondExecution = await service.executeCommand(command, {
            tenantId: 'tenant-1',
            dryRun: true,
        });

        assert.strictEqual(secondExecution.kind, 'failure');
        if (secondExecution.kind === 'failure') {
            assert.strictEqual(secondExecution.error.code, 'CONCURRENCY_LIMIT');
            assert.strictEqual(secondExecution.error.isRecoverable, true);
        }

        const firstResult = await firstExecution;
        assert.strictEqual(firstResult.kind, 'success');
    });
});
