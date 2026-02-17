import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeUtil } from '../../common/utils/date-range.util';
import { GetEcommerceSummaryDto, EcommerceSummaryResponseDto, EcommercePeriod } from './dto/ecommerce-summary.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EcommerceService {
  constructor(private readonly prisma: PrismaService) {}

  private toNumber(value: Prisma.Decimal | number | string | null | undefined, defaultValue = 0): number {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
    return Number(value);
  }

  async getSummary(tenantId: string, query: GetEcommerceSummaryDto): Promise<EcommerceSummaryResponseDto> {
    const days = query.period === EcommercePeriod.D7 ? 7 : 30;
    const { startDate, endDate } = DateRangeUtil.getDateRange(days);
    const { startDate: prevStartDate, endDate: prevEndDate } = DateRangeUtil.getPreviousPeriodDateRange(startDate, days);

    const currentMetrics = await this.prisma.metric.aggregate({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        revenue: true,
        orders: true,
        spend: true,
      },
      _avg: {
        averageOrderValue: true,
        conversionRate: true,
        cartAbandonmentRate: true,
      },
    });

    const prevMetrics = await this.prisma.metric.aggregate({
      where: {
        tenantId,
        date: { gte: prevStartDate, lte: prevEndDate },
      },
      _sum: {
        revenue: true,
        orders: true,
      },
      _avg: {
        averageOrderValue: true,
        conversionRate: true,
        cartAbandonmentRate: true,
      },
    });

    const calculateTrend = (curr: number, prev: number) => {
      if (!prev) return 0;
      return Number(((curr - prev) / prev * 100).toFixed(1));
    };

    const totalRevenue = this.toNumber(currentMetrics._sum.revenue);
    const prevRevenue = this.toNumber(prevMetrics._sum.revenue);
    
    const totalOrders = currentMetrics._sum.orders || 0;
    const prevOrders = prevMetrics._sum.orders || 0;

    const aov = this.toNumber(currentMetrics._avg.averageOrderValue);
    const prevAov = this.toNumber(prevMetrics._avg.averageOrderValue);

    const cr = this.toNumber(currentMetrics._avg.conversionRate);
    const prevCr = this.toNumber(prevMetrics._avg.conversionRate);

    const car = this.toNumber(currentMetrics._avg.cartAbandonmentRate);
    const prevCar = this.toNumber(prevMetrics._avg.cartAbandonmentRate);

    return {
      totalRevenue,
      revenueTrend: calculateTrend(totalRevenue, prevRevenue),
      totalOrders,
      ordersTrend: calculateTrend(totalOrders, prevOrders),
      averageOrderValue: aov,
      aovTrend: calculateTrend(aov, prevAov),
      conversionRate: cr,
      crTrend: calculateTrend(cr, prevCr),
      cartAbandonmentRate: car,
      abandonmentTrend: calculateTrend(car, prevCar),
    };
  }

  async getSalesTrends(tenantId: string, days = 30) {
    const { startDate, endDate } = DateRangeUtil.getDateRange(days);
    
    const trends = await this.prisma.metric.groupBy({
      by: ['date'],
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: {
        revenue: true,
        orders: true,
      },
      orderBy: { date: 'asc' },
    });

    return trends.map(t => ({
      date: t.date.toISOString().split('T')[0],
      revenue: this.toNumber(t._sum.revenue),
      orders: t._sum.orders || 0,
    }));
  }
}
