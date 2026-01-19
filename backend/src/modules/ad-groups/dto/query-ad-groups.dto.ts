import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAdGroupsDto {
    @ApiPropertyOptional({ description: 'Filter by parent campaign ID (UUID)' })
    @IsUUID()
    @IsOptional()
    campaignId?: string;

    @ApiPropertyOptional({ description: 'Search by ad group name' })
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by status (ACTIVE, PAUSED, DELETED, ARCHIVED)' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ default: 10 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit: number = 10;

    @ApiPropertyOptional({ default: 1 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    page: number = 1;

    @ApiPropertyOptional({ enum: ['name', 'createdAt', 'status', 'budget'] })
    @IsOptional()
    @IsString()
    sortBy?: string;

    @ApiPropertyOptional({ enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';
}
