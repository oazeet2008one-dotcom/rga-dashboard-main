# Manual Verification Test Plan

**Topic:** System Verification (Sprint 2 & 3 Support)
**Objective:** Verify system stability under heavy load and ensure alert watchdogs trigger correctly.

## 1. Prerequisites
- **Backend Running:** Ensure the NestJS server is running.
  ```bash
  npm run start:dev
  ```
- **Access Swagger:** Open [http://localhost:3000/api/docs](http://localhost:3000/api/docs) to easily interact with the Verification endpoints.
- **Authentication:** You must have a valid JWT token (Login via Frontend or use `Auth` endpoints in Swagger).

---

## 2. Test Scenario A: Export Scalability (Stress Test)
**Goal:** Verify that the Export Engine handles 10,000+ rows without crashing or timing out.

### Steps:
1.  **Seed Heavy Data:**
    -   Endpoint: `POST /api/v1/verify/seed-heavy`
    -   Payload: `{ "count": 10000 }`
    -   *Expected Result:* Returns success with inserted count ~10k campaigns and ~900k metrics.
    -   *Time:* May take 30-60 seconds.

2.  **Check Memory (Baseline):**
    -   Endpoint: `GET /api/v1/verify/memory-check`
    -   *Observe:* Note the `heapUsed` value (e.g., ~150MB).

3.  **Trigger Export:**
    -   Endpoint: `GET /api/v1/campaigns/export` (assuming standard export endpoint) or navigate to **Campaigns Page** > **Export CSV**.
    -   *Action:* During the request, if possible, hit `memory-check` again to see the spike.

### Verification Criteria:
-   [ ] **Status 200 OK:** API does not return 500/504.
-   [ ] **File Download:** A `.csv` file is downloaded.
-   [ ] **Data Integrity:** Open CSV. Check row count is at least 10,001 (header + data).
-   [ ] **Character Encoding:** Thai characters (e.g., "โปรโมชั่น") are readable (BOM included).

---

## 3. Test Scenario B: Watchdog Accuracy
**Goal:** Verify that the Alert Scheduler correctly detects threshold breaches and creates notifications.

### Steps:
1.  **Create a Failing Rule:**
    -   Via UI (Settings > Alert Rules) or API.
    -   **Rule:** "CTR < 100%" (Impossible to achieve 100% CTR usually, effectively forcing an alert).
    -   **Severity:** `WARNING`.

2.  **Force Scheduler Trigger:**
    -   Endpoint: `POST /api/v1/verify/trigger-alert-now`
    -   *Expected Result:* `{ "success": true, "message": "Alert cron triggered..." }`

3.  **Verify Alert Creation:**
    -   Endpoint: `GET /api/v1/notifications` (or check UI Bell icon).
    -   *Expected Result:* New notification exists: "CTR dropped below threshold".
    -   **Database:** Check `Alert` table for a new record with `status: OPEN`.

---

## 4. Test Scenario C: Integration Health
**Goal:** Ensure the "Heavy" verify actions don't block or break other tenants.

### Steps:
1.  **Tail Logs:** Watch the server console output.
2.  **Trigger Actions:** Run `trigger-alert-now` immediately after starting `seed-heavy`.
3.  **Observation:**
    -   The Scheduler should not fail because the DB is busy seeding.
    -   Tenant isolation: Errors in one tenant (if any) should be logged but loop should continue to next tenant.

### Verification Criteria:
-   [ ] **No Crash:** Server stays `UP`.
-   [ ] **Isolation:** Logs show "Checking alerts for X tenants..." without unhandled exceptions stopping the process.
