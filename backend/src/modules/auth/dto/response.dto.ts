import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

/**
 * Tenant DTO for nested responses
 */
export class TenantDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'RGA Company' })
    name: string;
}

/**
 * Sanitized User DTO for API responses
 * ⚠️ SECURITY: Excludes password hash and internal security fields
 * Per AUTH_INTERFACE_CONTRACT.md specification
 */
export class UserResponseDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'admin@rga.co.th' })
    email: string;

    @ApiProperty({ example: 'Admin User' })
    name: string;

    @ApiProperty({ enum: UserRole, example: 'ADMIN' })
    role: UserRole;

    @ApiProperty({ type: TenantDto })
    tenant: TenantDto;
}

/**
 * Auth Tokens DTO
 */
export class AuthTokensDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Short-lived access token (default: 15m)'
    })
    accessToken: string;

    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Long-lived refresh token (default: 7d)'
    })
    refreshToken: string;
}

/**
 * Login/Register Response DTO
 */
export class AuthResponseDto extends AuthTokensDto {
    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;
}

/**
 * Refresh Token Response DTO
 */
export class RefreshResponseDto extends AuthTokensDto {
    // Only tokens, no user object
}
