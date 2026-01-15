import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// FLOW START: Prisma Client Utility (EN)
// จุดเริ่มต้น: Utility Prisma Client (TH)

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Connection handling
try {
  const rawUrl = process.env.DATABASE_URL;
  if (typeof rawUrl === 'string' && rawUrl.trim()) {
    const url = new URL(rawUrl);
    logger.info('🔌 Prisma database target', {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port || '(default)',
      database: url.pathname?.startsWith('/') ? url.pathname.slice(1) : url.pathname,
      user: url.username || '(empty)',
      hasPassword: typeof url.password === 'string' && url.password.length > 0,
    });
  } else {
    logger.warn('🔌 Prisma DATABASE_URL is not set');
  }
} catch (_error) {
  logger.warn('🔌 Prisma DATABASE_URL is not a valid URL');
}

prisma
  .$connect()
  .then(() => {
    logger.info('✅ Database connected successfully');
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  });

export default prisma;

// FLOW END: Prisma Client Utility (EN)
// จุดสิ้นสุด: Utility Prisma Client (TH)
