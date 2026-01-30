import { Injectable, Logger } from '@nestjs/common';
import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';

/**
 * LINE Ads Platform Adapter
 * 
 * TODO: Refactor in Sprint 3
 * - MockCampaign has budget: number, but Prisma Campaign has budget: Decimal
 * - ctr/cpc/cpm are NOT in DB schema (calculated fields)
 * - Using type assertions as temporary fix
 */
@Injectable()
export class LineAdsAdapterService implements MarketingPlatformAdapter {
    private readonly logger = new Logger(LineAdsAdapterService.name);

    constructor() { }

    async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
        return !!credentials.accessToken;
    }

    async fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]> {
        // TODO: Implement real LINE Ads API call here
        return [];
    }

    async fetchMetrics(
        credentials: PlatformCredentials,
        campaignId: string,
        range: DateRange,
    ): Promise<Partial<Metric>[]> {
        // TODO: Implement real LINE Ads API call here
        return [];
    }
}
