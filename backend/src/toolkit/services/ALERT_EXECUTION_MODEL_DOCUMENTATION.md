# Phase 2.2.1: Alert Execution Model - Documentation

**Status:** ✅ COMPLETE  
**Date:** 2026-02-05  
**Scope:** Alert execution orchestration and flow

---

## 1. Core Concepts

### AlertExecutionRun

A single, bounded evaluation of alert rules against metrics data.

```
AlertExecutionRun
├── runId (unique identifier)
├── context (ExecutionContext)
│   ├── tenantId
│   ├── executionTime
│   ├── dryRun
│   └── executionMode (MANUAL | SCHEDULED | TEST)
├── startedAt
├── completedAt
└── status (PENDING | RUNNING | COMPLETED | FAILED)
```

### ExecutionContext

Input parameters that define how the execution should run.

```typescript
interface ExecutionContext {
    tenantId: string;           // Scope for rules and metrics
    executionTime: Date;        // When execution was initiated
    dryRun: boolean;           // If true, no side effects
    executionMode: ExecutionMode; // How triggered (MANUAL/SCHEDULED/TEST)
    correlationId?: string;    // For tracing
    triggeredBy?: string;      // User identifier (if manual)
}
```

### ExecutionResult

Complete output of an execution run.

```typescript
interface ExecutionResult {
    runId: string;
    context: ExecutionContext;
    timing: { startedAt, completedAt, durationMs };
    summary: {
        totalRules: number;
        enabledRules: number;
        triggeredCount: number;
        notTriggeredCount: number;
        snapshotsEvaluated: number;
    };
    triggeredAlerts: RuleEvaluation[];
    status: 'COMPLETED' | 'FAILED';
    error?: { message, code };
}
```

---

## 2. Step-by-Step Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Initialize                                         │
│  - Generate runId                                           │
│  - Record start time                                        │
│  - Validate context                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Step 2: Resolve Rules                                      │
│  - Call IRuleProvider.resolveRules(tenantId)               │
│  - Filter to enabled rules                                  │
│  - Early exit if no rules                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Step 3: Fetch Metrics                                      │
│  - Call IMetricProvider.fetchSnapshots()                   │
│  - Handle empty result (early return)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Step 4: Fetch Baselines (Optional)                         │
│  - If provider supports baselines                           │
│  - Call fetchBaselines()                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Step 5: Invoke AlertEngine                                 │
│  - Build AlertEngineContext                                 │
│  - Call alertEngine.evaluateCheck()                        │
│  - Receive evaluation results                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Step 6: Aggregate Results                                  │
│  - Map to RuleEvaluation objects                            │
│  - Separate triggered vs not-triggered                      │
│  - Calculate summary statistics                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Step 7: Emit Domain Events                                 │
│  - Emit alert:execution_completed                          │
│  - Emit alert:triggered (for each triggered alert)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Step 8: Return ExecutionResult                             │
│  - Build complete result object                             │
│  - Include timing, summary, alerts                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Abstractions (Interfaces)

### IRuleProvider

Decouples execution from rule resolution.

```typescript
interface IRuleProvider {
    resolveRules(tenantId: string): Promise<AlertRule[]>;
}
```

**Implementations:**
- Database provider (query AlertRule table)
- Mock provider (for testing)
- Cache provider (with fallback)

### IMetricProvider

Decouples execution from metric data sources.

```typescript
interface IMetricProvider {
    fetchSnapshots(
        tenantId: string,
        dateRange: { start: Date; end: Date }
    ): Promise<MetricSnapshot[]>;

    fetchBaselines?(
        tenantId: string,
        campaignIds: string[],
        baselineDateRange: { start: Date; end: Date }
    ): Promise<Map<string, BaselineSnapshot>>;
}
```

**Implementations:**
- Prisma provider (query Metric table)
- API provider (fetch from Ads platforms)
- Mock provider (for testing)

---

## 4. Example Execution Run

### Input Context

```typescript
const context: ExecutionContext = {
    tenantId: "tenant-123",
    executionTime: new Date("2024-01-15T10:30:00Z"),
    dryRun: false,
    executionMode: "MANUAL",
    triggeredBy: "user@example.com",
    correlationId: "corr-abc-123"
};
```

### Invoked Rules

```typescript
const rules: AlertRule[] = [
    {
        id: "rule-1",
        name: "High Spend Alert",
        condition: { type: "THRESHOLD", metric: "spend", operator: "GT", value: 10000 },
        severity: "HIGH",
        enabled: true
    },
    {
        id: "rule-2",
        name: "Zero Conversions",
        condition: { type: "ZERO_CONVERSIONS", minSpend: 5000 },
        severity: "CRITICAL",
        enabled: true
    }
];
```

### Result Output

```typescript
const result: ExecutionResult = {
    runId: "exec-1705314600000-abc123",
    context: { /* as above */ },
    timing: {
        startedAt: new Date("2024-01-15T10:30:00.100Z"),
        completedAt: new Date("2024-01-15T10:30:00.250Z"),
        durationMs: 150
    },
    summary: {
        totalRules: 2,
        enabledRules: 2,
        triggeredCount: 1,
        notTriggeredCount: 1,
        snapshotsEvaluated: 3
    },
    triggeredAlerts: [
        {
            rule: { /* High Spend Alert */ },
            triggered: true,
            reason: "spend ($15,000.00) > $10,000.00",
            values: { current: 15000, threshold: 10000 },
            evaluatedAt: new Date("2024-01-15T10:30:00.200Z")
        }
    ],
    status: "COMPLETED"
};
```

---

## 5. Event Emission

### Events Emitted

| Event | When | Payload |
|-------|------|---------|
| `alert:execution_completed` | After execution finishes | runId, mode, summary |
| `alert:triggered` | For each triggered alert | rule details, reason |

### Event Boundaries

- Events are emitted AFTER execution completes
- Event emission failure does NOT affect execution result
- No transport logic in event emission (pure domain events)

---

## 6. Invariant Verification

| Invariant | Status | Evidence |
|-----------|--------|----------|
| Stateless | ✅ PASS | No instance variables |
| No scheduling | ✅ PASS | No timers/cron |
| No transport logic | ✅ PASS | Pure orchestration |
| No persistence | ✅ PASS | Abstractions only |
| AlertEngine unchanged | ✅ PASS | Uses existing methods |
| Deterministic | ✅ PASS | Same input = same output |

---

## 7. Design Decisions

### Why Abstractions (IRuleProvider, IMetricProvider)?

- Decouples execution from data sources
- Enables testing without database
- Allows switching implementations
- Follows Dependency Inversion Principle

### Why 8-Step Flow?

- Each step has single responsibility
- Clear boundaries for testing
- Easy to add logging/metrics at each step
- Early exits for edge cases

### Why Events at Step 7?

- Execution must complete before events emitted
- Events represent "completed" facts
- Failure isolation (emission doesn't affect result)

---

## Deliverables Checklist

- [x] AlertExecutionService implementation
- [x] ExecutionContext definition
- [x] ExecutionResult definition
- [x] Step-by-step execution flow
- [x] Example execution run
- [x] IRuleProvider abstraction
- [x] IMetricProvider abstraction
- [x] Event emission (domain only)
- [x] Invariant verification
- [x] Build passes

**Status:** ✅ COMPLETE
