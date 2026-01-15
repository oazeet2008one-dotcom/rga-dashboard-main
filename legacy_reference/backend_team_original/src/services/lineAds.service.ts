import { Integration } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../utils/prisma';

// FLOW START: LINE Ads Service API + Sync (EN)
// จุดเริ่มต้น: Service LINE Ads (เรียก API + sync ลง DB) (TH)

export interface LineAdsCredentials {
  channelId: string;
  channelSecret: string;
  accessToken: string;
  refreshToken?: string;
}

export interface LineAdsCampaign {
  campaignId: string;
  campaignName: string;
  status: string;
  budget: number;
  budgetType: string;
  startDate: string;
  endDate?: string;
  targetingType: string;
  deliveryType: string;
}

export interface LineAdsMetrics {
  date: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  reach: number;
  frequency: number;
  cpc: number;
  ctr: number;
  cpm: number;
}

class LineAdsService {
  private baseUrl = 'https://ads-api.line.me';

  async getCredentials(tenantId: string): Promise<LineAdsCredentials> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'line_ads',
        isActive: true,
      },
    });

    if (!integration) {
      throw new Error('LINE Ads integration not found');
    }

    const credentials = integration.credentials as unknown;
    return credentials as LineAdsCredentials;
  }

  async getCampaigns(credentials: LineAdsCredentials): Promise<LineAdsCampaign[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2.1/campaigns`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to fetch LINE Ads campaigns:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCampaignMetrics(
    credentials: LineAdsCredentials,
    campaignId: string,
    startDate: string,
    endDate: string,
  ): Promise<LineAdsMetrics[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2.1/reports`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          fields:
            'DATE,CAMPAIGN_ID,IMPRESSIONS,CLICKS,SPEND,CONVERSIONS,REACH,FREQUENCY,CPC,CTR,CPM',
          filters: `CAMPAIGN_ID eq ${campaignId}`,
          granularity: 'DAILY',
          startDate,
          endDate,
          limit: 1000,
        },
      });

      return (
        response.data.data?.map((item: any) => ({
          date: item.DATE,
          campaignId: item.CAMPAIGN_ID,
          impressions: Number(item.IMPRESSIONS) || 0,
          clicks: Number(item.CLICKS) || 0,
          spend: Number(item.SPEND) || 0,
          conversions: Number(item.CONVERSIONS) || 0,
          reach: Number(item.REACH) || 0,
          frequency: Number(item.FREQUENCY) || 0,
          cpc: Number(item.CPC) || 0,
          ctr: Number(item.CTR) || 0,
          cpm: Number(item.CPM) || 0,
        })) || []
      );
    } catch (error: any) {
      console.error('Failed to fetch LINE Ads metrics:', error.response?.data || error.message);
      throw error;
    }
  }

  async sync(integration: Integration) {
    try {
      const credentials = integration.credentials as any;

      if (!credentials.accessToken || !credentials.channelId) {
        throw new Error('Missing LINE Ads credentials');
      }

      // Get campaigns
      const campaigns = await this.getCampaigns(credentials);
      const syncedCampaigns = [];

      // Get date range for metrics (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const campaignData of campaigns) {
        // Create or update campaign
        const dbCampaign = await prisma.campaign.upsert({
          where: {
            tenantId_platform_externalId: {
              tenantId: integration.tenantId,
              platform: 'line_ads',
              externalId: campaignData.campaignId,
            },
          },
          update: {
            name: campaignData.campaignName,
            status: campaignData.status.toLowerCase(),
            campaignType: campaignData.targetingType?.toLowerCase(),
            budget: campaignData.budget,
          },
          create: {
            tenantId: integration.tenantId,
            integrationId: integration.id,
            externalId: campaignData.campaignId,
            name: campaignData.campaignName,
            platform: 'line_ads',
            status: campaignData.status.toLowerCase(),
            campaignType: campaignData.targetingType?.toLowerCase(),
            startDate: campaignData.startDate ? new Date(campaignData.startDate) : null,
            endDate: campaignData.endDate ? new Date(campaignData.endDate as string) : null,
            budget: campaignData.budget,
          },
        });

        // Get campaign metrics
        const metrics = await this.getCampaignMetrics(
          credentials,
          campaignData.campaignId,
          startDate,
          endDate,
        );

        // Store metrics
        for (const metricData of metrics) {
          await prisma.metric.upsert({
            where: {
              tenantId_campaignId_date_hour_platform_source: {
                tenantId: integration.tenantId,
                campaignId: dbCampaign.id,
                date: new Date(metricData.date),
                hour: 0,
                platform: 'line_ads',
                source: campaignData.campaignId,
              },
            },
            update: {
              impressions: metricData.impressions,
              clicks: metricData.clicks,
              conversions: metricData.conversions,
              spend: metricData.spend,
            },
            create: {
              tenantId: integration.tenantId,
              campaignId: dbCampaign.id,
              date: new Date(metricData.date),
              platform: 'line_ads',
              source: campaignData.campaignId,
              impressions: metricData.impressions,
              clicks: metricData.clicks,
              conversions: metricData.conversions,
              spend: metricData.spend,
            },
          });
        }

        syncedCampaigns.push(dbCampaign);
      }

      // Update last sync time
      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() },
      });

      return {
        status: 'success',
        provider: 'line_ads',
        integrationId: integration.id,
        synced: syncedCampaigns.length,
        campaigns: syncedCampaigns,
      };
    } catch (error: any) {
      console.error(`LINE Ads sync failed: ${error.message}`);

      // Update integration status
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'error' },
      });

      throw error;
    }
  }

  async refreshToken(credentials: LineAdsCredentials): Promise<LineAdsCredentials> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth2/v2.1/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: credentials.refreshToken,
          client_id: credentials.channelId,
          client_secret: credentials.channelSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const newCredentials = {
        ...credentials,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || credentials.refreshToken,
      };

      return newCredentials;
    } catch (error: any) {
      console.error('Failed to refresh LINE Ads token:', error.response?.data || error.message);
      throw error;
    }
  }

  async validateCredentials(credentials: LineAdsCredentials): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2.1/campaigns`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          limit: 1,
        },
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const lineAdsService = new LineAdsService();
export default lineAdsService;

export const sync = async (integration: Integration) => {
  return lineAdsService.sync(integration);
};

// FLOW END: LINE Ads Service API + Sync (EN)
// จุดสิ้นสุด: Service LINE Ads (เรียก API + sync ลง DB) (TH)
