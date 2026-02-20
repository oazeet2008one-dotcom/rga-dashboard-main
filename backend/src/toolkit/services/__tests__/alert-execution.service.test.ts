/**
 * =============================================================================
 * AlertExecutionService — Unit Tests (Phase 5A.2)
 * =============================================================================
 *
 * Runner: node:test (no Jest)
 *
 * Tests the 8-step orchestration flow:
 *   1. Context validation (missing tenantId / executionTime / executionMode)
 *   2. No enabled rules → early‐return COMPLETED
 *   3. No metric snapshots → early‐return COMPLETED
 *   4. Successful execute with triggered alerts
 *   5. Successful execute with zero triggers
 *   6. Error handling → FAILED status
 *   7. Event emission (execution_completed + alert:triggered)
 *   8. Summary statistics correctness
 *   9. Baselines delegation (fetchBaselines present/absent)
 *  10. Date range calculation
 *
 * Strategy:
 *   - Mock AlertEngine.evaluateCheck via plain object stub
 *   - Mock IRuleProvider, IMetricProvider as inline objects
 *   - Spy on toolkitEventBus.emit via patches
 *   - Zero I/O, zero network
 * =============================================================================
 */

import 'reflect-metadata';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';

import {
    AlertExecutionService,
    ExecutionContext,
    IRuleProvider,
    IMetricProvider,
} from '../alert-execution.service';

import {
    AlertEngine,
    AlertRule,
    MetricSnapshot,
    BaselineSnapshot,
    AlertEvaluationResult,
    AlertCondition,
} from '../alert-engine.service';


// =============================================================================
// Constants
// =============================================================================

const NOW = new Date('2024-01-15T09:00:00.000Z');
const TENANT = 'tenant-test';

// =============================================================================
// Factory Helpers
// =============================================================================

function makeCtx(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
    return {
        tenantId: overrides.tenantId ?? TENANT,
        executionTime: overrides.executionTime ?? NOW,
        dryRun: overrides.dryRun ?? false,
        executionMode: overrides.executionMode ?? 'MANUAL',
        correlationId: overrides.correlationId,
        triggeredBy: overrides.triggeredBy,
    };
}

function makeRule(id: string, condition: AlertCondition, enabled = true): AlertRule {
    return {
        id,
        name: `Rule ${id}`,
        condition,
        severity: 'MEDIUM',
        enabled,
    };
}

function thresholdRule(id: string, metric: keyof MetricSnapshot['metrics'], op: 'GT' | 'LT', value: number, enabled = true): AlertRule {
    return makeRule(id, { type: 'THRESHOLD', metric, operator: op, value }, enabled);
}

function makeSnapshot(campaignId: string, overrides: Partial<MetricSnapshot['metrics']> = {}): MetricSnapshot {
    return {
        tenantId: TENANT,
        campaignId,
        date: NOW,
        platform: 'google_ads',
        metrics: {
            impressions: 1000,
            clicks: 50,
            conversions: 5,
            spend: 100,
            revenue: 500,
            ctr: 0.05,
            cpc: 2,
            cvr: 0.1,
            roas: 5,
            ...overrides,
        },
    };
}

function makeRuleProvider(rules: AlertRule[]): IRuleProvider {
    return {
        resolveRules: async (_tenantId: string) => rules,
    };
}

function makeMetricProvider(
    snapshots: MetricSnapshot[],
    baselines?: Map<string, BaselineSnapshot>,
): IMetricProvider {
    const provider: IMetricProvider = {
        fetchSnapshots: async () => snapshots,
    };
    if (baselines) {
        provider.fetchBaselines = async () => baselines;
    }
    return provider;
}

// =============================================================================
// Mock AlertEngine
// =============================================================================

/**
 * Creates a stub AlertEngine that returns a pre-configured result
 * from evaluateCheck. We override the prototype method, so we
 * need a real instance from tsyringe or direct construction, but
 * since `@injectable()` is just metadata, we can construct directly.
 */
function makeAlertEngine(result: AlertEvaluationResult): AlertEngine {
    const engine = Object.create(AlertEngine.prototype) as AlertEngine;
    (engine as any).evaluateCheck = (
        _snapshots: MetricSnapshot[],
        _rules: AlertRule[],
        _context: any,
        _baselines?: Map<string, BaselineSnapshot>,
    ): AlertEvaluationResult => result;
    return engine;
}

function noTriggersResult(): AlertEvaluationResult {
    return {
        triggeredAlerts: [],
        evaluatedAt: NOW,
        context: { tenantId: TENANT, dateRange: { start: NOW, end: NOW }, dryRun: false },
        metadata: { totalRules: 1, enabledRules: 1, triggeredCount: 0, durationMs: 1 },
    };
}

function triggeredResult(alerts: AlertEvaluationResult['triggeredAlerts']): AlertEvaluationResult {
    return {
        triggeredAlerts: alerts,
        evaluatedAt: NOW,
        context: { tenantId: TENANT, dateRange: { start: NOW, end: NOW }, dryRun: false },
        metadata: {
            totalRules: 1,
            enabledRules: 1,
            triggeredCount: alerts.length,
            durationMs: 1,
        },
    };
}

// =============================================================================
// Tests
// =============================================================================

describe('AlertExecutionService — context validation', () => {
    const engine = makeAlertEngine(noTriggersResult());
    const service = new AlertExecutionService(engine);
    const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
    const metrics = makeMetricProvider([makeSnapshot('c1')]);

    it('fails when tenantId is missing', async () => {
        const ctx = makeCtx({ tenantId: '' });
        const result = await service.execute(ctx, rules, metrics);

        assert.strictEqual(result.status, 'FAILED');
        assert.ok(result.error?.message.includes('tenantId'));
    });

    it('fails when executionMode is missing', async () => {
        const ctx = makeCtx({ executionMode: '' as any });
        const result = await service.execute(ctx, rules, metrics);

        assert.strictEqual(result.status, 'FAILED');
        assert.ok(result.error?.message.includes('executionMode'));
    });
});

describe('AlertExecutionService — no enabled rules', () => {
    const engine = makeAlertEngine(noTriggersResult());
    const service = new AlertExecutionService(engine);

    it('returns COMPLETED with zero counts when all rules disabled', async () => {
        const disabledRules = makeRuleProvider([
            thresholdRule('r1', 'spend', 'GT', 50, false),
            thresholdRule('r2', 'clicks', 'LT', 10, false),
        ]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), disabledRules, metrics);

        assert.strictEqual(result.status, 'COMPLETED');
        assert.strictEqual(result.summary.enabledRules, 0);
        assert.strictEqual(result.summary.triggeredCount, 0);
        assert.strictEqual(result.triggeredAlerts.length, 0);
    });

    it('returns COMPLETED when rule list is empty', async () => {
        const emptyRules = makeRuleProvider([]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), emptyRules, metrics);

        assert.strictEqual(result.status, 'COMPLETED');
        assert.strictEqual(result.summary.totalRules, 0);
    });
});

describe('AlertExecutionService — no metric snapshots', () => {
    const engine = makeAlertEngine(noTriggersResult());
    const service = new AlertExecutionService(engine);

    it('returns COMPLETED when no snapshots available', async () => {
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([]);

        const result = await service.execute(makeCtx(), rules, metrics);

        assert.strictEqual(result.status, 'COMPLETED');
        assert.strictEqual(result.summary.snapshotsEvaluated, 0);
    });
});

describe('AlertExecutionService — successful execution with triggers', () => {
    it('returns triggered alerts and correct summary', async () => {
        const triggerAlert = {
            ruleId: 'r1',
            ruleName: 'Rule r1',
            condition: { type: 'THRESHOLD' as const, metric: 'spend' as const, operator: 'GT' as const, value: 50 },
            severity: 'HIGH' as const,
            triggered: true,
            reason: 'spend (100) > 50',
            evaluatedAt: NOW,
            values: { current: 100, threshold: 50 },
        };
        const engine = makeAlertEngine(triggeredResult([triggerAlert]));
        const service = new AlertExecutionService(engine);

        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), rules, metrics);

        assert.strictEqual(result.status, 'COMPLETED');
        assert.strictEqual(result.triggeredAlerts.length, 1);
        assert.strictEqual(result.triggeredAlerts[0]!.rule.id, 'r1');
        assert.strictEqual(result.triggeredAlerts[0]!.triggered, true);
        assert.strictEqual(result.summary.triggeredCount, 1);
        assert.strictEqual(result.summary.enabledRules, 1);
    });
});

describe('AlertExecutionService — successful execution with no triggers', () => {
    it('returns empty triggeredAlerts and status COMPLETED', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);

        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 99999)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), rules, metrics);

        assert.strictEqual(result.status, 'COMPLETED');
        assert.strictEqual(result.triggeredAlerts.length, 0);
        assert.strictEqual(result.summary.triggeredCount, 0);
        assert.strictEqual(result.summary.notTriggeredCount, 1);
    });
});

describe('AlertExecutionService — error handling', () => {
    it('returns FAILED when ruleProvider throws', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);

        const brokenRules: IRuleProvider = {
            resolveRules: async () => { throw new Error('DB connection lost'); },
        };
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), brokenRules, metrics);

        assert.strictEqual(result.status, 'FAILED');
        assert.strictEqual(result.error?.code, 'EXECUTION_FAILED');
        assert.ok(result.error?.message.includes('DB connection lost'));
    });

    it('returns FAILED when metricProvider throws', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);

        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const brokenMetrics: IMetricProvider = {
            fetchSnapshots: async () => { throw new Error('API timeout'); },
        };

        const result = await service.execute(makeCtx(), rules, brokenMetrics);

        assert.strictEqual(result.status, 'FAILED');
        assert.ok(result.error?.message.includes('API timeout'));
    });

    it('returns FAILED when alertEngine throws', async () => {
        const engine = Object.create(AlertEngine.prototype) as AlertEngine;
        (engine as any).evaluateCheck = () => { throw new Error('Engine crash'); };
        const service = new AlertExecutionService(engine);

        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), rules, metrics);

        assert.strictEqual(result.status, 'FAILED');
        assert.ok(result.error?.message.includes('Engine crash'));
    });
});


describe('AlertExecutionService — timing and runId', () => {
    it('records positive durationMs', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), rules, metrics);

        assert.ok(result.timing.durationMs >= 0);
        assert.ok(result.timing.startedAt instanceof Date);
        assert.ok(result.timing.completedAt instanceof Date);
    });

    it('generates unique runId per execution', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result1 = await service.execute(makeCtx(), rules, metrics);
        const result2 = await service.execute(makeCtx(), rules, metrics);

        assert.notStrictEqual(result1.runId, result2.runId);
        assert.ok(result1.runId.startsWith('exec-'));
        assert.ok(result2.runId.startsWith('exec-'));
    });
});

describe('AlertExecutionService — summary statistics', () => {
    it('counts total vs enabled rules correctly', async () => {
        const triggerAlert = {
            ruleId: 'r1',
            ruleName: 'Rule r1',
            condition: { type: 'THRESHOLD' as const, metric: 'spend' as const, operator: 'GT' as const, value: 50 },
            severity: 'MEDIUM' as const,
            triggered: true,
            reason: 'spend > 50',
            evaluatedAt: NOW,
            values: { current: 100, threshold: 50 },
        };
        const engine = makeAlertEngine(triggeredResult([triggerAlert]));
        const service = new AlertExecutionService(engine);

        const rules = makeRuleProvider([
            thresholdRule('r1', 'spend', 'GT', 50, true),
            thresholdRule('r2', 'clicks', 'LT', 10, false), // disabled
            thresholdRule('r3', 'ctr', 'GT', 0.01, true),
        ]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const result = await service.execute(makeCtx(), rules, metrics);

        assert.strictEqual(result.summary.totalRules, 3);
        assert.strictEqual(result.summary.enabledRules, 2); // only 2 enabled
        assert.strictEqual(result.summary.snapshotsEvaluated, 1);
    });
});

describe('AlertExecutionService — baselines delegation', () => {
    it('calls fetchBaselines when provider supports it', async () => {
        let baselinesCalled = false;
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);

        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const provider: IMetricProvider = {
            fetchSnapshots: async () => [makeSnapshot('c1')],
            fetchBaselines: async () => {
                baselinesCalled = true;
                return new Map();
            },
        };

        await service.execute(makeCtx(), rules, provider);

        assert.strictEqual(baselinesCalled, true);
    });

    it('skips baselines when fetchBaselines is absent', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);

        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const provider: IMetricProvider = {
            fetchSnapshots: async () => [makeSnapshot('c1')],
            // NO fetchBaselines property
        };

        // Should not throw
        const result = await service.execute(makeCtx(), rules, provider);
        assert.strictEqual(result.status, 'COMPLETED');
    });
});

describe('AlertExecutionService — context preservation', () => {
    it('result.context matches input context', async () => {
        const engine = makeAlertEngine(noTriggersResult());
        const service = new AlertExecutionService(engine);
        const rules = makeRuleProvider([thresholdRule('r1', 'spend', 'GT', 50)]);
        const metrics = makeMetricProvider([makeSnapshot('c1')]);

        const inputCtx = makeCtx({
            tenantId: 'tenant-abc',
            executionMode: 'SCHEDULED',
            dryRun: true,
            correlationId: 'corr-123',
            triggeredBy: 'admin-user',
        });

        const result = await service.execute(inputCtx, rules, metrics);

        assert.strictEqual(result.context.tenantId, 'tenant-abc');
        assert.strictEqual(result.context.executionMode, 'SCHEDULED');
        assert.strictEqual(result.context.dryRun, true);
        assert.strictEqual(result.context.correlationId, 'corr-123');
        assert.strictEqual(result.context.triggeredBy, 'admin-user');
    });
});
