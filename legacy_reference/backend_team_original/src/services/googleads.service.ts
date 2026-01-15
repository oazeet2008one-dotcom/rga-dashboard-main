import { google } from 'googleapis';
import { GoogleAdsApi } from 'google-ads-api';
import { prisma } from '../utils/prisma';

// FLOW START: Google Ads Service API (EN)
// จุดเริ่มต้น: Service Google Ads (เรียก API) (TH)

export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  customerId: string;
}

export interface GoogleAdsCampaign {
  campaign: {
    id: string;
    name: string;
    status: string;
    advertisingChannelType: string;
    startDate: string;
    endDate?: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    costMicros: number;
    ctr: number;
    averageCpc: number;
    conversions: number;
    conversionValue: number;
  };
}

export interface GoogleAdsInsight {
  date: {
    year: string;
    month: string;
    day: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    costMicros: number;
    ctr: number;
    averageCpc: number;
    conversions: number;
    conversionValue: number;
  };
}

export class GoogleAdsService {
  async getCredentials(tenantId: string): Promise<GoogleAdsCredentials | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'googleads',
        isActive: true,
      },
    });

    if (!integration) return null;

    return integration.config as unknown as GoogleAdsCredentials;
  }

  private formatCustomerId(customerId: string): string {
    return customerId.replace(/-/g, '');
  }

  private async getCustomer(credentials: GoogleAdsCredentials) {
    const client = new GoogleAdsApi({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      developer_token: credentials.developerToken,
    });

    return client.Customer({
      customer_id: this.formatCustomerId(credentials.customerId),
      login_customer_id: this.formatCustomerId(credentials.customerId),
      refresh_token: credentials.refreshToken,
    });
  }

  async validateCredentials(credentials: GoogleAdsCredentials): Promise<boolean> {
    try {
      const tempClient = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);

      tempClient.setCredentials({
        refresh_token: credentials.refreshToken,
      });

      // Test the credentials by getting a new access token
      const { credentials: newCreds } = await tempClient.refreshAccessToken();
      return !!newCreds.access_token;
    } catch (error) {
      console.error('Google Ads validation failed:', error);
      return false;
    }
  }

  async getCampaigns(
    tenantId: string,
    _dateRange?: { start: string; end: string },
  ): Promise<GoogleAdsCampaign[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Google Ads credentials not found');

    try {
      const customer = await this.getCustomer(credentials);
      const query = `
        SELECT 
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.start_date,
          campaign.end_date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.conversions,
          metrics.conversion_value
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        LIMIT 200
      `;

      const rows = await customer.query(query);

      return rows.map((row: any) => ({
        campaign: {
          id: row.campaign.id,
          name: row.campaign.name,
          status: row.campaign.status,
          advertisingChannelType: row.campaign.advertising_channel_type,
          startDate: row.campaign.start_date,
          endDate: row.campaign.end_date,
        },
        metrics: {
          impressions: Number(row.metrics.impressions || 0),
          clicks: Number(row.metrics.clicks || 0),
          costMicros: Number(row.metrics.cost_micros || 0),
          ctr: Number(row.metrics.ctr || 0),
          averageCpc: Number(row.metrics.average_cpc || 0),
          conversions: Number(row.metrics.conversions || 0),
          conversionValue: Number(row.metrics.conversion_value || 0),
        },
      }));
    } catch (error) {
      console.error('Google Ads campaigns fetch failed:', error);
      throw new Error('Failed to fetch Google Ads campaigns');
    }
  }

  async getInsights(
    tenantId: string,
    dateRange?: { start: string; end: string },
  ): Promise<GoogleAdsInsight[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Google Ads credentials not found');

    try {
      const customer = await this.getCustomer(credentials);
      const { start, end } = this.resolveDateRange(dateRange);

      const query = `
        SELECT 
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.ctr,
          metrics.average_cpc,
          metrics.conversions,
          metrics.conversion_value
        FROM campaign
        WHERE campaign.status != 'REMOVED'
          AND segments.date BETWEEN '${start}' AND '${end}'
        LIMIT 1000
      `;

      const rows = await customer.query(query);

      return rows.map((row: any) => ({
        date: {
          year: row.segments.date.slice(0, 4),
          month: row.segments.date.slice(5, 7),
          day: row.segments.date.slice(8, 10),
        },
        metrics: {
          impressions: Number(row.metrics.impressions || 0),
          clicks: Number(row.metrics.clicks || 0),
          costMicros: Number(row.metrics.cost_micros || 0),
          ctr: Number(row.metrics.ctr || 0),
          averageCpc: Number(row.metrics.average_cpc || 0),
          conversions: Number(row.metrics.conversions || 0),
          conversionValue: Number(row.metrics.conversion_value || 0),
        },
      }));
    } catch (error) {
      console.error('Google Ads insights fetch failed:', error);
      throw new Error('Failed to fetch Google Ads insights');
    }
  }

  async getCustomers(tenantId: string): Promise<any[]> {
    try {
      const credentials = await this.getCredentials(tenantId);
      if (!credentials) throw new Error('Google Ads credentials not found');

      const client = new GoogleAdsApi({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        developer_token: credentials.developerToken,
      });

      const response = await client.listAccessibleCustomers(credentials.refreshToken);
      const resourceNames = (response as any)?.resource_names || [];

      return (resourceNames as string[]).map((resourceName: string) => ({
        customerId: resourceName.split('/').pop(),
        resourceName,
      }));
    } catch (error) {
      console.error('Google Ads customers fetch failed:', error);
      throw new Error('Failed to fetch Google Ads customers');
    }
  }

  private resolveDateRange(dateRange?: { start: string; end: string }): {
    start: string;
    end: string;
  } {
    if (dateRange?.start && dateRange?.end) {
      return { start: dateRange.start, end: dateRange.end };
    }

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);

    const format = (date: Date) => date.toISOString().slice(0, 10);

    return { start: format(start), end: format(end) };
  }

  // OAuth flow helpers
  getAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const scopes = ['https://www.googleapis.com/auth/adwords'].join(' ');

    return (
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`
    );
  }

  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<any> {
    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

      const { tokens } = await oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Google Ads token exchange failed:', error);
      throw new Error('Failed to exchange Google Ads code for token');
    }
  }

  async refreshToken(tenantId: string): Promise<string> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('Google Ads credentials not found');

    try {
      const tempClient = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);

      tempClient.setCredentials({
        refresh_token: credentials.refreshToken,
      });

      const { credentials: newCreds } = await tempClient.refreshAccessToken();

      // Update credentials in database
      await prisma.integration.updateMany({
        where: { tenantId, provider: 'googleads' },
        data: {
          config: { ...credentials, refreshToken: newCreds.refresh_token },
        },
      });

      return newCreds.access_token || '';
    } catch (error) {
      console.error('Google Ads token refresh failed:', error);
      throw new Error('Failed to refresh Google Ads token');
    }
  }
}

export const googleAdsService = new GoogleAdsService();

// FLOW END: Google Ads Service API (EN)
// จุดสิ้นสุด: Service Google Ads (เรียก API) (TH)
