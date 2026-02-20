import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../modules/prisma/prisma.service';
import {
    GetAlertHistoryQueryDto,
    GetAlertsQueryDto,
    GetMetricsQueryDto,
} from './dto';

@Injectable()
export class ToolkitQueryService {
    constructor(private readonly prismaService: PrismaService) {}

    async getMetrics(query: GetMetricsQueryDto): Promise<{ metrics: unknown[]; count: number }> {
        const where: Prisma.MetricWhereInput = { tenantId: query.tenantId };

        if (query.campaignId) {
            where.campaignId = query.campaignId;
        }

        if (query.startDate || query.endDate) {
            const dateWhere: Prisma.DateTimeFilter = {};
            if (query.startDate) {
                dateWhere.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                dateWhere.lte = new Date(query.endDate);
            }
            where.date = dateWhere;
        }

        const metrics = await this.prismaService.metric.findMany({
            where,
            orderBy: { date: 'desc' },
            take: query.limit,
        });

        return { metrics, count: metrics.length };
    }

    async getAlerts(query: GetAlertsQueryDto): Promise<{ alerts: unknown[]; count: number }> {
        const where: Prisma.AlertWhereInput = { tenantId: query.tenantId };

        if (query.status) {
            where.status = query.status;
        }

        const alerts = await this.prismaService.alert.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { rule: true, campaign: true },
        });

        return { alerts, count: alerts.length };
    }

    async getAlertHistory(
        query: GetAlertHistoryQueryDto,
    ): Promise<{ history: unknown[]; count: number }> {
        const where: Prisma.AlertHistoryWhereInput = { tenantId: query.tenantId };

        const history = await this.prismaService.alertHistory.findMany({
            where,
            orderBy: { triggeredAt: 'desc' },
            take: query.limit,
        });

        return { history, count: history.length };
    }
}
