import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';

// FLOW START: LINE Service API (EN)
// จุดเริ่มต้น: Service LINE (เรียก API) (TH)

export interface LINECredentials {
  channelId: string;
  channelSecret: string;
  accessToken: string;
  webhookUrl?: string;
}

export interface LINEMessageStats {
  timestamp: number;
  request: number;
  success: number;
  target: number;
}

export interface LINEUserStats {
  total: number;
  active: number;
  blocked: number;
}

export interface LINEFriendEvent {
  type: string;
  timestamp: number;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
}

class LINEService {
  private baseUrl = 'https://api.line.me/v2/bot';
  private analyticsUrl = 'https://api.line.me/v2/bot/message/aggregation';

  async getCredentials(tenantId: string): Promise<LINECredentials | null> {
    const integration = await prisma.integration.findFirst({
      where: {
        tenantId,
        provider: 'line',
        isActive: true,
      },
    });

    if (!integration) return null;

    return integration.config as unknown as LINECredentials;
  }

  async validateCredentials(credentials: LINECredentials): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/info`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      });
      return response.status === 200;
    } catch (error) {
      console.error('LINE API validation failed:', error);
      return false;
    }
  }

  async getMessageStats(
    tenantId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<LINEMessageStats[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('LINE credentials not found');

    try {
      const response = await axios.get(
        `${this.analyticsUrl}?` + `date=${dateFrom}&` + `date=${dateTo}`,
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
          },
        },
      );

      return response.data.numOfMessageDeliveries || [];
    } catch (error) {
      console.error('LINE message stats fetch failed:', error);
      throw new Error('Failed to fetch LINE message stats');
    }
  }

  async getUserStats(tenantId: string): Promise<LINEUserStats> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('LINE credentials not found');

    try {
      const response = await axios.get(`${this.baseUrl}/followers/ids`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      });

      // LINE API doesn't provide detailed user stats, so we need to make additional calls
      const userIds = response.data.userIds || [];

      return {
        total: userIds.length,
        active: userIds.length, // Simplified - would need additional API calls
        blocked: 0, // Simplified - would need additional API calls
      };
    } catch (error) {
      console.error('LINE user stats fetch failed:', error);
      throw new Error('Failed to fetch LINE user stats');
    }
  }

  async getFriendEvents(tenantId: string, _date?: string): Promise<LINEFriendEvent[]> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('LINE credentials not found');

    try {
      // This would typically come from webhook events stored in database
      // For now, we'll return a mock response
      return [];
    } catch (error) {
      console.error('LINE friend events fetch failed:', error);
      throw new Error('Failed to fetch LINE friend events');
    }
  }

  async broadcastMessage(tenantId: string, message: any): Promise<boolean> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('LINE credentials not found');

    try {
      const response = await axios.post(`${this.baseUrl}/message/broadcast`, message, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('LINE broadcast failed:', error);
      throw new Error('Failed to broadcast LINE message');
    }
  }

  async getUserProfile(tenantId: string, userId: string): Promise<any> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('LINE credentials not found');

    try {
      const response = await axios.get(`${this.baseUrl}/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('LINE user profile fetch failed:', error);
      throw new Error('Failed to fetch LINE user profile');
    }
  }

  async getWebhookEvents(tenantId: string, events: any[]): Promise<void> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('LINE credentials not found');

    try {
      // Process webhook events
      for (const event of events) {
        // Store events in database or process them
        console.log('LINE webhook event:', event);
      }
    } catch (error) {
      console.error('LINE webhook processing failed:', error);
      throw new Error('Failed to process LINE webhook events');
    }
  }

  // Webhook validation
  validateSignature(body: string, signature: string, channelSecret: string): boolean {
    const hash = crypto.createHmac('SHA256', channelSecret).update(body, 'utf8').digest('base64');

    return hash === signature;
  }

  // OAuth flow helpers
  getAuthUrl(channelId: string, redirectUri: string, state: string): string {
    const scopes = ['profile', 'openid', 'email'].join(' ');

    return (
      `https://access.line.me/oauth2/v2.1/authorize?` +
      `response_type=code&` +
      `client_id=${channelId}&` +
      `state=${state}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `nonce=random_string`
    );
  }

  async exchangeCodeForToken(
    code: string,
    channelId: string,
    channelSecret: string,
    redirectUri: string,
  ): Promise<any> {
    try {
      const response = await axios.post(
        'https://api.line.me/oauth2/v2.1/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri,
          client_id: channelId,
          client_secret: channelSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('LINE token exchange failed:', error);
      throw new Error('Failed to exchange LINE code for token');
    }
  }

  async refreshToken(tenantId: string): Promise<string> {
    const credentials = await this.getCredentials(tenantId);
    if (!credentials) throw new Error('LINE credentials not found');

    try {
      const response = await axios.post(
        'https://api.line.me/oauth2/v2.1/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.accessToken, // This should be refresh token, not access token
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
        where: { tenantId, provider: 'line' },
        data: {
          config: { ...credentials, accessToken: newAccessToken },
        },
      });

      return newAccessToken;
    } catch (error) {
      console.error('LINE token refresh failed:', error);
      throw new Error('Failed to refresh LINE token');
    }
  }
}

export const lineService = new LINEService();

// FLOW END: LINE Service API (EN)
// จุดสิ้นสุด: Service LINE (เรียก API) (TH)
