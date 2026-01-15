import * as cron from 'node-cron';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { syncIntegrationWithFallback } from '../services/syncRegistry';

// FLOW START: Scheduled Sync Job (EN)
// จุดเริ่มต้น: งานซิงค์อัตโนมัติ (TH)

// Run sync every hour
export const startSyncJob = () => {
  // FLOW START: cron schedule callback (EN)
  // จุดเริ่มต้น: ฟังก์ชันที่ถูกเรียกตาม cron (TH)
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting scheduled sync job...');

    try {
      // Get all active integrations
      const integrations = await prisma.integration.findMany({
        where: {
          isActive: true,
          // Only sync integrations that haven't been synced in the last hour
          OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } }],
        },
      });

      logger.info(`Found ${integrations.length} integrations to sync`);

      for (const integration of integrations) {
        try {
          logger.info(`Syncing integration: ${integration.id} (${integration.provider})`);
          const { provider, mode } = await syncIntegrationWithFallback(integration);

          // Ensure lastSyncAt is updated consistently even if the provider sync doesn't update it internally.
          await prisma.integration.update({
            where: { id: integration.id },
            data: { lastSyncAt: new Date(), status: 'active' },
          });
          logger.info(`Successfully synced integration: ${integration.id} (${provider}, mode=${mode})`);
        } catch (error: any) {
          logger.error(`Failed to sync integration ${integration.id}: ${error.message}`);

          // Update integration status to error
          await prisma.integration.update({
            where: { id: integration.id },
            data: { status: 'error' },
          });
        }
      }

      logger.info('Scheduled sync job completed');
    } catch (error: any) {
      logger.error(`Scheduled sync job failed: ${error.message}`);
    }
  });

  // FLOW END: cron schedule callback (EN)
  // จุดสิ้นสุด: ฟังก์ชันที่ถูกเรียกตาม cron (TH)

  logger.info('Scheduled sync job started (runs every hour)');
};

// FLOW END: Scheduled Sync Job (EN)
// จุดสิ้นสุด: งานซิงค์อัตโนมัติ (TH)
