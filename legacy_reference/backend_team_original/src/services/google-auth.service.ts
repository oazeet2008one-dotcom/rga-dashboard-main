import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// FLOW START: Google Auth Service (EN)
// จุดเริ่มต้น: Service ของ Google Auth (TH)

const prisma = new PrismaClient();

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/v1/auth/google/callback',
    );
  }

  /**
   * Generate Google OAuth URL for authorization
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Get user info from Google
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return data as GoogleUserInfo;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user information from Google');
    }
  }

  /**
   * Handle Google OAuth callback and create/login user
   */
  async handleCallback(code: string, _state?: string, tenantId?: string) {
    try {
      // Get tokens from Google
      const tokens = await this.getTokens(code);

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      // Get user info
      const googleUser = await this.getUserInfo(tokens.access_token);

      if (!googleUser.verified_email) {
        throw new Error('Google account email is not verified');
      }

      // Find or create user
      let user = await prisma.user.findFirst({
        where: {
          email: googleUser.email,
          ...(tenantId && { tenantId }),
        },
      });

      if (!user && tenantId) {
        // Create new user if doesn't exist
        user = await prisma.user.create({
          data: {
            tenantId,
            email: googleUser.email,
            firstName: googleUser.given_name || googleUser.name,
            lastName: googleUser.family_name || '',
            avatarUrl: googleUser.picture,
            emailVerified: true,
            passwordHash: '', // No password for OAuth users
            role: 'manager',
          },
        });
      } else if (!user) {
        throw new Error('User not found. Please register first or provide tenant ID.');
      }

      // Store/update Google tokens
      await this.storeUserTokens(user.id, tokens);

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
        googleTokens: tokens,
      };
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Store Google tokens for user
   */
  private async storeUserTokens(userId: string, tokens: any) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      // Find existing integration
      const existingIntegration = await prisma.integration.findFirst({
        where: {
          tenantId: user.tenantId,
          provider: 'google',
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
            provider: 'google',
            name: 'Google OAuth',
            credentials: tokens,
            config: {
              scopes: ['userinfo.email', 'userinfo.profile', 'calendar.readonly', 'drive.readonly'],
            },
            status: 'active',
            isActive: true,
            syncFrequencyMinutes: 60,
          },
        });
      }
    } catch (error) {
      console.error('Error storing Google tokens:', error);
    }
  }

  /**
   * Refresh Google access token
   */
  async refreshToken(refreshToken: string) {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  /**
   * Revoke Google access
   */
  async revokeAccess(accessToken: string) {
    try {
      await this.oauth2Client.revokeToken(accessToken);
    } catch (error) {
      console.error('Error revoking access:', error);
      throw new Error('Failed to revoke Google access');
    }
  }

  /**
   * Get Google Calendar events
   */
  async getCalendarEvents(accessToken: string, maxResults: number = 10) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error getting calendar events:', error);
      throw new Error('Failed to get Google Calendar events');
    }
  }

  /**
   * Get Google Drive files
   */
  async getDriveFiles(accessToken: string, maxResults: number = 10) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });

      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      const response = await drive.files.list({
        pageSize: maxResults,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink)',
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error getting drive files:', error);
      throw new Error('Failed to get Google Drive files');
    }
  }
}

export const googleAuthService = new GoogleAuthService();

// FLOW END: Google Auth Service (EN)
// จุดสิ้นสุด: Service ของ Google Auth (TH)
