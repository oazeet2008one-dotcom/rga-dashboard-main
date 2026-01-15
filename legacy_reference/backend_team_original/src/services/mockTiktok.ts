import { Integration, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

// FLOW START: Mock TikTok Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Mock TikTok (TH)

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

  // Create mock campaigns (TikTok: video ads)
  const campaigns: any[] = [];
  const numCampaigns = randomBetween(2, 5);
  for (let i = 0; i < numCampaigns; i++) {
    const camp = await prisma.campaign.upsert({
      where: {
        tenantId_platform_externalId: {
          tenantId: integration.tenantId,
          platform: 'tiktok',
          externalId: `mock_tt_${i + 1}`,
        },
      },
      update: {
        name: `TikTok Video Campaign #${i + 1}`,
        status: 'active',
        objective: ['REACH', 'TRAFFIC', 'CONVERSIONS'][i % 3],
        budget: randomDecimal(50, 1200),
        budgetType: 'daily',
      },
      create: {
        tenantId: integration.tenantId,
        integrationId: integration.id,
        externalId: `mock_tt_${i + 1}`,
        name: `TikTok Video Campaign #${i + 1}`,
        platform: 'tiktok',
        status: 'active',
        objective: ['REACH', 'TRAFFIC', 'CONVERSIONS'][i % 3],
        budget: randomDecimal(50, 1200),
        budgetType: 'daily',
        currency: 'THB',
        startDate: start,
      },
    });
    campaigns.push(camp);
  }

  // Daily metrics
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
          platform: 'tiktok',
          source: 'tiktok',
        },
        select: { id: true },
      });

      const payload = {
        impressions: randomBetween(3000, 30000),
        clicks: randomBetween(80, 1200),
        conversions: randomBetween(0, 20),
        spend: randomDecimal(30, 600),
        revenue: randomDecimal(0, 2500),
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
            platform: 'tiktok',
            source: 'tiktok',
            ...payload,
          } as any,
        });
      }
      metricDays += 1;
    }
  }

  return {
    status: 'ok',
    provider: 'tiktok',
    integrationId: integration.id,
    mock: true,
    campaigns: campaigns.length,
    metricDays,
    days: lookbackDays,
  };
}

// FLOW END: Mock TikTok Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Mock TikTok (TH)
