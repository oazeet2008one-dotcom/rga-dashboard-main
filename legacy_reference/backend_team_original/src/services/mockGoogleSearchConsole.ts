import { Integration, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals = 4): Prisma.Decimal {
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

const samplePages = ['/home', '/collections/sale', '/product/a', '/product/b', '/blog/how-to', '/contact'];
const sampleQueries = ['brand name', 'buy product', 'promo code', 'best price', 'how to use', 'near me'];
const sampleDevices = ['DESKTOP', 'MOBILE'];
const sampleCountries = ['THA', 'SGP', 'MYS'];

export async function sync(integration: Integration) {
  const config = parseJson<any>(integration.config, {});
  const lookbackDays = Number(config.lookbackDays || 30);

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (lookbackDays - 1));

  let rows = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    const dateStr = day.toISOString().slice(0, 10);
    const dateObj = new Date(`${dateStr}T00:00:00.000Z`);

    const perDayRows = randomBetween(6, 14);
    for (let i = 0; i < perDayRows; i++) {
      const page = samplePages[randomBetween(0, samplePages.length - 1)];
      const query = sampleQueries[randomBetween(0, sampleQueries.length - 1)];
      const device = sampleDevices[randomBetween(0, sampleDevices.length - 1)];
      const country = sampleCountries[randomBetween(0, sampleCountries.length - 1)];

      const impressions = randomBetween(10, 2000);
      const clicks = randomBetween(0, Math.min(400, impressions));
      const ctr = impressions > 0 ? clicks / impressions : 0;
      const position = Math.max(1, Math.min(70, randomBetween(1, 40) + Math.random()));

      const label = `${page} - ${query}`;

      const externalKey = `${dateStr}|${page}|${query}|${device}|${country}`;

      const payload = {
        metricType: 'search_performance',
        label,
        date: dateObj as any,
        externalKey,
        numericValue: randomDecimal(Math.max(0, ctr - 0.01), Math.min(1, ctr + 0.01)),
        volume: impressions,
        sessions: clicks,
        metadata: {
          mock: true,
          date: dateStr,
          page,
          query,
          device,
          country,
          position,
          clicks,
          impressions,
          ctr,
        },
      } as const;

      await prisma.seoMetric.upsert({
        where: {
          tenantId_metricType_externalKey: {
            tenantId: integration.tenantId,
            metricType: 'search_performance',
            externalKey,
          },
        } as any,
        update: payload as any,
        create: {
          tenantId: integration.tenantId,
          ...payload,
        } as any,
      });

      rows += 1;
    }
  }

  return {
    status: 'ok',
    provider: 'google_search_console',
    integrationId: integration.id,
    mock: true,
    rows,
    days: lookbackDays,
  };
}
