import { Injectable } from '@nestjs/common';
import { CampaignStatus, AdPlatform } from '@prisma/client';
import {
    DashboardOverviewDataDto,
    PeriodEnum,
    TrendDataPointDto,
    RecentCampaignDto,
    SummaryMetricsDto,
    GrowthMetricsDto
} from '../dashboard/dto/dashboard-overview.dto';

@Injectable()
export class MockDataService {

    getMockOverview(period: PeriodEnum): DashboardOverviewDataDto {
        const days = this.getDaysFromPeriod(period);
        const summary = this.generateSummary(days);
        const growth = this.generateGrowth();
        const trends = this.generateTrends(days);
        const recentCampaigns = this.generateRecentCampaigns();

        return {
            summary,
            growth,
            trends,
            recentCampaigns
        };
    }

    getMockCampaigns() {
        return this.generateRecentCampaigns(10);
    }

    private getDaysFromPeriod(period: PeriodEnum): number {
        switch (period) {
            case PeriodEnum.SEVEN_DAYS: return 7;
            case PeriodEnum.THIRTY_DAYS: return 30;
            case PeriodEnum.THIS_MONTH: return new Date().getDate();
            case PeriodEnum.LAST_MONTH: return 30;
            default: return 7;
        }
    }

    private generateSummary(days: number): SummaryMetricsDto {
        // Base numbers for 30 days
        const baseImpressions = 500000;
        const multiplier = days / 30;

        const impressions = Math.floor(baseImpressions * multiplier * (0.8 + Math.random() * 0.4));
        const clicks = Math.floor(impressions * 0.02 * (0.8 + Math.random() * 0.4)); // 2% CTR
        const cost = clicks * 15 * (0.8 + Math.random() * 0.4); // 15 THB CPC
        const conversions = Math.floor(clicks * 0.05 * (0.8 + Math.random() * 0.4)); // 5% CVR
        const revenue = cost * 2.5 * (0.8 + Math.random() * 0.4); // 2.5 ROAS

        return {
            totalImpressions: impressions,
            totalClicks: clicks,
            totalCost: Number(cost.toFixed(2)),
            totalConversions: conversions,
            averageCtr: Number(((clicks / impressions) * 100).toFixed(2)),
            averageRoas: Number((revenue / cost).toFixed(2))
        };
    }

    private generateGrowth(): GrowthMetricsDto {
        const randomGrowth = () => Number((Math.random() * 40 - 10).toFixed(1)); // -10% to +30%
        return {
            impressionsGrowth: randomGrowth(),
            clicksGrowth: randomGrowth(),
            costGrowth: randomGrowth(),
            conversionsGrowth: randomGrowth()
        };
    }

    private generateTrends(days: number): TrendDataPointDto[] {
        const trends: TrendDataPointDto[] = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Random daily fluctuation
            const dailyFactor = 0.5 + Math.random();
            const impressions = Math.floor(20000 * dailyFactor);
            const clicks = Math.floor(impressions * 0.025);
            const cost = clicks * 12;
            const conversions = Math.floor(clicks * 0.08);

            trends.push({
                date: date.toISOString().split('T')[0],
                impressions,
                clicks,
                cost: Number(cost.toFixed(2)),
                conversions
            });
        }
        return trends;
    }

    private generateRecentCampaigns(count = 5): RecentCampaignDto[] {
        const campaigns: RecentCampaignDto[] = [
            {
                id: 'mock-cmp-1',
                name: 'Summer Sale 2026 - Phase 1',
                status: CampaignStatus.ACTIVE,
                platform: AdPlatform.FACEBOOK,
                spending: 12500,
                budgetUtilization: 85
            },
            {
                id: 'mock-cmp-2',
                name: 'Brand Awareness Q1',
                status: CampaignStatus.ACTIVE,
                platform: AdPlatform.GOOGLE_ADS,
                spending: 45000,
                budgetUtilization: 92
            },
            {
                id: 'mock-cmp-3',
                name: 'Retargeting - Cart Abandoners',
                status: CampaignStatus.PAUSED,
                platform: AdPlatform.TIKTOK,
                spending: 8200,
                budgetUtilization: 45
            },
            {
                id: 'mock-cmp-4',
                name: 'New Product Launch',
                status: CampaignStatus.ACTIVE,
                platform: AdPlatform.LINE_ADS,
                spending: 15600,
                budgetUtilization: 60
            },
            {
                id: 'mock-cmp-5',
                name: 'Competitor Conquesting',
                status: CampaignStatus.ENDED,
                platform: AdPlatform.GOOGLE_ADS,
                spending: 5400,
                budgetUtilization: 100
            }
        ];

        // Generate more if requested
        if (count > 5) {
            for (let i = 6; i <= count; i++) {
                campaigns.push({
                    id: `mock-cmp-${i}`,
                    name: `Mock Campaign #${i}`,
                    status: Math.random() > 0.3 ? CampaignStatus.ACTIVE : CampaignStatus.PAUSED,
                    platform: Math.random() > 0.5 ? AdPlatform.FACEBOOK : AdPlatform.GOOGLE_ADS,
                    spending: Math.floor(Math.random() * 10000),
                    budgetUtilization: Math.floor(Math.random() * 100)
                });
            }
        }

        return campaigns.slice(0, count);
    }
}
