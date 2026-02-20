import 'reflect-metadata';
import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { AlertRuleEvaluator } from '../../../modules/verification/rules/alert-rule.evaluator';
import { BIZ_RULES, ANOMALY_RULES } from '../../../modules/verification/rules/rule-catalog';

describe('AlertRuleEvaluator (T4)', () => {
    const evaluator = new AlertRuleEvaluator();

    test('should flag LOW_ROAS (BIZ-001)', () => {
        const metrics = { spend: 100, revenue: 80, conversions: 5 }; // ROAS 0.8
        const checks = evaluator.evaluate(metrics, BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-001');
        assert.ok(rule, 'BIZ-001 should be evaluated');
        assert.strictEqual(rule.status, 'WARN', 'Should WARN for ROAS < 1.0');
    });

    test('should flag CRITICAL_ROAS (BIZ-002)', () => {
        const metrics = { spend: 100, revenue: 40, conversions: 5 }; // ROAS 0.4
        const checks = evaluator.evaluate(metrics, BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-002');
        assert.ok(rule, 'BIZ-002 should be evaluated');
        assert.strictEqual(rule.status, 'WARN');
    });

    test('should PASS good ROAS', () => {
        const metrics = { spend: 100, revenue: 200, conversions: 5 }; // ROAS 2.0
        const checks = evaluator.evaluate(metrics, BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-001');
        assert.strictEqual(rule?.status, 'PASS');
    });

    test('should flag NO_CONVERSIONS (BIZ-004)', () => {
        const metrics = { spend: 100, revenue: 0, conversions: 0 };
        const checks = evaluator.evaluate(metrics, BIZ_RULES);
        const rule = checks.find(c => c.ruleId === 'BIZ-004');
        assert.strictEqual(rule?.status, 'WARN');
    });

    test('should flag ANOMALY (SANE-001)', () => {
        const metrics = { impressions: 10, clicks: 20, spend: 100 }; // Impossible
        const checks = evaluator.evaluate(metrics, ANOMALY_RULES);
        const rule = checks.find(c => c.ruleId === 'SANE-001');
        assert.strictEqual(rule?.status, 'FAIL');
    });
});
