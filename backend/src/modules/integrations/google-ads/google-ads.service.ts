import { Injectable, Logger } from '@nestjs/common';
import {
    MarketingPlatformAdapter,
    PlatformCredentials,
    DateRange
} from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';
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
            // TODO: Refactor in Sprint 3 - proper type mapping
            // Current implementation returns raw API data which may have different types
            return result.campaigns.map(c => ({
                ...c,
                platform: 'GOOGLE_ADS' as const,
            })) as unknown as Partial<Campaign>[];
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
            // TODO: Refactor in Sprint 3 - proper type mapping
            // Current implementation returns raw API data with ctr/cpc/cpm that aren't in DB
            return metrics as unknown as Partial<Metric>[];
        } catch (error) {
            this.logger.error(`Failed to fetch metrics: ${error.message}`);
            return [];
        }
    }
}
