
// @ts-nocheck — node:test Mock types are not compatible with Prisma overrides; tests pass at runtime.
import 'reflect-metadata';
import { describe, it, mock, beforeEach, before } from 'node:test';
import assert from 'node:assert';
import { SeedUnifiedCommandHandler, SeedUnifiedCommand } from '../commands/seed-unified.command';
import { ToolkitPlatform } from '../domain/platform.types';

// =============================================================================
// Environment Setup — manifest safety gates require these
// =============================================================================
process.env.TOOLKIT_ENV = 'CI';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test_db';

// =============================================================================
// Mock Dependencies
// =============================================================================

const mockLogger = {
    info: mock.fn(),
    warn: mock.fn(),
    error: mock.fn(),
    success: mock.fn(),
    debug: mock.fn(),
    child: mock.fn(() => mockLogger),
};

// Transaction mock (inner tx)
const mockPrismaTx = {
    campaign: { create: mock.fn(() => Promise.resolve({ id: 'cmd-1' })) },
    metric: { createMany: mock.fn(() => Promise.resolve({ count: 10 })) }
};

const mockPrisma = {
    metric: {
        findFirst: mock.fn(),
        deleteMany: mock.fn(),
        createMany: mock.fn()
    },
    campaign: {
        findFirst: mock.fn(),
        deleteMany: mock.fn(),
        createMany: mock.fn(),
        create: mock.fn()
    },
    $transaction: mock.fn((cb) => cb(mockPrismaTx)),
    $queryRaw: mock.fn(() => Promise.resolve([
        { column_name: 'is_mock_data' },
        { column_name: 'source' },
    ])),
};

// =============================================================================
// Test Suite — 8 contract tests
// =============================================================================

describe('Phase 1C: Unified Seeding Contract', () => {
    let handler;

    beforeEach(() => {
        // Reset logger mocks
        mockLogger.info = mock.fn();
        mockLogger.warn = mock.fn();

        // Default Clean Tenant State
        mockPrisma.metric.findFirst = mock.fn(() => Promise.resolve(null));
        mockPrisma.metric.deleteMany = mock.fn(() => Promise.resolve({ count: 0 }));

        mockPrisma.campaign.findFirst = mock.fn(() => Promise.resolve(null));
        mockPrisma.campaign.deleteMany = mock.fn(() => Promise.resolve({ count: 0 }));

        // Transaction Mocks
        mockPrismaTx.metric.createMany = mock.fn(() => Promise.resolve({ count: 10 }));
        mockPrismaTx.campaign.create = mock.fn(() => Promise.resolve({ id: 'cmd-1' }));

        // Reset Transaction Wrapper
        mockPrisma.$transaction = mock.fn((cb) => cb(mockPrismaTx));
        mockPrisma.$queryRaw = mock.fn(() => Promise.resolve([
            { column_name: 'is_mock_data' },
            { column_name: 'source' },
        ]));

        // Scenario Loader Mock
        const mockScenarioLoader = {
            load: mock.fn(() => Promise.resolve({
                schemaVersion: '1.0.0',
                scenarioId: 'baseline',
                name: 'Baseline',
                trend: 'STABLE',
                baseImpressions: 10000,
                days: 30
            }))
        };

        // Fixture Provider Mock
        const mockFixtureProvider = {
            loadFixture: mock.fn(() => Promise.resolve(null)),
            validateChecksum: mock.fn(() => true)
        };

        handler = new SeedUnifiedCommandHandler(mockLogger, mockPrisma, mockScenarioLoader, mockFixtureProvider);
    });

    // =========================================================================
    // TEST 1: Hygiene Gate (Exit 78 via manifest)
    // =========================================================================
    it('Hygiene: Should return BLOCKED (Exit 78) if Real data exists and no override', async () => {
        mockPrisma.metric.findFirst = mock.fn(() => Promise.resolve({ id: 'real-1', isMockData: false }));

        const result = await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 123, days: 1, dryRun: false, allowRealTenant: false,
        });

        assert.strictEqual(result.status, 'BLOCKED', 'Status must be BLOCKED');
        assert.strictEqual(result.exitCode, 78, 'Exit code must be 78');

        // Manifest should have VALIDATE_INPUT step with FAILED status
        const hygieneStep = result.manifest.steps.find((s) => s.name === 'VALIDATE_INPUT');
        assert.ok(hygieneStep, 'Must have VALIDATE_INPUT step');
        assert.strictEqual(hygieneStep.status, 'FAILED', 'VALIDATE_INPUT must be FAILED');
    });

    // =========================================================================
    // TEST 2: Determinism — same seed → same output
    // =========================================================================
    it('Determinism: Same seed should produce identical outputs', async () => {
        // Run 1
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 999, days: 1, dryRun: false, platforms: 'google'
        });

        assert.ok(mockPrismaTx.metric.createMany.mock.calls.length > 0, 'Should call createMany');
        const firstCallArgs = mockPrismaTx.metric.createMany.mock.calls[0].arguments[0];

        // Reset mocks for run 2
        mockPrismaTx.metric.createMany = mock.fn(() => Promise.resolve({ count: 10 }));
        mockPrismaTx.campaign.create = mock.fn(() => Promise.resolve({ id: 'cmd-1' }));
        mockPrisma.metric.deleteMany = mock.fn(() => Promise.resolve({ count: 0 }));
        mockPrisma.campaign.deleteMany = mock.fn(() => Promise.resolve({ count: 0 }));

        // Run 2 — same params
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 999, days: 1, dryRun: false, platforms: 'google'
        });

        const secondCallArgs = mockPrismaTx.metric.createMany.mock.calls[0].arguments[0];

        assert.deepStrictEqual(firstCallArgs, secondCallArgs, 'Outputs must match exactly for same seed');
    });

    // =========================================================================
    // TEST 3: Subset Stability
    // =========================================================================
    it('Subset Stability: Platform output should be independent of peers', async () => {
        // Run Google Alone
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 555, days: 1, dryRun: false, platforms: 'google'
        });
        const googleOnlyOutput = mockPrismaTx.metric.createMany.mock.calls[0].arguments[0].data;

        // Reset mocks
        mockPrismaTx.metric.createMany = mock.fn(() => Promise.resolve({ count: 10 }));
        mockPrismaTx.campaign.create = mock.fn(() => Promise.resolve({ id: 'cmd-1' }));
        mockPrisma.metric.deleteMany = mock.fn(() => Promise.resolve({ count: 0 }));
        mockPrisma.campaign.deleteMany = mock.fn(() => Promise.resolve({ count: 0 }));

        // Run Google + Facebook
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 555, days: 1, dryRun: false, platforms: 'google,facebook'
        });

        // Find Google output in multi-calls
        const calls = mockPrismaTx.metric.createMany.mock.calls;
        const googleCall = calls.find((c) => c.arguments[0].data[0].platform === 'GOOGLE_ADS');

        assert.ok(googleCall, 'Google Ads data should be generated in multi-run');
        const googleMultiOutput = googleCall.arguments[0].data;

        assert.deepStrictEqual(googleOnlyOutput, googleMultiOutput, 'Google output must be identical regardless of Facebook presence');
    });

    // =========================================================================
    // TEST 4: Idempotency (Delete Before Write)
    // =========================================================================
    it('Idempotency: Should delete before writing', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 111, days: 1, dryRun: false, platforms: 'google'
        });

        const deleteCalls = mockPrisma.metric.deleteMany.mock.calls;
        assert.strictEqual(deleteCalls.length, 1, 'Should call deleteMany once');
        const deleteArgs = deleteCalls[0].arguments[0];

        assert.strictEqual(deleteArgs.where.tenantId, 't1');
        assert.strictEqual(deleteArgs.where.isMockData, true);
        assert.ok(deleteArgs.where.source.startsWith('toolkit:unified:baseline:111'), 'Should target specific source tag');
    });

    it('Idempotency: Campaign cleanup must be scoped per platform in multi-platform run', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 222, days: 1, dryRun: false, platforms: 'google,facebook'
        });

        const campaignDeleteCalls = mockPrisma.campaign.deleteMany.mock.calls;
        assert.strictEqual(campaignDeleteCalls.length, 2, 'Should clean campaigns once per selected platform');

        const deletedPlatforms = campaignDeleteCalls
            .map((call) => call.arguments[0]?.where?.platform)
            .filter(Boolean)
            .sort();

        assert.deepStrictEqual(
            deletedPlatforms,
            ['FACEBOOK', 'GOOGLE_ADS'],
            'Campaign delete scope must be platform-specific to avoid cross-platform cascade deletes',
        );
    });

    it('Date window: days=1 should generate exactly one daily metric row per platform', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 333, days: 1, dryRun: false, platforms: 'google'
        });

        const metricCalls = mockPrismaTx.metric.createMany.mock.calls;
        assert.ok(metricCalls.length > 0, 'Should write metric rows');

        const firstBatch = metricCalls[0].arguments[0].data;
        assert.strictEqual(firstBatch.length, 1, 'days=1 must produce exactly one row');
    });

    // =========================================================================
    // TEST 5: Provenance Guarantee
    // =========================================================================
    it('Provenance: All writes must have isMockData=true and source=toolkit:unified:*', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'growth', seed: 777, days: 1, dryRun: false, platforms: 'google'
        });

        // Check Campaign create call
        const campaignCalls = mockPrismaTx.campaign.create.mock.calls;
        assert.ok(campaignCalls.length > 0, 'Should create at least one campaign');
        const campaignData = campaignCalls[0].arguments[0].data;
        assert.strictEqual(campaignData.isMockData, true, 'Campaign must have isMockData=true');
        assert.ok(campaignData.source.startsWith('toolkit:unified:growth:777'), 'Campaign source must be toolkit:unified:*');

        // Check Metrics createMany call
        const metricCalls = mockPrismaTx.metric.createMany.mock.calls;
        assert.ok(metricCalls.length > 0, 'Should create metrics');
        const metricRows = metricCalls[0].arguments[0].data;
        for (const row of metricRows) {
            assert.strictEqual(row.isMockData, true, `Metric row must have isMockData=true`);
            assert.ok(row.source.startsWith('toolkit:unified:growth:777'), `Metric source must be toolkit:unified:*, got: ${row.source}`);
        }
    });

    // =========================================================================
    // TEST 6: Deterministic External IDs (no Date.now)
    // =========================================================================
    it('Determinism: externalId must NOT contain Date.now()', async () => {
        await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 42, days: 1, dryRun: false, platforms: 'google'
        });

        const campaignCalls = mockPrismaTx.campaign.create.mock.calls;
        assert.ok(campaignCalls.length > 0, 'Should create a campaign');
        const externalId = campaignCalls[0].arguments[0].data.externalId;

        // externalId should be deterministic: unified-<scenario>-<seed>-<platform>-<index>
        assert.ok(externalId.startsWith('unified-baseline-42-'), `externalId must be deterministic, got: ${externalId}`);
        // Ensure no 13-digit timestamp pattern (Date.now())
        assert.ok(!/\d{13}/.test(externalId), `externalId must NOT contain Date.now() timestamp, got: ${externalId}`);
    });

    // =========================================================================
    // TEST 7: Manifest Pipeline — expected structure
    // =========================================================================
    it('Manifest: runWithManifest should produce manifest with expected structure', async () => {
        const result = await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 321, days: 1, dryRun: false, platforms: 'google'
        });

        // Should have a manifest document
        assert.ok(result.manifest, 'Must produce a manifest');
        assert.strictEqual(result.manifest.invocation.commandName, 'seed-unified-scenario');
        assert.strictEqual(result.manifest.invocation.commandClassification, 'WRITE');

        // Should have steps
        const stepNames = result.manifest.steps.map((s) => s.name);
        assert.ok(stepNames.includes('SAFETY_CHECK'), 'Manifest must include SAFETY_CHECK step');
        assert.ok(stepNames.includes('LOAD_SCENARIO'), 'Manifest must include LOAD_SCENARIO step');
        assert.ok(stepNames.includes('VALIDATE_SCENARIO'), 'Manifest must include VALIDATE_SCENARIO step');
        assert.ok(stepNames.includes('VALIDATE_INPUT'), 'Manifest must include VALIDATE_INPUT step');
        assert.ok(stepNames.includes('EXECUTE'), 'Manifest must include EXECUTE step');
        assert.ok(stepNames.includes('VERIFY'), 'Manifest must include VERIFY step');

        // Status should be SUCCESS for clean tenant
        assert.strictEqual(result.status, 'SUCCESS');
        assert.strictEqual(result.exitCode, 0);
    });

    // =========================================================================
    // TEST 8: Manifest BLOCKED on hygiene failure
    // =========================================================================
    it('Manifest: Should produce BLOCKED manifest when hygiene fails', async () => {
        mockPrisma.metric.findFirst = mock.fn(() => Promise.resolve({ id: 'real-1', isMockData: false }));

        const result = await handler.runWithManifest({
            tenant: 't1', scenario: 'baseline', seed: 999, days: 1, dryRun: false, platforms: 'google',
            allowRealTenant: false,
        });

        assert.ok(result.manifest, 'Must produce a manifest even when blocked');
        assert.strictEqual(result.status, 'BLOCKED');
        assert.strictEqual(result.exitCode, 78);

        // Should have VALIDATE_INPUT step with FAILED status
        const hygieneStep = result.manifest.steps.find((s) => s.name === 'VALIDATE_INPUT');
        assert.ok(hygieneStep, 'Must have VALIDATE_INPUT step');
        assert.strictEqual(hygieneStep.status, 'FAILED');
    });
});
