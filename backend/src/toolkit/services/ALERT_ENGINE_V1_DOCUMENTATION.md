# Phase 2.1: AlertEngine v1 - Implementation Documentation

**Status:** ✅ COMPLETE  
**Date:** 2026-02-05  
**Scope:** Real alert evaluation logic, stateless, pure functions

---

## 1. Implementation Summary

### Core Methods Implemented

| Method | Status | Description |
|--------|--------|-------------|
| `evaluateOnce()` | ✅ FULL | Evaluate single snapshot against rules |
| `evaluateCheck()` | ✅ FULL | Evaluate multiple snapshots with baselines |
| `evaluateThreshold()` | ✅ FULL | THRESHOLD condition evaluator |
| `evaluateDropPercent()` | ✅ FULL | DROP_PERCENT with baseline |
| `evaluateZeroConversions()` | ✅ FULL | ZERO_CONVERSIONS evaluator |

### Condition Types Implemented

| Condition | Operators | Status |
|-----------|-----------|--------|
| `THRESHOLD` | GT, LT, GTE, LTE, EQ | ✅ COMPLETE |
| `DROP_PERCENT` | N/A (percent-based) | ✅ COMPLETE |
| `ZERO_CONVERSIONS` | N/A (boolean logic) | ✅ COMPLETE |

---

## 2. triggerCheck() Walkthrough (Commented)

The old `triggerCheck()` method has been **replaced** by `evaluateCheck()`:

```typescript
/**
 * evaluateCheck() - Phase 2.1 Implementation
 * 
 * INPUT:
 * - snapshots: MetricSnapshot[] - Current period metrics
 * - rules: AlertRule[] - Rules to evaluate
 * - context: EvaluationContext - Metadata (tenantId, dateRange, dryRun)
 * - baselines?: Map<string, BaselineSnapshot> - Optional baseline for comparison
 * 
 * OUTPUT:
 * - AlertEvaluationResult with triggeredAlerts, metadata, timing
 * 
 * ALGORITHM:
 * 1. Filter to enabled rules only
 * 2. For each snapshot:
 *    a. Find matching baseline (if provided)
 *    b. Evaluate each rule against snapshot
 *    c. Collect triggered alerts
 * 3. Aggregate all results
 * 4. Return complete evaluation
 */
```

---

## 3. Example Input → Output

### Example 1: THRESHOLD Condition (High Spend)

**Input:**
```typescript
const snapshot: MetricSnapshot = {
    tenantId: "tenant-123",
    campaignId: "camp-456",
    date: new Date("2024-01-15"),
    platform: "GOOGLE_ADS",
    metrics: {
        impressions: 100000,
        clicks: 5000,
        conversions: 50,
        spend: 15000,  // $15,000
        revenue: 25000,
        ctr: 0.05,
        cpc: 3,
        cvr: 0.01,
        roas: 1.67,
    },
};

const rule: AlertRule = {
    id: "rule-1",
    name: "High Spend Alert",
    condition: {
        type: "THRESHOLD",
        metric: "spend",
        operator: "GT",
        value: 10000,
    },
    severity: "HIGH",
    enabled: true,
};

const context: EvaluationContext = {
    tenantId: "tenant-123",
    dateRange: { start: new Date(), end: new Date() },
    dryRun: false,
};
```

**Evaluation:**
```typescript
const result = alertEngine.evaluateOnce(snapshot, [rule], context);
```

**Output:**
```typescript
{
    triggeredAlerts: [
        {
            ruleId: "rule-1",
            ruleName: "High Spend Alert",
            condition: { type: "THRESHOLD", metric: "spend", operator: "GT", value: 10000 },
            severity: "HIGH",
            triggered: true,
            reason: "spend ($15,000.00) > $10,000.00",
            evaluatedAt: "2024-01-15T10:30:00.000Z",
            values: {
                current: 15000,
                threshold: 10000,
            },
        }
    ],
    evaluatedAt: "2024-01-15T10:30:00.000Z",
    context: { ... },
    metadata: {
        totalRules: 1,
        enabledRules: 1,
        triggeredCount: 1,
        durationMs: 0,
    },
}
```

---

### Example 2: DROP_PERCENT Condition (With Baseline)

**Input:**
```typescript
const currentSnapshot: MetricSnapshot = {
    tenantId: "tenant-123",
    campaignId: "camp-456",
    date: new Date("2024-01-15"),
    platform: "GOOGLE_ADS",
    metrics: {
        impressions: 5000,   // DROPPED from 10000
        clicks: 250,         // DROPPED from 500
        conversions: 5,
        spend: 750,
        revenue: 1250,
        ctr: 0.05,
        cpc: 3,
        cvr: 0.02,
        roas: 1.67,
    },
};

const baseline: BaselineSnapshot = {
    metrics: {
        impressions: 10000,
        clicks: 500,
        conversions: 10,
        spend: 1500,
        revenue: 2500,
        ctr: 0.05,
        cpc: 3,
        cvr: 0.02,
        roas: 1.67,
    },
    dateRange: {
        start: new Date("2024-01-08"),
        end: new Date("2024-01-14"),
    },
};

const rule: AlertRule = {
    id: "rule-2",
    name: "CTR Drop Alert",
    condition: {
        type: "DROP_PERCENT",
        metric: "clicks",
        thresholdPercent: 40,  // Alert if clicks drop 40%+
    },
    severity: "CRITICAL",
    enabled: true,
};
```

**Evaluation:**
```typescript
const baselines = new Map([["camp-456", baseline]]);
const result = alertEngine.evaluateCheck(
    [currentSnapshot],
    [rule],
    context,
    baselines
);
```

**Output:**
```typescript
{
    triggeredAlerts: [
        {
            ruleId: "rule-2",
            ruleName: "CTR Drop Alert",
            condition: { type: "DROP_PERCENT", metric: "clicks", thresholdPercent: 40 },
            severity: "CRITICAL",
            triggered: true,
            reason: "clicks dropped 50.00% (500 → 250), exceeds threshold of 40%",
            evaluatedAt: "2024-01-15T10:30:00.000Z",
            values: {
                current: 250,
                baseline: 500,
                dropPercent: 50,
            },
        }
    ],
    // ... metadata
}
```

**Calculation:**
```
dropAmount = baseline - current = 500 - 250 = 250
dropPercent = (250 / 500) * 100 = 50%
triggered = 50% >= 40% threshold = true
```

---

### Example 3: ZERO_CONVERSIONS Condition

**Input:**
```typescript
const snapshot: MetricSnapshot = {
    tenantId: "tenant-123",
    campaignId: "camp-789",
    date: new Date("2024-01-15"),
    platform: "GOOGLE_ADS",
    metrics: {
        impressions: 50000,
        clicks: 1000,
        conversions: 0,      // ZERO conversions
        spend: 5000,         // But spending money
        revenue: 0,
        ctr: 0.02,
        cpc: 5,
        cvr: 0,
        roas: 0,
    },
};

const rule: AlertRule = {
    id: "rule-3",
    name: "Budget Burn Alert",
    condition: {
        type: "ZERO_CONVERSIONS",
        minSpend: 3000,  // Alert if spending $3k+ with no conversions
    },
    severity: "CRITICAL",
    enabled: true,
};
```

**Output:**
```typescript
{
    triggeredAlerts: [
        {
            ruleId: "rule-3",
            ruleName: "Budget Burn Alert",
            condition: { type: "ZERO_CONVERSIONS", minSpend: 3000 },
            severity: "CRITICAL",
            triggered: true,
            reason: "Zero conversions with spend $5,000.00 (threshold: $3,000.00)",
            evaluatedAt: "2024-01-15T10:30:00.000Z",
            values: {
                current: 0,      // conversions
                threshold: 3000, // minSpend
            },
        }
    ],
    // ... metadata
}
```

---

## 4. Edge Cases Handled

| Edge Case | Handling | Example |
|-----------|----------|---------|
| **Missing metric** | Returns not triggered with explanatory reason | `"Metric 'roas' is missing in snapshot"` |
| **Zero baseline** | Returns not triggered (cannot calculate drop) | `"Cannot calculate drop: baseline is 0"` |
| **No drop** | Returns not triggered | `"clicks increased or stayed same"` |
| **Disabled rule** | Skipped during evaluation | Not included in enabledRules count |
| **Unknown condition** | Returns not triggered with error | `"Unknown condition type: TREND"` |
| **Floating point EQ** | Uses epsilon (0.0001) comparison | `Math.abs(a - b) < epsilon` |

---

## 5. Invariant Verification

| Invariant | Status | Evidence |
|-----------|--------|----------|
| Stateless | ✅ PASS | No instance variables, pure functions |
| No side effects | ✅ PASS | No DB calls, no external services |
| Deterministic | ✅ PASS | Same input always produces same output |
| No transport logic | ✅ PASS | No CLI/HTTP/WS references |
| Pure functions | ✅ PASS | All methods return values based only on inputs |

---

## 6. Backward Compatibility

The `AlertCheckConfig` and `AlertCheckResult` types are preserved for compatibility with existing code:

```typescript
// Legacy types still exported for compatibility
export interface AlertCheckConfig { ... }
export interface AlertCheckResult { ... }
```

`AlertScenarioService` has been updated to use `evaluateCheck()` internally while maintaining the same external API.

---

## Deliverables Checklist

- [x] Updated AlertEngine implementation (no stubs)
- [x] Clear condition evaluator functions (one per condition)
- [x] triggerCheck() replaced with evaluateCheck() (documented)
- [x] Example input → output for each condition
- [x] Invariants verified (stateless, pure, deterministic)
- [x] No transport logic added
- [x] Build passes

**Status:** ✅ COMPLETE
