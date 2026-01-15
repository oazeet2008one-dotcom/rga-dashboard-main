import { Request, Response } from 'express';
import { googleAuthService } from '../services/google-auth.service';
import { PrismaClient } from '@prisma/client';
import '../types/auth';

const prisma = new PrismaClient();

// FLOW START: Google Auth Controller (EN)
// จุดเริ่มต้น: Controller ของ Google Auth (TH)

export class GoogleAuthController {
  /**
   * GET /api/v1/auth/google
   * Redirect to Google OAuth authorization page
   */
  async initiateGoogleAuth(req: Request, res: Response) {
    try {
      const { tenantId, returnUrl } = req.query;

      // Generate state parameter for security
      const state = JSON.stringify({
        tenantId: tenantId as string,
        returnUrl: (returnUrl as string) || '/dashboard',
        timestamp: Date.now(),
      });

      const authUrl = googleAuthService.getAuthUrl(Buffer.from(state).toString('base64'));

      res.redirect(authUrl);
    } catch (error) {
      console.error('Google auth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google authentication',
      });
    }
  }

  /**
   * GET /api/v1/auth/google/callback
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_denied`);
      }

      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_code`);
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
      const result = await googleAuthService.handleCallback(
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
      res.redirect(`${process.env.FRONTEND_URL}${returnUrl}?auth=success`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=google_auth_failed`);
    }
  }

  /**
   * POST /api/v1/auth/google/token
   * Exchange Google authorization code for tokens (for frontend use)
   */
  async exchangeGoogleToken(req: Request, res: Response): Promise<void> {
    try {
      const { code, tenantId } = req.body;

      if (!code) {
        res.status(400).json({
          success: false,
          message: 'Authorization code is required',
        });
        return;
      }

      const result = await googleAuthService.handleCallback(code, undefined, tenantId);

      res.json({
        success: true,
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error: any) {
      console.error('Google token exchange error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to authenticate with Google',
      });
    }
  }

  /**
   * POST /api/v1/auth/google/refresh
   * Refresh Google access token
   */
  async refreshGoogleToken(req: Request, res: Response): Promise<void> {
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

      const newTokens = await googleAuthService.refreshToken(refreshToken);

      // Update stored tokens
      if (userId) {
        await googleAuthService['storeUserTokens'](userId, newTokens);
      }

      res.json({
        success: true,
        data: {
          accessToken: newTokens.access_token,
          expiresIn: newTokens.expiry_date,
        },
      });
    } catch (error: any) {
      console.error('Google token refresh error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to refresh Google token',
      });
    }
  }

  /**
   * DELETE /api/v1/auth/google/revoke
   * Revoke Google access and remove integration
   */
  async revokeGoogleAccess(req: Request, res: Response): Promise<void> {
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

      // Get Google integration
      const integration = await prisma.integration.findFirst({
        where: {
          tenantId,
          provider: 'google',
        },
      });

      if (integration && integration.credentials) {
        const credentials = integration.credentials as any;

        // Revoke access with Google
        if (credentials.access_token) {
          try {
            await googleAuthService.revokeAccess(credentials.access_token);
          } catch (error) {
            console.error('Error revoking Google access:', error);
          }
        }

        // Remove integration from database
        await prisma.integration.delete({
          where: { id: integration.id },
        });
      }

      res.json({
        success: true,
        message: 'Google access revoked successfully',
      });
    } catch (error: any) {
      console.error('Google access revocation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to revoke Google access',
      });
    }
  }

  /**
   * GET /api/v1/auth/google/calendar
   * Get Google Calendar events
   */
  async getCalendarEvents(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { maxResults = 10 } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get Google integration
      const integration = await prisma.integration.findFirst({
        where: {
          tenantId,
          provider: 'google',
          isActive: true,
        },
      });

      if (!integration || !integration.credentials) {
        res.status(404).json({
          success: false,
          message: 'Google integration not found or not active',
        });
        return;
      }

      const credentials = integration.credentials as any;
      const events = await googleAuthService.getCalendarEvents(
        credentials.access_token,
        parseInt(maxResults as string),
      );

      res.json({
        success: true,
        data: events,
      });
    } catch (error: any) {
      console.error('Get calendar events error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get calendar events',
      });
    }
  }

  /**
   * GET /api/v1/auth/google/drive
   * Get Google Drive files
   */
  async getDriveFiles(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId;
      const { maxResults = 10 } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      // Get Google integration
      const integration = await prisma.integration.findFirst({
        where: {
          tenantId,
          provider: 'google',
          isActive: true,
        },
      });

      if (!integration || !integration.credentials) {
        res.status(404).json({
          success: false,
          message: 'Google integration not found or not active',
        });
        return;
      }

      const credentials = integration.credentials as any;
      const files = await googleAuthService.getDriveFiles(
        credentials.access_token,
        parseInt(maxResults as string),
      );

      res.json({
        success: true,
        data: files,
      });
    } catch (error: any) {
      console.error('Get drive files error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get drive files',
      });
    }
  }
}

export const googleAuthController = new GoogleAuthController();

// FLOW END: Google Auth Controller (EN)
// จุดสิ้นสุด: Controller ของ Google Auth (TH)
