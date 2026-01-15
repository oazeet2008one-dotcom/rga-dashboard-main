# Schema Consolidation - Implementation Plan

> **เป้าหมาย:** สร้าง Database Schema ที่ **"Just Enough"** สำหรับ Sprint 1-4 แต่ **"Scalable"** รองรับ Phase ต่อไป

---

## 📊 Gap Analysis Summary

### Sprint 1-4 Scope Requirements

| Sprint | Features | Required Tables |
|--------|----------|-----------------|
| **Sprint 1** | Auth, Multi-tenant, Overview (Mock Data) | `User`, `Tenant`, `Session`, `Metric` |
| **Sprint 2** | Website Connector, Trend Graph (7/30 days), Export | `GoogleAnalyticsAccount`, `WebAnalyticsDaily`, `Metric` |
| **Sprint 3** | Ads Connector (Multi-channel), Alerts (Rule-based), ETL Daily | `*AdsAccount`, `Campaign`, `AlertRule`, `Alert`, `SyncLog` |
| **Sprint 4** | UI Filters, Caching, UAT | `Notification`, `PlatformToken`, `AuditLog` |

---

## ✅ Scope Validation Results

### Tables ที่มีอยู่แล้วและรองรับ Sprint 1-4 ✓

| ตาราง | Sprint | สถานะ | หมายเหตุ |
|-------|--------|--------|----------|
| `User` | 1 | ✅ Ready | รองรับ Role, Security, 2FA |
| `Tenant` | 1 | ✅ Ready | Multi-tenant พร้อม |
| `Session` | 1 | ✅ Ready | JWT Refresh Token |
| `Metric` | 1-2 | ✅ Ready | Time-series data |
| `Campaign` | 2-3 | ✅ Ready | Multi-platform ready |
| `GoogleAnalyticsAccount` | 2 | ✅ Ready | GA4 connector |
| `WebAnalyticsDaily` | 2 | ✅ Ready | Trend Graph data |
| `GoogleAdsAccount` | 3 | ✅ Ready | Google Ads connector |
| `FacebookAdsAccount` | 3 | ✅ Ready | Meta Ads connector |
| `TikTokAdsAccount` | 3 | ✅ Ready | TikTok Ads connector |
| `LineAdsAccount` | 3 | ✅ Ready | LINE Ads connector |
| `AlertRule` | 3 | ✅ Ready | Rule-based alerts |
| `Alert` | 3 | ✅ Ready | Alert notifications |
| `SyncLog` | 3 | ✅ Ready | ETL tracking |
| `Notification` | 4 | ✅ Ready | In-app notifications |
| `PlatformToken` | 4 | ✅ Ready | Unified token management |
| `AuditLog` | 4 | ✅ Ready | Activity tracking |

> [!NOTE]
> **สรุป:** Schema ปัจจุบัน ([schema.prisma](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/prisma/schema.prisma)) **รองรับ Sprint 1-4 ครบถ้วนแล้ว!**

---

## 🔍 Gap Analysis: เปรียบเทียบกับ Backend Team Design

### ตาราง [database_documentation.md](file:///c:/Users/User/Desktop/rga-dashboard-main/docs/database_documentation.md) (17 tables) vs [schema.prisma](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/prisma/schema.prisma) ปัจจุบัน

| Table in Documentation | มีใน Prisma? | Action |
|------------------------|--------------|--------|
| `tenants` | ✅ `Tenant` | เพิ่ม fields เสริม |
| `users` | ✅ `User` | ครบแล้ว |
| `roles` | ❌ ไม่มี | **อาจเพิ่มใน Phase 2** (ปัจจุบันใช้ Enum แทน) |
| `integrations` | ⚠️ `APIConnection` | **ควรเพิ่ม `Integration` model** |
| `campaigns` | ✅ `Campaign` | ครบแล้ว |
| `metrics` | ✅ `Metric` | เพิ่ม JSONB `metadata` |
| `alerts` | ✅ `Alert` | ครบแล้ว |
| `alert_history` | ❌ ไม่มี | **ควรเพิ่ม** |
| `reports` | ❌ ไม่มี | **Phase 2** (Export Sprint 2 ใช้ in-memory) |
| `ai_insights` | ❌ ไม่มี | **Phase 2-3** |
| `ai_queries` | ❌ ไม่มี | **Phase 2-3** |
| `audit_logs` | ✅ `AuditLog` | ครบแล้ว |
| `activity_logs` | ❌ ไม่มี | **Merge with AuditLog** |
| `sessions` | ✅ `Session` | ครบแล้ว |
| `sync_histories` | ✅ `SyncLog` | ครบแล้ว |
| `webhook_events` | ❌ ไม่มี | **Phase 2** |
| `oauth_states` | ❌ ไม่มี | **ใช้ Redis/Memory แทน** |

---

## 🎯 Proposed Changes

### ✅ KEEP (ตารางที่ใช้งานได้ทันที)

ทุกตารางใน [schema.prisma](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/prisma/schema.prisma) ปัจจุบันพร้อมใช้งาน Sprint 1-4

### ➕ ADD (ตารางที่ควรเพิ่ม)

#### 1. [NEW] `AlertHistory` - ประวัติการแจ้งเตือน

```prisma
model AlertHistory {
  id             String   @id @default(cuid())
  alertId        String
  tenantId       String
  triggeredAt    DateTime @default(now())
  metricValue    Float?
  thresholdValue Float?
  message        String?
  metadata       Json?
  notificationSent Boolean @default(false)
  
  alert  Alert  @relation(fields: [alertId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([alertId])
  @@index([tenantId])
  @@index([triggeredAt])
}
```

**เหตุผล:** Sprint 3 ต้องการ tracking ว่า Alert ถูก trigger กี่ครั้ง

#### 2. [MODIFY] `Metric` - เพิ่ม `metadata` JSONB

```diff
model Metric {
  // ... existing fields
+ metadata    Json?  @db.JsonB // For future platform-specific data
}
```

**เหตุผล:** Future-proofing สำหรับข้อมูลเฉพาะ Platform (TikTok, LINE)

#### 3. [MODIFY] `Tenant` - เพิ่ม fields ที่ขาด

```diff
model Tenant {
+ slug            String?  @unique
+ domain          String?
+ logoUrl         String?
+ primaryColor    String?  @default("#3B82F6")
+ timezone        String?  @default("Asia/Bangkok")
+ subscriptionPlan   String?  @default("basic")
+ subscriptionStatus String?  @default("active")
}
```

**เหตุผล:** สอดคล้องกับ Backend Team Design และ Branding requirement

---

### ✂️ CUT (ตารางที่ยังไม่ต้องใช้ - Phase 2-3)

| ตาราง | เหตุผลที่ไม่เพิ่ม | Phase |
|-------|------------------|-------|
| `roles` (custom) | ใช้ Enum `UserRole` แทนได้ | Phase 2 |
| `reports` | Sprint 2 Export ทำใน Memory | Phase 2 |
| `ai_insights` | AI Feature ไม่อยู่ใน Sprint 1-4 | Phase 2-3 |
| `ai_queries` | Natural Language Query | Phase 2-3 |
| `webhook_events` | ไม่มี Webhook ใน Phase 1 | Phase 2 |
| `oauth_states` | ใช้ Redis/Memory | ไม่ต้องเก็บใน DB |

---

## 🔮 Future-Proofing Design

### 1. JSONB Metadata Pattern

```prisma
// ใช้ JSONB สำหรับข้อมูลเฉพาะ Platform
metadata    Json?  @db.JsonB
```

**ประโยชน์:**
- เพิ่ม fields ใหม่โดยไม่ต้อง migrate
- รองรับ Platform-specific data (TikTok Live metrics, LINE Click-to-message)

### 2. Enum-First Approach

```prisma
enum AdPlatform {
  GOOGLE_ADS
  FACEBOOK
  TIKTOK
  LINE_ADS
  GOOGLE_ANALYTICS
  // Easy to extend: SHOPEE, LAZADA, etc.
}
```

**ประโยชน์:**
- Type-safety ใน code
- เพิ่ม Platform ใหม่ได้ง่าย

### 3. Polymorphic Relations Ready

```prisma
model Campaign {
  googleAdsAccountId   String?
  facebookAdsAccountId String?
  tiktokAdsAccountId   String?
  lineAdsAccountId     String?
  // Ready for: shopeeAdsAccountId, lazadaAdsAccountId
}
```

---

## 📁 Output Files

### [MODIFY] [schema.prisma](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/prisma/schema.prisma)

Changes:
1. Add `AlertHistory` model
2. Add `metadata: Json?` to `Metric`
3. Add branding fields to `Tenant`
4. Add relation from `Alert` to `AlertHistory`
5. Add relation from `Tenant` to `AlertHistory`

---

## ✔️ Verification Plan

### Database Migration Test

```bash
cd backend
npx prisma validate
npx prisma migrate dev --name schema_consolidation_sprint1_4
```

**Expected Result:** Migration สำเร็จ ไม่มี error

### Manual Verification

1. ตรวจสอบว่า `AlertHistory` table ถูกสร้าง
2. ตรวจสอบว่า `Metric.metadata` column มีอยู่
3. ตรวจสอบว่า `Tenant` มี fields ใหม่

---

## 📋 Summary

| Category | Count |
|----------|-------|
| **Tables ที่มีอยู่ (Keep)** | 17 models |
| **Tables ที่เพิ่ม (Add)** | 1 model (`AlertHistory`) |
| **Fields ที่เพิ่ม** | 8 fields |
| **Tables ที่ตัด (Cut)** | 6 tables (deferred to Phase 2-3) |

> [!IMPORTANT]
> Schema ปัจจุบันใกล้เคียง Production-ready แล้ว! การเปลี่ยนแปลงมีน้อยมาก แสดงว่าทีม Backend ออกแบบมาดี
