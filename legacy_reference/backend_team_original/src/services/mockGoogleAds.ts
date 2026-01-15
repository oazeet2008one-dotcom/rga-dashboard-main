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

  const numCampaigns = randomBetween(3, 8);
  const campaigns: any[] = [];

  for (let i = 0; i < numCampaigns; i++) {
    const camp = await prisma.campaign.upsert({
      where: {
        tenantId_platform_externalId: {
          tenantId: integration.tenantId,
          platform: 'google',
          externalId: `mock_gg_${i + 1}`,
        },
      },
      update: {
        name: `Google Ads Campaign #${i + 1}`,
        status: 'active',
        objective: ['SALES', 'LEADS', 'TRAFFIC'][i % 3],
        budget: randomDecimal(100, 2500),
        budgetType: 'daily',
      },
      create: {
        tenantId: integration.tenantId,
        integrationId: integration.id,
        externalId: `mock_gg_${i + 1}`,
        name: `Google Ads Campaign #${i + 1}`,
        platform: 'google',
        status: 'active',
        objective: ['SALES', 'LEADS', 'TRAFFIC'][i % 3],
        budget: randomDecimal(100, 2500),
        budgetType: 'daily',
        currency: 'THB',
        startDate: start,
      },
    });
    campaigns.push(camp);
  }

  let metricDays = 0;
  for (const camp of campaigns) {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = new Date(d);
      day.setUTCHours(0, 0, 0, 0);

      const existing = await prisma.metric.findFirst({
        where: {
          tenantId: integration.tenantId,
          campaignId: camp.id,
          date: day as any,
          hour: null,
          platform: 'google',
          source: 'google_ads',
        },
        select: { id: true },
      });

      const payload = {
        impressions: randomBetween(8000, 90000),
        clicks: randomBetween(200, 4000),
        conversions: randomBetween(0, 80),
        spend: randomDecimal(100, 1800),
        revenue: randomDecimal(0, 6000),
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
            platform: 'google',
            source: 'google_ads',
            ...payload,
          } as any,
        });
      }

      metricDays += 1;
    }
  }

  return {
    status: 'ok',
    provider: 'google_ads',
    integrationId: integration.id,
    mock: true,
    campaigns: campaigns.length,
    metricDays,
    days: lookbackDays,
  };
}
