/**
 * =============================================================================
 * RuleValidator — Unit Tests (Phase 5A.4)
 * =============================================================================
 *
 * Runner: node:test
 *
 * Strategy: Build valid rule fixtures, then twist each field to trigger
 * specific validation errors. Covers root type, required fields, field types,
 * condition subtypes, business rules, and batch validation.
 * =============================================================================
 */

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { RuleValidator, ruleValidator, ValidationResult } from '../rule-validator';
import { AlertRule } from '../alert-rule.model';
import { AlertCondition } from '../../services/alert-engine.service';

// =============================================================================
// Fixtures
// =============================================================================

function validThresholdRule(): AlertRule {
    return {
        id: 'rule-test-001',
        tenantId: 'tenant-1',
        name: 'High CPC Alert',
        enabled: true,
        severity: 'HIGH',
        scope: 'CAMPAIGN',
        condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT', value: 5.0 },
    };
}

function validDropRule(): AlertRule {
    return {
        id: 'rule-test-002',
        tenantId: 'tenant-1',
        name: 'Click Drop Alert',
        enabled: true,
        severity: 'MEDIUM',
        scope: 'ACCOUNT',
        condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 30 },
    };
}

function validZeroConvRule(): AlertRule {
    return {
        id: 'rule-test-003',
        tenantId: 'tenant-1',
        name: 'Zero Conversions Alert',
        enabled: true,
        severity: 'CRITICAL',
        scope: 'CAMPAIGN',
        condition: { type: 'ZERO_CONVERSIONS', minSpend: 100 },
    };
}

function hasCode(result: ValidationResult, code: string): boolean {
    return result.errors.some((e) => e.code === code);
}

function hasField(result: ValidationResult, field: string): boolean {
    return result.errors.some((e) => e.field === field);
}

// =============================================================================
// Tests
// =============================================================================

describe('RuleValidator — valid rules pass', () => {
    const v = new RuleValidator();

    it('THRESHOLD rule passes', () => {
        const r = v.validate(validThresholdRule());
        assert.ok(r.valid, `Expected valid, got errors: ${JSON.stringify(r.errors)}`);
        assert.strictEqual(r.errors.length, 0);
    });

    it('DROP_PERCENT rule passes', () => {
        const r = v.validate(validDropRule());
        assert.ok(r.valid, JSON.stringify(r.errors));
    });

    it('ZERO_CONVERSIONS rule passes', () => {
        const r = v.validate(validZeroConvRule());
        assert.ok(r.valid, JSON.stringify(r.errors));
    });
});

describe('RuleValidator — root type check', () => {
    const v = new RuleValidator();

    it('rejects null', () => {
        const r = v.validate(null);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });

    it('rejects undefined', () => {
        const r = v.validate(undefined);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });

    it('rejects string', () => {
        const r = v.validate('not a rule');
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });

    it('rejects number', () => {
        const r = v.validate(42);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'NOT_AN_OBJECT'));
    });
});

describe('RuleValidator — required fields', () => {
    const v = new RuleValidator();

    for (const field of ['id', 'tenantId', 'name', 'enabled', 'severity', 'scope', 'condition']) {
        it(`detects missing ${field}`, () => {
            const rule: Record<string, unknown> = { ...validThresholdRule() };
            delete rule[field];
            const r = v.validate(rule);
            assert.ok(!r.valid);
            assert.ok(hasField(r, field), `Expected error on field "${field}"`);
            assert.ok(hasCode(r, 'REQUIRED_FIELD_MISSING'));
        });
    }

    it('detects null field as missing', () => {
        const rule = { ...validThresholdRule(), id: null };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'id'));
    });
});

describe('RuleValidator — field type checks', () => {
    const v = new RuleValidator();

    it('rejects numeric id', () => {
        const r = v.validate({ ...validThresholdRule(), id: 123 });
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'INVALID_TYPE'));
        assert.ok(hasField(r, 'id'));
    });

    it('rejects numeric tenantId', () => {
        const r = v.validate({ ...validThresholdRule(), tenantId: 999 });
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'tenantId'));
    });

    it('rejects non-string name', () => {
        const r = v.validate({ ...validThresholdRule(), name: 123 });
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'name'));
    });

    it('rejects empty name', () => {
        const r = v.validate({ ...validThresholdRule(), name: '   ' });
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'EMPTY_STRING'));
    });

    it('rejects non-boolean enabled', () => {
        const r = v.validate({ ...validThresholdRule(), enabled: 'yes' });
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'enabled'));
    });

    it('rejects invalid severity', () => {
        const r = v.validate({ ...validThresholdRule(), severity: 'EXTREME' });
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'severity'));
        assert.ok(hasCode(r, 'INVALID_VALUE'));
    });

    it('rejects invalid scope', () => {
        const r = v.validate({ ...validThresholdRule(), scope: 'GLOBAL' });
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'scope'));
    });

    it('rejects non-object condition', () => {
        const r = v.validate({ ...validThresholdRule(), condition: 'bad' });
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'condition'));
    });
});

describe('RuleValidator — THRESHOLD condition validation', () => {
    const v = new RuleValidator();

    it('rejects missing metric', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', operator: 'GT', value: 5 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'condition.metric'));
    });

    it('rejects invalid metric name', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'invalid_metric', operator: 'GT', value: 5 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'INVALID_VALUE'));
    });

    it('rejects missing operator', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', value: 5 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'condition.operator'));
    });

    it('rejects invalid operator', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'BETWEEN', value: 5 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'INVALID_VALUE'));
    });

    it('rejects missing value', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT' },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'condition.value'));
    });

    it('rejects NaN value', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT', value: NaN },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
    });

    it('accepts all valid operators', () => {
        for (const op of ['GT', 'LT', 'GTE', 'LTE', 'EQ']) {
            const rule = {
                ...validThresholdRule(),
                condition: { type: 'THRESHOLD', metric: 'cpc', operator: op, value: 5 },
            };
            const r = v.validate(rule);
            assert.ok(r.valid, `Operator ${op} should be valid but got: ${JSON.stringify(r.errors)}`);
        }
    });

    it('accepts all valid metrics', () => {
        const validMetrics = ['impressions', 'clicks', 'conversions', 'spend', 'revenue', 'ctr', 'cpc', 'cvr', 'roas'];
        for (const metric of validMetrics) {
            const rule = {
                ...validThresholdRule(),
                condition: { type: 'THRESHOLD', metric, operator: 'GT', value: 1 },
            };
            const r = v.validate(rule);
            assert.ok(r.valid, `Metric ${metric} should be valid`);
        }
    });
});

describe('RuleValidator — DROP_PERCENT condition validation', () => {
    const v = new RuleValidator();

    it('rejects missing metric', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', thresholdPercent: 30 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'condition.metric'));
    });

    it('rejects missing thresholdPercent', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks' },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'condition.thresholdPercent'));
    });

    it('rejects thresholdPercent > 100', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 150 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
    });

    it('rejects negative thresholdPercent', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: -10 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
    });

    it('accepts boundary value thresholdPercent = 100', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 100 },
        };
        const r = v.validate(rule);
        assert.ok(r.valid, JSON.stringify(r.errors));
    });
});

describe('RuleValidator — ZERO_CONVERSIONS condition validation', () => {
    const v = new RuleValidator();

    it('rejects missing minSpend', () => {
        const rule = {
            ...validZeroConvRule(),
            condition: { type: 'ZERO_CONVERSIONS' },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasField(r, 'condition.minSpend'));
    });

    it('rejects negative minSpend', () => {
        const rule = {
            ...validZeroConvRule(),
            condition: { type: 'ZERO_CONVERSIONS', minSpend: -50 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
    });

    it('accepts zero minSpend', () => {
        const rule = {
            ...validZeroConvRule(),
            condition: { type: 'ZERO_CONVERSIONS', minSpend: 0 },
        };
        const r = v.validate(rule);
        assert.ok(r.valid, JSON.stringify(r.errors));
    });
});

describe('RuleValidator — unknown condition type', () => {
    const v = new RuleValidator();

    it('rejects unknown condition type', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'RATE_LIMIT', metric: 'cpc' },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'INVALID_VALUE'));
    });

    it('rejects condition without type', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { metric: 'cpc', operator: 'GT', value: 5 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'REQUIRED_FIELD_MISSING'));
    });
});

describe('RuleValidator — business rules', () => {
    const v = new RuleValidator();

    it('warns on negative threshold value', () => {
        const rule = {
            ...validThresholdRule(),
            condition: { type: 'THRESHOLD', metric: 'cpc', operator: 'GT', value: -1 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'SUSPICIOUS_VALUE'));
    });

    it('warns on DROP_PERCENT threshold of 0', () => {
        const rule = {
            ...validDropRule(),
            condition: { type: 'DROP_PERCENT', metric: 'clicks', thresholdPercent: 0 },
        };
        const r = v.validate(rule);
        assert.ok(!r.valid);
        assert.ok(hasCode(r, 'SUSPICIOUS_VALUE'));
    });
});

describe('RuleValidator — validateMany', () => {
    const v = new RuleValidator();

    it('returns valid for all-good rules', () => {
        const r = v.validateMany([validThresholdRule(), validDropRule(), validZeroConvRule()]);
        assert.ok(r.valid);
        assert.strictEqual(r.errors.length, 0);
    });

    it('prefixes errors with array index', () => {
        const r = v.validateMany([validThresholdRule(), null, validDropRule()]);
        assert.ok(!r.valid);
        // Error field should start with [1].
        const indexedError = r.errors.find((e) => e.field.startsWith('[1].'));
        assert.ok(indexedError, 'Expected error indexed at [1]');
    });

    it('collects errors from multiple invalid rules', () => {
        const r = v.validateMany([null, 'bad', 42]);
        assert.ok(!r.valid);
        assert.ok(r.errors.length >= 3, `Expected ≥3 errors, got ${r.errors.length}`);
    });
});

describe('RuleValidator — singleton export', () => {
    it('ruleValidator is an instance of RuleValidator', () => {
        assert.ok(ruleValidator instanceof RuleValidator);
    });

    it('singleton validates correctly', () => {
        const r = ruleValidator.validate(validThresholdRule());
        assert.ok(r.valid);
    });
});
