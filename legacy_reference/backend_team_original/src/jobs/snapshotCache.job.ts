import * as cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { pushTenantSnapshot } from '../utils/snapshotCache';

const SNAPSHOT_LIMIT = 5;

const buildTenantSnapshot = async (tenantId: string) => {
  // Keep this intentionally minimal and generic.
  // When real platform fetch is ready, replace this part with calls to provider services.

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const grouped = await prisma.metric.groupBy({
    by: ['platform'],
    where: {
      tenantId,
      date: { gte: since },
    },
    _sum: {
      impressions: true,
      clicks: true,
      conversions: true,
      spend: true,
      revenue: true,
    },
  });

  const byPlatform = grouped.map((row: any) => ({
    platform: row.platform,
    impressions: row._sum.impressions ?? 0,
    clicks: row._sum.clicks ?? 0,
    conversions: row._sum.conversions ?? 0,
    spend: Number(row._sum.spend ?? 0),
    revenue: Number(row._sum.revenue ?? 0),
  }));

  return {
    generatedAt: new Date().toISOString(),
    window: { days: 30 },
    byPlatform,
  };
};

export const startSnapshotCacheJob = () => {
  // every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('Starting snapshot cache job...');

    try {
      const tenants = await prisma.tenant.findMany({
        select: { id: true },
      });

      for (const tenant of tenants) {
        try {
          const snapshot = await buildTenantSnapshot(tenant.id);
          await pushTenantSnapshot(tenant.id, snapshot, SNAPSHOT_LIMIT);
        } catch (err: any) {
          logger.error(`Snapshot cache failed for tenant ${tenant.id}: ${err?.message || err}`);
        }
      }

      logger.info('Snapshot cache job completed');
    } catch (err: any) {
      logger.error(`Snapshot cache job failed: ${err?.message || err}`);
    }
  });

  logger.info('Snapshot cache job started (runs every 15 minutes)');
};
