import { Injectable, Logger } from '@nestjs/common';
import {
    MarketingPlatformAdapter,
    PlatformCredentials,
    DateRange
} from '../common/marketing-platform.adapter';
import { Campaign, Metric, Prisma, AdPlatform } from '@prisma/client';
import { GoogleAdsCampaignService } from './google-ads-campaign.service';

/**
 * Google Ads Platform Adapter
 * 
 * TODO: Refactor in Sprint 3
 * - The return types from GoogleAdsCampaignService don't match Prisma Partial types exactly
 * - budget is number instead of Decimal
 * - Some calculated fields (ctr, cpc, cpm) included that aren't in DB
 * - Using type assertions as temporary fix
 */
@Injectable()
export class GoogleAdsService implements MarketingPlatformAdapter {
    private readonly logger = new Logger(GoogleAdsService.name);

    constructor(
        private readonly campaignService: GoogleAdsCampaignService,
    ) { }

    async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
        // TODO: Implement validation logic using GoogleAdsClientService or similar
        return true;
    }

    async fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]> {
        this.logger.log(`Fetching Google Ads campaigns for account ${credentials.accountId}`);
        try {
            const result = await this.campaignService.fetchCampaigns(credentials.accountId);
            return result.campaigns.map((c: any): Partial<Campaign> => ({
                externalId: String(c.externalId ?? c.id ?? ''),
                name: c.name,
                status: c.status,
                platform: AdPlatform.GOOGLE_ADS,
                budget: new Prisma.Decimal(c.budget ?? 0),
                startDate: c.startDate ?? null,
                endDate: c.endDate ?? null,
            }));
        } catch (error) {
            this.logger.error(`Failed to fetch campaigns: ${error.message}`);
            throw error;
        }
    }

    async fetchMetrics(
        credentials: PlatformCredentials,
        campaignId: string,
        range: DateRange
    ): Promise<Partial<Metric>[]> {
        this.logger.log(`Fetching metrics for campaign ${campaignId}`);
        try {
            // Note: GoogleAdsCampaignService.fetchCampaignMetrics takes Date objects
            const metrics = await this.campaignService.fetchCampaignMetrics(
                credentials.accountId,
                campaignId,
                range.startDate,
                range.endDate
            );

            return (metrics as any[]).map((m: any): Partial<Metric> => {
                const spend = m.spend ?? m.cost ?? 0;
                const revenue = m.revenue ?? m.conversionValue ?? 0;
                const spendNum = typeof spend === 'number' ? spend : Number(spend);
                const revenueNum = typeof revenue === 'number' ? revenue : Number(revenue);
                const roasNum = spendNum > 0 ? revenueNum / spendNum : 0;

                return {
                    date: m.date,
                    impressions: m.impressions ?? 0,
                    clicks: m.clicks ?? 0,
                    conversions: Math.trunc(m.conversions ?? 0),
                    spend: new Prisma.Decimal(spendNum || 0),
                    revenue: new Prisma.Decimal(revenueNum || 0),
                    roas: new Prisma.Decimal(roasNum),
                };
            });
        } catch (error) {
            this.logger.error(`Failed to fetch metrics: ${error.message}`);
            return [];
        }
    }
}
