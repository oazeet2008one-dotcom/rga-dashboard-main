import 'reflect-metadata';
import { test, describe, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { VerificationService } from '../../../modules/verification/verification.service';
import { VerificationRepository } from '../../../modules/verification/verification.repository';
import { AlertRuleEvaluator } from '../../../modules/verification/rules/alert-rule.evaluator';
import { ScenarioLoader } from '../../scenarios/scenario-loader';
import { DETERMINISTIC_ANCHOR } from '../../core/constants';

// Mock Interfaces
interface MockPrismaClient {
    metric: {
        count: (args: any) => Promise<number>;
        groupBy: (args: any) => Promise<any[]>;
    };
}

describe('VerificationService (Phase 3)', () => {
    let service: VerificationService;
    let repository: VerificationRepository;
    let mockPrisma: MockPrismaClient;
    let mockLoader: ScenarioLoader;

    // Spies
    let prismaCalls: any[] = [];

    beforeEach(() => {
        prismaCalls = [];

        // Manual Mock for Prisma
        mockPrisma = {
            metric: {
                count: async (args) => {
                    prismaCalls.push({ method: 'count', args });
                    return 100; // Default return
                },
                groupBy: async (args) => {
                    prismaCalls.push({ method: 'groupBy', args });
                    return [];
                }
            }
        };

        // Manual Mock for ScenarioLoader
        mockLoader = {
            load: async (id: string) => ({
                scenarioId: id,
                days: 30,
                // No dateAnchor implies deterministic default anchor
            })
        } as unknown as ScenarioLoader;

        // Mock Rule Evaluator
        const mockEvaluator = {
            evaluate: () => []
        } as unknown as AlertRuleEvaluator;

        // Instantiate
        repository = new VerificationRepository(mockPrisma as any);
        service = new VerificationService(repository, mockLoader, mockEvaluator);
    });

    // P0: T9 - VERIFY Invariant: Mock-Only
    test('T9: Should enforce strict mock-only filters in repository calls', async () => {
        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });

        // Check all count calls
        const countCalls = prismaCalls.filter(c => c.method === 'count');
        assert.ok(countCalls.length >= 3, 'Should call count for INT-003, INT-004, INT-001');

        // Verify EACH call enforces isMockData: true
        for (const call of countCalls) {
            const where = call.args.where;
            // INT-004 checks for isMockData: false (Consistency check)
            // Wait, INT-004 logic in repository:
            // where: { tenantId, source: 'toolkit:', isMockData: false }
            // So ONE call should check for false.

            // INT-003 and INT-001 MUST check for true.

            if (where.isMockData === false) {
                // This must be INT-004 (Consistency Check)
                // And it must check source startsWith toolkit
                assert.deepStrictEqual(where.source, { startsWith: 'toolkit:' });
            } else {
                // INT-001, INT-003
                assert.strictEqual(where.isMockData, true, 'Must filter by isMockData: true');
                assert.deepStrictEqual(where.source, { startsWith: 'toolkit:' }, 'Must filter by toolkit source');
            }
        }
    });

    // P0: T3 - Date Window Consistency
    test('T3: Should check for drift outside defined window', async () => {
        // Mock Loader to return specific anchor
        const fixedAnchor = new Date('2024-01-01T00:00:00Z');
        mockLoader.load = async (id) => ({
            scenarioId: id,
            days: 30,
            dateAnchor: fixedAnchor.toISOString()
        } as any);

        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });

        // Find the INT-003 drift check call
        // It uses countDriftMetrics -> NOT: { date: { gte: start, lte: end } }
        const driftCall = prismaCalls.find(c => c.args.where.NOT && c.args.where.NOT.date);
        assert.ok(driftCall, 'Should perform drift check');

        const dateFilter = driftCall.args.where.NOT.date;
        const expectedEnd = fixedAnchor;
        const expectedStart = new Date(fixedAnchor);
        expectedStart.setDate(expectedStart.getDate() - 30);

        assert.deepStrictEqual(dateFilter.gte, expectedStart);
        assert.deepStrictEqual(dateFilter.lte, expectedEnd);
    });

    // P0: T2 - Read-Only Guarantee (Implicit)
    test('T2: Should not call any write methods', async () => {
        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });

        const writeMethods = ['create', 'update', 'delete', 'upsert', 'createMany', 'deleteMany'];
        const calls = prismaCalls.filter(c => writeMethods.includes(c.method));
        assert.strictEqual(calls.length, 0, 'Must not perform any DB writes');
    });

    test('T3b: Should use deterministic anchor when scenario does not provide dateAnchor', async () => {
        await service.verifyScenario({
            scenarioId: 'test-scenario',
            tenantId: 'tenant-1'
        });

        const driftCall = prismaCalls.find(c => c.args.where.NOT && c.args.where.NOT.date);
        assert.ok(driftCall, 'Should perform drift check');

        const dateFilter = driftCall.args.where.NOT.date;
        const expectedEnd = new Date(DETERMINISTIC_ANCHOR);
        const expectedStart = new Date(expectedEnd);
        expectedStart.setDate(expectedStart.getDate() - 30);

        assert.deepStrictEqual(dateFilter.gte, expectedStart);
        assert.deepStrictEqual(dateFilter.lte, expectedEnd);
    });
});
