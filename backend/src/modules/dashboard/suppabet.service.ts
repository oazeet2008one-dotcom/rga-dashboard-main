import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';

@Injectable()
export class SuppabetService {
    constructor(private readonly prisma: PrismaService) { }

    async getMatches(tenantId: string, days: number = 7) {
        return [];
    }

    async getSummary(tenantId: string, days: number = 30) {
        return {
            totalVolume: 0,
            totalProfit: 0,
            totalBets: 0,
            matchCount: 0,
        };
    }
}
