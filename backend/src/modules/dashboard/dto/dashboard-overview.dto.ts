import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus, AdPlatform } from '@prisma/client';

// ============================================================
// Query DTO
// ============================================================

/**
 * Enum for dashboard period filter
 */
export enum PeriodEnum {
    SEVEN_DAYS = '7d',
    THIRTY_DAYS = '30d',
    THIS_MONTH = 'this_month',
    LAST_MONTH = 'last_month',
}

/**
 * Query parameters for GET /api/v1/dashboard/overview
 */
export class GetDashboardOverviewDto {
    @ApiPropertyOptional({
        enum: PeriodEnum,
        default: PeriodEnum.SEVEN_DAYS,
        description: 'Time period for aggregation',
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

// ============================================================
// Response DTOs
// ============================================================

/**
 * Aggregated summary metrics
 */
export class SummaryMetricsDto {
    @ApiProperty({ example: 455000 })
    totalImpressions: number;

    @ApiProperty({ example: 18500 })
    totalClicks: number;

    @ApiProperty({ example: 42500.0 })
    totalCost: number;

    @ApiProperty({ example: 625 })
    totalConversions: number;

    @ApiProperty({ example: 4.07, description: 'Calculated CTR percentage' })
    averageCtr: number;

    @ApiProperty({ example: 3.85, description: 'Calculated ROAS' })
    averageRoas: number;
}

/**
 * Growth metrics (percentage change vs previous period)
 */
export class GrowthMetricsDto {
    @ApiProperty({ example: 12.5, nullable: true })
    impressionsGrowth: number | null;

    @ApiProperty({ example: 8.3, nullable: true })
    clicksGrowth: number | null;

    @ApiProperty({ example: -5.2, nullable: true })
    costGrowth: number | null;

    @ApiProperty({ example: 15.7, nullable: true })
    conversionsGrowth: number | null;
}

/**
 * Daily trend data point for charts
 */
export class TrendDataPointDto {
    @ApiProperty({ example: '2026-01-15' })
    date: string;

    @ApiProperty({ example: 65000 })
    impressions: number;

    @ApiProperty({ example: 2650 })
    clicks: number;

    @ApiProperty({ example: 6100.0 })
    cost: number;

    @ApiProperty({ example: 95 })
    conversions: number;
}

/**
 * Recent campaign summary
 */
export class RecentCampaignDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
    id: string;

    @ApiProperty({ example: 'Summer Sale 2026' })
    name: string;

    @ApiProperty({ enum: CampaignStatus, example: 'ACTIVE' })
    status: CampaignStatus;

    @ApiProperty({ enum: AdPlatform, example: 'GOOGLE_ADS' })
    platform: AdPlatform;

    @ApiProperty({ example: 28500.0 })
    spending: number;

    @ApiProperty({ example: 57.0, required: false })
    budgetUtilization?: number;
}

/**
 * Response metadata
 */
export class ResponseMetaDto {
    @ApiProperty({ enum: PeriodEnum, example: '7d' })
    period: PeriodEnum;

    @ApiProperty({
        example: { from: '2026-01-09', to: '2026-01-15' },
    })
    dateRange: {
        from: string;
        to: string;
    };

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    tenantId: string;

    @ApiProperty({ example: '2026-01-15T11:06:26+07:00' })
    generatedAt: string;
}

/**
 * Dashboard overview data payload
 */
export class DashboardOverviewDataDto {
    @ApiProperty({ type: SummaryMetricsDto })
    summary: SummaryMetricsDto;

    @ApiProperty({ type: GrowthMetricsDto })
    growth: GrowthMetricsDto;

    @ApiProperty({ type: [TrendDataPointDto] })
    trends: TrendDataPointDto[];

    @ApiProperty({ type: [RecentCampaignDto] })
    recentCampaigns: RecentCampaignDto[];
}

/**
 * Full response structure for GET /api/v1/dashboard/overview
 */
export class DashboardOverviewResponseDto {
    @ApiProperty({ example: true })
    success: boolean;

    @ApiProperty({ type: DashboardOverviewDataDto })
    data: DashboardOverviewDataDto;

    @ApiProperty({ type: ResponseMetaDto })
    meta: ResponseMetaDto;
}
