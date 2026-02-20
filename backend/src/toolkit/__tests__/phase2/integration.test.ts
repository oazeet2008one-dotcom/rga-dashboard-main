import 'reflect-metadata';
import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { SeedUnifiedCommandHandler, SeedUnifiedCommandParams } from '../../commands/seed-unified.command';
import { ILogger, Result } from '../../core/contracts';
import { ScenarioLoader } from '../../scenarios/scenario-loader';
import { FixtureProvider } from '../../fixtures/fixture-provider';
import { ManifestBuilder } from '../../manifest';

// Mocks
const mockLogger: ILogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => mockLogger
};

const mockPrisma = {
    metric: { deleteMany: async () => ({ count: 0 }), createMany: async () => ({ count: 0 }), findFirst: async () => null },
    campaign: { deleteMany: async () => ({ count: 0 }), create: async () => ({ id: 'camp-1' }), findFirst: async () => null },
    $transaction: async (cb: any) => cb(mockPrisma),
    $queryRaw: async () => ([
        { column_name: 'is_mock_data' },
        { column_name: 'source' },
    ]),
};

const mockLoader = {
    load: async (name: string) => ({
        schemaVersion: '1.0.0',
        scenarioId: 'test-scenario',
        name: 'Test Scenario',
        trend: 'STABLE',
        days: 30
    })
} as unknown as ScenarioLoader;

const mockFixtureProvider = {
    loadFixture: async (id: string, seed: number) => ({
        schemaVersion: '1.0.0',
        scenarioId: id,
        seed,
        checksum: 'sha256:mock',
        shape: {
            totalCampaigns: 1,
            totalMetricRows: 100,
            perPlatform: { GOOGLE_ADS: { campaigns: 1, metricRows: 100 } },
        },
        samples: []
    })
} as unknown as FixtureProvider;

function deepSortKeys(input: unknown): unknown {
    if (input === null || typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.map((v) => deepSortKeys(v));
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(input as Record<string, unknown>).sort()) {
        out[key] = deepSortKeys((input as Record<string, unknown>)[key]);
    }
    return out;
}

function checksumShape(shape: unknown): string {
    const canonical = JSON.stringify(deepSortKeys(shape));
    const hash = require('crypto').createHash('sha256').update(canonical, 'utf-8').digest('hex');
    return `sha256:${hash}`;
}

const createHandler = () => new SeedUnifiedCommandHandler(
    mockLogger,
    mockPrisma as any,
    mockLoader,
    mockFixtureProvider
);

describe('SeedUnifiedCommandHandler Integration (Phase 2)', () => {
    let originalToolkitEnv: string | undefined;
    let originalDbUrl: string | undefined;

    beforeEach(() => {
        originalToolkitEnv = process.env.TOOLKIT_ENV;
        originalDbUrl = process.env.DATABASE_URL;

        // Mock safe environment for testing
        process.env.TOOLKIT_ENV = 'CI';
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    });

    afterEach(() => {
        process.env.TOOLKIT_ENV = originalToolkitEnv;
        process.env.DATABASE_URL = originalDbUrl;
    });

    test('should execute GENERATED mode (Test 21)', async () => {
        const handler = createHandler();
        const params: SeedUnifiedCommandParams = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 123,
            days: 1,
            dryRun: true
        };

        const result = await handler.runWithManifest(params);
        if (result.status !== 'SUCCESS') {
            // console.error('Integration Test Failed Result:', JSON.stringify(result, null, 2));
        }
        assert.strictEqual(result.status, 'SUCCESS');

        // Check manifest steps
        const steps = result.manifest.steps;
        assert.ok(steps.find(s => s.name === 'LOAD_SCENARIO' && s.status === 'SUCCESS'));
        assert.ok(steps.find(s => s.name === 'LOAD_FIXTURES' && s.status === 'SKIPPED'));
        assert.ok(steps.find(s => s.name === 'EXECUTE' && s.status === 'SUCCESS'));

        assert.strictEqual(result.manifest.results.writesApplied?.actualCounts?.totalRows, 0);
        assert.ok((result.manifest.results.writesPlanned?.estimatedCounts?.totalRows ?? 0) > 0);
    });

    test('should execute FIXTURE mode (Test 22)', async () => {
        const handler = createHandler();
        const params: SeedUnifiedCommandParams = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'FIXTURE',
            seed: 123,
            dryRun: true
        };

        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'SUCCESS');

        const steps = result.manifest.steps;
        // LOAD_FIXTURES should be SUCCESS
        assert.ok(steps.find(s => s.name === 'LOAD_FIXTURES' && s.status === 'SUCCESS'));

        // EXECUTE should be SUCCESS but with specific summary
        const execStep = steps.find(s => s.name === 'EXECUTE');
        assert.strictEqual(execStep?.status, 'SUCCESS');
        assert.ok(execStep?.summary.includes('Generation bypassed'));

        // Should Verify be skipped? My implementation skipped verify block logic but verify step is technically after execute?
        // Wait, 'builder.setResults' skips Verify block? 
        // My implementation returned { status: 'SUCCESS' } from executeCore.
        // runWithManifest calls executeCore.
        // It does NOT explicitly call a VERIFY step unless executeCore does.
        // executeCore logic: 
        // if mode=FIXTURE return SUCCESS early. 
        // So Verify step is NOT started.
        assert.strictEqual(steps.find(s => s.name === 'VERIFY'), undefined);
    });

    test('should execute HYBRID mode and pass if matches (Test 23)', async () => {
        // We need to mock the Engine or the Fixture to match.
        // Engine generates 10000 impressions * days * platforms.
        // Mock fixture expects "totalMetricRows: 100".
        // AdSimulatorEngine behavior is hard to mock via Handler unless we mock the engine property.
        // Handler creates `this.engine = new AdSimulatorEngine()`.
        // So we are stuck with real engine.
        // Real engine generates > 0 rows.
        // We can't easily align Mock Fixture with Real Engine in this test without dependency injection of Engine.
        // But Engine is not injected.

        // Workaround: Mock fixture to expect what the engine produces?
        // Engine production depends on many factors.
        // OR Inject a mocked Engine into the handler (using `(handler as any).engine = mockEngine`).

        const handler = createHandler();

        // Mock Engine
        const mockEngine = {
            generateDateRangeMetrics: () => [{ date: new Date(), metrics: {} }] // 1 row per call
        };
        (handler as any).engine = mockEngine;

        // Mock Fixture to expect (1 row * 1 platform * 1 day) = 1 row
        const expectedShape = {
            totalCampaigns: 1,
            totalMetricRows: 1,
            perPlatform: { GOOGLE_ADS: { campaigns: 1, metricRows: 1 } },
        };
        (mockFixtureProvider as any).loadFixture = async () => ({
            shape: expectedShape,
            checksum: checksumShape(expectedShape)
        });

        const params: SeedUnifiedCommandParams = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'HYBRID',
            seed: 123,
            days: 1,
            platforms: 'google', // 1 platform
            dryRun: true
        };

        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'SUCCESS');

        const steps = result.manifest.steps;
        assert.ok(steps.find(s => s.name === 'LOAD_FIXTURES' && s.status === 'SUCCESS'));
        assert.ok(steps.find(s => s.name === 'EXECUTE' && s.status === 'SUCCESS'));
    });

    test('should fail HYBRID mode if mismatch (Test 24)', async () => {
        const handler = createHandler();
        // Mock Engine to produce 1 row
        (handler as any).engine = {
            generateDateRangeMetrics: () => [{ date: new Date(), metrics: {} }]
        };

        // Mock Fixture to expect 999 rows
        const expectedShape = {
            totalCampaigns: 1,
            totalMetricRows: 999,
            perPlatform: { GOOGLE_ADS: { campaigns: 1, metricRows: 999 } },
        };
        (mockFixtureProvider as any).loadFixture = async () => ({
            shape: expectedShape,
            checksum: checksumShape(expectedShape)
        });

        const params: SeedUnifiedCommandParams = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'HYBRID',
            seed: 123,
            days: 1,
            platforms: 'google',
            dryRun: true
        };

        const result = await handler.runWithManifest(params);
        // Should Fail
        assert.notStrictEqual(result.status, 'SUCCESS');
        // My implementation returns { status: 'BLOCKED', exitCode: 2 } on failure.
        // Manifest wrapper might report it as FAILED or BLOCKED.
        // Let's check exitCode if available in local result (it's in pipeline result)
        // CommandPipelineResult has status.
        // assert.ok(result.status === 'BLOCKED' || result.status === 'FAILED');

        const execStep = result.manifest.steps.find(s => s.name === 'EXECUTE');
        assert.strictEqual(execStep?.status, 'FAILED');
        assert.ok(execStep?.summary.includes('generated shape does not match fixture shape'));
    });

    test('should parse line/shopee/lazada platform CSV for unified seed', async () => {
        const handler = createHandler();
        const params: SeedUnifiedCommandParams = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 123,
            days: 1,
            platforms: 'line,shopee,lazada',
            dryRun: true
        };

        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'SUCCESS');

        const execStep = result.manifest.steps.find(s => s.name === 'EXECUTE');
        assert.strictEqual(execStep?.status, 'SUCCESS');
        assert.ok(execStep?.summary.includes('LINE_ADS'));
        assert.ok(execStep?.summary.includes('SHOPEE'));
        assert.ok(execStep?.summary.includes('LAZADA'));
    });

    test('should block non-seedable platform input in unified seed CSV', async () => {
        const handler = createHandler();
        const params: SeedUnifiedCommandParams = {
            tenant: 'tenant-1',
            scenario: 'baseline',
            mode: 'GENERATED',
            seed: 123,
            days: 1,
            platforms: 'instagram',
            dryRun: true
        };

        const result = await handler.runWithManifest(params);
        assert.strictEqual(result.status, 'BLOCKED');
        assert.strictEqual(result.exitCode, 78);

        const validationStep = result.manifest.steps.find(s => s.name === 'VALIDATE_INPUT');
        assert.strictEqual(validationStep?.status, 'FAILED');
        assert.ok(validationStep?.summary.includes('non-seedable'));
        assert.ok(validationStep?.summary.includes('Allowed seedable platforms'));
    });
});
