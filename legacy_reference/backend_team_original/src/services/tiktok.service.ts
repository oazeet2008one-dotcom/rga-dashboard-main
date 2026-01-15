import axios from 'axios';
import { Integration } from '@prisma/client';
import { prisma } from '../utils/prisma';

// FLOW START: TikTok Service API + Sync (EN)
// จุดเริ่มต้น: Service TikTok (เรียก API + sync ลง DB) (TH)

export interface TikTokCredentials {
  appId: string;
  appSecret: string;
  accessToken: string;
  advertiserId?: string;
  refreshToken?: string;
}

export interface TikTokCampaign {
  advertiser_id: string;
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective_type: string;
  budget: number;
  budget_mode: string;
  start_time: number;
  end_time?: number;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    conversion_value: number;
  };
}

export interface TikTokInsight {
  date: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    conversions: number;
    conversion_value: number;
    video_views: number;
    video_play_rate: number;
  };
}

class TikTokService {
  private baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';
  private reportingUrl = 'https://business-api.tiktok.com/open_api/v1.3/reports';

  async getCredentials(tenantId: string): Promise<TikTokCredentials | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'tiktok',
        isActive: true,
      },
    });

    if (!integration) return null;

    return integration.config as unknown as TikTokCredentials;
  }

  async validateCredentials(credentials: TikTokCredentials): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/user/info/`, {
        headers: {
          'Access-Token': credentials.accessToken,
          'Content-Type': 'application/json',
        },
      });
      return response.status === 200 && response.data.code === 0;
    } catch (error) {
      console.error('TikTok API validation failed:', error);
      return false;
    }
  }

  async getCampaigns(
    tenantId: string,
    dateRange?: { start: string; end: string },
  ): Promise<TikTokCampaign[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('TikTok credentials not found');
    if (!credentials.advertiserId) throw new Error('TikTok advertiser ID not found');

    try {
      const response = await axios.get(`${this.baseUrl}/campaign/get/`, {
        params: {
          advertiser_id: credentials.advertiserId,
          fields: [
            'campaign_id',
            'campaign_name',
            'status',
            'objective_type',
            'budget',
            'budget_mode',
            'start_time',
            'end_time',
          ].join(','),
          filtering: JSON.stringify({
            status: ['ENABLED', 'DISABLED', 'PAUSED'],
          }),
        },
        headers: {
          'Access-Token': credentials.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.code !== 0) {
        throw new Error(`TikTok API error: ${response.data.message}`);
      }

      const campaigns = response.data.data?.campaigns || [];

      // Get metrics for each campaign
      const campaignsWithMetrics = await Promise.all(
        campaigns.map(async (campaign: any) => {
          const metrics = await this.getCampaignMetrics(tenantId, campaign.campaign_id, dateRange);
          return {
            ...campaign,
            metrics,
          };
        }),
      );

      return campaignsWithMetrics;
    } catch (error) {
      console.error('TikTok campaigns fetch failed:', error);
      throw new Error('Failed to fetch TikTok campaigns');
    }
  }

  async getCampaignMetrics(
    tenantId: string,
    campaignId: string,
    dateRange?: { start: string; end: string },
  ): Promise<any> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('TikTok credentials not found');
    if (!credentials.advertiserId) throw new Error('TikTok advertiser ID not found');

    try {
      const response = await axios.post(
        `${this.reportingUrl}/integrated/get/`,
        {
          advertiser_id: credentials.advertiserId,
          dimensions: ['CAMPAIGN_ID'],
          metrics: [
            'spend',
            'impressions',
            'clicks',
            'ctr',
            'cpc',
            'conversions',
            'conversion_value',
            'video_views',
            'video_play_rate',
          ],
          data_level: 'CAMPAIGN',
          start_date: dateRange?.start || '2024-01-01',
          end_date: dateRange?.end || '2024-12-31',
          filtering: JSON.stringify({
            campaign_ids: [campaignId],
          }),
        },
        {
          headers: {
            'Access-Token': credentials.accessToken,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.code !== 0) {
        throw new Error(`TikTok API error: ${response.data.message}`);
      }

      const metricsData = response.data.data?.list || [];
      if (metricsData.length === 0) {
        return {
          spend: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          conversions: 0,
          conversion_value: 0,
          video_views: 0,
          video_play_rate: 0,
        };
      }

      return metricsData[0].metrics;
    } catch (error) {
      console.error('TikTok campaign metrics fetch failed:', error);
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        conversions: 0,
        conversion_value: 0,
        video_views: 0,
        video_play_rate: 0,
      };
    }
  }

  async getInsights(
    tenantId: string,
    dateRange?: { start: string; end: string },
  ): Promise<TikTokInsight[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('TikTok credentials not found');
    if (!credentials.advertiserId) throw new Error('TikTok advertiser ID not found');

    try {
      const response = await axios.post(
        `${this.reportingUrl}/integrated/get/`,
        {
          advertiser_id: credentials.advertiserId,
          dimensions: ['STAT_TIME_DAY'],
          metrics: [
            'spend',
            'impressions',
            'clicks',
            'ctr',
            'cpc',
            'conversions',
            'conversion_value',
            'video_views',
            'video_play_rate',
          ],
          data_level: 'ADVERTISER',
          start_date: dateRange?.start || '2024-01-01',
          end_date: dateRange?.end || '2024-12-31',
        },
        {
          headers: {
            'Access-Token': credentials.accessToken,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.code !== 0) {
        throw new Error(`TikTok API error: ${response.data.message}`);
      }

      const insights = response.data.data?.list || [];
      return insights.map((insight: any) => ({
        date: insight.dimensions[0].STAT_TIME_DAY,
        metrics: insight.metrics,
      }));
    } catch (error) {
      console.error('TikTok insights fetch failed:', error);
      throw new Error('Failed to fetch TikTok insights');
    }
  }

  async getAdAccounts(tenantId: string): Promise<any[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('TikTok credentials not found');

    try {
      const response = await axios.get(`${this.baseUrl}/advertiser/get/`, {
        params: {
          fields: ['advertiser_id', 'name', 'status', 'role', 'currency', 'timezone'],
        },
        headers: {
          'Access-Token': credentials.accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.code !== 0) {
        throw new Error(`TikTok API error: ${response.data.message}`);
      }

      return response.data.data?.list || [];
    } catch (error) {
      console.error('TikTok ad accounts fetch failed:', error);
      throw new Error('Failed to fetch TikTok ad accounts');
    }
  }

  // OAuth flow helpers
  getAuthUrl(appId: string, redirectUri: string, state: string): string {
    const scopes = ['advertiser_info', 'campaign_management', 'reporting'].join(',');

    return (
      `https://business-api.tiktok.com/portal/auth?` +
      `app_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scopes}&` +
      `state=${state}`
    );
  }

  async exchangeCodeForToken(code: string, appId: string, appSecret: string): Promise<any> {
    try {
      const response = await axios.post(
        'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
        new URLSearchParams({
          app_id: appId,
          app_secret: appSecret,
          code: code,
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('TikTok token exchange failed:', error);
      throw new Error('Failed to exchange TikTok code for token');
    }
  }

  async refreshToken(tenantId: string): Promise<string> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('TikTok credentials not found');
    if (!credentials.refreshToken) throw new Error('TikTok refresh token not found');

    try {
      const response = await axios.post(
        'https://business-api.tiktok.com/open_api/v1.3/oauth2/refresh_token/',
        new URLSearchParams({
          app_id: credentials.appId,
          app_secret: credentials.appSecret,
          refresh_token: credentials.refreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const newAccessToken = response.data.access_token;

      // Update credentials in database
      await prisma.integration.updateMany({
        where: { tenantId, provider: 'tiktok' },
        data: {
          config: { ...credentials, accessToken: newAccessToken },
        },
      });

      return newAccessToken;
    } catch (error) {
      console.error('TikTok token refresh failed:', error);
      throw new Error('Failed to refresh TikTok token');
    }
  }
}

export const tiktokService = new TikTokService();

export const sync = async (integration: Integration) => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  const dateRange = {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };

  const campaigns = await tiktokService.getCampaigns(integration.tenantId, dateRange);
  let synced = 0;

  for (const campaignData of campaigns) {
    const dbCampaign = await prisma.campaign.upsert({
      where: {
        tenantId_platform_externalId: {
          tenantId: integration.tenantId,
          platform: 'tiktok',
          externalId: campaignData.campaign_id,
        },
      },
      update: {
        name: campaignData.campaign_name,
        status: campaignData.status?.toLowerCase?.() || 'unknown',
        campaignType: campaignData.objective_type?.toLowerCase?.() || 'unknown',
        budget: Number(campaignData.budget) || 0,
      },
      create: {
        tenantId: integration.tenantId,
        integrationId: integration.id,
        externalId: campaignData.campaign_id,
        name: campaignData.campaign_name,
        platform: 'tiktok',
        status: campaignData.status?.toLowerCase?.() || 'unknown',
        campaignType: campaignData.objective_type?.toLowerCase?.() || 'unknown',
        budget: Number(campaignData.budget) || 0,
      },
    });

    const m = (campaignData as any).metrics || {};

    await prisma.metric.upsert({
      where: {
        tenantId_campaignId_date_hour_platform_source: {
          tenantId: integration.tenantId,
          campaignId: dbCampaign.id,
          date: new Date(dateRange.end),
          hour: 0,
          platform: 'tiktok',
          source: campaignData.campaign_id,
        },
      },
      update: {
        impressions: Number(m.impressions) || 0,
        clicks: Number(m.clicks) || 0,
        conversions: Number(m.conversions) || 0,
        spend: Number(m.spend) || 0,
      },
      create: {
        tenantId: integration.tenantId,
        campaignId: dbCampaign.id,
        date: new Date(dateRange.end),
        hour: 0,
        platform: 'tiktok',
        source: campaignData.campaign_id,
        impressions: Number(m.impressions) || 0,
        clicks: Number(m.clicks) || 0,
        conversions: Number(m.conversions) || 0,
        spend: Number(m.spend) || 0,
      },
    });

    synced += 1;
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  return {
    status: 'success',
    provider: 'tiktok',
    integrationId: integration.id,
    synced,
  };
};

// FLOW END: TikTok Service API + Sync (EN)
// จุดสิ้นสุด: Service TikTok (เรียก API + sync ลง DB) (TH)
