import axios from 'axios';
import { Integration } from '@prisma/client';
import { prisma } from '../utils/prisma';

// FLOW START: Facebook Service API + Sync (EN)
// จุดเริ่มต้น: Service Facebook (เรียก API + sync ลง DB) (TH)

export interface FacebookCredentials {
  accessToken: string;
  accountId: string;
  appId: string;
  appSecret: string;
}

export interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  date_start: string;
  date_stop: string;
  conversions?: number;
}

export interface FacebookInsight {
  date_start: string;
  date_stop: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  reach: number;
  actions: Array<{
    action_type: string;
    value: number;
  }>;
}

class FacebookService {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  async getCredentials(tenantId: string): Promise<FacebookCredentials | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'facebook',
        isActive: true,
      },
    });

    if (!integration) return null;

    return integration.config as unknown as FacebookCredentials;
  }

  async validateCredentials(credentials: FacebookCredentials): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/me?access_token=${credentials.accessToken}`,
      );
      return response.status === 200;
    } catch (error) {
      console.error('Facebook API validation failed:', error);
      return false;
    }
  }

  async getCampaigns(
    tenantId: string,
    dateRange?: { start: string; end: string },
  ): Promise<FacebookCampaign[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Facebook credentials not found');

    try {
      const timeRange = dateRange
        ? `&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}`
        : '&time_range={"since":"2024-01-01","until":"2024-12-31"}';

      const response = await axios.get(
        `${this.baseUrl}/act_${credentials.accountId}/campaigns?` +
          `fields=name,status,objective,spend,impressions,clicks,cpc,ctr,date_start,date_stop,conversions` +
          `&access_token=${credentials.accessToken}${timeRange}`,
      );

      return response.data.data || [];
    } catch (error: any) {
      console.error('Facebook campaigns fetch failed:', error);
      throw new Error('Failed to fetch Facebook campaigns');
    }
  }

  async getInsights(
    tenantId: string,
    campaignId?: string,
    dateRange?: { start: string; end: string },
  ): Promise<FacebookInsight[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Facebook credentials not found');

    try {
      const timeRange = dateRange
        ? `&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}`
        : '&time_range={"since":"2024-01-01","until":"2024-12-31"}';

      const endpoint = campaignId
        ? `${this.baseUrl}/${campaignId}/insights`
        : `${this.baseUrl}/act_${credentials.accountId}/insights`;

      const response = await axios.get(
        `${endpoint}?` +
          `fields=date_start,date_stop,spend,impressions,clicks,cpc,ctr,reach,actions,objective` +
          `&access_token=${credentials.accessToken}${timeRange}`,
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Facebook insights fetch failed:', error);
      throw new Error('Failed to fetch Facebook insights');
    }
  }

  async getAdAccounts(tenantId: string): Promise<any[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Facebook credentials not found');

    try {
      const response = await axios.get(
        `${this.baseUrl}/me/adaccounts?` +
          `fields=name,account_id,status,currency,timezone_name` +
          `&access_token=${credentials.accessToken}`,
      );

      return response.data.data || [];
    } catch (error) {
      console.error('Facebook ad accounts fetch failed:', error);
      throw new Error('Failed to fetch Facebook ad accounts');
    }
  }

  async getAuthUrl(appId: string, redirectUri: string, state: string): Promise<string> {
    return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=ads_read,ads_management&state=${state}`;
  }

  async exchangeCodeForToken(
    code: string,
    appId: string,
    appSecret: string,
    redirectUri: string,
  ): Promise<any> {
    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Facebook token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  async sync(integration: Integration) {
    try {
      const credentials = integration.config as unknown as FacebookCredentials;

      if (!credentials.accessToken) {
        throw new Error('Missing Facebook credentials');
      }

      // Get campaigns
      const campaigns = await this.getCampaigns(integration.tenantId);
      const syncedCampaigns = [];

      // Get date range for metrics (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateRange = { start: startDate, end: endDate };

      for (const campaignData of campaigns) {
        // Create or update campaign
        const dbCampaign = await prisma.campaign.upsert({
          where: {
            tenantId_platform_externalId: {
              tenantId: integration.tenantId,
              platform: 'facebook',
              externalId: campaignData.id,
            },
          },
          update: {
            name: campaignData.name,
            status: campaignData.status.toLowerCase(),
            campaignType: campaignData.objective?.toLowerCase() || 'unknown',
            budget: campaignData.spend,
          },
          create: {
            tenantId: integration.tenantId,
            integrationId: integration.id,
            externalId: campaignData.id,
            name: campaignData.name,
            platform: 'facebook',
            status: campaignData.status.toLowerCase(),
            campaignType: campaignData.objective?.toLowerCase() || 'unknown',
            startDate: campaignData.date_start ? new Date(campaignData.date_start) : null,
            endDate: campaignData.date_stop ? new Date(campaignData.date_stop) : null,
            budget: campaignData.spend,
          },
        });

        // Get campaign metrics
        const metrics = await this.getInsights(integration.tenantId, campaignData.id, dateRange);

        // Store metrics
        for (const metricData of metrics) {
          const conversions = Array.isArray((metricData as any).actions)
            ? (metricData as any).actions.reduce(
                (sum: number, a: any) => sum + Number(a?.value || 0),
                0,
              )
            : 0;

          await prisma.metric.upsert({
            where: {
              tenantId_campaignId_date_hour_platform_source: {
                tenantId: integration.tenantId,
                campaignId: dbCampaign.id,
                date: new Date(metricData.date_start),
                hour: 0,
                platform: 'facebook',
                source: campaignData.id,
              },
            },
            update: {
              impressions: metricData.impressions,
              clicks: metricData.clicks,
              conversions,
              spend: metricData.spend,
            },
            create: {
              tenantId: integration.tenantId,
              campaignId: dbCampaign.id,
              date: new Date(metricData.date_start),
              platform: 'facebook',
              source: campaignData.id,
              impressions: metricData.impressions,
              clicks: metricData.clicks,
              conversions,
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
        provider: 'facebook',
        integrationId: integration.id,
        synced: syncedCampaigns.length,
        campaigns: syncedCampaigns,
      };
    } catch (error: any) {
      console.error(`Facebook sync failed: ${error.message}`);

      // Update integration status
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'error' },
      });

      throw error;
    }
  }

  async refreshToken(tenantId: string): Promise<string> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'facebook',
        isActive: true,
      },
    });

    if (!integration) {
      throw new Error('Facebook integration not found');
    }

    const credentials = integration.config as unknown as FacebookCredentials;

    try {
      const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_short',
          client_id: credentials.appId,
          client_secret: credentials.appSecret,
          fb_exchange_token: credentials.accessToken,
        },
      });

      const newAccessToken = response.data.access_token;

      // Update the integration with new token
      const updatedConfig = { ...credentials, accessToken: newAccessToken };
      await prisma.integration.update({
        where: { id: integration.id },
        data: { config: updatedConfig },
      });

      return newAccessToken;
    } catch (error) {
      console.error('Facebook token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  }
}

export const facebookService = new FacebookService();

export const sync = async (integration: Integration) => {
  return facebookService.sync(integration);
};

// FLOW END: Facebook Service API + Sync (EN)
// จุดสิ้นสุด: Service Facebook (เรียก API + sync ลง DB) (TH)
