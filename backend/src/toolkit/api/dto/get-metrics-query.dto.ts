import { Type } from 'class-transformer';
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { IsAfterOrEqual } from './date-order.validator';

export class GetMetricsQueryDto {
    @IsString()
    @IsNotEmpty()
    tenantId!: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    campaignId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    @IsAfterOrEqual('startDate', {
        message: 'endDate must be greater than or equal to startDate',
    })
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5000)
    limit: number = 1000;
}
