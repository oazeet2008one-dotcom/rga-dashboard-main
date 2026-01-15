import { prisma } from '../utils/prisma';
import { Integration } from '@prisma/client';
import { sync as googleAdsSync } from './googleAds';
import { sync as facebookSync } from './facebook.service';
import { sync as tiktokSync } from './tiktok.service';
import { sync as ga4Sync } from './ga4';
import { sync as searchConsoleSync } from './googleSearchConsole.service';
import { sync as lineAdsSync } from './lineAds.service';
import { logger } from '../utils/logger';

// FLOW START: Data Pipeline Service (EN)
// จุดเริ่มต้น: Service ของ Data Pipeline (TH)

export interface SyncResult {
  provider: string;
  status: 'success' | 'error' | 'partial';
  integrationId: string;
  synced?: number;
  campaigns?: any[];
  metrics?: any[];
  error?: string;
  duration?: number;
}

export interface PipelineConfig {
  tenantId: string;
  providers?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  forceSync?: boolean;
}

class DataPipelineService {
  private readonly providers = {
    google_ads: {
      name: 'Google Ads',
      sync: googleAdsSync,
      priority: 1,
    },
    facebook: {
      name: 'Facebook Ads',
      sync: facebookSync,
      priority: 2,
    },
    tiktok: {
      name: 'TikTok Ads',
      sync: tiktokSync,
      priority: 3,
    },
    ga4: {
      name: 'Google Analytics 4',
      sync: ga4Sync,
      priority: 4,
    },
    google_search_console: {
      name: 'Google Search Console',
      sync: searchConsoleSync,
      priority: 5,
    },
    line_ads: {
      name: 'LINE Ads',
      sync: lineAdsSync,
      priority: 6,
    },
  };

  async getActiveIntegrations(tenantId: string): Promise<Integration[]> {
    return await prisma.integration.findMany({
      where: {
        tenantId,
        isActive: true,
        provider: {
          in: Object.keys(this.providers),
        },
      },
      orderBy: {
        lastSyncAt: 'asc',
      },
    });
  }

  async shouldSync(integration: Integration, forceSync: boolean = false): Promise<boolean> {
    if (forceSync) return true;

    if (!integration.lastSyncAt) return true;

    const now = new Date();
    const lastSync = new Date(integration.lastSyncAt);
    const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

    // Sync every 4 hours for ad platforms, every 6 hours for analytics
    const syncInterval = ['google_ads', 'facebook', 'tiktok', 'line_ads'].includes(
      integration.provider,
    )
      ? 4
      : 6;

    return hoursSinceLastSync >= syncInterval;
  }

  async syncIntegration(integration: Integration): Promise<SyncResult> {
    const startTime = Date.now();
    const provider = this.providers[integration.provider as keyof typeof this.providers];

    if (!provider) {
      return {
        provider: integration.provider,
        status: 'error',
        integrationId: integration.id,
        error: `Unknown provider: ${integration.provider}`,
        duration: Date.now() - startTime,
      };
    }

    try {
      logger.info(`Starting sync for ${provider.name} (Integration: ${integration.id})`);

      const result = await provider.sync(integration);
      const r = result as any;

      const duration = Date.now() - startTime;

      logger.info(`${provider.name} sync completed successfully in ${duration}ms`);

      return {
        provider: integration.provider,
        status: 'success',
        integrationId: integration.id,
        synced: r?.synced || 0,
        campaigns: r?.campaigns || [],
        metrics: r?.metrics || [],
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      logger.error(`${provider.name} sync failed after ${duration}ms: ${errorMessage}`);

      // Update integration status to error (if lastError field exists)
      try {
        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            status: 'error',
          },
        });
      } catch (updateError) {
        // If lastError field doesn't exist, just update status
        logger.warn('Could not update lastError field, updating status only');
      }

      return {
        provider: integration.provider,
        status: 'error',
        integrationId: integration.id,
        error: errorMessage,
        duration,
      };
    }
  }

  async runPipeline(config: PipelineConfig): Promise<SyncResult[]> {
    const { tenantId, providers: selectedProviders, forceSync = false } = config;

    logger.info(`Starting data pipeline for tenant: ${tenantId}`);

    const integrations = await this.getActiveIntegrations(tenantId);

    // Filter integrations by selected providers if specified
    const filteredIntegrations = selectedProviders
      ? integrations.filter((integration) => selectedProviders.includes(integration.provider))
      : integrations;

    // Filter integrations that need syncing
    const integrationsToSync = filteredIntegrations.filter((integration) =>
      this.shouldSync(integration, forceSync),
    );

    if (integrationsToSync.length === 0) {
      logger.info('No integrations require syncing');
      return [];
    }

    // Sort by priority and run in parallel (with some limits)
    const sortedIntegrations = integrationsToSync.sort((a, b) => {
      const priorityA = this.providers[a.provider as keyof typeof this.providers]?.priority || 999;
      const priorityB = this.providers[b.provider as keyof typeof this.providers]?.priority || 999;
      return priorityA - priorityB;
    });

    // Run syncs in parallel with concurrency limit
    const concurrencyLimit = 3;
    const results: SyncResult[] = [];

    for (let i = 0; i < sortedIntegrations.length; i += concurrencyLimit) {
      const batch = sortedIntegrations.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map((integration) => this.syncIntegration(integration));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            provider: batch[index].provider,
            status: 'error',
            integrationId: batch[index].id,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });
    }

    // Log summary
    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'error').length;

    logger.info(`Pipeline completed: ${successful} successful, ${failed} failed`);

    return results;
  }

  async getAggregatedMetrics(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    platforms?: string[],
  ) {
    const whereClause: any = {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (platforms && platforms.length > 0) {
      whereClause.platform = {
        in: platforms,
      };
    }

    const metrics = await prisma.metric.groupBy({
      by: ['platform', 'date'],
      where: whereClause,
      _sum: {
        impressions: true,
        clicks: true,
        conversions: true,
        spend: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return metrics.map((metric) => ({
      platform: metric.platform,
      date: metric.date,
      impressions: metric._sum.impressions || 0,
      clicks: metric._sum.clicks || 0,
      conversions: metric._sum.conversions || 0,
      spend: Number(metric._sum.spend ?? 0),
      ctr:
        metric._sum.clicks && metric._sum.impressions
          ? (metric._sum.clicks / metric._sum.impressions) * 100
          : 0,
      cpc:
        metric._sum.clicks && metric._sum.spend
          ? Number(metric._sum.spend) / metric._sum.clicks
          : 0,
    }));
  }

  async getCrossPlatformSummary(tenantId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const metrics = await this.getAggregatedMetrics(tenantId, startDate, endDate);

    const summary = {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      avgCTR: 0,
      avgCPC: 0,
      cpa: 0,
      platforms: {} as Record<string, any>,
    };

    const platformData: Record<string, any> = {};

    metrics.forEach((metric) => {
      const platform = metric.platform;

      if (!platformData[platform]) {
        platformData[platform] = {
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
        };
      }

      platformData[platform].spend += metric.spend;
      platformData[platform].impressions += metric.impressions;
      platformData[platform].clicks += metric.clicks;
      platformData[platform].conversions += metric.conversions;

      summary.totalSpend += metric.spend;
      summary.totalImpressions += metric.impressions;
      summary.totalClicks += metric.clicks;
      summary.totalConversions += metric.conversions;
    });

    // Calculate platform-specific metrics
    Object.keys(platformData).forEach((platform) => {
      const data = platformData[platform];
      data.ctr = data.clicks && data.impressions ? (data.clicks / data.impressions) * 100 : 0;
      data.cpc = data.clicks && data.spend ? data.spend / data.clicks : 0;
      data.cpa = data.conversions && data.spend ? data.spend / data.conversions : 0;
      summary.platforms[platform] = data;
    });

    // Calculate overall averages
    summary.avgCTR =
      summary.totalClicks && summary.totalImpressions
        ? (summary.totalClicks / summary.totalImpressions) * 100
        : 0;
    summary.avgCPC =
      summary.totalClicks && summary.totalSpend ? summary.totalSpend / summary.totalClicks : 0;
    summary.cpa =
      summary.totalConversions && summary.totalSpend
        ? summary.totalSpend / summary.totalConversions
        : 0;

    return summary;
  }

  async getSyncStatus(tenantId: string): Promise<any> {
    const integrations = await this.getActiveIntegrations(tenantId);

    return integrations.map((integration) => ({
      id: integration.id,
      provider: integration.provider,
      providerName:
        this.providers[integration.provider as keyof typeof this.providers]?.name ||
        integration.provider,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
      needsSync: this.shouldSync(integration),
    }));
  }
}

export const dataPipelineService = new DataPipelineService();
export default dataPipelineService;

// FLOW END: Data Pipeline Service (EN)
// จุดสิ้นสุด: Service ของ Data Pipeline (TH)
