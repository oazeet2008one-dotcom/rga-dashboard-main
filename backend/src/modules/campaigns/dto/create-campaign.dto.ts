import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString, IsPositive } from 'class-validator';
import { CampaignStatus, AdPlatform } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale 2024' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AdPlatform })
  @Transform(({ value }) => {
    if (!value) return value;
    const upper = value.toUpperCase();
    if (upper === 'GOOGLE') return 'GOOGLE_ADS';
    if (upper === 'LINE') return 'LINE_ADS';
    return upper;
  })
  @IsEnum(AdPlatform)
  platform: AdPlatform;

  @ApiProperty({ enum: CampaignStatus, example: 'ACTIVE' })
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(CampaignStatus)
  status: CampaignStatus;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive()
  budget: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'google_ads_campaign_123', required: false })
  @IsString()
  @IsOptional()
  externalId?: string;
}
