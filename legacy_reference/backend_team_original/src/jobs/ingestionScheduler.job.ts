import * as cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { normalizeProviderKey } from '../services/syncRegistry';

const DEFAULT_INTERVAL_MINUTES = 60;

const db = prisma as any;

export const startIngestionSchedulerJob = () => {
  cron.schedule('0 * * * *', async () => {
    const now = new Date();

    try {
      const integrations = await prisma.integration.findMany({
        where: { isActive: true },
        select: { id: true, tenantId: true, provider: true },
      });

      for (const integration of integrations) {
        const provider = normalizeProviderKey(integration.provider);

        const state = await db.integrationSyncState.upsert({
          where: { integrationId: integration.id },
          update: { provider },
          create: {
            tenantId: integration.tenantId,
            integrationId: integration.id,
            provider,
            cursor: {},
            nextRunAt: now,
          },
        });

        const due = !state.nextRunAt || state.nextRunAt.getTime() <= now.getTime();
        if (!due) continue;

        const existing = await db.ingestionJob.findFirst({
          where: {
            integrationId: integration.id,
            status: { in: ['queued', 'running'] },
          },
          select: { id: true },
        });
        if (existing) continue;

        await db.ingestionJob.create({
          data: {
            tenantId: integration.tenantId,
            integrationId: integration.id,
            provider,
            trigger: 'cron',
            status: 'queued',
            runAt: now,
            maxAttempts: 3,
            payload: {
              intervalMinutes: DEFAULT_INTERVAL_MINUTES,
            },
          },
        });
      }

      logger.info(`Ingestion scheduler enqueued jobs for ${integrations.length} integrations`);
    } catch (err: any) {
      logger.error('Ingestion scheduler failed', { error: err?.message || String(err) });
    }
  });

  logger.info('Ingestion scheduler started (runs every 60 minutes)');
};
