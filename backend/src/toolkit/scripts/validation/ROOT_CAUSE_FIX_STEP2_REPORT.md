# Runtime Root-Cause Fix Report (Step 2)

## 1. Executive Summary
The Runtime Validation Harness (`phase-2.4.4.1.runtime.ts`) has been successfully fixed and is now passing all tests (A, B, C, D).
The root causes were:
1.  **Timezone Mismatch (Test B)**: The test harness was using `09:00 UTC` (04:00 EST), which caused the Calendar Gate to block execution ("Not the scheduled hour") before the Cooldown policy could be tested.
2.  **Data Persistence Failure (Tests C & D)**: The `InMemoryExecutionHistoryRepository` was evicting "old" records (from 2024) because the seeding method did not pass a reference `now` time, causing the repo to use the current system time (2026) for age calculation, resulting in immediate eviction.

## 2. Changes Applied

### A. Timezone Alignment
**File:** `src/toolkit/scripts/validation/phase-2.4.4.1.runtime.ts`
- **Change:** Updated `FIXED_NOW_ISO` from `2024-01-15T09:00:00.000Z` to `2024-01-15T14:00:00.000Z`.
- **Reason:** `14:00 UTC` corresponds to `09:00 EST` (America/New_York), which matches the scheduled hour in the fixture `tenant-1.json`. This ensures the Calendar Gate passes, allowing Policy Gates (Cooldown/Rate Limit) to be evaluated.

### B. History Persistence Fix
**File:** `src/toolkit/scripts/validation/phase-2.4.4.1.runtime.ts`
- **Change:** Modified `seedExecution` signature to accept a `referenceNow` parameter (defaulting to `FIXED_NOW`).
- **Change:** Updated `seedExecution` to call `historyRepo.record(record, referenceNow)`.
- **Reason:** Passing `referenceNow` forces the In-Memory Repository to calculate record age relative to the test time (2024) rather than real time (2026), preventing erroneous eviction of test data.

### C. Fail-Fast Assertion
**File:** `src/toolkit/scripts/validation/phase-2.4.4.1.runtime.ts`
- **Change:** Added a pre-flight check in Test C.
- **Reason:** Explicitly checks if `executionsInWindow > 0` immediately after seeding. If 0, it fails the test with a FATAL error, preventing misleading logic failures downstream.

## 3. Verification Evidence (Run #3)
All tests PASS with the applied fixes.

```text
Running Test A: Determinism Repeatability...
[EVIDENCE] SEED_RECORD: tenantId=tenant-1, finishedAt=2024-01-15T13:57:30.000Z...

Running Test B: Cooldown Block...
[EVIDENCE] fixedNow Local: 1/15/2024, 9:00:00 AM (America/New_York)
[EVIDENCE] shouldTrigger: false
[EVIDENCE] blockedBy: COOLDOWN

Running Test C: Rate-Limit Block...
[EVIDENCE] --- Test C Pre-Flight Check ---
[EVIDENCE] executionsInWindow: 32
[EVIDENCE] shouldTrigger: false
[EVIDENCE] blockedBy: LIMIT

Running Test D: Tenant Isolation...
[EVIDENCE] Tenant-1 Count (Expected 1): 1
[EVIDENCE] Tenant-2 Count (Expected 50): 50
[EVIDENCE] Tenant-1 blockedBy: COOLDOWN

╔════════════════════════════════════════════════════════════════════╗
║  RESULTS SUMMARY                                                   ║
╠════════════════════════════════════════════════════════════════════╣
║  ✅ PASS: Test A: Determinism Repeatability (3 runs)                 ║
║  ✅ PASS: Test B: Cooldown Block                                     ║
║  ✅ PASS: Test C: Rate-Limit Block                                   ║
║  ✅ PASS: Test D: Tenant Isolation                                   ║
╠════════════════════════════════════════════════════════════════════╣
║  FINAL VERDICT: ✅ SAFE                                              ║
╚════════════════════════════════════════════════════════════════════╝
```

## 4. Verdict
**PASS**. The harness is now reliable and correctly validates the Scheduler logic against the provided fixtures without modifying any business logic.
