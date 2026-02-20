import { IsNotEmpty, IsString } from 'class-validator';

export class ResetTenantHardTokenDto {
    @IsString()
    @IsNotEmpty()
    tenantId!: string;
}
