import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SeoService } from './seo.service';

@Injectable()
export class SeoSyncSchedulerService {
    private readonly logger = new Logger(SeoSyncSchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly seoService: SeoService,
    ) { }

    @Cron(CronExpression.EVERY_6_HOURS)
    async scheduledGscSync() {
        const tenants = await this.prisma.tenant.findMany({
            select: { id: true },
        });

        for (const t of tenants) {
            try {
                await this.seoService.syncGscForTenant(t.id, { days: 30 });
            } catch (error: any) {
                this.logger.error(`[GSC Sync] Failed for tenant ${t.id}: ${error.message}`);
            }
        }
    }
}
