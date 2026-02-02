import { Injectable, Logger } from '@nestjs/common';
import {
    MarketingPlatformAdapter,
    PlatformCredentials,
    DateRange
} from '../common/marketing-platform.adapter';
import { Campaign, Metric, Prisma } from '@prisma/client';
import { GoogleAnalyticsApiService } from './google-analytics-api.service';

/**
 * Google Analytics Platform Adapter
 * 
 * TODO: Refactor in Sprint 3
 * - spend is Decimal in DB, number here
 * - ctr/cpc/cpm are NOT in DB schema (calculated fields)
 * - Using type assertions as temporary fix
 */
@Injectable()
export class GoogleAnalyticsAdapterService implements MarketingPlatformAdapter {
    private readonly logger = new Logger(GoogleAnalyticsAdapterService.name);

    constructor(
        private readonly apiService: GoogleAnalyticsApiService,
    ) { }

    async validateCredentials(credentials: PlatformCredentials): Promise<boolean> {
        try {
            return !!credentials.accessToken;
        } catch (error) {
            this.logger.error(`Credential validation failed: ${error.message}`);
            return false;
        }
    }

    async fetchCampaigns(credentials: PlatformCredentials): Promise<Partial<Campaign>[]> {
        // GA4 is not campaign-centric in the same way as Ad platforms.
        return [];
    }

    async fetchMetrics(
        credentials: PlatformCredentials,
        campaignId: string,
        range: DateRange
    ): Promise<Partial<Metric>[]> {
        this.logger.log(`Fetching GA4 metrics for property ${credentials.accountId}`);
        try {
            const response = await this.apiService.runReport({
                propertyId: credentials.accountId,
                accessToken: credentials.accessToken,
                refreshToken: credentials.refreshToken,
            }, {
                dateRanges: [{
                    startDate: range.startDate.toISOString().split('T')[0],
                    endDate: range.endDate.toISOString().split('T')[0]
                }],
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'sessions' },
                    { name: 'conversions' },
                    { name: 'totalRevenue' },
                ],
            });

            if (!response || !response.rows) {
                return [];
            }

            const metrics: Partial<Metric>[] = response.rows.map((row: any) => {
                const revenue = Number(row.metricValues[3].value);

                return {
                    date: this.parseDate(row.dimensionValues[0].value),
                    impressions: Number(row.metricValues[0].value), // Mapping Active Users -> Impressions (approx)
                    clicks: Number(row.metricValues[1].value),      // Mapping Sessions -> Clicks (approx)
                    conversions: Math.trunc(Number(row.metricValues[2].value)),
                    revenue: new Prisma.Decimal(revenue),
                    spend: new Prisma.Decimal(0), // GA4 doesn't track ad spend directly unless linked
                    roas: new Prisma.Decimal(0),
                };
            });

            return metrics;

        } catch (error) {
            this.logger.error(`Failed to fetch metrics: ${error.message}`);
            return [];
        }
    }

    private parseDate(dateStr: string): Date {
        // GA4 returns YYYYMMDD
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
    }
}
