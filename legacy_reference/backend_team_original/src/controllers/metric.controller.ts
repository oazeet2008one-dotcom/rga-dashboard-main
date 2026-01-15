import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { prisma } from '../utils/prisma';
import { getTenantSnapshots, getSnapshotCacheMode } from '../utils/snapshotCache';

// FLOW START: Metrics Controller (EN)
// จุดเริ่มต้น: Controller ของ Metrics (TH)

export const getOverview = async (req: TenantRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayMetrics = await prisma.metric.aggregate({
    where: {
      tenantId: req.tenantId!,
      date: { gte: today },
    },
    _sum: {
      impressions: true,
      clicks: true,
      conversions: true,
      spend: true,
      revenue: true,
    },
  });

  res.json({
    overview: {
      ...todayMetrics,
      _sum: {
        impressions: todayMetrics._sum.impressions ?? 0,
        clicks: todayMetrics._sum.clicks ?? 0,
        conversions: todayMetrics._sum.conversions ?? 0,
        spend: Number(todayMetrics._sum.spend ?? 0),
        revenue: Number(todayMetrics._sum.revenue ?? 0),
      },
    },
  });
};

export const getDashboardData = async (req: TenantRequest, res: Response) => {
  const { period = '7d', startDate: startDateRaw, endDate: endDateRaw } = req.query;

  const startDateParam = typeof startDateRaw === 'string' ? startDateRaw : undefined;
  const endDateParam = typeof endDateRaw === 'string' ? endDateRaw : undefined;

  // Calculate date range based on period
  const endDate = new Date();
  const startDate = new Date();

  if (startDateParam && endDateParam) {
    const parsedStart = new Date(startDateParam);
    const parsedEnd = new Date(endDateParam);
    if (!Number.isNaN(parsedStart.getTime()) && !Number.isNaN(parsedEnd.getTime())) {
      startDate.setTime(parsedStart.getTime());
      endDate.setTime(parsedEnd.getTime());
    }
  }

  if (!(startDateParam && endDateParam)) {
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '365d':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
  }

  const metrics = await prisma.metric.findMany({
    where: {
      tenantId: req.tenantId!,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });

  const normalizeToMidnight = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const start = normalizeToMidnight(startDate);
  const end = normalizeToMidnight(endDate);

  // Group by date
  const groupedMetrics = metrics.reduce((acc: Record<string, any>, metric: any) => {
    const dateKey = new Date(metric.date).toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      };
    }
    acc[dateKey].impressions += metric.impressions || 0;
    acc[dateKey].clicks += metric.clicks || 0;
    acc[dateKey].conversions += metric.conversions || 0;
    acc[dateKey].spend += Number(metric.spend) || 0;
    acc[dateKey].revenue += Number(metric.revenue) || 0;
    return acc;
  }, {});

  // Always return a continuous series so charts can render 0-lines when there is no data.
  const series: any[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = cursor.toISOString().split('T')[0];
    series.push(
      groupedMetrics[key] || {
        date: key,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: 0,
        revenue: 0,
      },
    );
  }

  res.json({ data: series });
};

export const getPlatformBreakdown = async (req: TenantRequest, res: Response) => {
  const { period = '7d', startDate: startDateRaw, endDate: endDateRaw } = req.query;

  const startDateParam = typeof startDateRaw === 'string' ? startDateRaw : undefined;
  const endDateParam = typeof endDateRaw === 'string' ? endDateRaw : undefined;

  const endDate = new Date();
  const startDate = new Date();

  if (startDateParam && endDateParam) {
    const parsedStart = new Date(startDateParam);
    const parsedEnd = new Date(endDateParam);
    if (!Number.isNaN(parsedStart.getTime()) && !Number.isNaN(parsedEnd.getTime())) {
      startDate.setTime(parsedStart.getTime());
      endDate.setTime(parsedEnd.getTime());
    }
  }

  if (!(startDateParam && endDateParam)) {
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '365d':
        startDate.setDate(startDate.getDate() - 365);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
  }

  const grouped = await prisma.metric.groupBy({
    by: ['platform'],
    where: {
      tenantId: req.tenantId!,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      impressions: true,
      clicks: true,
      conversions: true,
      spend: true,
      revenue: true,
    },
  });

  const data = grouped
    .map((row: any) => ({
      platform: row.platform,
      impressions: row._sum.impressions ?? 0,
      clicks: row._sum.clicks ?? 0,
      conversions: row._sum.conversions ?? 0,
      spend: Number(row._sum.spend ?? 0),
      revenue: Number(row._sum.revenue ?? 0),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  res.json({ data });
};

export const getCachedSnapshots = async (req: TenantRequest, res: Response) => {
  const snapshots = await getTenantSnapshots(req.tenantId!, 5);
  res.json({
    mode: getSnapshotCacheMode(),
    count: snapshots.length,
    snapshots,
  });
};

export const getTrends = async (_req: TenantRequest, res: Response) => {
  res.json({ message: 'Get trends - Coming soon' });
};

export const getComparison = async (_req: TenantRequest, res: Response) => {
  res.json({ message: 'Get comparison - Coming soon' });
};

export const bulkCreateMetrics = async (req: TenantRequest, res: Response) => {
  const { metrics } = req.body;

  const created = await prisma.metric.createMany({
    data: metrics.map((m: any) => ({
      ...m,
      tenantId: req.tenantId!,
    })),
    skipDuplicates: true,
  });

  res.status(201).json({ created });
};

// FLOW END: Metrics Controller (EN)
// จุดสิ้นสุด: Controller ของ Metrics (TH)
