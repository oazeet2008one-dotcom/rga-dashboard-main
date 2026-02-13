import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CrmPeriod {
  D7 = '7d',
  D30 = '30d',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
}

export class GetCrmSummaryDto {
  @IsOptional()
  @IsEnum(CrmPeriod)
  @ApiProperty({ enum: CrmPeriod, default: CrmPeriod.D30, required: false })
  period?: CrmPeriod;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  tenantId?: string;
}

export class CrmSummaryResponseDto {
  totalLeads: number;
  leadsTrend: number;
  qualifiedLeads: number;
  qualifiedTrend: number;
  conversionRate: number;
  conversionTrend: number;
  costPerLead: number;
  cplTrend: number;
  pipelineValue: number;
  pipelineTrend: number;
}
