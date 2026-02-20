import { Transform } from 'class-transformer';
import {
    Equals,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';
import { toOptionalBoolean } from './boolean-transformer';

export class ResetTenantDto {
    @IsString()
    @IsNotEmpty()
    tenantId!: string;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @IsBoolean()
    dryRun: boolean = true;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @ValidateIf((dto: ResetTenantDto) => dto.dryRun === false)
    @Equals(true, { message: 'confirmWrite must be true when dryRun is false' })
    @IsBoolean()
    confirmWrite: boolean = false;
}
