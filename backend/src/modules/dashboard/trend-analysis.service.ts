import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';
import { GetTrendAnalysisDto, TrendDataResponseDto, TrendPeriod } from './dto/trend-analysis.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TrendAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: Prisma.Decimal | number | string | null | undefined, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    return Number(value);
  }

  async getTrends(tenantId: string, query: GetTrendAnalysisDto): Promise<TrendDataResponseDto[]> {
    const days = query.period === TrendPeriod.D7 ? 7 : 30;
    const { startDate, endDate } = DateRangeUtil.getDateRange(days);

    const metrics = await this.prisma.metric.groupBy({
      by: ['date'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
        conversions: true,
        revenue: true,
      },
      orderBy: { date: 'asc' },
    });

    const ga4Metrics = await this.prisma.webAnalyticsDaily.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      select: {
        date: true,
        sessions: true,
      },
    });

    const ga4Map = new Map(ga4Metrics.map(m => [m.date.toISOString().split('T')[0], m.sessions]));

    return metrics.map(m => {
      const dateStr = m.date.toISOString().split('T')[0];
      return {
        date: dateStr,
        cost: this.toNumber(m._sum.spend),
        impressions: m._sum.impressions || 0,
        clicks: m._sum.clicks || 0,
        conversions: m._sum.conversions || 0,
        revenue: this.toNumber(m._sum.revenue),
        sessions: ga4Map.get(dateStr) || 0,
      };
    });
  }
}
