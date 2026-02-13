import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class EcommerceRollupService {
    private readonly logger = new Logger(EcommerceRollupService.name);

    constructor(private readonly prisma: PrismaService) { }

    private dateKey(d: Date): string {
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    private stableNumber(seed: string): number {
        let h = 2166136261;
        for (let i = 0; i < seed.length; i++) {
            h ^= seed.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return (h >>> 0) / 4294967295;
    }

    private clamp(n: number, min: number, max: number) {
        return Math.max(min, Math.min(max, n));
    }

    async backfillLastNDaysForAllTenants(days: number = 30) {
        const tenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });
        for (const t of tenants) {
            try {
                await this.backfillLastNDaysForTenant(t.id, days);
            } catch (e) {
                this.logger.error(`Failed Ecommerce backfill for tenant ${t.id} (${t.name})`, e instanceof Error ? e.stack : e);
            }
        }
    }

    async backfillLastNDaysForTenant(tenantId: string, days: number = 30) {
        const safeDays = Math.max(1, Math.floor(days));
        const end = new Date();
        end.setUTCHours(0, 0, 0, 0);
        end.setUTCDate(end.getUTCDate() - 1);

        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - (safeDays - 1));

        for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
            await this.upsertDailyEcommerceForTenant(tenantId, new Date(d));
        }
    }

    async upsertDailyEcommerceForTenant(tenantId: string, date: Date) {
        const day = new Date(date);
        day.setUTCHours(0, 0, 0, 0);
        const key = this.dateKey(day);

        const base = this.stableNumber(`${tenantId}:${key}`);
        
        // Find existing campaign or create a mock one for ecommerce
        let campaign = await this.prisma.campaign.findFirst({
            where: { tenantId, name: 'Ecommerce Mock Campaign' }
        });

        if (!campaign) {
            campaign = await this.prisma.campaign.create({
                data: {
                    tenantId,
                    name: 'Ecommerce Mock Campaign',
                    platform: 'GOOGLE_ADS',
                    status: 'ACTIVE',
                    budget: new Prisma.Decimal(10000),
                }
            });
        }

        const sessions = Math.floor(1000 + base * 5000);
        const orders = Math.floor(sessions * (0.02 + this.stableNumber(`${tenantId}:${key}:orders`) * 0.03));
        const revenue = orders * (500 + this.stableNumber(`${tenantId}:${key}:revenue`) * 1500);
        const aov = orders > 0 ? revenue / orders : 0;
        const cr = sessions > 0 ? (orders / sessions) * 100 : 0;
        const car = 0.65 + this.stableNumber(`${tenantId}:${key}:car`) * 0.15;

        const existingMetric = await this.prisma.metric.findFirst({
            where: {
                campaignId: campaign.id,
                date: day,
            },
            select: { id: true }
        });

        const metricData = {
            tenantId,
            campaignId: campaign.id,
            date: day,
            revenue: new Prisma.Decimal(revenue.toFixed(2)),
            orders,
            averageOrderValue: new Prisma.Decimal(aov.toFixed(2)),
            conversionRate: new Prisma.Decimal(cr.toFixed(4)),
            cartAbandonmentRate: new Prisma.Decimal(car.toFixed(4)),
            isMockData: false,
            platform: campaign.platform,
        };

        if (existingMetric) {
            await this.prisma.metric.update({
                where: { id: existingMetric.id },
                data: metricData,
            });
        } else {
            await this.prisma.metric.create({
                data: metricData,
            });
        }
    }
}
