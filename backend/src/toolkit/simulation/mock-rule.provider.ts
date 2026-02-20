/**
 * =============================================================================
 * Mock Rule Provider
 * =============================================================================
 *
 * Implementation of IRuleProvider that loads alert rules from fixture files.
 * Provides deterministic, tenant-scoped rule resolution for simulation.
 *
 * Phase 2.2.3 Update:
 * - Now delegates to FixtureRuleSource from rules module
 * - Maintains same API for backward compatibility
 * - Adds validation via RuleValidator
 *
 * Design Principles:
 * - Stateless: No instance state
 * - Deterministic: Same context → same rules
 * - Replaceable: Can be swapped with real DB provider later
 * - Side-effect free: Only reads fixtures
 * =============================================================================
 */

import { IRuleProvider } from '../services/alert-execution.service';
import { AlertRule } from '../rules/alert-rule.model';
import { SimulationContext } from './simulation-context';
import { FixtureRuleSource, RuleValidator } from '../rules';

/**
 * Mock implementation of IRuleProvider
 * Wraps FixtureRuleSource for fixture-based rule loading
 */
export class MockRuleProvider implements IRuleProvider {
    private readonly source: FixtureRuleSource;

    constructor(private readonly context: SimulationContext) {
        // Create FixtureRuleSource with context-appropriate fixtures path
        this.source = new FixtureRuleSource(
            new RuleValidator(),
            undefined, // Use default logger
            this.context.fixtureBasePath
                ? `${this.context.fixtureBasePath}/rules`
                : undefined
        );
    }

    /**
     * Resolve alert rules for the configured tenant
     *
     * Resolution strategy:
     * 1. Try to load from scenario-specific fixture
     * 2. Try to load from tenant-specific fixture
     * 3. Fall back to default rules
     */
    async resolveRules(tenantId: string): Promise<AlertRule[]> {
        // Validate tenant matches context
        if (tenantId !== this.context.tenantId) {
            throw new Error(
                `Tenant mismatch: provider configured for ${this.context.tenantId}, ` +
                `but resolveRules called with ${tenantId}`
            );
        }

        // Delegate to FixtureRuleSource
        const rules = await this.source.loadRules(tenantId);

        // Return default rules if none found
        if (rules.length === 0) {
            return DEFAULT_RULES;
        }

        return rules;
    }

    /**
     * Clear fixture cache (for testing)
     */
    static clearCache(): void {
        // No-op - cache is managed by FixtureRuleSource
    }
}

/**
 * Default alert rules for simulation
 * Used when no fixtures are found
 */
export const DEFAULT_RULES: AlertRule[] = [
    {
        id: 'rule-high-spend',
        tenantId: 'tenant-1',
        name: 'High Daily Spend',
        condition: {
            type: 'THRESHOLD',
            metric: 'spend',
            operator: 'GT',
            value: 10000,
        },
        severity: 'HIGH',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-zero-conversions',
        tenantId: 'tenant-1',
        name: 'Budget Burn - Zero Conversions',
        condition: {
            type: 'ZERO_CONVERSIONS',
            minSpend: 5000,
        },
        severity: 'CRITICAL',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-low-roas',
        tenantId: 'tenant-1',
        name: 'Low ROAS',
        condition: {
            type: 'THRESHOLD',
            metric: 'roas',
            operator: 'LT',
            value: 1.0,
        },
        severity: 'MEDIUM',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-high-ctr-drop',
        tenantId: 'tenant-1',
        name: 'CTR Significant Drop',
        condition: {
            type: 'DROP_PERCENT',
            metric: 'ctr',
            thresholdPercent: 30,
        },
        severity: 'HIGH',
        scope: 'CAMPAIGN',
        enabled: true,
    },
    {
        id: 'rule-low-conversion-rate',
        tenantId: 'tenant-1',
        name: 'Low Conversion Rate',
        condition: {
            type: 'THRESHOLD',
            metric: 'cvr',
            operator: 'LT',
            value: 0.01,
        },
        severity: 'LOW',
        scope: 'CAMPAIGN',
        enabled: false, // Disabled by default
    },
];
