import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { facebookService } from './facebook.service';
import { googleAdsService } from './googleads.service';
import { lineService } from './line.service';
import { tiktokService } from './tiktok.service';
import { shopeeService } from './shopee.service';

// FLOW START: Integration Service (EN)
// จุดเริ่มต้น: Service กลางสำหรับ Integration (TH)

export interface PlatformConfig {
  facebook?: {
    accessToken: string;
    accountId: string;
    appId: string;
    appSecret: string;
  };
  googleads?: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    developerToken: string;
    customerId: string;
  };
  line?: {
    channelId: string;
    channelSecret: string;
    accessToken: string;
    webhookUrl?: string;
  };
  tiktok?: {
    appId: string;
    appSecret: string;
    accessToken: string;
    advertiserId?: string;
    refreshToken?: string;
  };
  shopee?: {
    partnerId: number;
    partnerKey: string;
    shopId: number;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface SyncResult {
  platform: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface WebhookEvent {
  platform: string;
  type: string;
  data: any;
  signature?: string;
  timestamp: Date;
}

class IntegrationService {
  private platforms = {
    facebook: facebookService,
    googleads: googleAdsService,
    line: lineService,
    tiktok: tiktokService,
    shopee: shopeeService,
  };

  async getActiveIntegrations(tenantId: string): Promise<string[]> {
    const integrations = await prisma.integration.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      select: { provider: true },
    });

    return integrations.map((integration) => integration.provider);
  }

  private getPlatformDisplayName(platform: string): string {
    const map: Record<string, string> = {
      facebook: 'Facebook',
      googleads: 'Google Ads',
      line: 'LINE OA',
      tiktok: 'TikTok',
      shopee: 'Shopee',
    };
    return map[platform] || platform;
  }

  private getPlatformActionUrl(platform: string): string {
    return `/integrations?provider=${platform}`;
  }

  private async createIntegrationNotification(params: {
    tenantId: string;
    integrationId?: string;
    platform: string;
    title: string;
    reason?: string;
    actionUrl?: string;
    severity?: 'info' | 'warning' | 'critical';
    metadata?: Record<string, any>;
  }): Promise<void> {
    const {
      tenantId,
      integrationId,
      platform,
      title,
      reason,
      actionUrl,
      severity = 'warning',
      metadata,
    } = params;

    try {
      const existing = await prisma.integrationNotification.findFirst({
        where: {
          tenantId,
          platform,
          status: 'open',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existing) {
        await prisma.integrationNotification.update({
          where: { id: existing.id },
          data: {
            title,
            reason,
            actionUrl,
            severity,
            metadata,
            updatedAt: new Date(),
          },
        });
        return;
      }

      await prisma.integrationNotification.create({
        data: {
          tenantId,
          integrationId,
          platform,
          title,
          reason,
          actionUrl,
          severity,
          metadata,
          status: 'open',
        },
      });
    } catch (error) {
      console.error('Failed to create integration notification:', error);
    }
  }

  private async resolveIntegrationNotifications(
    tenantId: string,
    integrationId: string,
    platform: string,
  ): Promise<void> {
    try {
      await prisma.integrationNotification.updateMany({
        where: {
          tenantId,
          platform,
          integrationId,
          status: 'open',
        },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to resolve integration notifications:', error);
    }
  }

  async validatePlatformCredentials(platform: string, credentials: any): Promise<boolean> {
    try {
      const service = this.platforms[platform as keyof typeof this.platforms];
      if (!service) {
        throw new Error(`Platform ${platform} not supported`);
      }

      return await service.validateCredentials(credentials);
    } catch (error) {
      console.error(`Validation failed for ${platform}:`, error);
      return false;
    }
  }

  async syncAllPlatforms(
    tenantId: string,
    dateRange?: { start: string; end: string },
  ): Promise<SyncResult[]> {
    const activePlatforms = await this.getActiveIntegrations(tenantId);
    const results: SyncResult[] = [];

    for (const platform of activePlatforms) {
      try {
        const result = await this.syncPlatform(tenantId, platform, dateRange);
        results.push(result);
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  async syncPlatform(
    tenantId: string,
    platform: string,
    dateRange?: { start: string; end: string },
  ): Promise<SyncResult> {
    const integration = await prisma.integration.findFirst({
      where: { tenantId, provider: platform },
    });

    if (!integration) {
      return {
        platform,
        success: false,
        error: `Integration for platform ${platform} is not configured`,
        timestamp: new Date(),
      };
    }

    try {
      const service = this.platforms[platform as keyof typeof this.platforms];
      if (!service) {
        throw new Error(`Platform ${platform} not supported`);
      }

      let data: any = {};

      switch (platform) {
        case 'facebook':
          data = {
            campaigns: await (service as any).getCampaigns(tenantId, dateRange),
            insights: await (service as any).getInsights(tenantId, undefined, dateRange),
          };
          break;

        case 'googleads':
          data = {
            campaigns: await (service as any).getCampaigns(tenantId, dateRange),
            insights: await (service as any).getInsights(tenantId, dateRange),
          };
          break;

        case 'line':
          data = {
            userStats: await (service as any).getUserStats(tenantId),
            messageStats: dateRange
              ? await (service as any).getMessageStats(tenantId, dateRange.start, dateRange.end)
              : [],
          };
          break;

        case 'tiktok':
          data = {
            campaigns: await (service as any).getCampaigns(tenantId, dateRange),
            insights: await (service as any).getInsights(tenantId, dateRange),
          };
          break;

        case 'shopee':
          data = {
            orders: await (service as any).getOrders(tenantId, dateRange),
            products: await (service as any).getProducts(tenantId),
            shopMetrics: await (service as any).getShopMetrics(tenantId),
          };
          break;

        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      await this.persistPlatformData(tenantId, integration.id, platform, data);

      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastSyncAt: new Date(),
          status: 'active',
        },
      });

      await this.storeSyncHistory(tenantId, platform, data, 'success', undefined, integration.id);
      await this.resolveIntegrationNotifications(tenantId, integration.id, platform);

      return {
        platform,
        success: true,
        data,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error(`Sync failed for ${platform}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'error' },
      });

      await this.storeSyncHistory(tenantId, platform, null, 'error', errorMessage, integration.id);
      await this.createIntegrationNotification({
        tenantId,
        integrationId: integration.id,
        platform,
        title: `${this.getPlatformDisplayName(platform)} sync failed`,
        reason: errorMessage,
        actionUrl: this.getPlatformActionUrl(platform),
        metadata: {
          dateRange,
        },
      });

      return {
        platform,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  async refreshToken(platform: string, tenantId: string): Promise<string> {
    try {
      const service = this.platforms[platform as keyof typeof this.platforms];
      if (!service) {
        throw new Error(`Platform ${platform} not supported`);
      }

      return await service.refreshToken(tenantId);
    } catch (error) {
      console.error(`Token refresh failed for ${platform}:`, error);
      throw error;
    }
  }

  async getOAuthUrl(
    platform: string,
    config: any,
    redirectUri: string,
    state: string,
  ): Promise<string> {
    try {
      const service = this.platforms[platform as keyof typeof this.platforms];
      if (!service) {
        throw new Error(`Platform ${platform} not supported`);
      }

      switch (platform) {
        case 'facebook':
          return (service as any).getAuthUrl(config.appId, redirectUri, state);

        case 'googleads':
          return (service as any).getAuthUrl(config.clientId, redirectUri, state);

        case 'line':
          return (service as any).getAuthUrl(config.channelId, redirectUri, state);

        case 'tiktok':
          return (service as any).getAuthUrl(config.appId, redirectUri, state);

        case 'shopee':
          return (service as any).getAuthUrl(config.partnerId, redirectUri, state);

        default:
          throw new Error(`OAuth not implemented for platform: ${platform}`);
      }
    } catch (error) {
      console.error(`OAuth URL generation failed for ${platform}:`, error);
      throw error;
    }
  }

  async exchangeCodeForToken(
    platform: string,
    code: string,
    config: any,
    redirectUri?: string,
  ): Promise<any> {
    try {
      const service = this.platforms[platform as keyof typeof this.platforms];
      if (!service) {
        throw new Error(`Platform ${platform} not supported`);
      }

      switch (platform) {
        case 'facebook':
          return (service as any).exchangeCodeForToken(
            code,
            config.appId,
            config.appSecret,
            redirectUri!,
          );

        case 'googleads':
          return (service as any).exchangeCodeForToken(
            code,
            config.clientId,
            config.clientSecret,
            redirectUri!,
          );

        case 'line':
          return (service as any).exchangeCodeForToken(
            code,
            config.channelId,
            config.channelSecret,
            redirectUri!,
          );

        case 'tiktok':
          return (service as any).exchangeCodeForToken(code, config.appId, config.appSecret);

        case 'shopee':
          return (service as any).exchangeCodeForToken(
            code,
            config.shopId,
            config.partnerId,
            config.partnerKey,
          );

        default:
          throw new Error(`Token exchange not implemented for platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Token exchange failed for ${platform}:`, error);
      throw error;
    }
  }

  async processWebhook(platform: string, event: WebhookEvent): Promise<void> {
    try {
      // Validate webhook signature if provided
      if (event.signature) {
        const isValid = await this.validateWebhookSignature(platform, event);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Store webhook event
      await this.storeWebhookEvent(platform, event);

      // Process platform-specific webhook logic
      switch (platform) {
        case 'facebook':
          await this.processFacebookWebhook(event);
          break;

        case 'line':
          await this.processLINEWebhook(event);
          break;

        case 'tiktok':
          await this.processTikTokWebhook(event);
          break;

        case 'shopee':
          await this.processShopeeWebhook(event);
          break;

        default:
          console.log(`Webhook processing not implemented for platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Webhook processing failed for ${platform}:`, error);
      throw error;
    }
  }

  private async validateWebhookSignature(platform: string, event: WebhookEvent): Promise<boolean> {
    try {
      switch (platform) {
        case 'line': {
          const integration = await prisma.integration.findFirst({
            where: { provider: 'line', isActive: true },
          });
          if (integration) {
            const credentials = integration.config as any;
            return lineService.validateSignature(
              JSON.stringify(event.data),
              event.signature!,
              credentials.channelSecret,
            );
          }
          return false;
        }

        default:
          return true; // No validation for other platforms
      }
    } catch (error) {
      console.error(`Webhook signature validation failed for ${platform}:`, error);
      return false;
    }
  }

  private async storeSyncHistory(
    tenantId: string,
    platform: string,
    data: any,
    status: 'success' | 'error',
    error?: string,
    integrationId?: string,
  ): Promise<void> {
    try {
      await prisma.syncHistory.create({
        data: {
          tenantId,
          integrationId,
          platform,
          status,
          data: data ?? undefined,
          error,
          syncedAt: new Date(),
        },
      });
    } catch (err) {
      console.error('Failed to store sync history:', err);
    }
  }

  private async persistPlatformData(
    tenantId: string,
    integrationId: string,
    platform: string,
    data: any,
  ): Promise<void> {
    try {
      switch (platform) {
        case 'facebook':
        case 'googleads':
        case 'tiktok':
          await this.persistAdPlatformData(tenantId, integrationId, platform, data);
          break;
        case 'line':
          await this.persistLineData(tenantId, data);
          break;
        case 'shopee':
          await this.persistShopeeData(tenantId, data);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Failed to persist data for ${platform}:`, error);
    }
  }

  private async persistAdPlatformData(
    tenantId: string,
    integrationId: string,
    platform: string,
    data: { campaigns?: any[]; insights?: any[] },
  ): Promise<void> {
    const campaigns = data?.campaigns ?? [];
    const insights = data?.insights ?? [];
    const campaignIdMap = new Map<string, string>();

    for (const raw of campaigns) {
      const source = raw?.campaign ?? raw;
      if (!source) continue;
      const externalId = String(source.id ?? source.campaign_id ?? source.externalId ?? '');
      if (!externalId) continue;

      const result = await prisma.campaign.upsert({
        where: {
          tenantId_platform_externalId: {
            tenantId,
            platform,
            externalId,
          },
        },
        update: {
          name: source.name ?? source.campaign_name ?? 'Unnamed campaign',
          status: (source.status ?? source.campaign_status ?? 'active').toString().toLowerCase(),
          objective: source.objective ?? source.objective_type ?? null,
          budget: this.toDecimal(
            (source.daily_budget ?? source.budget ?? raw?.metrics?.costMicros)
              ? Number(raw.metrics.costMicros) / 1_000_000
              : undefined,
          ),
          budgetType: source.budgetType ?? source.budget_mode ?? null,
          currency: source.currency ?? 'THB',
          campaignType: source.advertisingChannelType ?? source.advertising_channel_type ?? null,
          startDate: source.start_time
            ? new Date(source.start_time)
            : source.startDate
              ? new Date(source.startDate)
              : null,
          endDate: source.end_time
            ? new Date(source.end_time)
            : source.endDate
              ? new Date(source.endDate)
              : null,
        },
        create: {
          tenantId,
          integrationId,
          externalId,
          name: source.name ?? source.campaign_name ?? 'Unnamed campaign',
          platform,
          status: (source.status ?? source.campaign_status ?? 'active').toString().toLowerCase(),
          objective: source.objective ?? source.objective_type ?? null,
          budget: this.toDecimal(
            (source.daily_budget ?? source.budget ?? raw?.metrics?.costMicros)
              ? Number(raw.metrics.costMicros) / 1_000_000
              : undefined,
          ),
          budgetType: source.budgetType ?? source.budget_mode ?? null,
          currency: source.currency ?? 'THB',
          campaignType: source.advertisingChannelType ?? source.advertising_channel_type ?? null,
          startDate: source.start_time
            ? new Date(source.start_time)
            : source.startDate
              ? new Date(source.startDate)
              : null,
          endDate: source.end_time
            ? new Date(source.end_time)
            : source.endDate
              ? new Date(source.endDate)
              : null,
        },
      });

      campaignIdMap.set(externalId, result.id);
    }

    for (const raw of insights) {
      const campaignExternalId = String(raw.campaign_id ?? raw.id ?? raw.campaignId ?? '');
      const campaignId = campaignIdMap.get(campaignExternalId) ?? null;
      const dateStart = raw.date_start ?? raw.date ?? raw.date_start_time ?? raw.stat_time_day;
      if (!dateStart) continue;
      const date = new Date(`${dateStart}T00:00:00.000Z`);

      const impressions = Number(raw.impressions ?? raw.metrics?.impressions ?? 0);
      const clicks = Number(raw.clicks ?? raw.metrics?.clicks ?? 0);
      const conversions = Number(raw.conversions ?? raw.metrics?.conversions ?? 0);
      const spend = this.toDecimal(
        raw.spend ??
          raw.metrics?.spend ??
          (raw.metrics?.costMicros != null
            ? Number(raw.metrics.costMicros) / 1_000_000
            : undefined),
      );
      const revenue = this.toDecimal(
        raw.revenue ?? raw.metrics?.conversionValue ?? raw.metrics?.conversion_value,
      );

      await this.upsertMetric({
        tenantId,
        campaignId: campaignId ?? null,
        date,
        platform,
        source: campaignExternalId || platform,
        orders: undefined,
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
        metadata: raw,
      });
    }
  }

  private async persistLineData(
    tenantId: string,
    data: { userStats?: any; messageStats?: any[] },
  ): Promise<void> {
    const now = new Date();
    if (data?.userStats) {
      const date = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z');
      await this.upsertMetric({
        tenantId,
        campaignId: null,
        date,
        platform: 'line',
        source: 'line_user_stats',
        impressions: data.userStats.total ?? 0,
        clicks: data.userStats.active ?? 0,
        conversions: data.userStats.blocked ?? 0,
        metadata: data.userStats,
      });
    }

    for (const stat of data?.messageStats ?? []) {
      const ts =
        typeof stat.timestamp === 'number'
          ? stat.timestamp * 1000
          : Date.parse(stat.date ?? now.toISOString());
      const date = new Date(new Date(ts).toISOString().split('T')[0] + 'T00:00:00.000Z');
      await this.upsertMetric({
        tenantId,
        campaignId: null,
        date,
        platform: 'line',
        source: 'line_message_stats',
        impressions: stat.request ?? 0,
        clicks: stat.success ?? 0,
        conversions: stat.target ?? 0,
        metadata: stat,
      });
    }
  }

  private async persistShopeeData(
    tenantId: string,
    data: { orders?: any[]; products?: any[]; shopMetrics?: any },
  ): Promise<void> {
    for (const order of data?.orders ?? []) {
      const date = new Date(Number(order.create_time ?? order.order_time ?? Date.now()) * 1000);
      const source = `order_${order.order_sn ?? order.id ?? Math.random()}`;
      const revenue = Number(order.total_amount ?? 0);

      await this.upsertMetric({
        tenantId,
        campaignId: null,
        date,
        platform: 'shopee',
        source,
        orders: 1,
        revenue: this.toDecimal(revenue),
        metadata: order,
      });
    }

    if (data?.shopMetrics) {
      const date = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
      await this.upsertMetric({
        tenantId,
        campaignId: null,
        date,
        platform: 'shopee',
        source: 'shopee_shop_metrics',
        revenue: this.toDecimal(data.shopMetrics.metrics?.totalRevenue ?? 0),
        orders: data.shopMetrics.metrics?.totalOrders ?? 0,
        metadata: data.shopMetrics,
      });
    }
  }

  private async upsertMetric(params: {
    tenantId: string;
    campaignId: string | null;
    date: Date;
    platform: string;
    source: string;
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: Prisma.Decimal | null;
    revenue?: Prisma.Decimal | null;
    orders?: number;
    metadata?: any;
  }): Promise<void> {
    const {
      tenantId,
      campaignId,
      date,
      platform,
      source,
      impressions = 0,
      clicks = 0,
      conversions = 0,
      spend = null,
      revenue = null,
      orders = 0,
      metadata,
    } = params;

    const existing = await prisma.metric.findFirst({
      where: {
        tenantId,
        campaignId,
        date,
        hour: null,
        platform,
        source,
      },
      select: { id: true },
    });

    const payload = {
      impressions,
      clicks,
      conversions,
      spend,
      revenue,
      orders,
      metadata,
    };

    if (existing) {
      await prisma.metric.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.metric.create({
        data: {
          tenantId,
          campaignId,
          date,
          hour: null,
          platform,
          source,
          ...payload,
        },
      });
    }
  }

  private toDecimal(value?: number | string | null): Prisma.Decimal | null {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return null;
    }
    return new Prisma.Decimal(value);
  }

  private async storeWebhookEvent(tenantId: string, event: any): Promise<void> {
    try {
      await prisma.webhookEvent.create({
        data: {
          tenantId,
          platform: event.platform,
          type: event.type,
          data: JSON.stringify(event.data),
          signature: event.signature,
          receivedAt: event.timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to store webhook event:', error);
    }
  }

  private async processFacebookWebhook(event: WebhookEvent): Promise<void> {
    // Implement Facebook webhook processing logic
    console.log('Processing Facebook webhook:', event.type, event.data);
  }

  private async processLINEWebhook(event: WebhookEvent): Promise<void> {
    // Implement LINE webhook processing logic
    console.log('Processing LINE webhook:', event.type, event.data);
  }

  private async processTikTokWebhook(event: WebhookEvent): Promise<void> {
    // Implement TikTok webhook processing logic
    console.log('Processing TikTok webhook:', event.type, event.data);
  }

  private async processShopeeWebhook(event: WebhookEvent): Promise<void> {
    // Implement Shopee webhook processing logic
    console.log('Processing Shopee webhook:', event.type, event.data);
  }

  async getPlatformMetrics(
    tenantId: string,
    platform: string,
    dateRange?: { start: string; end: string },
  ): Promise<any> {
    try {
      const service = this.platforms[platform as keyof typeof this.platforms];
      if (!service) {
        throw new Error(`Platform ${platform} not supported`);
      }

      switch (platform) {
        case 'facebook':
          return {
            campaigns: await (service as any).getCampaigns(tenantId, dateRange),
            insights: await (service as any).getInsights(tenantId, undefined, dateRange),
          };

        case 'googleads':
          return {
            campaigns: await (service as any).getCampaigns(tenantId, dateRange),
            insights: await (service as any).getInsights(tenantId, dateRange),
          };

        case 'line':
          return {
            userStats: await (service as any).getUserStats(tenantId),
            messageStats: dateRange
              ? await (service as any).getMessageStats(tenantId, dateRange.start, dateRange.end)
              : [],
          };

        case 'tiktok':
          return {
            campaigns: await (service as any).getCampaigns(tenantId, dateRange),
            insights: await (service as any).getInsights(tenantId, dateRange),
          };

        case 'shopee':
          return {
            orders: await (service as any).getOrders(tenantId, dateRange),
            products: await (service as any).getProducts(tenantId),
            shopMetrics: await (service as any).getShopMetrics(tenantId),
          };

        default:
          throw new Error(`Metrics not implemented for platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Failed to get metrics for ${platform}:`, error);
      throw error;
    }
  }
}

export const integrationService = new IntegrationService();

// FLOW END: Integration Service (EN)
// จุดสิ้นสุด: Service กลางสำหรับ Integration (TH)
