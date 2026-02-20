/**
 * =============================================================================
 * Alert Engine Service - Phase 2.1 (Real Logic)
 * =============================================================================
 *
 * Pure domain service for alert evaluation with REAL logic.
 * Stateless, deterministic, no side effects.
 *
 * Design Principles:
 * - Single Responsibility: Alert evaluation logic only
 * - Stateless: No internal state between calls
 * - Pure Functions: Deterministic output for given input
 * - No Side Effects: Does not call external services or database
 *
 * Phase 2.1 Scope:
 * - Real triggerCheck() implementation
 * - THRESHOLD, ZERO_CONVERSIONS, DROP_PERCENT conditions
 * - Deterministic, explainable results
 * =============================================================================
 */

import { injectable } from 'tsyringe';

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Single metric snapshot for a specific evaluation window
 */
export interface MetricSnapshot {
    readonly tenantId: string;
    readonly campaignId: string;
    readonly date: Date;
    readonly platform: string;
    readonly metrics: {
        readonly impressions: number;
        readonly clicks: number;
        readonly conversions: number;
        readonly spend: number;
        readonly revenue: number;
        readonly ctr: number;
        readonly cpc: number;
        readonly cvr: number;
        readonly roas: number;
    };
}

/**
 * Baseline snapshot for comparison (e.g., previous period)
 * Used by DROP_PERCENT condition
 */
export interface BaselineSnapshot {
    readonly metrics: MetricSnapshot['metrics'];
    readonly dateRange: {
        readonly start: Date;
        readonly end: Date;
    };
}

/**
 * Context for alert evaluation
 * Contains metadata about the evaluation request
 */
export interface EvaluationContext {
    readonly tenantId: string;
    readonly dateRange: {
        readonly start: Date;
        readonly end: Date;
    };
    readonly dryRun: boolean;
}

/**
 * Alert rule configuration (minimal interface for evaluation)
 * Full model with metadata is in rules/alert-rule.model.ts
 */
export interface AlertRule {
    readonly id: string;
    readonly name: string;
    readonly condition: AlertCondition;
    readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    readonly enabled: boolean;
    readonly tenantId?: string; // Optional for engine, used for scoping
}

/**
 * Alert condition types
 */
export type AlertCondition =
    | { type: 'THRESHOLD'; metric: keyof MetricSnapshot['metrics']; operator: 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ'; value: number }
    | { type: 'DROP_PERCENT'; metric: keyof MetricSnapshot['metrics']; thresholdPercent: number }
    | { type: 'ZERO_CONVERSIONS'; minSpend: number };

/**
 * Result of evaluating a single alert rule
 */
export interface AlertTriggerResult {
    readonly ruleId: string;
    readonly ruleName: string;
    readonly condition: AlertCondition;
    readonly severity: AlertRule['severity'];
    readonly triggered: boolean;
    readonly reason: string;
    readonly evaluatedAt: Date;
    readonly values: {
        readonly current?: number;
        readonly baseline?: number;
        readonly threshold?: number;
        readonly dropPercent?: number;
    };
}

/**
 * Result of complete alert evaluation
 */
export interface AlertEvaluationResult {
    readonly triggeredAlerts: AlertTriggerResult[];
    readonly evaluatedAt: Date;
    readonly context: EvaluationContext;
    readonly metadata: {
        readonly totalRules: number;
        readonly enabledRules: number;
        readonly triggeredCount: number;
        readonly durationMs: number;
    };
}

// =============================================================================
// Service Implementation
// =============================================================================

@injectable()
export class AlertEngine {
    /**
     * Evaluate a single metric snapshot against provided rules
     * 
     * Algorithm:
     * 1. Filter to enabled rules only
     * 2. Evaluate each rule against the snapshot
     * 3. Collect all triggered alerts
     * 4. Return evaluation result with metadata
     * 
     * Pure function: no side effects, deterministic
     */
    evaluateOnce(
        snapshot: MetricSnapshot,
        rules: AlertRule[],
        context: EvaluationContext
    ): AlertEvaluationResult {
        const startTime = Date.now();
        const evaluatedAt = new Date();

        // Step 1: Filter to enabled rules only
        const enabledRules = rules.filter((rule) => rule.enabled);

        // Step 2: Evaluate each rule
        const triggeredAlerts: AlertTriggerResult[] = [];
        for (const rule of enabledRules) {
            const result = this.evaluateRule(snapshot, rule, evaluatedAt);
            if (result.triggered) {
                triggeredAlerts.push(result);
            }
        }

        // Step 3: Return evaluation result
        return {
            triggeredAlerts,
            evaluatedAt,
            context,
            metadata: {
                totalRules: rules.length,
                enabledRules: enabledRules.length,
                triggeredCount: triggeredAlerts.length,
                durationMs: Date.now() - startTime,
            },
        };
    }

    /**
     * Evaluate alerts for multiple snapshots with optional baselines
     * 
     * Phase 2.1: Real implementation
     * 
     * Algorithm:
     * 1. Iterate over all provided snapshots
     * 2. For each snapshot, find matching baseline (if provided)
     * 3. Evaluate all rules against snapshot (with baseline context)
     * 4. Aggregate all triggered alerts
     * 5. Return complete evaluation result
     */
    evaluateCheck(
        snapshots: MetricSnapshot[],
        rules: AlertRule[],
        context: EvaluationContext,
        baselines?: Map<string, BaselineSnapshot> // campaignId -> baseline
    ): AlertEvaluationResult {
        const startTime = Date.now();
        const evaluatedAt = new Date();

        // Filter to enabled rules only
        const enabledRules = rules.filter((rule) => rule.enabled);
        const allTriggeredAlerts: AlertTriggerResult[] = [];

        // Evaluate each snapshot
        for (const snapshot of snapshots) {
            // Find baseline for this campaign (if available)
            const baseline = baselines?.get(snapshot.campaignId);

            // Evaluate each rule against this snapshot
            for (const rule of enabledRules) {
                const result = this.evaluateRuleWithBaseline(
                    snapshot,
                    rule,
                    baseline,
                    evaluatedAt
                );
                if (result.triggered) {
                    allTriggeredAlerts.push(result);
                }
            }
        }

        return {
            triggeredAlerts: allTriggeredAlerts,
            evaluatedAt,
            context,
            metadata: {
                totalRules: rules.length,
                enabledRules: enabledRules.length,
                triggeredCount: allTriggeredAlerts.length,
                durationMs: Date.now() - startTime,
            },
        };
    }

    // =========================================================================
    // Private Methods - Condition Evaluators
    // =========================================================================

    /**
     * Evaluate a single rule against a snapshot
     * 
     * Delegates to specific condition evaluators based on condition type.
     * Returns a complete AlertTriggerResult with all context.
     */
    private evaluateRule(
        snapshot: MetricSnapshot,
        rule: AlertRule,
        evaluatedAt: Date
    ): AlertTriggerResult {
        const condition = rule.condition;

        switch (condition.type) {
            case 'THRESHOLD':
                return this.evaluateThreshold(snapshot, rule, condition, evaluatedAt);

            case 'DROP_PERCENT':
                // DROP_PERCENT requires baseline - if not provided, cannot trigger
                return this.evaluateDropPercentWithoutBaseline(snapshot, rule, condition, evaluatedAt);

            case 'ZERO_CONVERSIONS':
                return this.evaluateZeroConversions(snapshot, rule, condition, evaluatedAt);

            default:
                // Unknown condition type - fail safe (not triggered)
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    condition,
                    severity: rule.severity,
                    triggered: false,
                    reason: `Unknown condition type: ${(condition as { type: string }).type}`,
                    evaluatedAt,
                    values: {},
                };
        }
    }

    /**
     * Evaluate a rule with optional baseline
     * Used by evaluateCheck() when baselines are available
     */
    private evaluateRuleWithBaseline(
        snapshot: MetricSnapshot,
        rule: AlertRule,
        baseline: BaselineSnapshot | undefined,
        evaluatedAt: Date
    ): AlertTriggerResult {
        const condition = rule.condition;

        switch (condition.type) {
            case 'THRESHOLD':
                return this.evaluateThreshold(snapshot, rule, condition, evaluatedAt);

            case 'DROP_PERCENT':
                if (baseline) {
                    return this.evaluateDropPercent(snapshot, baseline, rule, condition, evaluatedAt);
                }
                return this.evaluateDropPercentWithoutBaseline(snapshot, rule, condition, evaluatedAt);

            case 'ZERO_CONVERSIONS':
                return this.evaluateZeroConversions(snapshot, rule, condition, evaluatedAt);

            default:
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    condition,
                    severity: rule.severity,
                    triggered: false,
                    reason: `Unknown condition type`,
                    evaluatedAt,
                    values: {},
                };
        }
    }

    /**
     * Evaluate THRESHOLD condition
     * 
     * Logic: Compare metric value against threshold using operator
     * 
     * Operators:
     * - GT: metric > value
     * - LT: metric < value  
     * - GTE: metric >= value
     * - LTE: metric <= value
     * - EQ: metric === value (within floating point epsilon)
     */
    private evaluateThreshold(
        snapshot: MetricSnapshot,
        rule: AlertRule,
        condition: Extract<AlertCondition, { type: 'THRESHOLD' }>,
        evaluatedAt: Date
    ): AlertTriggerResult {
        // Extract current metric value
        const currentValue = snapshot.metrics[condition.metric];

        // Handle missing metric (should not happen in valid data, but be safe)
        if (currentValue === undefined || currentValue === null) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Metric "${condition.metric}" is missing in snapshot`,
                evaluatedAt,
                values: { current: currentValue },
            };
        }

        // Evaluate based on operator
        let triggered = false;
        const threshold = condition.value;

        switch (condition.operator) {
            case 'GT':
                triggered = currentValue > threshold;
                break;
            case 'LT':
                triggered = currentValue < threshold;
                break;
            case 'GTE':
                triggered = currentValue >= threshold;
                break;
            case 'LTE':
                triggered = currentValue <= threshold;
                break;
            case 'EQ':
                // Use small epsilon for floating point comparison
                const epsilon = 0.0001;
                triggered = Math.abs(currentValue - threshold) < epsilon;
                break;
            default:
                triggered = false;
        }

        // Build human-readable reason
        let reason: string;
        if (triggered) {
            reason = `${condition.metric} (${this.formatNumber(currentValue)}) ${this.operatorToString(condition.operator)} ${this.formatNumber(threshold)}`;
        } else {
            reason = `${condition.metric} (${this.formatNumber(currentValue)}) does not satisfy ${this.operatorToString(condition.operator)} ${this.formatNumber(threshold)}`;
        }

        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered,
            reason,
            evaluatedAt,
            values: {
                current: currentValue,
                threshold,
            },
        };
    }

    /**
     * Evaluate DROP_PERCENT condition with baseline
     * 
     * Logic: Calculate percent drop from baseline to current
     * Trigger if: ((baseline - current) / baseline) * 100 >= thresholdPercent
     * 
     * Edge cases:
     * - If baseline is 0 or negative: cannot calculate drop, not triggered
     * - If current >= baseline: no drop, not triggered
     */
    private evaluateDropPercent(
        snapshot: MetricSnapshot,
        baseline: BaselineSnapshot,
        rule: AlertRule,
        condition: Extract<AlertCondition, { type: 'DROP_PERCENT' }>,
        evaluatedAt: Date
    ): AlertTriggerResult {
        const currentValue = snapshot.metrics[condition.metric];
        const baselineValue = baseline.metrics[condition.metric];

        // Validate inputs
        if (currentValue === undefined || baselineValue === undefined) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Metric "${condition.metric}" is missing in current or baseline`,
                evaluatedAt,
                values: { current: currentValue, baseline: baselineValue },
            };
        }

        // Cannot calculate drop if baseline is zero or negative
        if (baselineValue <= 0) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Cannot calculate drop: baseline ${condition.metric} is ${baselineValue} (must be positive)`,
                evaluatedAt,
                values: { current: currentValue, baseline: baselineValue },
            };
        }

        // No drop if current is >= baseline
        if (currentValue >= baselineValue) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `${condition.metric} increased or stayed same: ${this.formatNumber(currentValue)} vs baseline ${this.formatNumber(baselineValue)}`,
                evaluatedAt,
                values: { current: currentValue, baseline: baselineValue, dropPercent: 0 },
            };
        }

        // Calculate drop percentage
        // Formula: ((baseline - current) / baseline) * 100
        const dropAmount = baselineValue - currentValue;
        const dropPercent = (dropAmount / baselineValue) * 100;
        const thresholdPercent = condition.thresholdPercent;

        const triggered = dropPercent >= thresholdPercent;

        // Build reason
        let reason: string;
        if (triggered) {
            reason = `${condition.metric} dropped ${this.formatNumber(dropPercent)}% (${this.formatNumber(baselineValue)} → ${this.formatNumber(currentValue)}), exceeds threshold of ${thresholdPercent}%`;
        } else {
            reason = `${condition.metric} dropped ${this.formatNumber(dropPercent)}% (${this.formatNumber(baselineValue)} → ${this.formatNumber(currentValue)}), below threshold of ${thresholdPercent}%`;
        }

        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered,
            reason,
            evaluatedAt,
            values: {
                current: currentValue,
                baseline: baselineValue,
                dropPercent,
            },
        };
    }

    /**
     * Evaluate DROP_PERCENT without baseline
     * 
     * When baseline is not available, we cannot evaluate the condition.
     * Returns not triggered with explanatory reason.
     */
    private evaluateDropPercentWithoutBaseline(
        snapshot: MetricSnapshot,
        rule: AlertRule,
        condition: Extract<AlertCondition, { type: 'DROP_PERCENT' }>,
        evaluatedAt: Date
    ): AlertTriggerResult {
        const currentValue = snapshot.metrics[condition.metric];

        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered: false,
            reason: `DROP_PERCENT condition requires baseline data (not provided)`,
            evaluatedAt,
            values: {
                current: currentValue,
            },
        };
    }

    /**
     * Evaluate ZERO_CONVERSIONS condition
     * 
     * Logic: Trigger if conversions === 0 AND spend >= minSpend
     * 
     * Use case: Detect campaigns that are spending but not converting
     */
    private evaluateZeroConversions(
        snapshot: MetricSnapshot,
        rule: AlertRule,
        condition: Extract<AlertCondition, { type: 'ZERO_CONVERSIONS' }>,
        evaluatedAt: Date
    ): AlertTriggerResult {
        const conversions = snapshot.metrics.conversions;
        const spend = snapshot.metrics.spend;
        const minSpend = condition.minSpend;

        // Check for missing metrics
        if (conversions === undefined || spend === undefined) {
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                condition,
                severity: rule.severity,
                triggered: false,
                reason: `Missing required metrics (conversions or spend)`,
                evaluatedAt,
                values: { current: conversions },
            };
        }

        // Evaluate condition
        const hasZeroConversions = conversions === 0;
        const meetsSpendThreshold = spend >= minSpend;
        const triggered = hasZeroConversions && meetsSpendThreshold;

        // Build reason
        let reason: string;
        if (triggered) {
            reason = `Zero conversions with spend ${this.formatCurrency(spend)} (threshold: ${this.formatCurrency(minSpend)})`;
        } else if (!hasZeroConversions) {
            reason = `Has ${conversions} conversions (needs zero)`;
        } else {
            reason = `Spend ${this.formatCurrency(spend)} below threshold ${this.formatCurrency(minSpend)}`;
        }

        return {
            ruleId: rule.id,
            ruleName: rule.name,
            condition,
            severity: rule.severity,
            triggered,
            reason,
            evaluatedAt,
            values: {
                current: conversions,
                threshold: minSpend,
            },
        };
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    private operatorToString(operator: string): string {
        switch (operator) {
            case 'GT': return '>';
            case 'LT': return '<';
            case 'GTE': return '>=';
            case 'LTE': return '<=';
            case 'EQ': return '=';
            default: return operator;
        }
    }

    private formatNumber(num: number): string {
        if (num === undefined || num === null) return 'N/A';
        if (Number.isInteger(num)) return num.toString();
        return num.toFixed(4);
    }

    private formatCurrency(num: number): string {
        if (num === undefined || num === null) return 'N/A';
        return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
}

// =============================================================================
// Legacy Exports (for backward compatibility during transition)
// =============================================================================

export interface AlertCheckConfig {
    readonly tenantId: string;
    readonly timeframe: 'YESTERDAY' | 'TODAY' | 'LAST_7_DAYS';
    readonly campaignIds?: string[];
    readonly ruleIds?: string[];
}

export interface AlertCheckResult {
    readonly success: boolean;
    readonly triggeredAlerts: AlertTriggerResult[];
    readonly evaluatedAt: Date;
    readonly metadata: {
        readonly snapshotsEvaluated: number;
        readonly totalRulesEvaluated: number;
        readonly totalRulesTriggered: number;
        readonly durationMs: number;
    };
}
