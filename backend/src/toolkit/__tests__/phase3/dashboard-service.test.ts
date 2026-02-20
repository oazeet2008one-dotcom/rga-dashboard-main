import 'reflect-metadata';
import { test, describe, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { DashboardService } from '../../../modules/dashboard/dashboard.service';
import { PrismaService } from '../../../modules/prisma/prisma.service';
import { ProvenanceMode } from '../../../common/provenance.constants';
import { BadRequestException } from '@nestjs/common';

describe('DashboardService (T1: PROD Invariant)', () => {
    let dashboardService: DashboardService;
    let mockPrisma: any;

    beforeEach(() => {
        // Mock Prisma Client
        mockPrisma = {
            campaign: {
                count: async () => 0,
                findMany: async () => [],
            },
            metric: {
                aggregate: async () => ({ _sum: { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 } }),
                findFirst: async () => null,
                groupBy: async () => [],
            },
            googleAdsAccount: { count: async () => 0 },
            googleAnalyticsAccount: { count: async () => 0 },
            tenant: { findUnique: async () => null },
            user: { count: async () => 0 },
            webAnalyticsDaily: { aggregate: async () => ({ _sum: {} }) }
        };
        dashboardService = new DashboardService(mockPrisma as PrismaService);
    });

    test('getSummary should filter isMockData: false for campaign counts (Active & Total)', async () => {
        const calls: any[] = [];
        mockPrisma.campaign.count = async (args: any) => {
            calls.push(args);
            return 0;
        };

        await dashboardService.getSummary('tenant-1');

        // Should be called twice (total and active)
        assert.strictEqual(calls.length, 3, 'Should call count 3 times (total, active, previous)');

        // Check filtering
        calls.forEach((arg, index) => {
            assert.strictEqual(arg.where.isMockData, false, `Call ${index} should filter isMockData: false`);
            assert.strictEqual(arg.where.tenantId, 'tenant-1', `Call ${index} should filter by tenant`);
        });
    });

    test('getSummary should apply REAL_DATA_FILTER to metrics aggregation', async () => {
        const calls: any[] = [];
        mockPrisma.metric.aggregate = async (args: any) => {
            calls.push(args);
            return { _sum: {} };
        };

        await dashboardService.getSummary('tenant-1');

        // Should be called twice (current and previous)
        assert.strictEqual(calls.length, 2, 'Should aggregate metrics 2 times');

        calls.forEach((arg, index) => {
            // REAL_DATA_FILTER is { isMockData: false }
            assert.strictEqual(arg.where.isMockData, false, `Metric Aggregation ${index} should filter isMockData: false`);
        });
    });

    test('getSummaryByPlatform should filter mock data', async () => {
        const campaignCalls: any[] = [];
        mockPrisma.campaign.count = async (args: any) => {
            campaignCalls.push(args);
            return 0;
        };

        const metricCalls: any[] = [];
        mockPrisma.metric.aggregate = async (args: any) => {
            metricCalls.push(args);
            return { _sum: {} };
        };

        await dashboardService.getSummaryByPlatform('tenant-1', 30, 'GOOGLE_ADS');

        // Check Campaigns
        campaignCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, false, 'Campaign count should filter mock data');
        });

        // Check Metrics
        metricCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, false, 'Metric aggregate should filter mock data');
        });
    });

    test('getSummaryByPlatform should reject unsupported platform filters', async () => {
        await assert.rejects(
            () => dashboardService.getSummaryByPlatform('tenant-1', 30, 'UNKNOWN_PLATFORM'),
            (error: unknown) => error instanceof BadRequestException,
        );
    });

    test('getTopCampaigns should filter mock data when fetching details', async () => {
        // MockgroupBy returns list of campaignIds
        mockPrisma.metric.groupBy = async () => [
            { campaignId: 'c1', _sum: { spend: 100 } }
        ];

        let findArgs: any = null;
        mockPrisma.campaign.findMany = async (args: any) => {
            findArgs = args;
            return [{ id: 'c1', name: 'Test', isMockData: false }];
        };

        await dashboardService.getTopCampaigns('tenant-1');

        assert.ok(findArgs, 'Should call findMany campaigns');
        assert.strictEqual(findArgs.where.isMockData, false, 'Should filter campaigns by isMockData: false');
    });

    test('getSummary should support explicit MOCK provenance mode', async () => {
        const campaignCalls: any[] = [];
        mockPrisma.campaign.count = async (args: any) => {
            campaignCalls.push(args);
            return 0;
        };

        const metricCalls: any[] = [];
        mockPrisma.metric.aggregate = async (args: any) => {
            metricCalls.push(args);
            return { _sum: {} };
        };

        await dashboardService.getSummary('tenant-1', 30, ProvenanceMode.MOCK);

        campaignCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, true, 'MOCK mode must query isMockData=true campaigns');
        });

        metricCalls.forEach(arg => {
            assert.strictEqual(arg.where.isMockData, true, 'MOCK mode must query isMockData=true metrics');
        });
    });

    test('getSummary should support explicit ALL provenance mode', async () => {
        const campaignCalls: any[] = [];
        mockPrisma.campaign.count = async (args: any) => {
            campaignCalls.push(args);
            return 0;
        };

        const metricCalls: any[] = [];
        mockPrisma.metric.aggregate = async (args: any) => {
            metricCalls.push(args);
            return { _sum: {} };
        };

        await dashboardService.getSummary('tenant-1', 30, ProvenanceMode.ALL);

        campaignCalls.forEach(arg => {
            assert.strictEqual(Object.prototype.hasOwnProperty.call(arg.where, 'isMockData'), false, 'ALL mode must not enforce campaign provenance filter');
        });

        metricCalls.forEach(arg => {
            assert.strictEqual(Object.prototype.hasOwnProperty.call(arg.where, 'isMockData'), false, 'ALL mode must not enforce metric provenance filter');
        });
    });

    test('getPerformanceByPlatform should include extended ad platforms and GA row', async () => {
        mockPrisma.metric.groupBy = async () => [];
        mockPrisma.campaign.findMany = async () => [];
        mockPrisma.webAnalyticsDaily.aggregate = async () => ({ _sum: {} });

        const rows = await dashboardService.getPerformanceByPlatform('tenant-1', 30, ProvenanceMode.REAL);
        const platforms = rows.map((row: any) => row.platform);

        assert.ok(platforms.includes('GOOGLE_ADS'));
        assert.ok(platforms.includes('FACEBOOK'));
        assert.ok(platforms.includes('TIKTOK'));
        assert.ok(platforms.includes('LINE_ADS'));
        assert.ok(platforms.includes('SHOPEE'));
        assert.ok(platforms.includes('LAZADA'));
        assert.ok(platforms.includes('INSTAGRAM'));
        assert.ok(platforms.includes('GOOGLE_ANALYTICS'));
    });

    test('getOverview should expose platformPerformance for full-platform breakdown widgets', async () => {
        mockPrisma.metric.groupBy = async () => [];
        mockPrisma.campaign.findMany = async () => [];
        mockPrisma.webAnalyticsDaily.aggregate = async () => ({ _sum: {} });

        const response = await dashboardService.getOverview(
            { tenantId: 'tenant-1', role: 'MANAGER' as any },
            { period: '7d' as any, provenance: ProvenanceMode.REAL } as any,
        );

        assert.ok(Array.isArray(response.data.platformPerformance));
        assert.ok(response.data.platformPerformance.length >= 1);
    });
});
