import { Integration, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals = 2): Prisma.Decimal {
  const val = Math.random() * (max - min) + min;
  return new Prisma.Decimal(val.toFixed(decimals));
}

function parseJson<T = any>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    return typeof value === 'string' ? JSON.parse(value) : (value as T);
  } catch {
    return fallback;
  }
}

export async function sync(integration: Integration) {
  const config = parseJson<any>(integration.config, {});
  const lookbackDays = Number(config.lookbackDays || 30);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (lookbackDays - 1));

  // Commerce store as a single pseudo campaign
  const camp = await prisma.campaign.upsert({
    where: {
      tenantId_platform_externalId: {
        tenantId: integration.tenantId,
        platform: 'lazada',
        externalId: 'mock_lazada_store',
      },
    },
    update: {
      name: 'Lazada Store',
      status: 'active',
      objective: 'SALES',
      budget: randomDecimal(200, 4000),
      budgetType: 'lifetime',
    },
    create: {
      tenantId: integration.tenantId,
      integrationId: integration.id,
      externalId: 'mock_lazada_store',
      name: 'Lazada Store',
      platform: 'lazada',
      status: 'active',
      objective: 'SALES',
      budget: randomDecimal(200, 4000),
      budgetType: 'lifetime',
      currency: 'THB',
      startDate: start,
    },
  });

  let metricDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    day.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.metric.findFirst({
      where: {
        tenantId: integration.tenantId,
        campaignId: camp.id,
        date: day as any,
        hour: null,
        platform: 'lazada',
        source: 'lazada',
      },
      select: { id: true },
    });

    const orders = randomBetween(0, 35);
    const aov = randomDecimal(180, 950);
    const revenue = new Prisma.Decimal((Number(aov) * orders).toFixed(2));

    const payload = {
      impressions: randomBetween(1200, 10000),
      clicks: randomBetween(60, 1200),
      conversions: orders,
      orders,
      averageOrderValue: aov,
      spend: randomDecimal(20, 600),
      revenue,
      metadata: { mock: true },
    } as const;

    if (existing) {
      await prisma.metric.update({ where: { id: existing.id }, data: payload as any });
    } else {
      await prisma.metric.create({
        data: {
          tenantId: integration.tenantId,
          campaignId: camp.id,
          date: day as any,
          hour: null,
          platform: 'lazada',
          source: 'lazada',
          ...payload,
        } as any,
      });
    }

    metricDays += 1;
  }

  return {
    status: 'ok',
    provider: 'lazada',
    integrationId: integration.id,
    mock: true,
    campaigns: 1,
    metricDays,
    days: lookbackDays,
  };
}
