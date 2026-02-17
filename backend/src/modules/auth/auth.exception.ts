/**
 * Auth Module Domain Exceptions
 * 
 * These exceptions provide structured error responses with:
 * - error: Machine-readable error code
 * - message: Human-readable description
 * - meta: Contextual data (e.g., lockoutMinutes, remainingAttempts)
 * 
 * Used by GlobalExceptionFilter to return standardized API errors.
 */

import { UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';

// =============================================================================
// Authentication Errors (401 Unauthorized)
// =============================================================================

/**
 * Thrown when login credentials are invalid
 * @param remainingAttempts - Number of attempts before account lockout
 */
export class InvalidCredentialsException extends UnauthorizedException {
    constructor(remainingAttempts?: number) {
        const hasRemainingInfo = remainingAttempts !== undefined && remainingAttempts > 0;
        super({
            error: 'INVALID_CREDENTIALS',
            message: hasRemainingInfo
                ? `Invalid credentials. ${remainingAttempts} attempts remaining.`
                : 'Invalid credentials',
            meta: hasRemainingInfo ? { remainingAttempts } : undefined,
        });
    }
}

/**
 * Thrown when account is locked due to too many failed login attempts
 * @param lockoutMinutes - Minutes until account unlocks
 */
export class AccountLockedException extends UnauthorizedException {
    constructor(lockoutMinutes: number) {
        super({
            error: 'ACCOUNT_LOCKED',
            message: `Account is locked. Try again in ${lockoutMinutes} minutes.`,
            meta: { lockoutMinutes },
        });
    }
}

/**
 * Thrown when refresh token has expired
 */
export class TokenExpiredException extends UnauthorizedException {
    constructor() {
        super({
            error: 'TOKEN_EXPIRED',
            message: 'Your session has expired. Please login again.',
        });
    }
}

/**
 * Thrown when refresh token has already been used (rotation security)
 */
export class TokenRevokedException extends UnauthorizedException {
    constructor() {
        super({
            error: 'TOKEN_REVOKED',
            message: 'Token has been revoked. Please login again.',
        });
    }
}

/**
 * Thrown when user is not found during token refresh
 */
export class UserNotFoundException extends UnauthorizedException {
    constructor() {
        super({
            error: 'USER_NOT_FOUND',
            message: 'User not found',
        });
    }
}

/**
 * Thrown when user account is inactive/disabled
 */
export class AccountInactiveException extends ForbiddenException {
    constructor() {
        super({
            error: 'ACCOUNT_INACTIVE',
            message: 'Account is deactivated. Please contact support.',
        });
    }
}

/**
 * Thrown when user tries to login before verifying email
 */
export class EmailNotVerifiedException extends ForbiddenException {
    constructor() {
        super({
            error: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email before logging in.',
        });
    }
}

/**
 * Thrown when email verification token is invalid
 */
export class InvalidEmailVerificationTokenException extends UnauthorizedException {
    constructor() {
        super({
            error: 'INVALID_EMAIL_VERIFICATION_TOKEN',
            message: 'Invalid verification token.',
        });
    }
}

/**
 * Thrown when email verification token is expired
 */
export class EmailVerificationTokenExpiredException extends UnauthorizedException {
    constructor() {
        super({
            error: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
            message: 'Verification token has expired. Please request a new one.',
        });
    }
}

// =============================================================================
// Registration Errors (409 Conflict)
// =============================================================================

/**
 * Thrown when attempting to register with an already-used email
 */
export class EmailExistsException extends ConflictException {
    constructor() {
        super({
            error: 'EMAIL_EXISTS',
            message: 'This email is already registered. Please login instead.',
        });
    }
}

/**
 * Thrown when attempting to register with an already-used username
 */
export class UsernameExistsException extends ConflictException {
    constructor() {
        super({
            error: 'USERNAME_EXISTS',
            message: 'This username is already taken. Please choose another one.',
        });
    }
}

/**
 * Thrown when user does not accept terms during registration
 */
export class TermsNotAcceptedException extends ForbiddenException {
    constructor() {
        super({
            error: 'TERMS_NOT_ACCEPTED',
            message: 'You must accept the Terms & Conditions to create an account.',
        });
    }
}
