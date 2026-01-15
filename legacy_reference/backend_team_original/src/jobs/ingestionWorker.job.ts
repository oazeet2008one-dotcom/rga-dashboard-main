import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { syncIntegrationWithFallback, normalizeProviderKey } from '../services/syncRegistry';

const WORKER_ID = process.env.INGESTION_WORKER_ID || `ingestion-worker-${process.pid}`;
const POLL_INTERVAL_MS = Number(process.env.INGESTION_POLL_INTERVAL_MS || 2000);
const CONCURRENCY = Math.max(1, Number(process.env.INGESTION_CONCURRENCY || 2));

const db = prisma as any;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const backoffMs = (attempts: number) => {
  const base = 5000;
  const capped = Math.min(6, Math.max(0, attempts));
  const exp = Math.pow(2, capped);
  const jitter = Math.floor(Math.random() * 500);
  return base * exp + jitter;
};

const claimNextJob = async () => {
  const now = new Date();
  const job = await db.ingestionJob.findFirst({
    where: {
      status: 'queued',
      runAt: { lte: now },
      lockedAt: null,
    },
    orderBy: { runAt: 'asc' },
  });
  if (!job) return null;

  const lockedAt = new Date();
  const updated = await db.ingestionJob.updateMany({
    where: {
      id: job.id,
      status: 'queued',
      lockedAt: null,
    },
    data: {
      status: 'running',
      lockedAt,
      lockedBy: WORKER_ID,
      startedAt: lockedAt,
      attempts: { increment: 1 },
    },
  });

  if (updated.count !== 1) return null;
  return db.ingestionJob.findUnique({ where: { id: job.id } });
};

const markJobDone = async (jobId: string) => {
  const finishedAt = new Date();
  await db.ingestionJob.update({
    where: { id: jobId },
    data: {
      status: 'success',
      finishedAt,
      lockedAt: null,
      lockedBy: null,
    },
  });
};

const markJobFailed = async (jobId: string, attempts: number, maxAttempts: number, error: string) => {
  const now = new Date();
  const shouldRetry = attempts < maxAttempts;
  if (shouldRetry) {
    const runAt = new Date(Date.now() + backoffMs(attempts));
    await db.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: 'queued',
        error,
        runAt,
        lockedAt: null,
        lockedBy: null,
        startedAt: null,
        finishedAt: null,
      },
    });
    return;
  }

  await db.ingestionJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      error,
      finishedAt: now,
      lockedAt: null,
      lockedBy: null,
    },
  });
};

const updateSyncState = async (integrationId: string, tenantId: string, provider: string, data: any) => {
  const now = new Date();
  await db.integrationSyncState.upsert({
    where: { integrationId },
    update: {
      provider,
      cursor: data?.cursor ?? {},
      lastAttemptAt: now,
      lastSuccessAt: now,
      nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    create: {
      tenantId,
      integrationId,
      provider,
      cursor: data?.cursor ?? {},
      lastAttemptAt: now,
      lastSuccessAt: now,
      nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
};

const writeSyncHistory = async (tenantId: string, integrationId: string, provider: string, ok: boolean, data: any, error?: string) => {
  await prisma.syncHistory.create({
    data: {
      tenantId,
      integrationId,
      platform: provider,
      status: ok ? 'success' : 'error',
      data,
      error,
      syncedAt: new Date(),
    },
  });
};

const runJob = async (job: any) => {
  const startedAt = Date.now();
  const integration = await prisma.integration.findUnique({ where: { id: job.integrationId } });
  if (!integration) {
    throw new Error('Integration not found');
  }

  const provider = normalizeProviderKey(integration.provider);
  const { mode, result } = await syncIntegrationWithFallback(integration);
  const durationMs = Date.now() - startedAt;

  const ok = (result as any)?.status !== 'error';

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      lastSyncAt: new Date(),
      status: ok ? 'active' : 'error',
    },
  });

  await writeSyncHistory(
    integration.tenantId,
    integration.id,
    provider,
    ok,
    {
      trigger: job.trigger,
      mode,
      durationMs,
      result,
    },
    ok ? undefined : (result as any)?.message || (result as any)?.error,
  );

  if (ok) {
    await updateSyncState(integration.id, integration.tenantId, provider, result);
  }

  return { provider, mode, ok };
};

export const startIngestionWorker = () => {
  let stopped = false;
  let inFlight = 0;

  const loop = async () => {
    while (!stopped) {
      if (inFlight >= CONCURRENCY) {
        await sleep(100);
        continue;
      }

      const job = await claimNextJob();
      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      inFlight += 1;

      (async () => {
        try {
          const res = await runJob(job);
          await markJobDone(job.id);
          logger.info('Ingestion job completed', { jobId: job.id, provider: res.provider, mode: res.mode });
        } catch (err: any) {
          const error = err?.message || String(err);
          await markJobFailed(job.id, Number(job.attempts || 0), Number(job.maxAttempts || 3), error);
          logger.error('Ingestion job failed', { jobId: job.id, error });
        } finally {
          inFlight -= 1;
        }
      })();
    }
  };

  loop().catch((err) => {
    logger.error('Ingestion worker crashed', { error: err?.message || String(err) });
  });

  logger.info(`Ingestion worker started (id=${WORKER_ID}, concurrency=${CONCURRENCY})`);

  return () => {
    stopped = true;
  };
};
