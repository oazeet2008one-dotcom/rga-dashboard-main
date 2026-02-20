import 'reflect-metadata';
import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { AlertScenarioService } from '../../services/alert-scenario.service';

describe('AlertScenarioService (real data orchestration)', () => {
    test('loads snapshots/rules from Prisma and injects anomaly before evaluation', async () => {
        const seederService = {
            seed: async () => ({
                success: true,
                status: 'completed',
                message: 'ok',
                data: {
                    tenantId: 'tenant-1',
                    tenantName: 'tenant-1',
                    seededCount: 4,
                    campaignCount: 2,
                    dateRange: {
                        start: '2025-01-01',
                        end: '2025-01-31',
                    },
                    campaigns: [],
                },
            }),
        };

        let metricFindManyCall = 0;
        const prisma = {
            metric: {
                findFirst: async () => ({
                    id: 'm-latest',
                    spend: 100,
                    clicks: 20,
                    impressions: 1000,
                    conversions: 2,
                    revenue: 300,
                }),
                update: async () => ({ id: 'm-latest' }),
                findMany: async () => {
                    metricFindManyCall += 1;
                    // First call: latest snapshots (desc), second call: baselines (asc)
                    if (metricFindManyCall === 1) {
                        return [
                            {
                                tenantId: 'tenant-1',
                                campaignId: 'c-1',
                                date: new Date('2025-01-31'),
                                createdAt: new Date('2025-01-31T12:00:00Z'),
                                platform: 'GOOGLE_ADS',
                                impressions: 1000,
                                clicks: 100,
                                conversions: 5,
                                spend: 250,
                                revenue: 600,
                                ctr: 0.1,
                                costPerClick: 2.5,
                                conversionRate: 0.05,
                                roas: 2.4,
                            },
                            {
                                tenantId: 'tenant-1',
                                campaignId: 'c-2',
                                date: new Date('2025-01-31'),
                                createdAt: new Date('2025-01-31T12:00:00Z'),
                                platform: 'GOOGLE_ADS',
                                impressions: 800,
                                clicks: 70,
                                conversions: 3,
                                spend: 180,
                                revenue: 390,
                                ctr: 0.0875,
                                costPerClick: 2.57,
                                conversionRate: 0.0428,
                                roas: 2.16,
                            },
                        ];
                    }

                    return [
                        {
                            tenantId: 'tenant-1',
                            campaignId: 'c-1',
                            date: new Date('2025-01-01'),
                            createdAt: new Date('2025-01-01T12:00:00Z'),
                            platform: 'GOOGLE_ADS',
                            impressions: 900,
                            clicks: 80,
                            conversions: 4,
                            spend: 200,
                            revenue: 500,
                            ctr: 0.0888,
                            costPerClick: 2.5,
                            conversionRate: 0.05,
                            roas: 2.5,
                        },
                        {
                            tenantId: 'tenant-1',
                            campaignId: 'c-2',
                            date: new Date('2025-01-01'),
                            createdAt: new Date('2025-01-01T12:00:00Z'),
                            platform: 'GOOGLE_ADS',
                            impressions: 700,
                            clicks: 60,
                            conversions: 2,
                            spend: 140,
                            revenue: 260,
                            ctr: 0.0857,
                            costPerClick: 2.33,
                            conversionRate: 0.0333,
                            roas: 1.85,
                        },
                    ];
                },
            },
            alertRule: {
                findMany: async () => ([
                    {
                        id: 'rule-1',
                        name: 'Spend limit',
                        alertType: 'THRESHOLD',
                        metric: 'spend',
                        operator: '>',
                        threshold: 200,
                        severity: 'WARNING',
                        isActive: true,
                        createdAt: new Date('2025-01-01T00:00:00Z'),
                    },
                ]),
            },
        };

        const alertEngine = {
            evaluateCheck: (
                snapshots: any[],
                rules: any[],
                _context: any,
                baselines: Map<string, unknown>,
            ) => {
                assert.strictEqual(snapshots.length, 2);
                assert.strictEqual(rules.length, 1);
                assert.strictEqual(rules[0].id, 'rule-1');
                assert.strictEqual(baselines.size, 2);

                return {
                    triggeredAlerts: [],
                    evaluatedAt: new Date('2025-01-31T12:00:00Z'),
                    metadata: {
                        totalRules: 1,
                        enabledRules: 1,
                        triggeredCount: 0,
                        durationMs: 5,
                    },
                };
            },
        };

        const service = new AlertScenarioService(
            seederService as any,
            alertEngine as any,
            prisma as any,
        );

        const result = await service.execute({
            tenantId: 'tenant-1',
            days: 30,
            injectAnomaly: true,
            autoCreateCampaigns: false,
        });

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.status, 'completed');
        assert.strictEqual(result.data?.anomalyInjected, true);
        assert.strictEqual(result.data?.alertCheck.metadata.snapshotsEvaluated, 2);
        assert.strictEqual(result.data?.alertCheck.metadata.totalRulesEvaluated, 1);
    });
});

