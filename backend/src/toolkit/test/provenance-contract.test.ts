
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PROVENANCE } from '../../common/provenance.constants';

// We will recreate this object for each test to ensure clean state
let mockPrisma: any;

// Mock DashboardService dependencies manually
import { DashboardService } from '../../modules/dashboard/dashboard.service';
import { AlertService } from '../../modules/alerts/alert.service';

const createDashboardService = () => {
    return new DashboardService(mockPrisma);
};

const createAlertService = () => {
    const mockNotify = { triggerFromAlert: mock.fn() } as any;
    return new AlertService(mockPrisma, mockNotify);
}

describe('Phase 1B: Data Provenance Contract', () => {

    beforeEach(() => {
        // Reset mockPrisma with fresh mock functions
        mockPrisma = {
            metric: {
                aggregate: mock.fn(() => Promise.resolve({ _sum: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 } })),
                groupBy: mock.fn(() => Promise.resolve([])),
                createMany: mock.fn(),
                updateMany: mock.fn(),
                findFirst: mock.fn(),
            },
            campaign: {
                findMany: mock.fn(() => Promise.resolve([])),
                findFirst: mock.fn(),
                create: mock.fn(),
            },
            tenant: { findUnique: mock.fn() },
            googleAdsAccount: { count: mock.fn() },
            googleAnalyticsAccount: { count: mock.fn() },
            user: { count: mock.fn() },
            webAnalyticsDaily: { aggregate: mock.fn() },
            alertRule: { findMany: mock.fn(() => Promise.resolve([])) },
        };
    });

    describe('DashboardService (Readers)', () => {
        it('getSummary should apply REAL_DATA_FILTER by default', async () => {
            const service = createDashboardService();
            // Setup specific return if needed
            mockPrisma.metric.aggregate = mock.fn(() => Promise.resolve({ _sum: { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 } }));

            await service.getOverview({ tenantId: 't1', role: 'admin' } as any, {});

            const call = mockPrisma.metric.aggregate.mock.calls[0];
            assert.ok(call, 'metric.aggregate should be called');
            const where = call.arguments[0].where;
            assert.strictEqual(where.isMockData, false, 'Must filter isMockData: false');
        });

        it('getTopCampaigns should apply REAL_DATA_FILTER', async () => {
            const service = createDashboardService();
            mockPrisma.metric.groupBy = mock.fn(() => Promise.resolve([]));
            // campaign.findMany is already mocked in beforeEach

            await service.getTopCampaigns('t1');

            const call = mockPrisma.metric.groupBy.mock.calls[0];
            assert.ok(call, 'metric.groupBy called');
            assert.strictEqual(call.arguments[0].where.isMockData, false);
        });
    });

    describe('AlertService (Readers)', () => {
        it('checkAlerts should apply REAL_DATA_FILTER to metrics include', async () => {
            const service = createAlertService();
            // Mock alert rules
            mockPrisma.alertRule.findMany = mock.fn(() => Promise.resolve([
                { id: 'r1', name: 'Rule 1', metric: 'spend', operator: 'gt', threshold: 100, isActive: true }
            ]));

            await service.checkAlerts('t1');

            const call = mockPrisma.campaign.findMany.mock.calls[0];
            assert.ok(call, 'campaign.findMany called');
            const include = call.arguments[0].include.metrics;
            assert.strictEqual(include.where.isMockData, false, 'Must filter metrics by isMockData: false');
        });
    });
});
