/**
 * =============================================================================
 * In-Memory Rule Source
 * =============================================================================
 *
 * Stores alert rules in memory.
 *
 * Design Principles:
 * - Fast, no I/O overhead
 * - Useful for tests and programmatic rule creation
 * - Thread-safe (single-threaded Node.js assumption)
 * - Supports tenant isolation
 *
 * Use cases:
 * - Unit tests with programmatic rules
 * - Dynamic rule creation in CLI tools
 * - Caching layer in front of slower sources
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { AlertRule } from './alert-rule.model';
import { RuleValidator, ValidationResult } from './rule-validator';
import { ILogger, TOKENS } from '../core';
import { IRuleSource } from './rule-source.fixture';

// =============================================================================
// In-Memory Rule Source
// =============================================================================

@injectable()
export class InMemoryRuleSource implements IRuleSource {
    private rules: Map<string, AlertRule> = new Map();
    private validator: RuleValidator;
    private logger: ILogger;

    constructor(
        @inject(RuleValidator) validator?: RuleValidator,
        @inject(TOKENS.Logger) logger?: ILogger
    ) {
        this.validator = validator ?? new RuleValidator();
        this.logger = (logger ?? console as unknown as ILogger).child({ source: 'InMemoryRuleSource' });
    }

    // =========================================================================
    // IRuleSource Implementation
    // =========================================================================

    /**
     * Load rules for a specific tenant
     * Only returns enabled rules
     */
    async loadRules(tenantId: string): Promise<AlertRule[]> {
        const tenantRules = Array.from(this.rules.values())
            .filter((r) => r.tenantId === tenantId && r.enabled);
        this.logger.debug(`Loaded ${tenantRules.length} rules for tenant ${tenantId}`);
        return tenantRules;
    }

    /**
     * Get a specific rule by ID
     */
    async getRule(ruleId: string): Promise<AlertRule | null> {
        return this.rules.get(ruleId) ?? null;
    }

    /**
     * Clear all cached rules
     */
    clearCache(): void {
        this.rules.clear();
        this.logger.debug('Cleared all rules from memory');
    }

    // =========================================================================
    // Management API (not part of IRuleSource)
    // =========================================================================

    /**
     * Add or update a rule
     * Validates before storing
     */
    addRule(rule: AlertRule): ValidationResult {
        const result = this.validator.validate(rule);

        if (!result.valid) {
            this.logger.warn(
                `Validation failed for rule ${rule.id}: ${result.errors.length} errors`
            );
            return result;
        }

        this.rules.set(rule.id, rule);
        this.logger.debug(`Added/updated rule ${rule.id} (${rule.name})`);

        return result;
    }

    /**
     * Add multiple rules
     * Validates each before storing
     * Stops on first validation failure and returns that result
     */
    addRules(rules: AlertRule[]): ValidationResult {
        for (const rule of rules) {
            const result = this.addRule(rule);
            if (!result.valid) {
                return {
                    valid: false,
                    errors: result.errors.map((e) => ({
                        ...e,
                        field: `rule[${rule.id}].${e.field}`,
                    })),
                };
            }
        }
        return { valid: true, errors: [] };
    }

    /**
     * Remove a rule by ID
     */
    removeRule(ruleId: string): boolean {
        const existed = this.rules.delete(ruleId);
        if (existed) {
            this.logger.debug(`Removed rule ${ruleId}`);
        }
        return existed;
    }

    /**
     * Get all rules (including disabled)
     */
    getAllRules(): AlertRule[] {
        return Array.from(this.rules.values());
    }

    /**
     * Get rules by tenant (including disabled)
     */
    getRulesByTenant(tenantId: string): AlertRule[] {
        return Array.from(this.rules.values())
            .filter((r) => r.tenantId === tenantId);
    }

    /**
     * Check if a rule exists
     */
    hasRule(ruleId: string): boolean {
        return this.rules.has(ruleId);
    }

    /**
     * Get count of stored rules
     */
    get count(): number {
        return this.rules.size;
    }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create an InMemoryRuleSource pre-populated with rules
 * Useful for testing
 */
export function createRuleSource(
    rules: AlertRule[],
    validator?: RuleValidator,
    logger?: ILogger
): InMemoryRuleSource {
    const source = new InMemoryRuleSource(validator, logger);
    const result = source.addRules(rules);

    if (!result.valid) {
        const errors = result.errors.map((e) => `[${e.field}] ${e.message}`).join('\n');
        throw new Error(`Failed to create rule source:\n${errors}`);
    }

    return source;
}

/**
 * Create an empty InMemoryRuleSource
 */
export function createEmptyRuleSource(
    validator?: RuleValidator,
    logger?: ILogger
): InMemoryRuleSource {
    return new InMemoryRuleSource(validator, logger);
}
