import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';
import { Prisma } from '@prisma/client';

// ============================================================
// Helper: Safe Decimal to Number conversion
// ============================================================
function toNumber(value: Prisma.Decimal | number | null | undefined, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    return Number(value);
}

/**
 * MetricsService - Clean version following Seed Pattern
 * 
 * This service ONLY reads from database.
 * Mock data is seeded by MockDataSeederService during sync, NOT generated on-the-fly.
 */
@Injectable()
export class MetricsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get metrics trends for a specific period
     * @param tenantId - Tenant ID
     * @param period - Time period ('7d', '14d', '30d', '90d')
     * @param compareWith - Compare with previous period (optional)
     */
    async getMetricsTrends(
        tenantId: string,
        period: string,
        compareWith?: 'previous_period',
    ) {
        const days = DateRangeUtil.parsePeriodDays(period);
        const { startDate, endDate } = DateRangeUtil.getDateRange(days);

        // Current period metrics from DB
        const currentMetrics = await this.getAggregatedMetrics(
            tenantId,
            startDate,
            endDate,
        );

        // Previous period metrics (if comparison requested)
        let previousMetrics = null;
        if (compareWith === 'previous_period') {
            const { startDate: prevStartDate, endDate: prevEndDate } = DateRangeUtil.getPreviousPeriodDateRange(startDate, days);

            previousMetrics = await this.getAggregatedMetrics(
                tenantId,
                prevStartDate,
                prevEndDate,
            );
        }

        // Calculate trends
        const trends = this.calculateTrends(currentMetrics, previousMetrics);

        return {
            period,
            startDate,
            endDate,
            current: currentMetrics,
            previous: previousMetrics,
            trends,
        };
    }

    /**
     * Get aggregated metrics for a date range (reads from DB only)
     * Note: ctr, cpc are calculated fields, not stored in DB
     */
    private async getAggregatedMetrics(
        tenantId: string,
        startDate: Date,
        endDate: Date,
    ) {
        const result = await this.prisma.metric.aggregate({
            where: {
                campaign: { tenantId },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
                revenue: true,
            },
            // Note: ctr and cpc are removed from _avg since they don't exist in schema
            // They are calculated fields based on impressions/clicks/spend
            _avg: {
                roas: true,
            },
        });

        // Also aggregate Web Analytics (GA4) data for Sessions
        const webResult = await this.prisma.webAnalyticsDaily.aggregate({
            where: {
                tenantId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                sessions: true,
            },
        });

        const totalImpressions = result._sum.impressions ?? 0;
        const totalClicks = result._sum.clicks ?? 0;
        const totalSpend = toNumber(result._sum.spend);
        const totalConversions = result._sum.conversions ?? 0;
        const totalRevenue = toNumber(result._sum.revenue);
        const totalSessions = webResult._sum.sessions ?? 0;

        // Calculate derived metrics with safe math
        return {
            impressions: totalImpressions,
            clicks: totalClicks,
            spend: totalSpend,
            conversions: totalConversions,
            revenue: totalRevenue,
            sessions: totalSessions,
            // Calculated fields (Safe Math):
            ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
            cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
            roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        };
    }

    /**
     * Calculate trends (percentage change)
     */
    private calculateTrends(current: any, previous: any) {
        if (!previous) return null;

        const calculateChange = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return ((curr - prev) / prev) * 100;
        };

        return {
            impressions: calculateChange(current.impressions, previous.impressions),
            clicks: calculateChange(current.clicks, previous.clicks),
            spend: calculateChange(current.spend, previous.spend),
            conversions: calculateChange(current.conversions, previous.conversions),
            revenue: calculateChange(current.revenue, previous.revenue),
            sessions: calculateChange(current.sessions, previous.sessions),
            ctr: calculateChange(current.ctr, previous.ctr),
            cpc: calculateChange(current.cpc, previous.cpc),
            roas: calculateChange(current.roas, previous.roas),
        };
    }

    /**
     * Get daily metrics for chart data (reads from DB only)
     * @param tenantId - Tenant ID
     * @param period - Time period ('7d', '30d')
     */
    async getDailyMetrics(tenantId: string, period: string) {
        const days = DateRangeUtil.parsePeriodDays(period);
        const { startDate, endDate } = DateRangeUtil.getDateRange(days);

        const metrics = await this.prisma.metric.groupBy({
            by: ['date'],
            where: {
                campaign: { tenantId },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _sum: {
                impressions: true,
                clicks: true,
                spend: true,
                conversions: true,
                revenue: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return {
            period,
            startDate,
            endDate,
            data: metrics.map((m) => {
                const impressions = m._sum.impressions ?? 0;
                const clicks = m._sum.clicks ?? 0;
                const spend = toNumber(m._sum.spend);
                const revenue = toNumber(m._sum.revenue);

                return {
                    date: m.date,
                    impressions,
                    clicks,
                    spend,
                    conversions: m._sum.conversions ?? 0,
                    revenue,
                    // Calculated fields (Safe Math):
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    roas: spend > 0 ? revenue / spend : 0,
                };
            }),
        };
    }

    /**
     * Get campaign performance metrics
     */
    async getCampaignPerformance(
        campaignId: string,
        startDate: Date,
        endDate: Date,
    ) {
        const metrics = await this.prisma.metric.findMany({
            where: {
                campaignId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                date: 'asc',
            },
        });

        // Calculate totals with proper Decimal handling
        const totals = metrics.reduce(
            (acc, m) => ({
                impressions: acc.impressions + (m.impressions ?? 0),
                clicks: acc.clicks + (m.clicks ?? 0),
                spend: acc.spend + toNumber(m.spend),
                conversions: acc.conversions + (m.conversions ?? 0),
                revenue: acc.revenue + toNumber(m.revenue),
            }),
            {
                impressions: 0,
                clicks: 0,
                spend: 0,
                conversions: 0,
                revenue: 0,
            },
        );

        return {
            campaignId,
            startDate,
            endDate,
            totals: {
                ...totals,
                // Calculated fields (Safe Math):
                ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
                cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
                roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
            },
            daily: metrics.map((m) => {
                const impressions = m.impressions ?? 0;
                const clicks = m.clicks ?? 0;
                const spend = toNumber(m.spend);
                const revenue = toNumber(m.revenue);
                const roas = toNumber(m.roas);

                return {
                    date: m.date,
                    impressions,
                    clicks,
                    spend,
                    conversions: m.conversions ?? 0,
                    revenue,
                    // Calculated fields for daily data:
                    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                    cpc: clicks > 0 ? spend / clicks : 0,
                    roas,
                };
            }),
        };
    }
}
