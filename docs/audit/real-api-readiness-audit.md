# Real API Production Readiness Audit

## 1. Executive Summary & Readiness Score

**Overall Readiness Score: 35%** — ระบบปัจจุบันสามารถเชื่อมต่อ OAuth และดึงข้อมูลจาก Google Ads ได้ แต่ยัง **ไม่พร้อมรับมือกับ Production API จริง** ในเรื่องปริมาณข้อมูลจำนวนมาก, Rate Limiting, และความทนทานต่อ Error

| Dimension                        | Score  | Status       |
|----------------------------------|--------|--------------|
| OAuth & Authentication           | 90%    | ✅ พร้อม      |
| Pagination & Large Data          | 0%     | ❌ ไม่มีเลย   |
| Rate Limit & Retry/Backoff       | 0%     | ❌ ไม่มีเลย   |
| Database Idempotency (Metrics)   | 70%    | ⚠️ บางส่วน    |
| Database Idempotency (Campaigns) | 50%    | ⚠️ มีความเสี่ยง |
| Data Mapping Safety              | 40%    | ⚠️ มีช่องโหว่  |
| Error Handling Granularity       | 30%    | ⚠️ ผิวเผิน    |
| Scheduled Sync Resilience        | 20%    | ❌ เปราะบาง   |

---

## 2. Files Audited

| # | File Path | Role |
|---|-----------|------|
| 1 | `backend/src/modules/integrations/google-ads/services/google-ads-api.service.ts` | API Caller (fetchCampaigns, fetchMetrics) |
| 2 | `backend/src/modules/integrations/google-ads/services/google-ads-client.service.ts` | GoogleAdsApi Client Factory |
| 3 | `backend/src/modules/integrations/google-ads/services/google-ads-sync.service.ts` | Campaign & Metric Sync Orchestrator |
| 4 | `backend/src/modules/integrations/google-ads/services/google-ads-mapper.service.ts` | Raw API ➜ Internal Schema Mapper |
| 5 | `backend/src/modules/integrations/google-ads/google-ads-oauth.service.ts` | OAuth Flow Handler |
| 6 | `backend/src/modules/integrations/google-ads/google-ads-campaign.service.ts` | Campaign Facade Service |
| 7 | `backend/src/modules/sync/unified-sync.service.ts` | Unified Cross-Platform Sync Engine |
| 8 | `backend/src/modules/sync/sync-scheduler.service.ts` | Cron-based Scheduled Sync |
| 9 | `backend/src/common/exceptions/google-ads.exception.ts` | Custom Exception Classes |
| 10 | `backend/prisma/schema.prisma` | Database Schema (Metric, Campaign, GoogleAdsAccount) |

---

## 3. Pagination & Throughput Analysis

### ❌ Critical Blocker: No Pagination Support

**ไฟล์ที่เกี่ยวข้อง:** `google-ads-api.service.ts` (Lines 181-195, 256-275)

**ปัญหา:** ทั้ง `fetchCampaigns()` และ `fetchCampaignMetrics()` ส่ง GAQL Query ไปยัง Google Ads API และรอรับผลลัพธ์ทั้งหมดใน Array เดียว (`const results = await customer.query(query)`) โดยไม่มีกลไก Pagination ใดๆ

**ผลกระทบ:**
- หากลูกค้ามี **5,000+ แคมเปญ** หรือ **365 วัน x หลายแคมเปญ** ของ Metrics → Array ใน Memory จะมีขนาดใหญ่มาก
- Google Ads API ส่งข้อมูลแบบ Streaming/Paged แต่ `google-ads-api` library ที่ใช้อยู่อาจ Buffer ทั้งหมดไว้ใน Memory → เสี่ยง OOM (Out of Memory)
- ไม่มีการตั้ง `LIMIT` ใน GAQL Query → ดึงข้อมูลทุกอย่างมาทุกครั้ง

**ข้อมูลเพิ่มเติม:** ฟังก์ชัน `syncAllCampaignMetrics()` ใน `google-ads-sync.service.ts` (Line 262) ใช้ `Promise.all()` (ไม่ใช่ `Promise.allSettled`) เพื่อ Sync Metrics ของทุกแคมเปญ **พร้อมกัน** → หากมี 100 แคมเปญ จะยิง 100 API Calls พร้อมกัน → ชน Rate Limit แน่นอน

---

## 4. Error Handling & Rate Limit Analysis

### ❌ Critical Blocker: No Retry, Backoff, or Circuit Breaker

**ไฟล์ที่เกี่ยวข้อง:** `google-ads-api.service.ts` (Lines 197-217, 289-331)

**สิ่งที่มีอยู่:**
- Error handler (`handleApiError`) ทำแค่ **แปลข้อความ Error ให้อ่านง่ายขึ้น** แล้ว throw ต่อ
- ดักจับ `invalid_grant` และ `USER_PERMISSION_DENIED` ได้ และเปลี่ยนสถานะ Account เป็น `DISCONNECTED`

**สิ่งที่ขาดหายอย่างวิกฤต:**
- **ไม่มี Retry Logic:** หาก Google API ตอบ `429 Too Many Requests`, `QUOTA_EXCEEDED`, `INTERNAL_ERROR` (500), หรือ `RESOURCE_EXHAUSTED` → ระบบจะ Fail ทันทีไม่มีการลองใหม่
- **ไม่มี Exponential Backoff:** ไม่มีกลไก Sleep/Wait ก่อน Retry
- **ไม่มี Circuit Breaker:** หาก Google API ล่มต่อเนื่อง → Scheduled Sync ทุก 6 ชั่วโมงจะยิง Requests ซ้ำๆ ไม่หยุด ไม่มีกลไก "หยุดชั่วคราว"
- **ไม่มีการแยก Transient vs Permanent Errors:** `invalid_grant` (Permanent) ถูกจัดการแล้ว แต่ `QUOTA_EXCEEDED` (Transient) ไม่ถูกจัดการเลย

### ⚠️ Scheduled Sync ไม่มี Guard

**ไฟล์ที่เกี่ยวข้อง:** `sync-scheduler.service.ts` (Lines 19-63)

**ปัญหา:** Cron Jobs ทั้ง 5 (`EVERY_6_HOURS`) ไม่มี:
- **Mutex/Lock:** หาก Sync รอบก่อนยังไม่เสร็จ รอบใหม่จะเริ่ม Overlap ได้
- **Timeout:** หาก API Call ค้าง → Sync จะค้างตลอดไป ไม่มี Deadline
- **Error Catch ระดับ Cron:** หาก `syncPlatform()` throw Error → UnhandledPromiseRejection อาจทำให้ Process ล่ม

---

## 5. Database Idempotency Risks

### ✅ Metrics (unified-sync.service.ts): ปลอดภัย
- ใช้ `prisma.metric.upsert()` กับ Composite Key `metrics_unique_key` (tenantId + campaignId + date + hour + platform + source)
- **ผลลัพธ์:** ดึงข้อมูลซ้ำ → Update แทน Create → ไม่มีข้อมูลซ้ำ ✅

### ⚠️ Metrics (google-ads-sync.service.ts): มีความเสี่ยงสูง
- ใช้ `prisma.metric.findFirst({ where: { campaignId, date } })` แล้ว Branch เป็น `create` หรือ `update` (Lines 175-201)
- **ปัญหา:** `findFirst` ค้นหาด้วย `campaignId` + `date` เท่านั้น **ไม่มี `tenantId`, `hour`, `platform`, `source`** → อาจ Match ผิด Record ในกรณีที่มี Multiple Sources หรือ Hour Granularity
- **ปัญหาเพิ่มเติม:** Pattern `findFirst + create/update` ไม่ใช่ Atomic Operation → Race Condition เป็นไปได้ หาก 2 Sync Processes ทำงานพร้อมกัน

### ⚠️ Campaigns (google-ads-sync.service.ts + unified-sync.service.ts): ปลอดภัยบางส่วน
- ทั้งสองไฟล์ใช้ Pattern `findFirst({ externalId, platform, tenantId })` → แล้ว `update` หรือ `create`
- **ข้อดี:** ใช้ 3 Conditions ร่วมกัน ลดโอกาส Duplicate
- **ข้อเสีย:** ยังไม่ใช่ Atomic `upsert` → Race Condition ยังเป็นไปได้ในทางทฤษฎี

---

## 6. Critical Blockers (Must Fix before Production)

เรียงตามความสำคัญ (Priority 1 = ต้องแก้ก่อนเปิดใช้งานจริง):

| Priority | Blocker | File(s) | Impact |
|----------|---------|---------|--------|
| **P0** | **ไม่มี Retry / Exponential Backoff สำหรับ Transient Errors** (`429`, `QUOTA_EXCEEDED`, `500`) | `google-ads-api.service.ts` | ระบบจะ Fail ทันทีเมื่อ Google ตอบช้าหรือ Rate Limit → ข้อมูลหาย, Sync ล้มเหลว |
| **P0** | **syncAllCampaignMetrics ยิง API แบบ Parallel ไม่จำกัด** (`Promise.all` ไม่มี Concurrency Limit) | `google-ads-sync.service.ts:262` | 100 แคมเปญ = 100 Concurrent API Calls → ชน Rate Limit ทันที |
| **P1** | **ไม่มี Pagination / Streaming** สำหรับ Campaigns และ Metrics ปริมาณมาก | `google-ads-api.service.ts` | ลูกค้ารายใหญ่ (5000+ แคมเปญ) → OOM หรือ Timeout |
| **P1** | **Metric Sync ใช้ `findFirst` + `create/update` แทน `upsert`** (Non-atomic) | `google-ads-sync.service.ts:175-201` | Race Condition → ข้อมูล Metrics ซ้ำซ้อนได้ |
| **P2** | **Scheduled Cron ไม่มี Mutex Lock** | `sync-scheduler.service.ts` | Sync รอบก่อนยังไม่เสร็จ รอบใหม่เริ่มซ้อน → Double Write, API Overload |
| **P2** | **Mapper ไม่ดักจับ `null`/`undefined` อย่างเข้มงวด** | `google-ads-mapper.service.ts:37-51` | `row.campaign.id.toString()` จะ Throw Error ถ้า `id` เป็น `null` → Sync ตาย |
| **P2** | **ไม่มี Timeout สำหรับ API Calls** | `google-ads-api.service.ts` | API Call ที่ค้าง → Process Hang ตลอดไป |
| **P3** | **Cron Jobs ไม่มี Top-level try/catch** | `sync-scheduler.service.ts:20-63` | UnhandledPromiseRejection → Process Crash |
| **P3** | **`saveWebAnalytics` mapping ผิดความหมาย** (`impressions` → `activeUsers`, `clicks` → `sessions`) | `unified-sync.service.ts:376-377` | ข้อมูล GA4 ถูกบันทึกด้วยค่าที่ไม่ถูกต้อง |
