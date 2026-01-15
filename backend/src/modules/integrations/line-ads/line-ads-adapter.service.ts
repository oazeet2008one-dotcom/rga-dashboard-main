import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketingPlatformAdapter, PlatformCredentials, DateRange } from '../common/marketing-platform.adapter';
import { Campaign, Metric } from '@prisma/client';
import { getMockCampaignsByPlatform } from '../../mock-data/data/mock-campaigns';
import { generateMetricsForDateRange } from '../../mock-data/generators/metrics.generator';

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

    // Feature flag - ควบคุมผ่าน environment variable
    private readonly useMockData: boolean;

    constructor(private readonly configService: ConfigService) {
        this.useMockData = this.configService.get('LINE_ADS_USE_MOCK', 'true') === 'true';
        this.logger.log(`[LINE Ads] Mock Data Mode: ${this.useMockData}`);
    }

    async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
        return !!credentials.accessToken;
    }

    async fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]> {
        if (this.useMockData) {
            // ใช้ mock data จาก centralized module
            const campaigns = getMockCampaignsByPlatform('LINE_ADS');
            this.logger.log(`[LINE Ads] Fetched ${campaigns.length} mock campaigns`);
            // TODO: Refactor in Sprint 3 - MockCampaign has budget: number, Prisma has Decimal
            return campaigns as unknown as Partial<Campaign>[];
        }
        // TODO: Implement real LINE Ads API call here
        return [];
    }

    async fetchMetrics(
        credentials: PlatformCredentials,
        campaignId: string,
        range: DateRange,
    ): Promise<Partial<Metric>[]> {
        if (this.useMockData) {
            // คำนวณจำนวนวัน
            const start = new Date(range.startDate);
            const end = new Date(range.endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            // ใช้ generator จาก centralized module
            const metrics = generateMetricsForDateRange(days, 'ads');
            this.logger.log(`[LINE Ads] Generated ${metrics.length} days of mock metrics`);
            // TODO: Refactor in Sprint 3 - generated metrics may have fields not in DB
            return metrics as unknown as Partial<Metric>[];
        }
        // TODO: Implement real LINE Ads API call here
        return [];
    }
}
