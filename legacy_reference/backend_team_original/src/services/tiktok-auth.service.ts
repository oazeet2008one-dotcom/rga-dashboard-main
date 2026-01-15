import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// FLOW START: TikTok Auth Service (EN)
// จุดเริ่มต้น: Service ของ TikTok Auth (TH)

const prisma = new PrismaClient();

export interface TikTokUserInfo {
  open_id: string;
  union_id: string;
  avatar_url: string;
  avatar_url_100: string;
  avatar_large_url: string;
  display_name: string;
  bio_description: string;
  profile_deep_link: string;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

export class TikTokAuthService {
  private clientKey: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string = 'https://www.tiktok.com';
  private apiBaseUrl: string = 'https://open.tiktokapis.com';

  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
    this.redirectUri =
      process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3001/api/v1/auth/tiktok/callback';
  }

  /**
   * Generate TikTok OAuth URL for authorization
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
      'video.upload',
    ];

    const params = new URLSearchParams({
      client_key: this.clientKey,
      scope: scopes.join(','),
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state: state || this.generateState(),
    });

    return `${this.baseUrl}/v2/auth/authorize/?${params.toString()}`;
  }

  /**
   * Generate secure state parameter
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<TikTokTokenResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/auth/token/`,
        {
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache',
          },
        },
      );

      if (response.data.error) {
        throw new Error(`TikTok OAuth error: ${response.data.error_description}`);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error getting TikTok access token:', error);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  /**
   * Get user info from TikTok
   */
  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/v2/user/info/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: {
          fields:
            'open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count',
        },
      });

      if (response.data.error) {
        throw new Error(`TikTok API error: ${response.data.error.message}`);
      }

      return response.data.data.user;
    } catch (error: any) {
      console.error('Error getting TikTok user info:', error);
      throw new Error('Failed to get user information from TikTok');
    }
  }

  /**
   * Refresh TikTok access token
   */
  async refreshToken(refreshToken: string): Promise<TikTokTokenResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/auth/token/`,
        {
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (response.data.error) {
        throw new Error(`TikTok refresh token error: ${response.data.error_description}`);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error refreshing TikTok token:', error);
      throw new Error('Failed to refresh TikTok access token');
    }
  }

  /**
   * Revoke TikTok access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/v2/auth/revoke/`,
        {
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          token: accessToken,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
    } catch (error: any) {
      console.error('Error revoking TikTok token:', error);
      throw new Error('Failed to revoke TikTok access token');
    }
  }

  /**
   * Handle TikTok OAuth callback and create/login user
   */
  async handleCallback(code: string, _state?: string, tenantId?: string) {
    try {
      // Get access token from TikTok
      const tokenData = await this.getAccessToken(code);

      // Get user info
      const tiktokUser = await this.getUserInfo(tokenData.access_token);

      // Create email from open_id (TikTok doesn't provide email)
      const email = `${tiktokUser.open_id}@tiktok.oauth`;

      // Find or create user
      let user = await prisma.user.findFirst({
        where: {
          email: email,
          ...(tenantId && { tenantId }),
        },
      });

      if (!user && tenantId) {
        // Create new user if doesn't exist
        user = await prisma.user.create({
          data: {
            tenantId,
            email: email,
            firstName: tiktokUser.display_name || 'TikTok User',
            lastName: '',
            avatarUrl: tiktokUser.avatar_url,
            emailVerified: true,
            passwordHash: '', // No password for OAuth users
            role: 'manager',
          },
        });
      } else if (!user) {
        throw new Error('User not found. Please register first or provide tenant ID.');
      }

      // Store/update TikTok tokens
      await this.storeUserTokens(user.id, {
        ...tokenData,
        user_info: tiktokUser,
      });

      // Generate JWT token
      const jwtToken = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' },
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          tenantId: user.tenantId,
        },
        token: jwtToken,
        tiktokTokens: tokenData,
        tiktokUser: tiktokUser,
      };
    } catch (error) {
      console.error('TikTok OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Store TikTok tokens for user
   */
  private async storeUserTokens(userId: string, tokens: any) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      // Find existing integration
      const existingIntegration = await prisma.integration.findFirst({
        where: {
          tenantId: user.tenantId,
          provider: 'tiktok',
        },
      });

      if (existingIntegration) {
        // Update existing integration
        await prisma.integration.update({
          where: { id: existingIntegration.id },
          data: {
            credentials: tokens,
            isActive: true,
            lastSyncAt: new Date(),
          },
        });
      } else {
        // Create new integration
        await prisma.integration.create({
          data: {
            tenantId: user.tenantId,
            type: 'oauth',
            provider: 'tiktok',
            name: 'TikTok OAuth',
            credentials: tokens,
            config: {
              scopes: [
                'user.info.basic',
                'user.info.profile',
                'user.info.stats',
                'video.list',
                'video.upload',
              ],
            },
            status: 'active',
            isActive: true,
            syncFrequencyMinutes: 60,
          },
        });
      }
    } catch (error) {
      console.error('Error storing TikTok tokens:', error);
    }
  }

  /**
   * Get user's videos from TikTok
   */
  async getUserVideos(accessToken: string, maxResults: number = 20): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/v2/video/list/`,
        {
          max_count: maxResults,
          cursor: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error) {
        throw new Error(`TikTok API error: ${response.data.error.message}`);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error getting TikTok videos:', error);
      throw new Error('Failed to get TikTok videos');
    }
  }

  /**
   * Get video analytics from TikTok
   */
  async getVideoAnalytics(accessToken: string, videoIds: string[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/v2/video/insights/`,
        {
          video_ids: videoIds,
          fields: ['like_count', 'comment_count', 'share_count', 'view_count'],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error) {
        throw new Error(`TikTok API error: ${response.data.error.message}`);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error getting TikTok video analytics:', error);
      throw new Error('Failed to get TikTok video analytics');
    }
  }

  /**
   * Upload video to TikTok
   */
  async uploadVideo(
    accessToken: string,
    videoData: {
      video_url: string;
      post_info: {
        title: string;
        description?: string;
        privacy_level: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
        disable_duet?: boolean;
        disable_comment?: boolean;
        disable_stitch?: boolean;
        video_cover_timestamp_ms?: number;
      };
      source_info: {
        source: string;
        video_url: string;
      };
    },
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/v2/post/publish/video/init/`,
        videoData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.error) {
        throw new Error(`TikTok API error: ${response.data.error.message}`);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error uploading video to TikTok:', error);
      throw new Error('Failed to upload video to TikTok');
    }
  }
}

export const tiktokAuthService = new TikTokAuthService();

// FLOW END: TikTok Auth Service (EN)
// จุดสิ้นสุด: Service ของ TikTok Auth (TH)
