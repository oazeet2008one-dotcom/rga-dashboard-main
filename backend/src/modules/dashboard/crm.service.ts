import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';
import { GetCrmSummaryDto, CrmSummaryResponseDto, CrmPeriod } from './dto/crm-summary.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: Prisma.Decimal | number | string | null | undefined, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    return Number(value);
  }

  async getSummary(tenantId: string, query: GetCrmSummaryDto): Promise<CrmSummaryResponseDto> {
    const days = query.period === CrmPeriod.D7 ? 7 : 30;
    const { startDate, endDate } = DateRangeUtil.getDateRange(days);
    const { startDate: prevStartDate, endDate: prevEndDate } = DateRangeUtil.getPreviousPeriodDateRange(startDate, days);

    // Using Metric table as a base for lead data (stored in metadata or dedicated columns if added)
    // For now, we'll aggregate from existing Metric columns
    const currentMetrics = await this.prisma.metric.aggregate({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        conversions: true, // Total Leads
        spend: true,
        revenue: true, // Pipeline Value
      },
    });

    const prevMetrics = await this.prisma.metric.aggregate({
      where: {
        tenantId,
        date: { gte: prevStartDate, lte: prevEndDate },
      },
      _sum: {
        conversions: true,
        spend: true,
        revenue: true,
      },
    });

    const calculateTrend = (curr: number, prev: number) => {
      if (!prev) return 0;
      return Number(((curr - prev) / prev * 100).toFixed(1));
    };

    const totalLeads = this.toNumber(currentMetrics._sum.conversions);
    const prevLeads = this.toNumber(prevMetrics._sum.conversions);
    
    const qualifiedLeads = Math.floor(totalLeads * 0.4); // Mock ratio for now
    const prevQualified = Math.floor(prevLeads * 0.4);

    const spend = this.toNumber(currentMetrics._sum.spend);
    const prevSpend = this.toNumber(prevMetrics._sum.spend);

    const cpl = totalLeads > 0 ? spend / totalLeads : 0;
    const prevCpl = prevLeads > 0 ? prevSpend / prevLeads : 0;

    const pipelineValue = this.toNumber(currentMetrics._sum.revenue);
    const prevPipeline = this.toNumber(prevMetrics._sum.revenue);

    return {
      totalLeads,
      leadsTrend: calculateTrend(totalLeads, prevLeads),
      qualifiedLeads,
      qualifiedTrend: calculateTrend(qualifiedLeads, prevQualified),
      conversionRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
      conversionTrend: 0,
      costPerLead: cpl,
      cplTrend: calculateTrend(cpl, prevCpl),
      pipelineValue,
      pipelineTrend: calculateTrend(pipelineValue, prevPipeline),
    };
  }

  async getPipelineTrends(tenantId: string, days = 30) {
    const { startDate, endDate } = DateRangeUtil.getDateRange(days);
    
    const trends = await this.prisma.metric.groupBy({
      by: ['date'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        conversions: true,
        revenue: true,
      },
      orderBy: { date: 'asc' },
    });

    return trends.map(t => ({
      date: t.date.toISOString().split('T')[0],
      leads: t._sum.conversions || 0,
      value: this.toNumber(t._sum.revenue),
    }));
  }
}
