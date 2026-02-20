import { AlertStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetAlertsQueryDto {
    @IsString()
    @IsNotEmpty()
    tenantId!: string;

    @IsOptional()
    @IsEnum(AlertStatus)
    status?: AlertStatus;
}
