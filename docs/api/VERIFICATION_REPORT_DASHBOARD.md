# Dashboard Overview API - Verification Report

> **Endpoint:** `GET /api/v1/dashboard/overview`  
> **Spec Reference:** [DASHBOARD_API_SPEC.md](./DASHBOARD_API_SPEC.md)  
> **Test Date:** _______________  
> **Tester:** _______________

---

## 1. Pre-requisites

### 1.1 Start the Backend Server
```bash
cd backend
npm run start:dev
```
Expected: Server running on `http://localhost:3000`

### 1.2 Obtain Access Token

**Option A: Login via cURL**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@rga.com", "password": "password123"}'
```

**Option B: Use existing token from browser DevTools**
1. Login via frontend at `http://localhost:5173`
2. Open DevTools → Application → Local Storage
3. Copy `accessToken` value

### 1.3 Set Token Variable (PowerShell)
```powershell
$TOKEN = "your_access_token_here"
```

---

## 2. Test Scenarios

### TC-01: Happy Path (Default Period)
**Description:** Call endpoint without parameters, expect default `7d` period.

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected:**
- Status: `200 OK`
- `meta.period` = `"7d"`
- `data.summary` object exists
- `data.trends` is array with ~7 items

---

### TC-02: Query Param - 30 Days
**Description:** Request 30-day period explicitly.

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/overview?period=30d" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- Status: `200 OK`
- `meta.period` = `"30d"`
- `meta.dateRange.from` should be ~30 days before `to`

---

### TC-03: Query Param - This Month
**Description:** Request current month data.

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/overview?period=this_month" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- Status: `200 OK`
- `meta.period` = `"this_month"`
- `meta.dateRange.from` = first day of current month

---

### TC-04: Data Integrity Check
**Description:** Verify seeded data is returned correctly.

```bash
curl -s "http://localhost:3000/api/v1/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.summary'
```

**Validation:**
- [ ] `totalImpressions` > 0 (seed generates 10,000-60,000 per day)
- [ ] `totalClicks` > 0
- [ ] `totalCost` > 0
- [ ] `averageCtr` is a number (not null/undefined)

---

### TC-05: Response Structure Check
**Description:** Verify all required fields present per API spec.

```bash
curl -s "http://localhost:3000/api/v1/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN" | jq 'keys'
```

**Validation Checklist:**
- [ ] Top level: `success`, `data`, `meta`
- [ ] `data.summary`: `totalImpressions`, `totalClicks`, `totalCost`, `totalConversions`, `averageCtr`, `averageRoas`
- [ ] `data.growth`: `impressionsGrowth`, `clicksGrowth`, `costGrowth`, `conversionsGrowth`
- [ ] `data.trends`: Array of objects with `date`, `impressions`, `clicks`, `cost`, `conversions`
- [ ] `data.recentCampaigns`: Array (max 5) with `id`, `name`, `status`, `platform`, `spending`

---

### TC-06: Recent Campaigns Array
**Description:** Verify recentCampaigns structure and count.

```bash
curl -s "http://localhost:3000/api/v1/dashboard/overview" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.recentCampaigns | length'
```

**Expected:**
- Length ≤ 5
- Seeded data has 3 campaigns, so expect 3

---

### TC-07: Error Handling - Invalid Period
**Description:** Send invalid period value, expect 400 error.

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/overview?period=invalid" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- Status: `400 Bad Request`
- Error message mentioning valid period values

---

### TC-08: Error Handling - No Auth Token
**Description:** Call without Authorization header.

```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/overview"
```

**Expected:**
- Status: `401 Unauthorized`

---

## 3. Results Checklist

| Test ID | Description | Status | Response Time | Pass/Fail |
|---------|-------------|--------|---------------|-----------|
| TC-01 | Happy Path (7d default) | ___ | ___ms | ✅ |
| TC-02 | Period = 30d | ___ | ___ms | ✅ |
| TC-03 | Period = this_month | ___ | ___ms | ✅ |
| TC-04 | Data Integrity | ___ | ___ms | ✅ |
| TC-05 | Structure Check | ___ | ___ms | ✅ |
| TC-06 | Recent Campaigns Count | ___ | ___ms | ✅ |
| TC-07 | Invalid Period (400) | ___ | ___ms | ✅ |
| TC-08 | No Auth (401) | ___ | ___ms | ✅ |

**Legend:** ✅ Pass | ❌ Fail | ⚠️ Partial | ⬜ Not Tested

---

## 4. Validation Instructions

### 4.1 JSON Structure Validation
Use `jq` to verify nested structure:

```bash
# Check summary object keys
curl -s ... | jq '.data.summary | keys'
# Expected: ["averageCtr","averageRoas","totalClicks","totalConversions","totalCost","totalImpressions"]

# Check trends array first item
curl -s ... | jq '.data.trends[0] | keys'
# Expected: ["clicks","conversions","cost","date","impressions"]

# Check growth values are numbers or null
curl -s ... | jq '.data.growth | map(type)'
# Expected: all "number" or "null"
```

### 4.2 Date Range Validation
```bash
# For 7d period, verify date range is ~7 days
curl -s ... | jq '.meta.dateRange'
# Calculate: (to - from) should be ≈ 7 days
```

### 4.3 Growth Null Handling
If previous period has no data, growth should be `null`:
```bash
curl -s ... | jq '.data.growth.impressionsGrowth'
# If no previous data: null
# If has previous data: number (positive or negative)
```

---

## 5. Known Issues / Notes

| Issue | Description | Status |
|-------|-------------|--------|
| | | |

---

## 6. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Developer | | | |

---

**Test Result:** ⬜ PASS / ⬜ FAIL / ⬜ BLOCKED
