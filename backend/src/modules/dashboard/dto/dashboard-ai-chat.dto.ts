import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PeriodEnum } from './dashboard-overview.dto';

export enum DashboardAiChatIntent {
  SUMMARY = 'SUMMARY',
  REVENUE = 'REVENUE',
  OVER_BUDGET = 'OVER_BUDGET',
  CPC = 'CPC',
  PERFORMANCE = 'PERFORMANCE',
  TOP_CAMPAIGN = 'TOP_CAMPAIGN',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
}

export enum DashboardAiChatQueryType {
  SQL = 'SQL',
  ANALYSIS = 'ANALYSIS',
}

export class DashboardAiChatRequestDto {
  @ApiProperty({
    example: 'เนเธเธฃเธเธเธฒเธฃเนเธซเธเธเธณเธฅเธฑเธเนเธเนเธ—เธฃเธฑเธเธขเธฒเธเธฃเน€เธเธดเธเธเธ?',
    description: 'Natural language question (Thai/English)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  question: string;

  @ApiPropertyOptional({
    enum: PeriodEnum,
    default: PeriodEnum.SEVEN_DAYS,
    description: 'Time period for analytics scope',
  })
  @IsOptional()
  @IsEnum(PeriodEnum, {
    message: 'period must be one of: 7d, 30d, this_month, last_month',
  })
  period?: PeriodEnum = PeriodEnum.SEVEN_DAYS;

  @ApiPropertyOptional({
    description: 'Tenant ID override (SUPER_ADMIN only)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'tenantId must be a valid UUID' })
  tenantId?: string;
}

export class DashboardAiChatEvidenceDto {
  @ApiProperty({ example: 'Cost' })
  label: string;

  @ApiProperty({ example: 'เธฟ58,231' })
  value: string;
}

export class DashboardAiChatDataDto {
  @ApiProperty({ example: 'เนเธเธฃเธเธเธฒเธฃเนเธซเธเธเธณเธฅเธฑเธเนเธเนเธ—เธฃเธฑเธเธขเธฒเธเธฃเน€เธเธดเธเธเธ?' })
  question: string;

  @ApiProperty({ enum: DashboardAiChatIntent, example: DashboardAiChatIntent.OVER_BUDGET })
  intent: DashboardAiChatIntent;

  @ApiProperty({ enum: DashboardAiChatQueryType, example: DashboardAiChatQueryType.SQL })
  queryType: DashboardAiChatQueryType;

  @ApiProperty({
    example: 'เนเธเธกเน€เธเธ Brand Search เนเธเนเธเธ 124.3% เธเธญเธ budget เนเธเธเนเธงเธเน€เธงเธฅเธฒเธ—เธตเนเน€เธฅเธทเธญเธ',
  })
  answer: string;

  @ApiPropertyOptional({
    example: "SELECT name, budget, spending FROM campaigns WHERE tenant_id = '...' ORDER BY spending DESC LIMIT 3;",
  })
  generatedQuery?: string;

  @ApiProperty({ type: [DashboardAiChatEvidenceDto] })
  evidence: DashboardAiChatEvidenceDto[];
}

export class DashboardAiChatMetaDto {
  @ApiProperty({ enum: PeriodEnum, example: PeriodEnum.SEVEN_DAYS })
  period: PeriodEnum;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tenantId: string;

  @ApiProperty({ example: '2026-02-16T09:10:11.000Z' })
  generatedAt: string;
}

export class DashboardAiChatResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DashboardAiChatDataDto })
  data: DashboardAiChatDataDto;

  @ApiProperty({ type: DashboardAiChatMetaDto })
  meta: DashboardAiChatMetaDto;
}

