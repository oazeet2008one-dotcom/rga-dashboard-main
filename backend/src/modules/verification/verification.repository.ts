import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PROVENANCE } from '../../common/provenance.constants';

@Injectable()
export class VerificationRepository {
    constructor(private readonly prisma: PrismaClient) { }

    /**
     * Count metrics strictly matching filtering criteria.
     * Enforces PROVENANCE check (MOCK ONLY).
     */
    async countMetrics(tenantId: string, windowStart: Date, windowEnd: Date): Promise<number> {
        return this.prisma.metric.count({
            where: {
                tenantId,
                isMockData: true, // STRICT MOCK ONLY
                source: { startsWith: 'toolkit:' }, // STRICT TOOLKIT SOURCE
                date: {
                    gte: windowStart,
                    lte: windowEnd,
                },
            },
        });
    }

    /**
     * Check for any metrics OUTSIDE the valid window.
     * Useful for INT-003 Drift Check.
     */
    async countDriftMetrics(tenantId: string, windowStart: Date, windowEnd: Date): Promise<number> {
        return this.prisma.metric.count({
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: 'toolkit:' },
                NOT: {
                    date: {
                        gte: windowStart,
                        lte: windowEnd,
                    },
                },
            },
        });
    }

    /**
     * Check for any metrics with isMockData=false in the target set.
     * This should return 0 if isolation is working, but verification needs to detect leaks (if run without filter).
     * But VerificationService imposes the filter. 
     * To verify INT-004 "All seeded records have isMockData: true", we need to search by seed ID?
     * If we search by TENANT, we expect EVERYTHING to be mock if it's a mock tenant.
     * But here checks specific run.
     * We will check if there are records with 'toolkit:' source but isMockData=false.
     */
    async checkMockFlagConsistency(tenantId: string): Promise<number> {
        return this.prisma.metric.count({
            where: {
                tenantId,
                source: { startsWith: 'toolkit:' },
                isMockData: false, // VIOLATION
            },
        });
    }

    /**
     * Get aggregates for Anomaly and Business Rules.
     * Groups by Campaign to allow campaign-level rules (Budget, ROAS).
     */
    async getAggregates(tenantId: string, windowStart: Date, windowEnd: Date) {
        // 1. Get Metrics Aggregated by Campaign
        // platform, campaignId
        const metrics = await this.prisma.metric.groupBy({
            by: ['campaignId', 'platform'],
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: 'toolkit:' },
                date: {
                    gte: windowStart,
                    lte: windowEnd,
                },
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
                revenue: true,
            },
        });

        if (metrics.length === 0) return [];

        // 2. Fetch Campaign Info (Budget)
        const campaignIds = metrics.map(m => m.campaignId);
        const campaigns = await this.prisma.campaign.findMany({
            where: { id: { in: campaignIds }, tenantId },
            select: { id: true, name: true, budget: true, budgetType: true },
        });
        const campaignMap = new Map(campaigns.map(c => [c.id, c]));

        // 3. Merge
        return metrics.map(m => {
            const c = campaignMap.get(m.campaignId);
            const totals = m._sum;
            return {
                campaignId: m.campaignId,
                campaignName: c?.name || 'Unknown',
                platform: m.platform,
                budget: c?.budget ? Number(c.budget) : 0,
                budgetType: c?.budgetType || 'DAILY',
                impressions: totals.impressions || 0,
                clicks: totals.clicks || 0,
                spend: totals.spend ? Number(totals.spend) : 0,
                conversions: totals.conversions || 0,
                revenue: totals.revenue ? Number(totals.revenue) : 0,
            };
        });
    }
}
