// src/types/auth.ts
// =============================================================================
// Authentication Types - Per AUTH_INTERFACE_CONTRACT.md
// =============================================================================

/**
 * Sanitized User DTO for API responses
 * ⚠️ SECURITY: password, failedLoginCount, lockedUntil are excluded
 */
export interface AuthUser {
    /** UUID v4 */
    id: string;

    /** User email address */
    email: string;

    /** User display name */
    name: string;

    /** User role */
    role: 'ADMIN' | 'MANAGER' | 'VIEWER';

    /** Associated tenant/company */
    tenant: {
        id: string;
        name: string;
    };
}

/**
 * JWT Token Pair
 */
export interface AuthTokens {
    /** Short-lived access token (default: 15m) */
    accessToken: string;

    /** Long-lived refresh token (default: 7d) */
    refreshToken: string;
}

/**
 * Login Response - User + Tokens
 */
export interface LoginResponse extends AuthTokens {
    user: AuthUser;
}

/**
 * Register Response - Same as Login
 */
export interface RegisterResponse extends AuthTokens {
    user: AuthUser;
}

/**
 * Refresh Token Response - New Tokens Only
 */
export interface RefreshTokenResponse extends AuthTokens {
    // No user object - client should already have it
}

// =============================================================================
// Request DTOs
// =============================================================================

/**
 * Login Request
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    companyName: string;
}

/**
 * Refresh Token Request
 */
export interface RefreshTokenRequest {
    refreshToken: string;
}

// =============================================================================
// Error Response Types (Per Contract)
// =============================================================================

/**
 * Standard Error Codes from AUTH_INTERFACE_CONTRACT.md
 */
export type AuthErrorCode =
    | 'INVALID_CREDENTIALS'
    | 'ACCOUNT_LOCKED'
    | 'EMAIL_EXISTS'
    | 'VALIDATION_ERROR'
    | 'TOKEN_EXPIRED'
    | 'INVALID_REFRESH_TOKEN'
    | 'INTERNAL_ERROR';

/**
 * Auth Error Response
 */
export interface AuthErrorResponse {
    success: false;
    error: AuthErrorCode;
    message: string;
    statusCode: number;
    lockoutMinutes?: number;      // For ACCOUNT_LOCKED
    remainingAttempts?: number;   // For INVALID_CREDENTIALS
    errors?: Array<{              // For VALIDATION_ERROR
        field: string;
        message: string;
    }>;
}
