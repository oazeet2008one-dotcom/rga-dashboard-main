import { IsOptional, IsString, IsInt, Min, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCampaignsDto {
  @ApiPropertyOptional({ description: 'Search by campaign name or external ID' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by platform (GOOGLE_ADS, FACEBOOK, TIKTOK, etc.)' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Filter by status (ACTIVE, PAUSED, DRAFT, etc.)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit: number = 10;

  @ApiPropertyOptional({
    enum: [
      'name', 'createdAt', 'status', 'platform',
      'spend', 'impressions', 'clicks', 'revenue', 'conversions',
      'ctr', 'cpc', 'cpm', 'roas', 'roi'
    ],
    description: 'Field to sort by'
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    description: 'Sort direction'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  // ==========================================================================
  // NEW: Time-Window Filtering for Metrics Aggregation
  // ==========================================================================

  @ApiPropertyOptional({
    description: 'Start date for metrics aggregation (ISO 8601: YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a valid ISO 8601 date string (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for metrics aggregation (ISO 8601: YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string (YYYY-MM-DD)' })
  endDate?: string;
}
