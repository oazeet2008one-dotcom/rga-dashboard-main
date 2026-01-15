import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';
import { validationResult } from 'express-validator';
import { facebookService } from '../services/facebook.service';
import { googleAdsService } from '../services/googleads.service';
import { lineService } from '../services/line.service';
import { tiktokService } from '../services/tiktok.service';
import { shopeeService } from '../services/shopee.service';
import { normalizeProviderKey, syncIntegrationWithFallback } from '../services/syncRegistry';

// FLOW START: Integrations Controller (EN)
// จุดเริ่มต้น: Controller ของ Integrations (TH)

const storeSyncHistory = async (params: {
  tenantId: string;
  integrationId: string;
  platform: string;
  status: 'success' | 'error';
  data?: any;
  error?: string;
}) => {
  const { tenantId, integrationId, platform, status, data, error } = params;
  await prisma.syncHistory.create({
    data: {
      tenantId,
      integrationId,
      platform,
      status,
      data: data ?? undefined,
      error,
      syncedAt: new Date(),
    },
  });
};

export const getSyncHistory = async (req: TenantRequest, res: Response) => {
  try {
    const { platform, status, limit, offset } = req.query as any;
    const take = Math.max(1, Math.min(200, Number(limit ?? 50)));
    const skip = Math.max(0, Number(offset ?? 0));

    const where: any = {
      tenantId: req.tenantId!,
    };
    if (platform) where.platform = String(platform);
    if (status) where.status = String(status);

    const [total, histories] = await Promise.all([
      prisma.syncHistory.count({ where }),
      prisma.syncHistory.findMany({
        where,
        orderBy: { syncedAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          tenantId: true,
          integrationId: true,
          platform: true,
          status: true,
          data: true,
          error: true,
          syncedAt: true,
        },
      }),
    ]);

    return res.json({ histories, total });
  } catch (error) {
    console.error('Get sync history error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIntegrations = async (req: TenantRequest, res: Response) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { tenantId: req.tenantId! },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        // Don't expose credentials
      },
    });

    res.json({ integrations });
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIntegrationNotifications = async (req: TenantRequest, res: Response) => {
  try {
    const { status } = req.query;

    const notifications = await prisma.integrationNotification.findMany({
      where: {
        tenantId: req.tenantId!,
        ...(status ? { status: status as string } : {}),
      },
      include: {
        integration: {
          select: {
            id: true,
            name: true,
            provider: true,
            lastSyncAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Get integration notifications error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIntegrationById = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: { id, tenantId: req.tenantId! },
      select: {
        id: true,
        provider: true,
        name: true,
        isActive: true,
        config: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    if (!integration) {
      res.status(404).json({ message: 'Integration not found' });
      return;
    }

    res.json({ integration });
    return;
  } catch (error) {
    console.error('Get integration by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};

export const createIntegration = async (req: TenantRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { provider: providerRaw, type, name } = req.body;
    const config = req.body?.config ?? {};
    const credentials = req.body?.credentials ?? req.body?.config ?? {};
    const provider = (providerRaw || type) as string;
    const integrationType = (type || provider) as string;

    // Check if integration already exists
    const existingIntegration = await prisma.integration.findFirst({
      where: { tenantId: req.tenantId!, provider },
    });

    if (existingIntegration) {
      res.status(400).json({ message: 'Integration for this provider already exists' });
      return;
    }

    // Validate credentials based on provider
    let isValid = false;
    switch (provider) {
      case 'facebook':
        isValid = await facebookService.validateCredentials(credentials);
        break;
      case 'googleads':
        isValid = await googleAdsService.validateCredentials(credentials);
        break;
      case 'line':
        isValid = await lineService.validateCredentials(credentials);
        break;
      case 'tiktok':
        isValid = await tiktokService.validateCredentials(credentials);
        break;
      case 'shopee':
        isValid = await shopeeService.validateCredentials(credentials);
        break;
      default:
        res.status(400).json({ message: 'Invalid provider' });
        return;
    }

    if (!isValid) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const integration = await prisma.integration.create({
      data: {
        tenantId: req.tenantId!,
        provider,
        type: integrationType,
        credentials,
        config,
        name: name || `${provider} Integration`,
        isActive: true,
      },
    });

    res.status(201).json({ integration });
    return;
  } catch (error) {
    console.error('Create integration error:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
};

export const updateIntegration = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  const integration = await prisma.integration.updateMany({
    where: { id, tenantId: req.tenantId! },
    data: req.body,
  });

  res.json({ integration });
};

export const deleteIntegration = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;

  await prisma.integration.deleteMany({
    where: { id, tenantId: req.tenantId! },
  });

  res.json({ message: 'Integration deleted successfully' });
};

export const syncIntegration = async (req: TenantRequest, res: Response) => {
  try {
    const { id } = req.params;
    const integration = await prisma.integration.findFirst({
      where: { id, tenantId: req.tenantId! },
    });

    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    if (!integration.isActive) {
      return res.status(400).json({ message: 'Integration is not active' });
    }

    const startedAt = Date.now();
    const { provider, mode, result } = await syncIntegrationWithFallback(integration);
    const durationMs = Date.now() - startedAt;

    const ok = (result as any)?.status !== 'error';
    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        status: ok ? 'active' : 'error',
      },
    });

    await storeSyncHistory({
      tenantId: req.tenantId!,
      integrationId: integration.id,
      platform: provider,
      status: ok ? 'success' : 'error',
      data: { result, durationMs, mode, trigger: 'manual' },
      error: ok ? undefined : (result as any)?.message || (result as any)?.error,
    });

    return res.json({
      message: 'Sync completed',
      provider,
      integrationId: integration.id,
      mode,
      durationMs,
      result,
    });
  } catch (error: any) {
    console.error('Sync integration error:', error);

    try {
      await storeSyncHistory({
        tenantId: req.tenantId!,
        integrationId: req.params.id,
        platform: normalizeProviderKey('unknown'),
        status: 'error',
        data: undefined,
        error: error.message,
      });
    } catch {
      // ignore
    }

    return res.status(500).json({
      message: 'Sync failed',
      error: error.message,
    });
  }
};

export const syncAllIntegrations = async (req: TenantRequest, res: Response) => {
  try {
    const providersRaw = Array.isArray((req.body as any)?.providers) ? ((req.body as any).providers as any[]) : null;
    const providers = providersRaw
      ? providersRaw
          .map((p) => normalizeProviderKey(String(p)))
          .filter((p) => Boolean(p))
      : null;

    const allIntegrations = await prisma.integration.findMany({
      where: {
        tenantId: req.tenantId!,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const integrations = providers?.length
      ? allIntegrations.filter((i) => providers.includes(normalizeProviderKey(i.provider)))
      : allIntegrations;

    const results: Array<{
      integrationId: string;
      provider: string;
      ok: boolean;
      result?: any;
      error?: string;
    }> = [];

    for (const integration of integrations) {
      const providerKey = normalizeProviderKey(integration.provider);
      const startedAt = Date.now();
      try {
        const { provider, mode, result } = await syncIntegrationWithFallback(integration);
        const durationMs = Date.now() - startedAt;
        const ok = (result as any)?.status !== 'error';

        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            lastSyncAt: new Date(),
            status: ok ? 'active' : 'error',
          },
        });

        await storeSyncHistory({
          tenantId: req.tenantId!,
          integrationId: integration.id,
          platform: provider,
          status: ok ? 'success' : 'error',
          data: { result, durationMs, mode, trigger: 'manual_bulk' },
          error: ok ? undefined : (result as any)?.message || (result as any)?.error,
        });

        results.push({ integrationId: integration.id, provider, ok, result });
      } catch (e: any) {
        const durationMs = Date.now() - startedAt;
        await prisma.integration.update({
          where: { id: integration.id },
          data: { status: 'error', lastSyncAt: new Date() },
        });

        await storeSyncHistory({
          tenantId: req.tenantId!,
          integrationId: integration.id,
          platform: providerKey,
          status: 'error',
          data: { durationMs, trigger: 'manual_bulk' },
          error: e?.message || 'Unknown error',
        });

        results.push({
          integrationId: integration.id,
          provider: providerKey,
          ok: false,
          error: e?.message || 'Unknown error',
        });
      }
    }

    return res.json({
      message: 'Sync all completed',
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Sync all integrations error:', error);
    return res.status(500).json({
      message: 'Sync all failed',
      error: error.message,
    });
  }
};

export const testIntegration = async (req: TenantRequest, res: Response) => {
  const { id } = req.params;
  const integration = await prisma.integration.findFirst({
    where: { id, tenantId: req.tenantId! },
  });
  if (!integration) return res.status(404).json({ message: 'Integration not found' });

  // Simulated test per provider
  return res.json({
    message: 'Integration is configured',
    provider: integration.provider,
    integrationId: id,
  });
};

// FLOW END: Integrations Controller (EN)
// จุดสิ้นสุด: Controller ของ Integrations (TH)
