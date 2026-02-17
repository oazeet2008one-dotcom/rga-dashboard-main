import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SeoRollupService } from './seo-rollup.service';

@Injectable()
export class SeoSchedulerService {
    private readonly logger = new Logger(SeoSchedulerService.name);

    constructor(private readonly seoRollupService: SeoRollupService) { }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async rollupYesterday() {
        this.logger.log('Starting scheduled SEO daily rollup (yesterday)...');
        await this.seoRollupService.upsertYesterdayForAllTenants();
        this.logger.log('Scheduled SEO daily rollup completed');
    }
}
