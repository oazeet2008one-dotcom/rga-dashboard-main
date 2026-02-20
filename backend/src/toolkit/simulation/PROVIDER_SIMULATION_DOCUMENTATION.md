# Provider & Simulation Documentation

**Phase:** 2.2.2  
**Status:** ✅ COMPLETE  
**Purpose:** Mock providers for deterministic alert testing

---

## Overview

This module provides **deterministic, stateless** mock implementations of the provider interfaces used by `AlertExecutionService`.

It enables developers to:
- Test alert logic with predictable data
- Reproduce scenarios consistently
- Add new test cases without touching core logic
- Validate end-to-end alert flow

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AlertExecutionService                     │
│                      (unchanged)                             │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────▼──────────┐      ┌───────────▼────────────┐
    │  IRuleProvider      │      │   IMetricProvider      │
    │  (interface)        │      │   (interface)          │
    └──────────┬──────────┘      └───────────┬────────────┘
               │                              │
    ┌──────────▼──────────┐      ┌───────────▼────────────┐
    │  MockRuleProvider   │      │   MockMetricProvider   │
    │  (fixtures/memory)  │      │   (fixtures/generated) │
    └──────────┬──────────┘      └───────────┬────────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ SimulationContext │
                    │ (deterministic)   │
                    └───────────────────┘
```

---

## Components

### 1. SimulationContext

Defines the context for a deterministic simulation run.

```typescript
interface SimulationContext {
    tenantId: string;           // Scope for data
    scenarioName: string;       // Fixture identifier
    dateRange: { start, end };  // Evaluation window
    mode: 'FIXTURE' | 'GENERATED' | 'HYBRID';
    seed?: string;              // Deterministic seed
    metricOverrides?: Record<string, number>;
}
```

**Factory Functions:**
- `createSimulationContext(params)` - General purpose
- `createPredefinedScenarioContext(name, tenantId)` - Predefined scenarios

### 2. MockRuleProvider

Loads alert rules from fixtures or returns defaults.

**Resolution Order:**
1. `fixtures/rules/{scenario-name}.json`
2. `fixtures/rules/{tenant-id}.json`
3. `fixtures/rules/default.json`
4. Built-in `DEFAULT_RULES`

**Usage:**
```typescript
const context = createPredefinedScenarioContext('zero-conversion', 'tenant-123');
const ruleProvider = new MockRuleProvider(context);
const rules = await ruleProvider.resolveRules('tenant-123');
```

### 3. MockMetricProvider

Loads or generates metric snapshots deterministically.

**Data Sources:**
- **FIXTURE mode:** Load from `fixtures/metrics/{scenario}.json`
- **GENERATED mode:** Deterministic generation based on seed
- **HYBRID mode:** Fixtures first, fall back to generation

**Seeded Random Generator:**
- Same seed = same generated data
- Uses Linear Congruential Generator for determinism

**Usage:**
```typescript
const metricProvider = new MockMetricProvider(context);
const snapshots = await metricProvider.fetchSnapshots('tenant-123', dateRange);
const baselines = await metricProvider.fetchBaselines('tenant-123', ['camp-1'], baselineRange);
```

---

## Fixture Convention

### Directory Structure

```
fixtures/
├── rules/
│   ├── default.json          # Fallback rules
│   ├── zero-conversion.json  # Scenario-specific rules
│   └── custom-tenant.json    # Tenant-specific rules
└── metrics/
    ├── zero-conversion.json           # Current metrics
    ├── zero-conversion-baseline.json  # Baseline metrics
    └── drop-spend.json
```

### Rule Fixture Format

```json
{
  "description": "Rules for zero conversion scenario",
  "rules": [
    {
      "id": "rule-zero-conv",
      "name": "Budget Burn",
      "condition": {
        "type": "ZERO_CONVERSIONS",
        "minSpend": 5000
      },
      "severity": "CRITICAL",
      "enabled": true
    }
  ]
}
```

### Metric Fixture Format

```json
{
  "description": "Zero conversion scenario",
  "metrics": [
    {
      "tenantId": "demo-tenant",
      "campaignId": "campaign-1",
      "date": "2024-01-15T00:00:00.000Z",
      "platform": "GOOGLE_ADS",
      "metrics": {
        "impressions": 45000,
        "clicks": 2250,
        "conversions": 0,
        "spend": 7500,
        "revenue": 0,
        "ctr": 0.05,
        "cpc": 3.33,
        "cvr": 0,
        "roas": 0
      }
    }
  ]
}
```

### Baseline Fixture Format

```json
{
  "description": "Baseline for drop detection",
  "baselines": {
    "campaign-1": {
      "metrics": { /* baseline metrics */ },
      "dateRange": {
        "start": "2024-01-08T00:00:00.000Z",
        "end": "2024-01-14T23:59:59.000Z"
      }
    }
  }
}
```

---

## Predefined Scenarios

| Scenario | Description | Triggers |
|----------|-------------|----------|
| `zero-conversion` | High spend, zero conversions | Budget Burn alert |
| `drop-spend` | 50%+ drop in clicks/spend | CTR Drop alert |
| `high-roas` | ROAS > 5.0 | (No alert) |
| `missing-metrics` | Partial data | Validation edge cases |
| `baseline-comparison` | Requires baseline | DROP_PERCENT condition |

**Usage:**
```typescript
const context = createPredefinedScenarioContext('zero-conversion', 'tenant-123');
```

---

## Example: End-to-End Execution

```typescript
import {
    AlertExecutionService,
    ExecutionContext,
} from '../services/alert-execution.service';
import {
    createPredefinedScenarioContext,
    MockRuleProvider,
    MockMetricProvider,
} from '../simulation';

// 1. Create simulation context
const simContext = createPredefinedScenarioContext(
    'zero-conversion',
    'demo-tenant'
);

// 2. Create execution context
const execContext: ExecutionContext = {
    tenantId: 'demo-tenant',
    executionTime: new Date(),
    dryRun: false,
    executionMode: 'TEST',
};

// 3. Create providers
const ruleProvider = new MockRuleProvider(simContext);
const metricProvider = new MockMetricProvider(simContext);

// 4. Execute
const executionService = new AlertExecutionService(alertEngine);
const result = await executionService.execute(
    execContext,
    ruleProvider,
    metricProvider
);

// 5. Assert
console.log(result.summary.triggeredCount); // 1 (Zero Conversions alert)
```

---

## Determinism Verification

### Test: Same Context → Same Output

```typescript
const context = createSimulationContext({
    tenantId: 'test',
    scenarioName: 'zero-conversion',
    dateRange: { start: new Date('2024-01-01'), end: new Date('2024-01-07') },
    mode: 'GENERATED',
    seed: 'deterministic-seed-123',
});

const provider1 = new MockMetricProvider(context);
const provider2 = new MockMetricProvider(context);

const metrics1 = await provider1.fetchSnapshots('test', dateRange);
const metrics2 = await provider2.fetchSnapshots('test', dateRange);

// metrics1 === metrics2 (deep equality)
```

### Test: Different Seeds → Different Output

```typescript
const context1 = { ...context, seed: 'seed-a' };
const context2 = { ...context, seed: 'seed-b' };

// Generated metrics will differ
```

---

## Invariant Verification

| Invariant | Status | Evidence |
|-----------|--------|----------|
| Deterministic | ✅ PASS | Seeded RNG, cached fixtures |
| Stateless | ✅ PASS | No instance variables |
| Replaceable | ✅ PASS | Implements IRuleProvider/IMetricProvider |
| Side-effect free | ✅ PASS | No IO beyond fixture loading |
| Transport-agnostic | ✅ PASS | No HTTP/WS references |
| Tenant isolated | ✅ PASS | tenantId validation everywhere |

---

## This vs Production

| Aspect | Simulation | Production |
|--------|------------|------------|
| **Data Source** | Fixtures / Generated | Database / Ads APIs |
| **Determinism** | Guaranteed | Variable (real data) |
| **Latency** | Instant | Network latency |
| **Cost** | Free | API costs |
| **Use Case** | Testing, validation | Live monitoring |
| **Reproducibility** | Exact replay | Cannot replay |

---

## Adding New Scenarios

1. **Create rule fixture** (optional):
   ```bash
   touch fixtures/rules/my-scenario.json
   ```

2. **Create metric fixture**:
   ```bash
   touch fixtures/metrics/my-scenario.json
   ```

3. **Add to predefined scenarios** (optional):
   ```typescript
   export const PREDEFINED_SCENARIOS = {
     ...existing,
     'my-scenario': {
       description: 'My custom scenario',
       defaultDateRange: { days: 1 },
     },
   };
   ```

4. **Use in test/CLI**:
   ```typescript
   const context = createPredefinedScenarioContext('my-scenario', 'tenant-123');
   ```

**No core code changes required!**

---

## Deliverables Checklist

- [x] MockRuleProvider implementation
- [x] MockMetricProvider implementation
- [x] SimulationContext definition
- [x] Fixture structure and examples
- [x] Deterministic generation (seeded RNG)
- [x] Predefined scenarios
- [x] Invariant verification
- [x] Build passes

---

## Success Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| AlertExecutionService runs end-to-end | ✅ PASS | Can execute with mock providers |
| No production dependencies | ✅ PASS | No DB, API, or external IO |
| Junior dev can add scenario | ✅ PASS | Add fixture files only |
| Remains Developer Toolkit | ✅ PASS | No backend/server logic |

---

**Ready for Phase 2.2.3:** ✅ YES
