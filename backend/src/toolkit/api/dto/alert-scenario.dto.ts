import { Transform, Type } from 'class-transformer';
import {
    Equals,
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateIf,
} from 'class-validator';
import { toOptionalBoolean } from './boolean-transformer';

export class AlertScenarioDto {
    @IsString()
    @IsNotEmpty()
    tenantId!: string;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @IsBoolean()
    seedBaseline: boolean = true;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @IsBoolean()
    injectAnomaly: boolean = true;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(365)
    days: number = 30;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @IsBoolean()
    dryRun: boolean = true;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @ValidateIf((dto: AlertScenarioDto) => dto.dryRun === false)
    @Equals(true, { message: 'confirmWrite must be true when dryRun is false' })
    @IsBoolean()
    confirmWrite: boolean = false;
}
