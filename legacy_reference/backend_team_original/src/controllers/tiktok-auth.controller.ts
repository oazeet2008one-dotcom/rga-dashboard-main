import { Request, Response } from 'express';
import { tiktokAuthService } from '../services/tiktok-auth.service';
import { PrismaClient } from '@prisma/client';
import '../types/auth';

const prisma = new PrismaClient();

// FLOW START: TikTok Auth Controller (EN)
// จุดเริ่มต้น: Controller ของ TikTok Auth (TH)

export class TikTokAuthController {
  /**
   * GET /api/v1/auth/tiktok
   * Redirect to TikTok OAuth authorization page
   */
  async initiateTikTokAuth(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, returnUrl } = req.query;

      // Generate state parameter for security
      const state = JSON.stringify({
        tenantId: tenantId as string,
        returnUrl: (returnUrl as string) || '/dashboard',
        timestamp: Date.now(),
      });

      const authUrl = tiktokAuthService.getAuthUrl(Buffer.from(state).toString('base64'));

      res.redirect(authUrl);
    } catch (error) {
      console.error('TikTok auth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate TikTok authentication',
      });
    }
  }

  /**
   * GET /api/v1/auth/tiktok/callback
   * Handle TikTok OAuth callback
   */
  async handleTikTokCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error } = req.query;

      if (error) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=tiktok_auth_denied`);
        return;
      }

      if (!code) {
        res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
        return;
      }

      // Decode state parameter
      let stateData: any = {};
      if (state) {
        try {
          stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        } catch (e) {
          console.error('Invalid state parameter:', e);
        }
      }

      // Handle OAuth callback
      const result = await tiktokAuthService.handleCallback(
        code as string,
        state as string,
        stateData.tenantId,
      );

      // Set JWT token in cookie
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with success
      const returnUrl = stateData.returnUrl || '/dashboard';
      res.redirect(`${process.env.FRONTEND_URL}${returnUrl}?auth=success&provider=tiktok`);
    } catch (error) {
      console.error('TikTok callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=tiktok_auth_failed`);
    }
  }

  /**
   * POST /api/v1/auth/tiktok/token
   * Exchange TikTok authorization code for tokens (for frontend use)
   */
  async exchangeTikTokToken(req: Request, res: Response): Promise<void> {
    try {
      const { code, tenantId } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          message: 'Authorization code is required',
        });
        return;
      }

      const result = await tiktokAuthService.handleCallback(code, undefined, tenantId);

      res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
          tiktokUser: result.tiktokUser,
        },
      });
    } catch (error: any) {
      console.error('TikTok token exchange error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to authenticate with TikTok',
      });
    }
  }

  /**
   * POST /api/v1/auth/tiktok/refresh
   * Refresh TikTok access token
   */
  async refreshTikTokToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const newTokens = await tiktokAuthService.refreshToken(refreshToken);

      // Update stored tokens
      if (userId) {
        await tiktokAuthService['storeUserTokens'](userId, newTokens);
      }

      res.json({
        success: true,
        data: {
          accessToken: newTokens.access_token,
          expiresIn: newTokens.expires_in,
          refreshToken: newTokens.refresh_token,
        },
      });
    } catch (error: any) {
      console.error('TikTok token refresh error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to refresh TikTok token',
      });
    }
  }

  /**
   * DELETE /api/v1/auth/tiktok/revoke
   * Revoke TikTok access and remove integration
   */
  async revokeTikTokAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId;

      if (!userId || !tenantId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get TikTok integration
      const integration = await prisma.integration.findFirst({
        where: {
          tenantId,
          provider: 'tiktok',
        },
      });

      if (integration && integration.credentials) {
        const credentials = integration.credentials as any;

        // Revoke access with TikTok
        if (credentials.access_token) {
          try {
            await tiktokAuthService.revokeToken(credentials.access_token);
          } catch (error) {
            console.error('Error revoking TikTok access:', error);
          }
        }

        // Remove integration from database
        await prisma.integration.delete({
          where: { id: integration.id },
        });
      }

      res.json({
        success: true,
        message: 'TikTok access revoked successfully',
      });
    } catch (error: any) {
      console.error('TikTok access revocation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to revoke TikTok access',
      });
    }
  }

  /**
   * GET /api/v1/auth/tiktok/videos
   * Get user's TikTok videos
   */
  async getTikTokVideos(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { maxResults = 20 } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get TikTok integration
      const integration = await prisma.integration.findFirst({
        where: {
          tenantId,
          provider: 'tiktok',
          isActive: true,
        },
      });

      if (!integration || !integration.credentials) {
        res.status(404).json({
          success: false,
          message: 'TikTok integration not found or not active',
        });
        return;
      }

      const credentials = integration.credentials as any;
      const videos = await tiktokAuthService.getUserVideos(
        credentials.access_token,
        parseInt(maxResults as string),
      );

      res.json({
        success: true,
        data: videos,
      });
    } catch (error: any) {
      console.error('Get TikTok videos error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get TikTok videos',
      });
    }
  }

  /**
   * POST /api/v1/auth/tiktok/analytics
   * Get TikTok video analytics
   */
  async getTikTokAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { videoIds } = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!videoIds || !Array.isArray(videoIds)) {
        res.status(400).json({
          success: false,
          message: 'Video IDs array is required',
        });
        return;
      }

      // Get TikTok integration
      const integration = await prisma.integration.findFirst({
        where: {
          tenantId,
          provider: 'tiktok',
          isActive: true,
        },
      });

      if (!integration || !integration.credentials) {
        res.status(404).json({
          success: false,
          message: 'TikTok integration not found or not active',
        });
        return;
      }

      const credentials = integration.credentials as any;
      const analytics = await tiktokAuthService.getVideoAnalytics(
        credentials.access_token,
        videoIds,
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      console.error('Get TikTok analytics error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get TikTok analytics',
      });
    }
  }

  /**
   * POST /api/v1/auth/tiktok/upload
   * Upload video to TikTok
   */
  async uploadToTikTok(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { videoData } = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!videoData) {
        res.status(400).json({
          success: false,
          message: 'Video data is required',
        });
        return;
      }

      // Get TikTok integration
      const integration = await prisma.integration.findFirst({
        where: {
          tenantId,
          provider: 'tiktok',
          isActive: true,
        },
      });

      if (!integration || !integration.credentials) {
        res.status(404).json({
          success: false,
          message: 'TikTok integration not found or not active',
        });
        return;
      }

      const credentials = integration.credentials as any;
      const uploadResult = await tiktokAuthService.uploadVideo(credentials.access_token, videoData);

      res.json({
        success: true,
        data: uploadResult,
      });
    } catch (error: any) {
      console.error('TikTok upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload video to TikTok',
      });
    }
  }
}

export const tiktokAuthController = new TikTokAuthController();

// FLOW END: TikTok Auth Controller (EN)
// จุดสิ้นสุด: Controller ของ TikTok Auth (TH)
