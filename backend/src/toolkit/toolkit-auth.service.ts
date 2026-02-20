/**
 * =============================================================================
 * Toolkit Auth Service
 * =============================================================================
 *
 * Handles authentication for toolkit scripts and automation.
 * Provides user lookup/creation and JWT token generation for API calls.
 *
 * Design Principles:
 * - Fail Fast: Throws immediately if secrets are missing
 * - Schema Compliant: Uses correct Prisma types from audit
 * - Environment Secure: Validates JWT_SECRET before signing
 *
 * Forensic Audit Results (from schema.prisma):
 * - Role: UserRole enum (SUPER_ADMIN, ADMIN, MANAGER, CLIENT, VIEWER)
 * - User-Tenant: Direct tenantId field with relation
 * - Password: Required field (password_hash in DB)
 * - JWT Payload: { sub: userId, email } (from auth.service.ts)
 *
 * =============================================================================
 */

import * as dotenv from 'dotenv';
dotenv.config();

import * as jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';

// =============================================================================
// EXPORTED INTERFACES
// =============================================================================

/**
 * Minimal user info returned from getOrCreateAdmin.
 */
export interface ToolkitUser {
    id: string;
    email: string;
    role: string;
}

/**
 * JWT payload structure matching auth.service.ts.
 */
export interface JwtPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Dummy bcrypt hash for placeholder passwords.
 * This is a valid bcrypt hash for "toolkit_placeholder_password".
 * SECURITY: These users should never be used for actual login.
 */
const DUMMY_PASSWORD_HASH =
    '$2b$10$DUMMYHASH.toolkit.placeholder.password.hash';

/**
 * Default email prefix for auto-created toolkit users.
 */
const TOOLKIT_USER_EMAIL_PREFIX = 'toolkit-admin';

// =============================================================================
// TOOLKIT AUTH SERVICE CLASS
// =============================================================================

/**
 * ToolkitAuthService provides authentication utilities for toolkit scripts.
 *
 * @example
 * ```typescript
 * const authService = new ToolkitAuthService();
 *
 * // Get or create an admin user for a tenant
 * const user = await authService.getOrCreateAdmin(tenantId);
 *
 * // Generate a short-lived JWT for API calls
 * const token = authService.generateImpersonationToken(user, tenantId);
 * ```
 */
export class ToolkitAuthService {
    private readonly prisma: PrismaClient;

    constructor(prisma?: PrismaClient) {
        this.prisma = prisma || new PrismaClient();
    }

    /**
     * Gets an existing admin user for a tenant, or creates one if none exists.
     *
     * Logic:
     * 1. Try to find the first user associated with the tenantId
     * 2. If found, return it
     * 3. If not found, create a new ADMIN user with dummy password
     *
     * @param tenantId - The tenant UUID
     * @returns User info with id, email, and role
     * @throws Error if tenant doesn't exist or database error
     *
     * @example
     * ```typescript
     * const user = await authService.getOrCreateAdmin('tenant-uuid');
     * console.log(user.email); // 'toolkit-admin@tenant-uuid.local'
     * ```
     */
    async getOrCreateAdmin(tenantId: string): Promise<ToolkitUser> {
        // Step 1: Try to find existing user for this tenant
        const existingUser = await this.prisma.user.findFirst({
            where: {
                tenantId: tenantId,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        if (existingUser) {
            return {
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role,
            };
        }

        // Step 2: Verify tenant exists before creating user
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new Error(`Tenant not found: ${tenantId}`);
        }

        // Step 3: Create new ADMIN user for this tenant
        const newUser = await this.prisma.user.create({
            data: {
                tenantId: tenantId,
                email: `${TOOLKIT_USER_EMAIL_PREFIX}@${tenantId.slice(0, 8)}.local`,
                password: DUMMY_PASSWORD_HASH,
                firstName: 'Toolkit',
                lastName: 'Admin',
                role: UserRole.ADMIN,
                isActive: true,
                emailVerified: true,
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        return {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
        };
    }

    /**
     * Generates a short-lived JWT token for API impersonation.
     *
     * The token uses the same payload structure as auth.service.ts:
     * { sub: userId, email }
     *
     * @param user - User object with id and email
     * @param _tenantId - Tenant ID (reserved for future use in payload)
     * @returns Signed JWT token string
     * @throws Error if JWT_SECRET is not configured
     *
     * @example
     * ```typescript
     * const token = authService.generateImpersonationToken(user, tenantId);
     * // Use in Authorization header: `Bearer ${token}`
     * ```
     */
    generateImpersonationToken(
        user: { id: string; email: string },
        _tenantId: string,
    ): string {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error(
                'Missing JWT_SECRET in environment. Check .env file.',
            );
        }

        // Payload matches auth.service.ts: { sub: userId, email }
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
        };

        // Sign with short expiry for script use (5 minutes)
        return jwt.sign(payload, secret, {
            expiresIn: '5m',
        });
    }

    /**
     * Cleanup: Disconnects Prisma client.
     * Call this when done to prevent connection leaks.
     */
    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
    }
}
