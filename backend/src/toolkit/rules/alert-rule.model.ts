/**
 * =============================================================================
 * Alert Rule Model
 * =============================================================================
 *
 * Domain-level definition of an Alert Rule.
 *
 * Design Principles:
 * - Explicit: Every field is clear and typed
 * - Serializable: JSON-safe, no executable logic
 * - Deterministic: Same input always produces same behavior
 * - Tenant-scoped: Rules belong to a specific tenant
 *
 * This is a PURE DATA MODEL. No methods, no logic, no side effects.
 * =============================================================================
 */

import { AlertCondition } from '../services/alert-engine.service';

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Severity levels for alert rules
 * Ordered from least to most severe
 */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Rule scope determines what the rule evaluates against
 */
export type RuleScope = 'CAMPAIGN' | 'ACCOUNT';

/**
 * Core Alert Rule model
 *
 * This is a pure data structure. No methods, no logic.
 * All validation happens in RuleValidator.
 */
export interface AlertRule {
    /**
     * Unique identifier for the rule
     * Format: rule-{tenant}-{timestamp}-{random}
     */
    readonly id: string;

    /**
     * Tenant that owns this rule
     */
    readonly tenantId: string;

    /**
     * Human-readable name
     */
    readonly name: string;

    /**
     * Optional description for documentation
     */
    readonly description?: string;

    /**
     * Whether the rule is enabled for evaluation
     * Disabled rules are loaded but never evaluated
     */
    readonly enabled: boolean;

    /**
     * Severity level of alerts produced by this rule
     */
    readonly severity: AlertSeverity;

    /**
     * Scope of evaluation (single campaign vs entire account)
     */
    readonly scope: RuleScope;

    /**
     * Alert condition to evaluate
     * See AlertEngine for condition types
     */
    readonly condition: AlertCondition;

    /**
     * Metadata for developer tooling (not used in evaluation)
     */
    readonly metadata?: {
        readonly createdBy?: string;
        readonly createdAt?: string; // ISO date
        readonly tags?: string[];
        readonly category?: string;
    };
}

// =============================================================================
// Rule Creation Helpers
// =============================================================================

/**
 * Factory function to create a valid AlertRule
 * Provides sensible defaults and validation hints
 */
export function createAlertRule(
    params: {
        tenantId: string;
        name: string;
        condition: AlertCondition;
        id?: string;
        description?: string;
        enabled?: boolean;
        severity?: AlertSeverity;
        scope?: RuleScope;
        metadata?: AlertRule['metadata'];
    }
): AlertRule {
    return {
        id: params.id ?? generateRuleId(params.tenantId),
        tenantId: params.tenantId,
        name: params.name,
        description: params.description,
        enabled: params.enabled ?? true,
        severity: params.severity ?? 'MEDIUM',
        scope: params.scope ?? 'CAMPAIGN',
        condition: params.condition,
        metadata: params.metadata,
    };
}

/**
 * Generate a deterministic rule ID
 */
function generateRuleId(tenantId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `rule-${tenantId}-${timestamp}-${random}`;
}

// =============================================================================
// Severity Utilities
// =============================================================================

/**
 * Severity priority order (for sorting)
 */
export const SEVERITY_PRIORITY: Record<AlertSeverity, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
};

/**
 * Compare two severities
 * Returns: negative if a < b, 0 if equal, positive if a > b
 */
export function compareSeverity(a: AlertSeverity, b: AlertSeverity): number {
    return SEVERITY_PRIORITY[a] - SEVERITY_PRIORITY[b];
}

/**
 * Check if severity meets minimum threshold
 */
export function isSeverityAtLeast(
    severity: AlertSeverity,
    minimum: AlertSeverity
): boolean {
    return SEVERITY_PRIORITY[severity] >= SEVERITY_PRIORITY[minimum];
}
