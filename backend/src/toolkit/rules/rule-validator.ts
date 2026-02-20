/**
 * =============================================================================
 * Rule Validator
 * =============================================================================
 *
 * Validates AlertRule structures for correctness.
 *
 * Design Principles:
 * - Explicit validation with clear error messages
 * - No silent failures
 * - Human-readable errors for developers
 * - Pure function (no side effects)
 *
 * Validation covers:
 * - Schema correctness (required fields, types)
 * - Condition compatibility (valid operators, valid metrics)
 * - Business rules (sensible thresholds)
 * =============================================================================
 */

import { AlertRule, AlertSeverity, RuleScope } from './alert-rule.model';
import { AlertCondition, MetricSnapshot } from '../services/alert-engine.service';

// =============================================================================
// Validation Result Types
// =============================================================================

export interface RuleValidationError {
    readonly field: string;
    readonly code: string;
    readonly message: string;
}

export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: RuleValidationError[];
}

// =============================================================================
// Valid Metric Names (for condition validation)
// =============================================================================

const VALID_METRICS: Array<keyof MetricSnapshot['metrics']> = [
    'impressions',
    'clicks',
    'conversions',
    'spend',
    'revenue',
    'ctr',
    'cpc',
    'cvr',
    'roas',
];

const VALID_OPERATORS = ['GT', 'LT', 'GTE', 'LTE', 'EQ'] as const;

const VALID_SEVERITIES: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const VALID_SCOPES: RuleScope[] = ['CAMPAIGN', 'ACCOUNT'];

// =============================================================================
// Validator Implementation
// =============================================================================

export class RuleValidator {
    /**
     * Validate an AlertRule completely
     *
     * Returns ValidationResult with:
     * - valid: true if rule is valid, false otherwise
     * - errors: array of validation errors (empty if valid)
     */
    validate(rule: unknown): ValidationResult {
        const errors: RuleValidationError[] = [];

        // Basic type check
        if (typeof rule !== 'object' || rule === null) {
            return {
                valid: false,
                errors: [{
                    field: '(root)',
                    code: 'NOT_AN_OBJECT',
                    message: 'Rule must be an object',
                }],
            };
        }

        const r = rule as Record<string, unknown>;

        // Validate required fields
        errors.push(...this.validateRequiredFields(r));

        // Validate field types
        errors.push(...this.validateFieldTypes(r));

        // Validate condition structure
        if (r.condition && typeof r.condition === 'object') {
            errors.push(...this.validateCondition(r.condition as AlertCondition));
        }

        // Validate business rules (only if basic structure is valid)
        if (errors.length === 0) {
            errors.push(...this.validateBusinessRules(r as unknown as AlertRule));
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Validate multiple rules
     * Returns aggregate result with all errors
     */
    validateMany(rules: unknown[]): ValidationResult {
        const allErrors: RuleValidationError[] = [];

        for (let i = 0; i < rules.length; i++) {
            const result = this.validate(rules[i]);
            if (!result.valid) {
                allErrors.push(...result.errors.map((e) => ({
                    ...e,
                    field: `[${i}].${e.field}`,
                })));
            }
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors,
        };
    }

    // =========================================================================
    // Private Validation Methods
    // =========================================================================

    private validateRequiredFields(r: Record<string, unknown>): RuleValidationError[] {
        const errors: RuleValidationError[] = [];
        const required = ['id', 'tenantId', 'name', 'enabled', 'severity', 'scope', 'condition'];

        for (const field of required) {
            if (!(field in r) || r[field] === undefined || r[field] === null) {
                errors.push({
                    field,
                    code: 'REQUIRED_FIELD_MISSING',
                    message: `Required field "${field}" is missing`,
                });
            }
        }

        return errors;
    }

    private validateFieldTypes(r: Record<string, unknown>): RuleValidationError[] {
        const errors: RuleValidationError[] = [];

        // id: string
        if (r.id !== undefined && typeof r.id !== 'string') {
            errors.push({
                field: 'id',
                code: 'INVALID_TYPE',
                message: 'Field "id" must be a string',
            });
        }

        // tenantId: string
        if (r.tenantId !== undefined && typeof r.tenantId !== 'string') {
            errors.push({
                field: 'tenantId',
                code: 'INVALID_TYPE',
                message: 'Field "tenantId" must be a string',
            });
        }

        // name: string (non-empty)
        if (r.name !== undefined) {
            if (typeof r.name !== 'string') {
                errors.push({
                    field: 'name',
                    code: 'INVALID_TYPE',
                    message: 'Field "name" must be a string',
                });
            } else if (r.name.trim().length === 0) {
                errors.push({
                    field: 'name',
                    code: 'EMPTY_STRING',
                    message: 'Field "name" cannot be empty',
                });
            }
        }

        // enabled: boolean
        if (r.enabled !== undefined && typeof r.enabled !== 'boolean') {
            errors.push({
                field: 'enabled',
                code: 'INVALID_TYPE',
                message: 'Field "enabled" must be a boolean',
            });
        }

        // severity: valid enum value
        if (r.severity !== undefined) {
            if (!VALID_SEVERITIES.includes(r.severity as AlertSeverity)) {
                errors.push({
                    field: 'severity',
                    code: 'INVALID_VALUE',
                    message: `Field "severity" must be one of: ${VALID_SEVERITIES.join(', ')}`,
                });
            }
        }

        // scope: valid enum value
        if (r.scope !== undefined) {
            if (!VALID_SCOPES.includes(r.scope as RuleScope)) {
                errors.push({
                    field: 'scope',
                    code: 'INVALID_VALUE',
                    message: `Field "scope" must be one of: ${VALID_SCOPES.join(', ')}`,
                });
            }
        }

        // condition: object
        if (r.condition !== undefined) {
            if (typeof r.condition !== 'object' || r.condition === null) {
                errors.push({
                    field: 'condition',
                    code: 'INVALID_TYPE',
                    message: 'Field "condition" must be an object',
                });
            }
        }

        return errors;
    }

    private validateCondition(condition: AlertCondition): RuleValidationError[] {
        const errors: RuleValidationError[] = [];

        // Check condition has a type
        if (!('type' in condition)) {
            return [{
                field: 'condition.type',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'Condition must have a "type" field',
            }];
        }

        switch (condition.type) {
            case 'THRESHOLD':
                errors.push(...this.validateThresholdCondition(condition));
                break;

            case 'DROP_PERCENT':
                errors.push(...this.validateDropPercentCondition(condition));
                break;

            case 'ZERO_CONVERSIONS':
                errors.push(...this.validateZeroConversionsCondition(condition));
                break;

            default:
                errors.push({
                    field: 'condition.type',
                    code: 'INVALID_VALUE',
                    message: `Unknown condition type: ${(condition as { type: string }).type}`,
                });
        }

        return errors;
    }

    private validateThresholdCondition(
        condition: Extract<AlertCondition, { type: 'THRESHOLD' }>
    ): RuleValidationError[] {
        const errors: RuleValidationError[] = [];

        // Validate metric
        if (!condition.metric) {
            errors.push({
                field: 'condition.metric',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'THRESHOLD condition requires a "metric" field',
            });
        } else if (!VALID_METRICS.includes(condition.metric)) {
            errors.push({
                field: 'condition.metric',
                code: 'INVALID_VALUE',
                message: `Invalid metric "${condition.metric}". Valid: ${VALID_METRICS.join(', ')}`,
            });
        }

        // Validate operator
        if (!condition.operator) {
            errors.push({
                field: 'condition.operator',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'THRESHOLD condition requires an "operator" field',
            });
        } else if (!VALID_OPERATORS.includes(condition.operator)) {
            errors.push({
                field: 'condition.operator',
                code: 'INVALID_VALUE',
                message: `Invalid operator "${condition.operator}". Valid: ${VALID_OPERATORS.join(', ')}`,
            });
        }

        // Validate value
        if (condition.value === undefined || condition.value === null) {
            errors.push({
                field: 'condition.value',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'THRESHOLD condition requires a "value" field',
            });
        } else if (typeof condition.value !== 'number' || isNaN(condition.value)) {
            errors.push({
                field: 'condition.value',
                code: 'INVALID_TYPE',
                message: 'THRESHOLD condition "value" must be a number',
            });
        }

        return errors;
    }

    private validateDropPercentCondition(
        condition: Extract<AlertCondition, { type: 'DROP_PERCENT' }>
    ): RuleValidationError[] {
        const errors: RuleValidationError[] = [];

        // Validate metric
        if (!condition.metric) {
            errors.push({
                field: 'condition.metric',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'DROP_PERCENT condition requires a "metric" field',
            });
        } else if (!VALID_METRICS.includes(condition.metric)) {
            errors.push({
                field: 'condition.metric',
                code: 'INVALID_VALUE',
                message: `Invalid metric "${condition.metric}". Valid: ${VALID_METRICS.join(', ')}`,
            });
        }

        // Validate thresholdPercent
        if (condition.thresholdPercent === undefined || condition.thresholdPercent === null) {
            errors.push({
                field: 'condition.thresholdPercent',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'DROP_PERCENT condition requires a "thresholdPercent" field',
            });
        } else if (
            typeof condition.thresholdPercent !== 'number' ||
            isNaN(condition.thresholdPercent) ||
            condition.thresholdPercent < 0 ||
            condition.thresholdPercent > 100
        ) {
            errors.push({
                field: 'condition.thresholdPercent',
                code: 'INVALID_VALUE',
                message: 'DROP_PERCENT "thresholdPercent" must be a number between 0 and 100',
            });
        }

        return errors;
    }

    private validateZeroConversionsCondition(
        condition: Extract<AlertCondition, { type: 'ZERO_CONVERSIONS' }>
    ): RuleValidationError[] {
        const errors: RuleValidationError[] = [];

        // Validate minSpend
        if (condition.minSpend === undefined || condition.minSpend === null) {
            errors.push({
                field: 'condition.minSpend',
                code: 'REQUIRED_FIELD_MISSING',
                message: 'ZERO_CONVERSIONS condition requires a "minSpend" field',
            });
        } else if (
            typeof condition.minSpend !== 'number' ||
            isNaN(condition.minSpend) ||
            condition.minSpend < 0
        ) {
            errors.push({
                field: 'condition.minSpend',
                code: 'INVALID_VALUE',
                message: 'ZERO_CONVERSIONS "minSpend" must be a non-negative number',
            });
        }

        return errors;
    }

    private validateBusinessRules(rule: AlertRule): RuleValidationError[] {
        const errors: RuleValidationError[] = [];

        // Check for suspiciously low thresholds that might cause alert fatigue
        if (rule.condition?.type === 'THRESHOLD') {
            const threshold = rule.condition.value;
            if (threshold < 0) {
                errors.push({
                    field: 'condition.value',
                    code: 'SUSPICIOUS_VALUE',
                    message: `Threshold value ${threshold} is negative - is this intentional?`,
                });
            }
        }

        // Check for zero threshold on DROP_PERCENT (would trigger on any drop)
        if (rule.condition?.type === 'DROP_PERCENT') {
            const threshold = rule.condition.thresholdPercent;
            if (threshold === 0) {
                errors.push({
                    field: 'condition.thresholdPercent',
                    code: 'SUSPICIOUS_VALUE',
                    message: 'DROP_PERCENT threshold of 0% will trigger on any decrease - is this intentional?',
                });
            }
        }

        return errors;
    }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const ruleValidator = new RuleValidator();
