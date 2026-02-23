import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationFactory } from '../integrations/common/integration.factory';
import { AdPlatform, Prisma } from '@prisma/client';
import { MarketingPlatformAdapter } from '../integrations/common/marketing-platform.adapter';

function toNumber(value: any, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return Number.isFinite(value) ? value : defaultValue;
    if (typeof value === 'string') {
        const n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
    }
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}

function toUTCDateOnly(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class UnifiedSyncService {
    private readonly logger = new Logger(UnifiedSyncService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly integrationFactory: IntegrationFactory,
    ) { }

    private async resolveIntegrationId(
        platform: AdPlatform,
        tenantId: string,
        account: any,
    ): Promise<string | null> {
        if (account?.integrationId && typeof account.integrationId === 'string') {
            return account.integrationId;
        }

        const integration = await this.prisma.integration.findFirst({
            where: {
                tenantId,
                type: platform,
                isActive: true,
                status: 'CONNECTED',
            },
            select: { id: true },
            orderBy: { updatedAt: 'desc' },
        });

        return integration?.id ?? null;
    }

    /**
     * Sync all connected accounts across all platforms
     */
    async syncAll() {
        this.logger.log('Starting unified sync for all platforms...');

        const results = {
            [AdPlatform.GOOGLE_ADS]: await this.syncPlatform(AdPlatform.GOOGLE_ADS),
            [AdPlatform.FACEBOOK]: await this.syncPlatform(AdPlatform.FACEBOOK),
            [AdPlatform.GOOGLE_ANALYTICS]: await this.syncPlatform(AdPlatform.GOOGLE_ANALYTICS),
            [AdPlatform.TIKTOK]: await this.syncPlatform(AdPlatform.TIKTOK),
            [AdPlatform.LINE_ADS]: await this.syncPlatform(AdPlatform.LINE_ADS),
        };

        this.logger.log('Unified sync completed', results);
        return results;
    }

    async syncAllForTenant(tenantId: string) {
        this.logger.log(`Starting unified sync for tenant ${tenantId}...`);

        const results = {
            [AdPlatform.GOOGLE_ADS]: await this.syncPlatformForTenant(AdPlatform.GOOGLE_ADS, tenantId),
            [AdPlatform.FACEBOOK]: await this.syncPlatformForTenant(AdPlatform.FACEBOOK, tenantId),
            [AdPlatform.GOOGLE_ANALYTICS]: await this.syncPlatformForTenant(AdPlatform.GOOGLE_ANALYTICS, tenantId),
            [AdPlatform.TIKTOK]: await this.syncPlatformForTenant(AdPlatform.TIKTOK, tenantId),
            [AdPlatform.LINE_ADS]: await this.syncPlatformForTenant(AdPlatform.LINE_ADS, tenantId),
        };

        return results;
    }

    /**
     * Sync all accounts for a specific platform
     */
    async syncPlatform(platform: AdPlatform) {
        this.logger.log(`Syncing all accounts for platform: ${platform}`);
        let accounts: any[] = [];

        // Fetch accounts based on platform
        // TODO: In the future, we should have a unified Account table or a polymorphic relation
        switch (platform) {
            case AdPlatform.GOOGLE_ADS:
                accounts = await this.prisma.googleAdsAccount.findMany({ where: { status: 'ENABLED' } });
                break;
            case AdPlatform.FACEBOOK:
            case 'INSTAGRAM' as any:
                accounts = await this.prisma.facebookAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case AdPlatform.GOOGLE_ANALYTICS:
                accounts = await this.prisma.googleAnalyticsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case AdPlatform.TIKTOK:
                accounts = await this.prisma.tikTokAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            case AdPlatform.LINE_ADS:
                accounts = await this.prisma.lineAdsAccount.findMany({ where: { status: 'ACTIVE' } });
                break;
            default:
                this.logger.warn(`Platform ${platform} not supported for batch sync`);
                return { success: 0, failed: 0 };
        }

        let success = 0;
        let failed = 0;

        for (const account of accounts) {
            try {
                await this.syncAccount(platform, account.id, account.tenantId, account);
                success++;
            } catch (error) {
                this.logger.error(`Failed to sync account ${account.id} (${platform}): ${error.message}`);
                failed++;
            }
        }

        return { success, failed };
    }

    async syncPlatformForTenant(platform: AdPlatform, tenantId: string) {
        this.logger.log(`Syncing accounts for platform ${platform} (tenant ${tenantId})`);
        let accounts: any[] = [];

        switch (platform) {
            case AdPlatform.GOOGLE_ADS:
                accounts = await this.prisma.googleAdsAccount.findMany({ where: { tenantId, status: 'ENABLED' } });
                break;
            case AdPlatform.FACEBOOK:
                accounts = await this.prisma.facebookAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case AdPlatform.GOOGLE_ANALYTICS:
                accounts = await this.prisma.googleAnalyticsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case AdPlatform.TIKTOK:
                accounts = await this.prisma.tikTokAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            case AdPlatform.LINE_ADS:
                accounts = await this.prisma.lineAdsAccount.findMany({ where: { tenantId, status: 'ACTIVE' } });
                break;
            default:
                this.logger.warn(`Platform ${platform} not supported for tenant sync`);
                return { success: 0, failed: 0 };
        }

        let success = 0;
        let failed = 0;

        for (const account of accounts) {
            try {
                await this.syncAccount(platform, account.id, tenantId, account);
                success++;
            } catch (error) {
                this.logger.error(`Failed to sync account ${account.id} (${platform}, tenant ${tenantId}): ${error.message}`);
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * Sync a specific account using the Adapter Pattern
     */
    async syncAccount(platform: AdPlatform, accountId: string, tenantId: string, account?: any) {
        this.logger.log(`Syncing ${platform} account: ${accountId} (tenant ${tenantId})`);

        // 1. Prepare Credentials
        // Fetch account record to get credentials
        const accountData = account ?? (await this.fetchAccountData(platform, accountId));

        if (!accountData) {
            throw new Error(`Account not found: ${platform} ${accountId}`);
        }

        const integrationId = await this.resolveIntegrationId(platform, tenantId, accountData);

        const adapter = this.integrationFactory.getAdapter(platform);

        const credentials = {
            accessToken: accountData.accessToken,
            refreshToken: accountData.refreshToken,
            accountId: (() => {
                switch (platform) {
                    case AdPlatform.GOOGLE_ANALYTICS:
                        return accountData.propertyId;
                    case AdPlatform.GOOGLE_ADS:
                        return accountData.customerId;
                    case AdPlatform.FACEBOOK:
                        return accountData.accountId;
                    case AdPlatform.TIKTOK:
                        return accountData.advertiserId;
                    case AdPlatform.LINE_ADS:
                        return accountData.channelId;
                    default:
                        return accountData.accountId;
                }
            })(),
        };

        // 2. Fetch Campaigns
        const campaigns = await adapter.fetchCampaigns(credentials);

        for (const c of campaigns) {
            const campaign = await this.saveCampaign(tenantId, platform, accountId, c, integrationId);
        }

        // 4. Fetch & Save Metrics
        if (platform === AdPlatform.GOOGLE_ANALYTICS) {
            // GA4 Logic: Fetch Account Level Metrics
            const dateRange = {
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                endDate: new Date(),
            };

            const metrics = await adapter.fetchMetrics(credentials, credentials.accountId, dateRange);
            await this.saveWebAnalytics(tenantId, credentials.accountId, metrics);

        } else {
            // Ads Logic: Fetch Campaign Level Metrics
            const campaignPlatforms = platform === ('INSTAGRAM' as any as AdPlatform) ? [AdPlatform.FACEBOOK] : [platform];
            const dbCampaigns = await this.prisma.campaign.findMany({
                where: {
                    tenantId,
                    platform: { in: campaignPlatforms },
                    OR: [
                        { googleAdsAccountId: accountId },
                        { facebookAdsAccountId: accountId }
                    ]
                }
            });

            for (const campaign of dbCampaigns) {
                if (!campaign.externalId) continue;

                const dateRange = {
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    endDate: new Date(),
                };

                const metrics = await adapter.fetchMetrics(credentials, campaign.externalId, dateRange);
                await this.saveCampaignMetrics(tenantId, platform, campaign.id, metrics);
            }
        }

        // Update Last Sync Time
        await this.updateLastSync(platform, accountId);
    }

    private async fetchAccountData(platform: AdPlatform, accountId: string) {
        switch (platform) {
            case AdPlatform.GOOGLE_ADS:
                return this.prisma.googleAdsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.FACEBOOK:
            case 'INSTAGRAM' as any:
                return this.prisma.facebookAdsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.GOOGLE_ANALYTICS:
                return this.prisma.googleAnalyticsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.TIKTOK:
                return this.prisma.tikTokAdsAccount.findUnique({ where: { id: accountId } });
            case AdPlatform.LINE_ADS:
                return this.prisma.lineAdsAccount.findUnique({ where: { id: accountId } });
            default:
                throw new Error(`Unknown platform ${platform}`);
        }
    }

    private async saveCampaign(
        tenantId: string,
        platform: AdPlatform,
        accountId: string,
        data: any,
        integrationId: string | null,
    ) {
        // Common logic to upsert campaign
        const fkField =
            platform === AdPlatform.GOOGLE_ADS
                ? 'googleAdsAccountId'
                : platform === AdPlatform.FACEBOOK
                    ? 'facebookAdsAccountId'
                    : platform === AdPlatform.TIKTOK
                        ? 'tiktokAdsAccountId'
                        : 'lineAdsAccountId';

        // Check existence
        const existing = await this.prisma.campaign.findFirst({
            where: {
                tenantId,
                externalId: data.externalId,
                platform,
            }
        });

        const campaignData = {
            name: data.name,
            status: data.status,
            budget: data.budget,
            startDate: data.startDate,
            endDate: data.endDate,
            [fkField]: accountId,
            ...(integrationId ? { integrationId } : {}),
        };

        if (existing) {
            return this.prisma.campaign.update({
                where: { id: existing.id },
                data: campaignData
            });
        } else {
            return this.prisma.campaign.create({
                data: {
                    ...campaignData,
                    tenantId,
                    externalId: data.externalId,
                    platform,
                }
            });
        }
    }

    /**
     * Save campaign metrics to DB
     * Note: Schema V2 does not have cpc, ctr, cpm columns in Metric model
     * These are calculated fields in the service layer
     */
    private async saveCampaignMetrics(tenantId: string, platform: AdPlatform, campaignId: string, metrics: any[]) {
        for (const m of metrics) {
            const date = toUTCDateOnly(new Date(m.date));

            const hour = 0;
            const source = 'sync';

            const spendNum = toNumber(m.spend);
            const revenueNum = toNumber(m.revenue);
            const roasNum = spendNum > 0 ? revenueNum / spendNum : 0;

            const impressions = m.impressions ?? 0;
            const clicks = m.clicks ?? 0;
            const conversions = m.conversions ?? 0;

            await this.prisma.metric.upsert({
                where: {
                    metrics_unique_key: {
                        tenantId,
                        campaignId,
                        date,
                        hour,
                        platform,
                        source,
                    },
                },
                create: {
                    tenantId,
                    campaignId,
                    platform,
                    date,
                    hour,
                    source,
                    impressions,
                    clicks,
                    spend: spendNum,
                    conversions,
                    revenue: revenueNum,
                    roas: roasNum,
                },
                update: {
                    impressions,
                    clicks,
                    spend: spendNum,
                    conversions,
                    revenue: revenueNum,
                    roas: roasNum,
                },
            });
        }
    }

    /**
     * Save web analytics data to DB
     */
    private async saveWebAnalytics(tenantId: string, propertyId: string, metrics: any[]) {
        for (const m of metrics) {
            const date = toUTCDateOnly(new Date(m.date));

            await this.prisma.webAnalyticsDaily.upsert({
                where: {
                    web_analytics_daily_unique: {
                        tenantId,
                        propertyId,
                        date,
                    },
                },
                create: {
                    tenantId,
                    propertyId,
                    date,
                    activeUsers: m.impressions ?? 0,
                    sessions: m.clicks ?? 0,
                    newUsers: 0,
                    screenPageViews: 0,
                    engagementRate: 0,
                    bounceRate: 0,
                    avgSessionDuration: 0,
                },
                update: {
                    activeUsers: m.impressions ?? 0,
                    sessions: m.clicks ?? 0,
                },
            });
        }
    }

    private async updateLastSync(platform: AdPlatform, accountId: string) {
        const now = new Date();
        switch (platform) {
            case AdPlatform.GOOGLE_ADS:
                await this.prisma.googleAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case AdPlatform.FACEBOOK:
            case 'INSTAGRAM' as any:
                await this.prisma.facebookAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case AdPlatform.GOOGLE_ANALYTICS:
                await this.prisma.googleAnalyticsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case AdPlatform.TIKTOK:
                await this.prisma.tikTokAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
            case AdPlatform.LINE_ADS:
                await this.prisma.lineAdsAccount.update({ where: { id: accountId }, data: { lastSyncAt: now } });
                break;
        }
    }
}
