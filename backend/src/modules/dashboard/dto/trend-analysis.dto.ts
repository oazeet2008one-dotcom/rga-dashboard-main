import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TrendPeriod {
  D7 = '7d',
  D30 = '30d',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
}

export class GetTrendAnalysisDto {
  @IsOptional()
  @IsEnum(TrendPeriod)
  @ApiProperty({ enum: TrendPeriod, default: TrendPeriod.D30, required: false })
  period?: TrendPeriod;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  tenantId?: string;
}

export class TrendDataResponseDto {
  date: string;
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  sessions: number;
}
