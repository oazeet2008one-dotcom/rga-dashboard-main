import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsightsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAiInsights(tenantId: string) {
        return this.prisma.aiInsight.findMany({
            where: {
                tenantId,
                status: 'ACTIVE',
            },
            orderBy: {
                occurredAt: 'desc',
            },
        });
    }
}
