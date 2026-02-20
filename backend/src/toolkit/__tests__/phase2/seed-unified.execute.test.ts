import 'reflect-metadata';
import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { SeedUnifiedCommand, SeedUnifiedCommandHandler } from '../../commands/seed-unified.command';
import { ILogger, IExecutionContext, IUiPrinter, createTenantId } from '../../core/contracts';

const mockLogger: ILogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => mockLogger,
};

const mockPrinter: IUiPrinter = {
    log: () => { },
    warn: () => { },
    error: () => { },
    header: () => { },
    spinner: () => ({ start: () => { }, succeed: () => { }, fail: () => { }, stop: () => { } }),
};

const context: IExecutionContext = {
    tenantId: createTenantId('11111111-1111-1111-1111-111111111111'),
    correlationId: 'corr-test',
    startedAt: new Date(),
    dryRun: false,
    verbose: true,
    runId: 'run-test',
    logger: mockLogger,
    printer: mockPrinter,
    with(props) {
        return { ...this, ...props } as IExecutionContext;
    },
    elapsedMs() {
        return 0;
    },
};

const mockPrisma = {
    metric: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findFirst: async () => null },
    campaign: { deleteMany: async () => ({ count: 0 }), create: async () => ({ id: 'camp-1' }), findFirst: async () => null },
    $transaction: async (cb: any) => cb(mockPrisma),
};

const mockLoader = {
    load: async () => ({
        schemaVersion: '1.0.0',
        scenarioId: 'baseline',
        name: 'Baseline',
        trend: 'STABLE',
        days: 30,
    }),
};

const mockFixtureProvider = {
    loadFixture: async () => ({
        shape: { totalMetricRows: 1 },
        checksum: 'sha256:mock',
    }),
};

describe('SeedUnifiedCommand.execute status propagation', () => {
    test('returns failure when pipeline is BLOCKED', async () => {
        const handler = new SeedUnifiedCommandHandler(
            mockLogger,
            mockPrisma as any,
            mockLoader as any,
            mockFixtureProvider as any,
        );

        (handler as any).runWithManifest = async () => ({
            status: 'BLOCKED',
            exitCode: 78,
            manifestPath: null,
            manifest: {},
        });

        const command = new SeedUnifiedCommand({
            tenant: '11111111-1111-1111-1111-111111111111',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 12345,
            days: 1,
            dryRun: false,
        });

        const result = await handler.execute(command, context);
        assert.strictEqual(result.kind, 'failure');
    });

    test('returns success when pipeline is SUCCESS', async () => {
        const handler = new SeedUnifiedCommandHandler(
            mockLogger,
            mockPrisma as any,
            mockLoader as any,
            mockFixtureProvider as any,
        );

        (handler as any).runWithManifest = async () => ({
            status: 'SUCCESS',
            exitCode: 0,
            manifestPath: 'toolkit-manifests/test.manifest.json',
            manifest: {
                results: {
                    writesApplied: {
                        actualCounts: { totalRows: 42 },
                    },
                },
            },
        });

        const command = new SeedUnifiedCommand({
            tenant: '11111111-1111-1111-1111-111111111111',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 12345,
            days: 1,
            dryRun: false,
        });

        const result = await handler.execute(command, context);
        assert.strictEqual(result.kind, 'success');
        if (result.kind === 'success') {
            assert.strictEqual(result.value.rowsCreated, 42);
        }
    });
});
