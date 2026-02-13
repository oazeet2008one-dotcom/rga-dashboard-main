import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Use DATABASE_URL from environment variable
    // This allows switching between SQLite (dev) and PostgreSQL (prod)
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      const url = process.env.DATABASE_URL;
      const maskedUrl = url ? url.replace(/:[^:@]+@/, ':****@') : 'UNDEFINED';
      console.log('----------------------------------------');
      console.log(`[PrismaService] Connecting to DB: ${maskedUrl}`);
      console.log('----------------------------------------');
      await this.$connect();
      console.log('[PrismaService] Connected successfully!');
    } catch (error) {
      console.error('[PrismaService] Connection error:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
