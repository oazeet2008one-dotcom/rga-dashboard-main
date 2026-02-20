/**
 * =============================================================================
 * Rule Source Adapter
 * =============================================================================
 *
 * Bridges IRuleSource implementations to the IRuleProvider interface.
 *
 * This adapter allows the rules module to be plugged into AlertExecutionService
 * without changing the existing IRuleProvider contract.
 *
 * Usage:
 * ```typescript
 * const fixtureSource = new FixtureRuleSource();
 * const provider = new RuleSourceAdapter(fixtureSource);
 *
 * // Now use with AlertExecutionService
 * const result = await executionService.execute(context, provider, metricProvider);
 * ```
 * =============================================================================
 */

import { IRuleProvider } from '../services/alert-execution.service';
import { IRuleSource } from './rule-source.fixture';
import { AlertRule } from './alert-rule.model';

/**
 * Adapter that wraps IRuleSource to implement IRuleProvider
 */
export class RuleSourceAdapter implements IRuleProvider {
    constructor(private readonly source: IRuleSource) {}

    /**
     * Resolve rules for a tenant
     * Delegates to underlying IRuleSource.loadRules()
     */
    async resolveRules(tenantId: string): Promise<AlertRule[]> {
        return this.source.loadRules(tenantId);
    }
}

/**
 * Convenience function to create an adapter
 */
export function adaptRuleSource(source: IRuleSource): IRuleProvider {
    return new RuleSourceAdapter(source);
}
