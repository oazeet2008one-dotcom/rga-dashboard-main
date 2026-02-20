/**
 * =============================================================================
 * Tenant Reset Service
 * =============================================================================
 *
 * Provides tenant data reset functionality with two modes:
 * - Partial Reset (default): Removes operational data only
 * - Hard Reset (explicit): Removes all data including campaigns and alert definitions
 *
 * Design Principles:
 * - Safety First: Partial reset is default, hard reset requires explicit confirmation
 * - Explicit Intent: Hard reset requires confirmation token
 * - Transactional: All-or-nothing operations
 * - Audit Trail: Tracks what was deleted
 *
 * MVP Scope (Locked):
 * - Partial: metrics, alert state, runtime data
 * - Hard: + campaigns, alert definitions
 * - Identity & config preserved in both modes
 * - Confirmation token required for hard reset
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { PrismaClient, Prisma } from '@prisma/client';
import { TOKENS } from '../core/container';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'crypto';

// =============================================================================
// Domain Types
// =============================================================================

export type ResetMode = 'PARTIAL' | 'HARD';

export interface ResetConfirmation {
    readonly mode: ResetMode;
    readonly confirmedAt: Date;
    readonly confirmationToken: string;
}

export interface ResetResult {
    readonly success: boolean;
    readonly mode: ResetMode;
    readonly message: string;
    readonly data?: {
        readonly tenantId: string;
        readonly deletedMetrics: number;
        readonly deletedAlerts: number;
        readonly deletedCampaigns?: number;
        readonly deletedAlertDefinitions?: number;
        readonly durationMs: number;
    };
    readonly error?: string;
}

interface HardResetTokenRecord {
    readonly tokenId: string;
    readonly tenantId: string;
    readonly mode: ResetMode;
    readonly issuedAt: Date;
    readonly expiresAt: Date;
    readonly tokenHashHex: string;
    consumedAt: Date | null;
}

const HARD_RESET_TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes
const HARD_RESET_TOKEN_PREFIX = 'RTH';
const MAX_ACTIVE_HARD_RESET_TOKENS = 2048;

/**
 * Whitelist of tables that should NEVER be deleted
 * Identity and configuration preserved across all reset modes
 */
const PRESERVED_TABLES = [
    'Tenant',           // Core identity
    'User',             // User accounts
    'UserSession',      // Session management
    'Integration',      // Platform connections config
    'AlertRule',        // Alert definitions (partial reset)
    'Campaign',         // Campaign definitions (partial reset)
] as const;

/**
 * Tables deleted in PARTIAL reset mode
 * Operational data only
 */
const PARTIAL_RESET_TABLES = [
    'Metric',           // Historical metrics
    'Alert',            // Triggered alerts state
    'AlertHistory',     // Alert state changes
    'AnomalyDetection', // Runtime anomaly data
] as const;

/**
 * Additional tables deleted in HARD reset mode
 * Definition data + operational data
 */
const HARD_RESET_ADDITIONAL_TABLES = [
    'Campaign',         // Campaign definitions
    'AlertRule',        // Alert rule definitions
    'AlertRuleCondition', // Rule conditions
] as const;

// =============================================================================
// Service Implementation
// =============================================================================

@injectable()
export class TenantResetService {
    private readonly hardResetTokens = new Map<string, HardResetTokenRecord>();

    constructor(
        @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
    ) {}

    /**
     * Partial reset - removes operational data only (default)
     * Preserves: Tenant, Users, Campaigns, Alert Definitions, Integrations
     * Removes: Metrics, Alert State, Runtime data
     */
    async partialReset(tenantId: string): Promise<ResetResult> {
        const startTime = Date.now();

        try {
            // Validate tenant exists
            const tenant = await this.validateTenant(tenantId);
            if (!tenant) {
                return {
                    success: false,
                    mode: 'PARTIAL',
                    message: `Tenant "${tenantId}" not found.`,
                    error: 'Tenant not found',
                };
            }

            // Execute partial reset within transaction
            const result = await this.prisma.$transaction(async (tx) => {
                // Delete metrics
                const metricsResult = await tx.metric.deleteMany({
                    where: { tenantId },
                });

                // Delete alerts (triggered state)
                const alertsResult = await tx.alert.deleteMany({
                    where: { tenantId },
                });

                // Delete alert history
                const alertHistoryResult = await tx.alertHistory?.deleteMany({
                    where: { tenantId },
                }) || { count: 0 };

                return {
                    metrics: metricsResult.count,
                    alerts: alertsResult.count,
                    alertHistory: alertHistoryResult.count,
                };
            });

            const duration = Date.now() - startTime;

            return {
                success: true,
                mode: 'PARTIAL',
                message: `Partial reset completed for tenant "${tenant.name}"`,
                data: {
                    tenantId,
                    deletedMetrics: result.metrics,
                    deletedAlerts: result.alerts + result.alertHistory,
                    durationMs: duration,
                },
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                mode: 'PARTIAL',
                message: 'Partial reset failed',
                error: errorMessage,
            };
        }
    }

    /**
     * Hard reset - removes ALL tenant data (explicit operation)
     * Preserves: Tenant identity, Users, Integrations (config)
     * Removes: Everything else including Campaigns and Alert Definitions
     *
     * Requires confirmation token for safety
     */
    async hardReset(
        tenantId: string,
        confirmation: ResetConfirmation
    ): Promise<ResetResult> {
        const startTime = Date.now();

        try {
            // Validate tenant exists
            const tenant = await this.validateTenant(tenantId);
            if (!tenant) {
                return {
                    success: false,
                    mode: 'HARD',
                    message: `Tenant "${tenantId}" not found.`,
                    error: 'Tenant not found',
                };
            }

            // Validate confirmation (server-side one-time token)
            const validationError = this.validateConfirmation(tenantId, confirmation, 'HARD');
            if (validationError) {
                return {
                    success: false,
                    mode: 'HARD',
                    message: 'Hard reset failed: Invalid confirmation',
                    error: validationError,
                };
            }

            // Execute hard reset within transaction
            const result = await this.prisma.$transaction(async (tx) => {
                // Step 1: Delete operational data (same as partial)
                const metricsResult = await tx.metric.deleteMany({
                    where: { tenantId },
                });

                const alertsResult = await tx.alert.deleteMany({
                    where: { tenantId },
                });

                const alertHistoryResult = await tx.alertHistory?.deleteMany({
                    where: { tenantId },
                }) || { count: 0 };

                // Step 2: Delete alert definitions
                const alertRulesResult = await tx.alertRule.deleteMany({
                    where: { tenantId },
                });

                // Step 3: Delete campaigns
                const campaignsResult = await tx.campaign.deleteMany({
                    where: { tenantId },
                });

                return {
                    metrics: metricsResult.count,
                    alerts: alertsResult.count,
                    alertHistory: alertHistoryResult.count,
                    alertRules: alertRulesResult.count,
                    campaigns: campaignsResult.count,
                };
            });

            const duration = Date.now() - startTime;

            return {
                success: true,
                mode: 'HARD',
                message: `Hard reset completed for tenant "${tenant.name}"`,
                data: {
                    tenantId,
                    deletedMetrics: result.metrics,
                    deletedAlerts: result.alerts + result.alertHistory,
                    deletedCampaigns: result.campaigns,
                    deletedAlertDefinitions: result.alertRules,
                    durationMs: duration,
                },
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                mode: 'HARD',
                message: 'Hard reset failed',
                error: errorMessage,
            };
        }
    }

    /**
     * Generate confirmation token for hard reset
     * User must explicitly request this token before hard reset
     */
    generateConfirmationToken(tenantId: string): { token: string; expiresAt: Date } {
        this.cleanupExpiredTokens();

        if (this.hardResetTokens.size >= MAX_ACTIVE_HARD_RESET_TOKENS) {
            throw new Error(
                `Too many active hard reset confirmations (${MAX_ACTIVE_HARD_RESET_TOKENS}). ` +
                'Wait for expiry or restart service.',
            );
        }

        const tokenId = randomUUID();
        const tokenSecret = randomBytes(24).toString('base64url');
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + HARD_RESET_TOKEN_TTL_MS);
        const token = `${HARD_RESET_TOKEN_PREFIX}.${tokenId}.${tokenSecret}`;

        const record: HardResetTokenRecord = {
            tokenId,
            tenantId,
            mode: 'HARD',
            issuedAt,
            expiresAt,
            tokenHashHex: this.hashTokenSecret(tokenSecret),
            consumedAt: null,
        };

        this.hardResetTokens.set(tokenId, record);

        return { token, expiresAt };
    }

    // =========================================================================
    // Private Methods
    // =========================================================================

    private async validateTenant(tenantId: string): Promise<{ id: string; name: string } | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true },
        });
        return tenant;
    }

    private validateConfirmation(
        tenantId: string,
        confirmation: ResetConfirmation,
        expectedMode: ResetMode
    ): string | null {
        this.cleanupExpiredTokens();

        // Check mode matches
        if (confirmation.mode !== expectedMode) {
            return `Confirmation mode mismatch: expected ${expectedMode}, got ${confirmation.mode}`;
        }

        const parsed = this.parseConfirmationToken(confirmation.confirmationToken);
        if (!parsed) {
            return 'Invalid confirmation token format';
        }

        const tokenRecord = this.hardResetTokens.get(parsed.tokenId);
        if (!tokenRecord) {
            return 'Confirmation token is unknown or expired';
        }

        if (tokenRecord.mode !== expectedMode) {
            return `Confirmation token mode mismatch: expected ${expectedMode}, got ${tokenRecord.mode}`;
        }

        if (tokenRecord.tenantId !== tenantId) {
            return 'Confirmation token tenant mismatch';
        }

        if (tokenRecord.consumedAt) {
            return 'Confirmation token already used';
        }

        const now = new Date();
        if (tokenRecord.expiresAt.getTime() < now.getTime()) {
            this.hardResetTokens.delete(tokenRecord.tokenId);
            return 'Confirmation token expired (valid for 5 minutes)';
        }

        // Ensure client-provided confirmation time is bounded by token validity.
        if (confirmation.confirmedAt.getTime() < tokenRecord.issuedAt.getTime()) {
            return 'confirmedAt cannot be before token issuance';
        }
        if (confirmation.confirmedAt.getTime() > tokenRecord.expiresAt.getTime()) {
            return 'confirmedAt is outside token validity window';
        }
        if (confirmation.confirmedAt.getTime() > now.getTime() + 30_000) {
            return 'confirmedAt cannot be in the future';
        }

        if (!this.verifyTokenSecret(parsed.tokenSecret, tokenRecord.tokenHashHex)) {
            return 'Invalid confirmation token';
        }

        // One-time token: consume before destructive execution to prevent replay.
        tokenRecord.consumedAt = now;

        return null; // Valid
    }

    private cleanupExpiredTokens(referenceTime = new Date()): void {
        for (const [tokenId, record] of this.hardResetTokens.entries()) {
            const isExpired = record.expiresAt.getTime() < referenceTime.getTime();
            const isConsumedAndOld =
                record.consumedAt !== null &&
                record.consumedAt.getTime() < referenceTime.getTime() - HARD_RESET_TOKEN_TTL_MS;
            if (isExpired || isConsumedAndOld) {
                this.hardResetTokens.delete(tokenId);
            }
        }
    }

    private parseConfirmationToken(
        token: string | undefined,
    ): { tokenId: string; tokenSecret: string } | null {
        if (!token || typeof token !== 'string') {
            return null;
        }
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const [prefix, tokenId, tokenSecret] = parts;
        if (prefix !== HARD_RESET_TOKEN_PREFIX || !tokenId || !tokenSecret) {
            return null;
        }
        return { tokenId, tokenSecret };
    }

    private hashTokenSecret(secret: string): string {
        return createHash('sha256').update(secret, 'utf8').digest('hex');
    }

    private verifyTokenSecret(secret: string, expectedHashHex: string): boolean {
        const actualHash = Buffer.from(this.hashTokenSecret(secret), 'hex');
        const expectedHash = Buffer.from(expectedHashHex, 'hex');
        if (actualHash.length !== expectedHash.length) {
            return false;
        }
        return timingSafeEqual(actualHash, expectedHash);
    }
}
