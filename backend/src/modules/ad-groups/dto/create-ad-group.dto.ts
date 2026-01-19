import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsNumber,
    IsOptional,
    IsUUID,
    IsPositive,
    IsObject,
} from 'class-validator';
import { AdGroupStatus } from '@prisma/client';

export class CreateAdGroupDto {
    @ApiProperty({ example: 'Ad Group - Thailand Audience', description: 'Ad group name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Parent Campaign ID (UUID)' })
    @IsUUID()
    @IsNotEmpty()
    campaignId: string;

    @ApiPropertyOptional({ enum: AdGroupStatus, default: 'ACTIVE', description: 'Ad group status' })
    @Transform(({ value }) => value?.toUpperCase())
    @IsEnum(AdGroupStatus)
    @IsOptional()
    status?: AdGroupStatus;

    @ApiPropertyOptional({ example: 5000, description: 'Budget in THB' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    budget?: number;

    @ApiPropertyOptional({ example: 2.50, description: 'Bid amount per click/impression' })
    @IsNumber()
    @IsPositive()
    @IsOptional()
    bidAmount?: number;

    @ApiPropertyOptional({ example: 'CPC', description: 'Bid type (CPC, CPM, CPA)' })
    @IsString()
    @IsOptional()
    bidType?: string;

    @ApiPropertyOptional({ description: 'Targeting configuration (JSON object)' })
    @IsObject()
    @IsOptional()
    targeting?: Record<string, unknown>;

    @ApiPropertyOptional({ example: 'ext_adgroup_123', description: 'External platform ID' })
    @IsString()
    @IsOptional()
    externalId?: string;
}
