import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';

// FLOW START: SEO Controller (EN)
// จุดเริ่มต้น: Controller ของ SEO (TH)

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export const getSeoOverview = async (req: TenantRequest, res: Response) => {
  const { dateFrom, dateTo, limit } = req.query as any;
  const start = parseDate(dateFrom);
  const end = parseDate(dateTo);
  const topLimit = Math.max(1, Math.min(100, Number(limit) || 10));

  const whereMetric: any = { tenantId: req.tenantId!, platform: 'ga4', campaignId: null };
  if (start || end) {
    whereMetric.date = {} as any;
    if (start) whereMetric.date.gte = start;
    if (end) whereMetric.date.lte = end;
  }

  const ga4Metrics = await prisma.metric.findMany({
    where: whereMetric,
    orderBy: { date: 'asc' },
    select: {
      date: true,
      organicTraffic: true,
      bounceRate: true,
      avgSessionDuration: true,
      revenue: true,
      orders: true,
    },
  });

  const sessionsTotal = ga4Metrics.reduce((sum, m) => sum + Number(m.organicTraffic || 0), 0);
  const bounceRates = ga4Metrics.map((m) => Number(m.bounceRate || 0)).filter((v) => Number.isFinite(v));
  const avgDurations = ga4Metrics.map((m) => Number(m.avgSessionDuration || 0)).filter((v) => Number.isFinite(v));
  const revenueTotal = ga4Metrics.reduce((sum, m) => sum + Number(m.revenue || 0), 0);
  const ordersTotal = ga4Metrics.reduce((sum, m) => sum + Number(m.orders || 0), 0);
  const bounceRateAvg = bounceRates.length ? bounceRates.reduce((a, b) => a + b, 0) / bounceRates.length : 0;
  const avgSessionDuration = avgDurations.length ? Math.round(avgDurations.reduce((a, b) => a + b, 0) / avgDurations.length) : 0;

  const trend = ga4Metrics.map((m) => ({ date: m.date, sessions: Number(m.organicTraffic || 0) }));

  const whereSeo: any = { tenantId: req.tenantId!, metricType: 'search_performance' };
  if (start || end) {
    const dateWhere: any = {};
    if (start) dateWhere.gte = start;
    if (end) dateWhere.lte = end;

    const createdAtWhere: any = {};
    if (start) createdAtWhere.gte = start;
    if (end) createdAtWhere.lte = end;

    whereSeo.OR = [
      { date: dateWhere },
      { date: null, createdAt: createdAtWhere },
    ];
  }

  const seoRows = await prisma.seoMetric.findMany({ where: whereSeo, select: { metadata: true } });
  let gscClicks = 0;
  let gscImpressions = 0;
  let positions: number[] = [];
  const queryAgg = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
  const pageAgg = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
  const deviceAgg = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();
  const countryAgg = new Map<string, { clicks: number; impressions: number; ctr: number; position: number }>();

  for (const row of seoRows) {
    const md: any = row.metadata || {};
    const clicks = Number(md.clicks || 0);
    const impressions = Number(md.impressions || 0);
    const pos = Number(md.position || 0);
    const query = String(md.query || '');
    const page = String(md.page || '');
    const device = String(md.device || '');
    const country = String(md.country || '');

    gscClicks += clicks;
    gscImpressions += impressions;
    if (Number.isFinite(pos)) positions.push(pos);

    if (query) {
      const prev = queryAgg.get(query) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      prev.clicks += clicks;
      prev.impressions += impressions;
      prev.position = prev.position ? (prev.position + pos) / 2 : pos;
      prev.ctr = prev.impressions > 0 ? prev.clicks / prev.impressions : 0;
      queryAgg.set(query, prev);
    }
    if (page) {
      const prev = pageAgg.get(page) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      prev.clicks += clicks;
      prev.impressions += impressions;
      prev.position = prev.position ? (prev.position + pos) / 2 : pos;
      prev.ctr = prev.impressions > 0 ? prev.clicks / prev.impressions : 0;
      pageAgg.set(page, prev);
    }

    if (device) {
      const prev = deviceAgg.get(device) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      prev.clicks += clicks;
      prev.impressions += impressions;
      prev.position = prev.position ? (prev.position + pos) / 2 : pos;
      prev.ctr = prev.impressions > 0 ? prev.clicks / prev.impressions : 0;
      deviceAgg.set(device, prev);
    }

    if (country) {
      const prev = countryAgg.get(country) || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      prev.clicks += clicks;
      prev.impressions += impressions;
      prev.position = prev.position ? (prev.position + pos) / 2 : pos;
      prev.ctr = prev.impressions > 0 ? prev.clicks / prev.impressions : 0;
      countryAgg.set(country, prev);
    }
  }

  const avgCtr = gscImpressions > 0 ? gscClicks / gscImpressions : 0;
  const avgPosition = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : 0;

  const topQueries = Array.from(queryAgg.entries())
    .map(([query, v]) => ({ query, ...v }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, topLimit);
  const topPages = Array.from(pageAgg.entries())
    .map(([page, v]) => ({ page, ...v }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, topLimit);

  const byDevice = Array.from(deviceAgg.entries())
    .map(([device, v]) => ({ device, ...v }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, topLimit);

  const byCountry = Array.from(countryAgg.entries())
    .map(([country, v]) => ({ country, ...v }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, topLimit);

  res.json({
    success: true,
    data: {
      ga4: {
        sessions: sessionsTotal,
        bounceRate: bounceRateAvg,
        avgSessionDuration,
        revenue: revenueTotal,
        orders: ordersTotal,
        trend,
      },
      gsc: {
        clicks: gscClicks,
        impressions: gscImpressions,
        ctr: avgCtr,
        position: avgPosition,
        topQueries,
        topPages,
        byDevice,
        byCountry,
      },
    },
  });
};

// FLOW END: SEO Controller (EN)
// จุดสิ้นสุด: Controller ของ SEO (TH)
