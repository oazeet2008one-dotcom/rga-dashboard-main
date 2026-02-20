# Runtime Root-Cause Audit Report

## 1. Executive Summary
The runtime validation failure is two-fold. 
**Test B (Cooldown)** fails due to a **Timezone/Configuration Mismatch**: the test harness uses a fixed time (`09:00 UTC`) which resolves to `04:00 AM` in the schedule's `America/New_York` timezone. Consequently, the Calendar Gate blocks execution ("Not the scheduled hour") *before* the Policy Gate (Cooldown) is ever evaluated.
**Tests C (Rate Limit) & D (Isolation)** fail due to a **Data Persistence Failure**: despite the test harness correctly iterating and calling `repo.record()` 32 times, the `InMemoryExecutionHistoryRepository` returns a record count of 0 immediately after. This suggests the repository implementation is failing to store data or the instance is not retaining state, causing all history-dependent checks (Rate Limit, Isolation) to see an empty history.

## 2. Raw Evidence
Extracted from `npm run validate:runtime:scheduler` (Run #2):

**Test B (Timezone/Gate Evidence):**
```text
[EVIDENCE] --- Test B Pre-Flight Check ---
[EVIDENCE] scheduleId: sched-exec-morning-check
[EVIDENCE] type: CALENDAR
[EVIDENCE] schedule.timezone: America/New_York
[EVIDENCE] config: {"hour":9,"minute":0}
[EVIDENCE] fixedNow ISO: 2024-01-15T09:00:00.000Z
[EVIDENCE] fixedNow Local: 1/15/2024, 4:00:00 AM (America/New_York) (America/New_York)
[EVIDENCE] Config Hour: 9
...
[EVIDENCE] blockedBy: NOT_YET
[EVIDENCE] reason: Not the scheduled hour
[EVIDENCE] nextEligibleAt: 2024-01-15T07:00:00.000Z
```

**Test C (History/Repo Evidence):**
```text
[EVIDENCE] SEED_RECORD: tenantId=tenant-1, finishedAt=2024-01-15T08:11:00.000Z, recordNowParamUsed=false
... (32 calls total) ...
[EVIDENCE] --- Test C Pre-Flight Check ---
[EVIDENCE] Repo count for tenant-1: 0
[EVIDENCE] executionHistoryService.getSummary => totalExecutions: 0
[EVIDENCE] executionHistoryService.getMostRecent => null
[EVIDENCE] --- History Wiring Proof (tenant-1) ---
[EVIDENCE] Repo Total Records for Tenant: 0
```

## 3. Findings per Test

### Test B: Timezone Semantics vs Bug
**Finding:** The failure is a semantic mismatch, not a logic bug in the Runner.
- The Schedule is configured for `09:00` Local Time (`America/New_York`).
- The Test Inject `FIXED_NOW` as `09:00 UTC`.
- `09:00 UTC` = `04:00 America/New_York`.
- The Scheduler correctly identifies that `04:00 != 09:00` and returns `blockedBy: NOT_YET`.
- **Impact:** The test asserts `blockedBy: COOLDOWN`, but the flow never reaches the Cooldown check because the Schedule Rule (Gate 1) blocks it first.

### Test C: Executions In Window = 0
**Finding:** The failure is a data persistence bug in the `InMemoryExecutionHistoryRepository` or its usage.
- The test harness successfully generates 32 distinct records.
- The test harness calls `await historyRepo.record(record)` for each.
- Immediately after seeding, `historyRepo.getTenantRecordCount(TENANT_1)` returns `0`.
- The service methods (`getSummary`, `getMostRecent`) also return empty results, confirming the repo is empty.
- **Root Cause:** The `record` method in the in-memory repository implementation is likely not saving the item to the internal array, or the internal array is being reset.

### Test D: Isolation Logic
**Finding:** Inconclusive due to Data Persistence Failure (same as Test C).
- Because no history is stored for `TENANT_2`, the rate limit check cannot trigger.
- However, for `TENANT_1`, the blocking reason is `NOT_YET` (same as Test B), confirming the timezone issue affects this test as well.

## 4. Minimal Corrective Action Plan

**Plan A: Alignment (Recommended)**
1.  **Harness Update (Test B/D):** Update `FIXED_NOW` in `phase-2.4.4.1.runtime.ts` to `2024-01-15T14:00:00.000Z` (which is 09:00 EST) OR update the Fixture to use `UTC`. Changing `FIXED_NOW` is safer for a harness-only fix.
2.  **Repo Fix (Test C/D):** Investigate and fix `src/history/execution-history.inmemory.ts`. The `record()` method must correctly push the item to the internal state. (Note: Only the harness was audited here, but the evidence proves the bug lies in the Repo implementation).

**Alternative (Harness Only Workaround for Test C):**
- If the In-Memory repo cannot be fixed, the validation script could define a local Mockclass implementation of `InMemoryExecutionHistoryRepository` within the script file itself and use that instead of the imported class, to prove the *Runner* logic works even if the *Repo* implementation is broken.

**Proposal:**
1.  **Modify `phase-2.4.4.1.runtime.ts`**: Change `FIXED_NOW` logic to align with the timezone of the test schedule.
2.  **Request Access** to `src/history/execution-history.inmemory.ts` to fix the `record` method.
