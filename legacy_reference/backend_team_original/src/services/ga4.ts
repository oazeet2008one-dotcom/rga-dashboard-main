import { Integration } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';

// FLOW START: GA4 Sync Service (EN)
// จุดเริ่มต้น: Service ซิงค์ GA4 (TH)

type SAJson = {
  client_email: string;
  private_key: string;
  project_id?: string;
  [k: string]: any;
};

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
  const creds = parseJson<any>(integration.credentials, {});

  const propertyId: string | undefined = config.propertyId || creds.propertyId;
  const lookbackDays: number = Number(config.lookbackDays || 30);

  if (!propertyId) {
    return {
      status: 'error',
      message: 'GA4 propertyId is required in integration.config.propertyId',
    };
  }

  // Service Account JSON can be at credentials.serviceAccount or flat root
  const sa: SAJson | undefined =
    creds.serviceAccount || (creds.client_email && creds.private_key ? creds : undefined);
  if (!sa?.client_email || !sa?.private_key) {
    return { status: 'error', message: 'Service Account JSON missing in integration.credentials' };
  }

  const auth = new GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const analyticsDataClient = new BetaAnalyticsDataClient({ auth });

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (lookbackDays - 1));

  const format = (d: Date) => d.toISOString().slice(0, 10);

  // Request daily metrics
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: format(start), endDate: format(end) }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
      { name: 'purchaseRevenue' },
      { name: 'transactions' },
    ],
  });

  const rows = response.rows || [];
  let upserts = 0;

  for (const r of rows) {
    const dateStr = r.dimensionValues?.[0]?.value as string; // YYYYMMDD
    if (!dateStr) continue;
    const iso = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    const dateObj = new Date(iso + 'T00:00:00.000Z');

    const getNum = (i: number) => Number(r.metricValues?.[i]?.value || 0);

    const sessions = getNum(0);
    // const totalUsers = getNum(1);
    const bounceRate = getNum(2);
    const avgSessionDuration = Math.round(getNum(3));
    const revenue = getNum(4);
    const orders = Math.round(getNum(5));

    // Map to metrics table using findFirst then update/create
    const existing = await prisma.metric.findFirst({
      where: {
        tenantId: integration.tenantId,
        campaignId: null,
        date: dateObj as any,
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
      organicTraffic: sessions,
      bounceRate: bounceRate || null,
      avgSessionDuration: avgSessionDuration || null,
      revenue: revenue || null,
      orders: orders || null,
      metadata: {
        propertyId,
      },
    } as const;

    if (existing) {
      await prisma.metric.update({ where: { id: existing.id }, data: payload as any });
    } else {
      await prisma.metric.create({
        data: {
          tenantId: integration.tenantId,
          campaignId: null,
          date: dateObj as any,
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
    propertyId,
    rows: rows.length,
    upserts,
  };
}

// FLOW END: GA4 Sync Service (EN)
// จุดสิ้นสุด: Service ซิงค์ GA4 (TH)
