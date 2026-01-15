import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { TenantRequest } from '../middleware/tenant.middleware';
import { integrationService } from '../services/integration.service';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';

// FLOW START: OAuth Controller (EN)
// จุดเริ่มต้น: Controller ของ OAuth (TH)

export const startOAuth = async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { redirectUri } = req.body;

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        tenantId: req.tenantId!,
      },
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    const state = `${integration.id}_${Date.now()}`;
    const authUrl = await integrationService.getOAuthUrl(
      integration.provider,
      integration.config,
      redirectUri || `${process.env.FRONTEND_URL || 'http://localhost:3001'}/integrations/callback`,
      state,
    );

    // Store state in database for verification
    await prisma.oAuthState.create({
      data: {
        integrationId: integration.id,
        state,
        redirectUri:
          redirectUri ||
          `${process.env.FRONTEND_URL || 'http://localhost:3001'}/integrations/callback`,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    res.json({ authorizeUrl: authUrl, state, provider: integration.provider });
  } catch (error) {
    console.error('Start OAuth error:', error);
    res.status(500).json({ message: 'Failed to start OAuth flow' });
  }
};

export const handleCallback = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id: _id } = req.params;
    const { code, state, error } = req.query;

    if (error) {
      res.status(400).json({
        message: 'OAuth authorization failed',
        error: error as string,
      });
      return;
    }

    if (!code || !state) {
      res.status(400).json({
        message: 'Missing required OAuth parameters',
      });
      return;
    }

    // Verify state
    const oauthState = await prisma.oAuthState.findFirst({
      where: {
        state: state as string,
        expiresAt: { gt: new Date() },
      },
    });

    if (!oauthState) {
      res.status(400).json({
        message: 'Invalid or expired OAuth state',
      });
      return;
    }

    if (!oauthState.integrationId) {
      res.status(400).json({ message: 'Invalid OAuth state' });
      return;
    }

    const integration = await prisma.integration.findFirst({
      where: {
        id: oauthState.integrationId,
        tenantId: req.tenantId!,
      },
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    // Exchange code for tokens
    const tokens = await integrationService.exchangeCodeForToken(
      integration.provider,
      code as string,
      integration.config,
      oauthState.redirectUri,
    );

    // Update integration with new credentials
    const existingConfig =
      integration.config &&
      typeof integration.config === 'object' &&
      !Array.isArray(integration.config)
        ? (integration.config as Record<string, unknown>)
        : {};
    const tokenObject =
      tokens && typeof tokens === 'object' && !Array.isArray(tokens)
        ? (tokens as Record<string, unknown>)
        : {};
    const updatedConfig = { ...existingConfig, ...tokenObject } as Prisma.InputJsonValue;

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        config: updatedConfig,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    // Clean up OAuth state
    await prisma.oAuthState.delete({
      where: { id: oauthState.id },
    });

    // Redirect back to frontend with success
    const redirectUrl = `${oauthState.redirectUri}?success=true&platform=${integration.provider}`;
    res.redirect(redirectUrl);
    return;
  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/integrations/callback?success=false&error=authentication_failed`;
    res.redirect(errorUrl);
    return;
  }
};

export const refreshToken = async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        tenantId: req.tenantId!,
      },
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    const newAccessToken = await integrationService.refreshToken(
      integration.provider,
      req.tenantId!,
    );

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      provider: integration.provider,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
};

export const revokeAccess = async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.updateMany({
      where: {
        id,
        tenantId: req.tenantId!,
      },
      data: {
        isActive: false,
        config: {},
      },
    });

    if (integration.count === 0) {
      throw new AppError('Integration not found', 404);
    }

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Revoke access error:', error);
    res.status(500).json({ message: 'Failed to revoke access' });
  }
};

export const getOAuthStatus = async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: {
        id,
        tenantId: req.tenantId!,
      },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!integration) {
      throw new AppError('Integration not found', 404);
    }

    // Check if credentials are valid
    let isValid = false;
    if (integration.isActive) {
      try {
        const credentials = await prisma.integration.findFirst({
          where: { id: integration.id },
          select: { config: true },
        });

        if (credentials?.config) {
          isValid = await integrationService.validatePlatformCredentials(
            integration.provider,
            credentials.config,
          );
        }
      } catch (error) {
        isValid = false;
      }
    }

    res.json({
      ...integration,
      isAuthorized: isValid,
      needsReauth: integration.isActive && !isValid,
    });
  } catch (error) {
    console.error('Get OAuth status error:', error);
    res.status(500).json({ message: 'Failed to get OAuth status' });
  }
};

// FLOW END: OAuth Controller (EN)
// จุดสิ้นสุด: Controller ของ OAuth (TH)
