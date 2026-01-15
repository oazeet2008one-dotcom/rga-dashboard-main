import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';
import * as mockGa4 from '../services/mockGa4';
import * as mockFacebook from '../services/mockFacebook';
import * as mockTiktok from '../services/mockTiktok';
import * as mockLine from '../services/mockLine';
import * as mockShopee from '../services/mockShopee';

// FLOW START: Mock Controller (EN)
// จุดเริ่มต้น: Controller ของ Mock Data (TH)

export const generateMockData = async (req: TenantRequest, res: Response) => {
  const { providers, lookbackDays } = req.body as {
    providers?: string[];
    lookbackDays?: number;
  };
  const selectedProviders = providers || ['ga4', 'facebook'];
  const days = lookbackDays || 30;

  const results: any[] = [];

  // Ensure integration records exist for mock providers
  for (const provider of selectedProviders) {
    const existing = await prisma.integration.findFirst({
      where: { type: provider, tenantId: req.tenantId! },
    });
    if (!existing) {
      const created = await prisma.integration.create({
        data: {
          tenantId: req.tenantId!,
          type: provider,
          provider: provider,
          name: `${provider.toUpperCase()} Mock Integration`,
          credentials: { mock: true },
          config: { lookbackDays: days },
          status: 'active',
        },
      });
      results.push({ provider, action: 'created', integrationId: created.id });
    } else {
      // Update config in case lookbackDays changed
      await prisma.integration.update({
        where: { id: existing.id },
        data: { config: { lookbackDays: days } as any },
      });
      results.push({ provider, action: 'existing', integrationId: existing.id });
    }
  }

  // Run mock syncs
  for (const provider of selectedProviders) {
    const integration = await prisma.integration.findFirst({
      where: { type: provider, tenantId: req.tenantId! },
    });
    if (!integration) continue;

    let result: any;
    if (provider === 'ga4') {
      result = await mockGa4.sync({ ...integration, config: { lookbackDays: days } as any } as any);
    } else if (provider === 'facebook') {
      result = await mockFacebook.sync({ ...integration, config: { lookbackDays: days } as any } as any);
    } else if (provider === 'tiktok') {
      result = await mockTiktok.sync({ ...integration, config: { lookbackDays: days } as any } as any);
    } else if (provider === 'line') {
      result = await mockLine.sync({ ...integration, config: { lookbackDays: days } as any } as any);
    } else if (provider === 'shopee') {
      result = await mockShopee.sync({ ...integration, config: { lookbackDays: days } as any } as any);
    } else {
      result = { status: 'skipped', provider };
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    results.push({ provider, syncResult: result });
  }

  res.json({ message: 'Mock data generated', results });
};

export const getMockMetrics = async (req: TenantRequest, res: Response) => {
  const { startDate, endDate, platform } = req.query as any;
  const where: any = { tenantId: req.tenantId! };
  if (platform) where.platform = platform;
  if (startDate && endDate) {
    where.date = { gte: new Date(startDate), lte: new Date(endDate) };
  }

  const metrics = await prisma.metric.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      campaign: { select: { id: true, name: true, platform: true } },
    },
    take: 500,
  });

  res.json({ metrics });
};

export const getMockCampaigns = async (req: TenantRequest, res: Response) => {
  const { platform } = req.query as any;
  const where: any = { tenantId: req.tenantId! };
  if (platform) where.platform = platform;

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      metrics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });

  res.json({ campaigns });
};

// FLOW END: Mock Controller (EN)
// จุดสิ้นสุด: Controller ของ Mock Data (TH)
