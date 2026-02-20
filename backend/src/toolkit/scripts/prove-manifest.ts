
import 'reflect-metadata';
import { container } from 'tsyringe';
import { randomUUID } from 'crypto';
import { initializeContainer, loadConfiguration, ServiceLocator, TOKENS, ExecutionContextFactory, createTenantId } from '../core';
import { SeedUnifiedCommandHandler } from '../commands/seed-unified.command';
import { SeedUnifiedCommand } from '../commands/seed-unified.command';
import { PinoLogger } from '../infrastructure/pino-logger';
import { ScenarioLoader } from '../scenarios/scenario-loader';
import { FixtureProvider } from '../fixtures/fixture-provider';
import { PinoOpsLogger } from '../core/observability/ops-logger';
import { ConsoleUiPrinter } from '../core/observability/ui-printer';
import { RunLogger } from '../core/observability/run-logger';

async function main() {
    process.env.TOOLKIT_ENV = 'CI';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

    console.log('--- Initializing ---');
    const config = loadConfiguration();
    initializeContainer(config);

    ServiceLocator.register(TOKENS.Logger, PinoLogger);

    // Register instances to avoid DI interface metadata issues with optional config
    container.registerInstance(ScenarioLoader, new ScenarioLoader());
    container.registerInstance(FixtureProvider, new FixtureProvider());

    container.register(SeedUnifiedCommandHandler, { useClass: SeedUnifiedCommandHandler });

    const handler = container.resolve(SeedUnifiedCommandHandler);
    const runId = randomUUID();
    const env = process.env.TOOLKIT_ENV === 'CI' ? 'CI' : 'LOCAL';
    const runLogger = new RunLogger(
        new ConsoleUiPrinter(env),
        new PinoOpsLogger(env, { runId, command: 'seed-unified-scenario', tenantId: 'tenant-evidence' }),
    );
    const context = ExecutionContextFactory.create({
        tenantId: createTenantId('tenant-evidence'),
        verbose: true,
        runId,
        logger: runLogger.ops,
        printer: runLogger.printer,
    });

    // 1. SUCCESS Run
    console.log('\n--- Running SUCCESS Case ---');
    const cmdSuccess = new SeedUnifiedCommand({
        tenant: 'tenant-evidence',
        scenario: 'baseline',
        mode: 'GENERATED',
        seed: 12345,
        days: 1,
        dryRun: true, // Don't write to DB, but write Manifest
        allowRealTenant: false
    });

    await handler.execute(cmdSuccess, context);

    // 2. BLOCKED Run (Path Traversal)
    console.log('\n--- Running BLOCKED Case ---');
    const cmdBlocked = new SeedUnifiedCommand({
        tenant: 'tenant-evidence',
        scenario: '../../../etc/passwd',
        mode: 'GENERATED',
        seed: 12345,
        days: 1,
        dryRun: true,
        allowRealTenant: false
    });

    await handler.execute(cmdBlocked, context);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
