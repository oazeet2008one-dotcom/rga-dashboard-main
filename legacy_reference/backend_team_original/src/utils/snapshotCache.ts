import { createClient } from 'redis';
import { logger } from './logger';

type CacheMode = 'redis' | 'memory';

let mode: CacheMode = 'memory';
let client: ReturnType<typeof createClient> | null = null;
const memoryStore = new Map<string, string[]>();

const getRedisUrl = () => {
  const raw = process.env.REDIS_URL;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return null;
};

export const initSnapshotCache = async () => {
  const url = getRedisUrl();
  if (!url) {
    mode = 'memory';
    client = null;
    return;
  }

  try {
    const redisClient = createClient({ url });
    redisClient.on('error', (err) => {
      logger.error('Redis client error', err);
    });
    await redisClient.connect();
    client = redisClient;
    mode = 'redis';
    logger.info('Snapshot cache initialized with Redis');
  } catch (err) {
    mode = 'memory';
    client = null;
    logger.warn('Snapshot cache falling back to memory (Redis unavailable)');
  }
};

export const closeSnapshotCache = async () => {
  if (mode !== 'redis' || !client) {
    return;
  }

  try {
    await client.quit();
  } catch (err) {
    logger.warn('Failed to close Redis snapshot cache connection');
  } finally {
    client = null;
    mode = 'memory';
  }
};

export const getSnapshotCacheMode = () => mode;

const keyForTenant = (tenantId: string) => `snapshot:tenant:${tenantId}`;

export const pushTenantSnapshot = async (tenantId: string, snapshot: unknown, limit = 5) => {
  const key = keyForTenant(tenantId);
  const payload = JSON.stringify(snapshot);

  if (mode === 'redis' && client) {
    await client.lPush(key, payload);
    await client.lTrim(key, 0, Math.max(0, limit - 1));
    return;
  }

  const current = memoryStore.get(key) || [];
  const next = [payload, ...current].slice(0, limit);
  memoryStore.set(key, next);
};

export const getTenantSnapshots = async (tenantId: string, limit = 5): Promise<any[]> => {
  const key = keyForTenant(tenantId);

  if (mode === 'redis' && client) {
    const rows = await client.lRange(key, 0, Math.max(0, limit - 1));
    return rows
      .map((row) => {
        try {
          return JSON.parse(row);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  const rows = (memoryStore.get(key) || []).slice(0, limit);
  return rows
    .map((row) => {
      try {
        return JSON.parse(row);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};
