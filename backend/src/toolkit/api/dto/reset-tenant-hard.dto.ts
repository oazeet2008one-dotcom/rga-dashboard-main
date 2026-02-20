import { Transform } from 'class-transformer';
import {
    Equals,
    IsBoolean,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateIf,
} from 'class-validator';
import { toOptionalBoolean } from './boolean-transformer';

export class ResetTenantHardDto {
    @IsString()
    @IsNotEmpty()
    tenantId!: string;

    @IsString()
    @IsNotEmpty()
    confirmationToken!: string;

    @IsDateString()
    confirmedAt!: string;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @IsBoolean()
    dryRun: boolean = true;

    @IsOptional()
    @Transform(toOptionalBoolean)
    @ValidateIf((dto: ResetTenantHardDto) => dto.dryRun === false)
    @Equals(true, { message: 'confirmWrite must be true when dryRun is false' })
    @IsBoolean()
    confirmWrite: boolean = false;

    @IsString()
    @Equals('HARD_RESET')
    destructiveAck!: string;
}
