import { Integration, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

// FLOW START: Mock GA4 Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ Mock GA4 (TH)

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

  let upserts = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    day.setUTCHours(0, 0, 0, 0);
    const existing = await prisma.metric.findFirst({
      where: {
        tenantId: integration.tenantId,
        campaignId: null,
        date: day as any,
        hour: null,
        platform: 'ga4',
        source: 'ga4',
      },
      select: { id: true },
    });

    const payload = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: null,
      organicTraffic: randomBetween(800, 3000),
      bounceRate: randomDecimal(20, 70),
      avgSessionDuration: randomBetween(60, 240),
      revenue: randomDecimal(0, 5000),
      orders: randomBetween(0, 15),
      metadata: { mock: true },
    } as const;

    if (existing) {
      await prisma.metric.update({ where: { id: existing.id }, data: payload as any });
    } else {
      await prisma.metric.create({
        data: {
          tenantId: integration.tenantId,
          campaignId: null,
          date: day as any,
          hour: null,
          platform: 'ga4',
          source: 'ga4',
          ...payload,
        } as any,
      });
    }
    upserts += 1;
  }

  return {
    status: 'ok',
    provider: 'ga4',
    integrationId: integration.id,
    mock: true,
    upserts,
    days: lookbackDays,
  };
}

// FLOW END: Mock GA4 Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ Mock GA4 (TH)
