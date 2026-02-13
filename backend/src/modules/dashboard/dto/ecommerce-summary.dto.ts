import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EcommercePeriod {
  D7 = '7d',
  D30 = '30d',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
}

export class GetEcommerceSummaryDto {
  @IsOptional()
  @IsEnum(EcommercePeriod)
  @ApiProperty({ enum: EcommercePeriod, default: EcommercePeriod.D30, required: false })
  period?: EcommercePeriod;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  tenantId?: string;
}

export class EcommerceSummaryResponseDto {
  totalRevenue: number;
  revenueTrend: number;
  totalOrders: number;
  ordersTrend: number;
  averageOrderValue: number;
  aovTrend: number;
  conversionRate: number;
  crTrend: number;
  cartAbandonmentRate: number;
  abandonmentTrend: number;
}
