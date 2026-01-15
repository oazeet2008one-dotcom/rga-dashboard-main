import { Integration, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

// FLOW START: Mock Facebook Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Mock Facebook (TH)

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

const campaignNames = [
  'Spring Sale 2025',
  'Summer Promo',
  'Brand Awareness Q1',
  'Product Launch',
  'Retargeting Campaign',
  'Lookalike Audience',
  'Conversion Boost',
  'Holiday Special',
];

export async function sync(integration: Integration) {
  const config = parseJson<any>(integration.config, {});
  const lookbackDays = Number(config.lookbackDays || 30);
  const numCampaigns = randomBetween(3, 7);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (lookbackDays - 1));

  // Create mock campaigns
  const campaigns: any[] = [];
  for (let i = 0; i < numCampaigns; i++) {
    const camp = await prisma.campaign.upsert({
      where: {
        tenantId_platform_externalId: {
          tenantId: integration.tenantId,
          platform: 'facebook',
          externalId: `mock_fb_${i + 1}`,
        },
      },
      update: {
        name: campaignNames[i % campaignNames.length],
        status: 'active',
        objective: ['CONVERSIONS', 'TRAFFIC', 'REACH', 'AWARENESS'][i % 4],
        budget: randomDecimal(100, 2000),
        budgetType: 'daily',
      },
      create: {
        tenantId: integration.tenantId,
        integrationId: integration.id,
        externalId: `mock_fb_${i + 1}`,
        name: campaignNames[i % campaignNames.length],
        platform: 'facebook',
        status: 'active',
        objective: ['CONVERSIONS', 'TRAFFIC', 'REACH', 'AWARENESS'][i % 4],
        budget: randomDecimal(100, 2000),
        budgetType: 'daily',
        currency: 'THB',
        startDate: start,
      },
    });
    campaigns.push(camp);
  }

  // Create daily metrics for each campaign
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
          platform: 'facebook',
          source: 'facebook',
        },
        select: { id: true },
      });

      const payload = {
        impressions: randomBetween(5000, 50000),
        clicks: randomBetween(100, 1500),
        conversions: randomBetween(0, 25),
        spend: randomDecimal(50, 800),
        revenue: randomDecimal(0, 3000),
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
            platform: 'facebook',
            source: 'facebook',
            ...payload,
          } as any,
        });
      }
      metricDays += 1;
    }
  }

  return {
    status: 'ok',
    provider: 'facebook',
    integrationId: integration.id,
    mock: true,
    campaigns: campaigns.length,
    metricDays,
    days: lookbackDays,
  };
}

// FLOW END: Mock Facebook Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Mock Facebook (TH)
