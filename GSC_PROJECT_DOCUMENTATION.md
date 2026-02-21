# GSC Data to SEO Display Project - Complete Documentation

## 1. ภาพรวมโปรเจคต์

### วัตถุประสงค์
- ดึงข้อมูลจริงจาก Google Search Console (GSC) มาเก็บในฐานข้อมูล
- ให้ frontend SEO pages แสดงข้อมูลจริงแทน mock data
- มีระบบอัตโนมัติ (scheduler) และ manual trigger
- ให้ Google Assistant สามารถเข้าถึงข้อมูล SEO แบบ real-time

### สถานะปัจจุบัน
- ✅ **Backend Implementation**: เสร็จสมบูรณ์ (commit 8e48735)
- ✅ **Database Schema**: พร้อมสำหรับ SEO data
- ✅ **API Endpoints**: มีครบถ้วนแล้ว
- ✅ **Google Site Verification**: ไฟล์สร้างแล้ว พร้อม verify
- ❌ **Runtime Verification**: ค้างเนื่องจาก environment variables เป็น placeholder

---

## 2. สถาปัตยกรรมระบบ

### 2.1 Backend Components

#### Core Service (`backend/src/modules/seo/seo.service.ts`)
```typescript
// Method หลักที่เพิ่ม
async syncGscForTenant(tenantId: string, opts: { days: number }) {
  // 1. ตรวจสอบ GSC credentials
  // 2. ดึง site URL จาก tenant settings หรือ env
  // 3. คำนวณวันที่จะ sync (default 30 วัน)
  // 4. วนลูปทีละวัน fetch ข้อมูลจาก GSC
  // 5. เขียนลง SeoTopKeywords (delete+create)
  // 6. เขียนลง SeoTrafficByLocation (upsert)
}

// Helper method สำหรับ pagination
private async fetchAllGscRows(params: {...}) {
  // จัดการ pagination จาก GSC API (max 25,000 rows/request)
}

// Existing methods (ไม่ได้แก้)
async getTopKeywords(tenantId: string) { /* อ่านจาก seo_top_keywords */ }
async getSeoTrafficByLocation(tenantId: string) { /* อ่านจาก seo_traffic_by_location */ }
```

#### API Controller (`backend/src/modules/seo/seo.controller.ts`)
```typescript
// Endpoints ทั้งหมด
@Post('sync/gsc')                    // Manual trigger (เพิ่มใหม่)
@Get('summary')                     // SEO summary metrics
@Get('history')                     // SEO history for charts
@Get('keyword-intent')               // Keyword intent breakdown
@Get('traffic-by-location')           // Traffic by location (ใช้งาน)
@Get('top-keywords')                // Top keywords (ใช้งาน)
@Get('offpage-snapshots')            // Offpage metrics
@Get('anchor-texts')                 // Anchor text analysis
@Get('ai-insights')                  // AI insights
```

#### Scheduler Service (`backend/src/modules/seo/seo-sync-scheduler.service.ts`)
```typescript
@Cron(CronExpression.EVERY_6_HOURS)
async scheduledGscSync() {
  // 1. ดึง tenants ทั้งหมด
  // 2. วนลูป sync ทีละ tenant
  // 3. Log success/failure ตาม tenant
}
```

#### GSC Client (`backend/src/modules/seo/google-search-console.service.ts`)
```typescript
// Authentication Methods
getSiteUrl(tenantSettings?: any): string | null
hasCredentials(): boolean
private getAuth() {
  // ใช้ GSC_SERVICE_ACCOUNT_JSON หรือ GSC_SERVICE_ACCOUNT_KEY_FILE
  // Scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
}

// Core API Method
async querySearchAnalytics(params: {...}) {
  // เรียก Google Search Console API
  // จัดการ error และ logging
}
```

### 2.2 Database Schema (Prisma)

#### SeoTopKeywords Model
```prisma
model SeoTopKeywords {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  date        DateTime @map("date") @db.Date
  keyword     String   @map("keyword") @db.VarChar(255)
  position    Float    @map("position")
  volume      Int      @map("volume")
  traffic     Int      @map("traffic")
  trafficPercentage Float  @map("traffic_percentage")
  url         String   @map("url") @db.Text
  change      Int      @map("change")
  
  // Relations & Indexes
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@index([tenantId], name: "idx_seo_keywords_tenant")
  @@index([date], name: "idx_seo_keywords_date")
  @@map("seo_top_keywords")
}
```

#### SeoTrafficByLocation Model
```prisma
model SeoTrafficByLocation {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId          String   @map("tenant_id") @db.Uuid
  date              DateTime @map("date") @db.Date
  location          String   @map("location") @db.VarChar(100)
  traffic           Int      @map("traffic")
  trafficPercentage Float    @map("traffic_percentage")
  keywords          Int      @map("keywords")
  
  // Relations & Indexes
  tenant            Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@unique([tenantId, date, location], name: "seo_location_unique")
  @@index([tenantId], name: "idx_seo_location_tenant")
  @@index([date], name: "idx_seo_location_date")
  @@map("seo_traffic_by_location")
}
```

#### Tenant Model (สำหรับ Multi-Tenancy)
```prisma
model Tenant {
  id   String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name String @map("name") @db.VarChar(255)
  
  // Relations ไปยัง SEO tables
  SeoTopKeywords            SeoTopKeywords[]
  SeoTrafficByLocation      SeoTrafficByLocation[]
  
  @@map("tenants")
}
```

### 2.3 การทำงานของระบบ

#### Data Flow
```
Google Search Console API
        ↓ (googleapis v165.0.0)
GoogleSearchConsoleService
        ↓ (fetch 30 วันย้อนหลัง)
SeoService.syncGscForTenant()
        ↓ (Prisma v5.7.1)
SeoTopKeywords & SeoTrafficByLocation Tables
        ↓ (existing endpoints)
Frontend SEO Pages & Google Assistant
```

#### Multi-Tenancy Support
- **Tenant Isolation**: ทุก query ใช้ `tenantId` filter
- **Settings Override**: `getSiteUrl()` รองรับจาก tenant settings ก่อน env
- **Scheduler Loop**: รัน sync สำหรับทุก tenants ในระบบ

---

## 3. Environment Variables ที่ต้องการ

### 3.1 Required Variables
```env
# Google Search Console Authentication (ใช้อย่างใดอย่างหนึ่ง)
GSC_SERVICE_ACCOUNT_KEY_FILE="C:\\Users\\Admin\\Desktop\\service-account.json"
# หรือ
GSC_SERVICE_ACCOUNT_JSON="{\"type\":\"service_account\",...}"

# Search Console Property URL
GSC_SITE_URL="http://localhost:5173"
# หรือสำหรับ domain property
GSC_SITE_URL="sc-domain:your-domain.com"
```

### 3.2 การตั้งค่า Service Account
1. **สร้าง Service Account** ใน Google Cloud Console
2. **สร้าง Key** เป็น JSON และดาวน์โหลด
3. **เพิ่ม User** ใน Google Search Console:
   - ใช้ `client_email` จากไฟล์ JSON
   - ให้สิทธิ์ Read (หรือ Full)

---

## 4. API Endpoints

### 4.1 Existing Endpoints (ไม่ต้องแก้)
```
GET /api/v1/seo/top-keywords      - อ่านข้อมูลคีย์เวิร์ดต้น ๆ
GET /api/v1/seo/traffic-by-location - อ่านข้อมูล traffic ตาม location
```

### 4.2 New Endpoints
```
POST /api/v1/seo/sync/gsc?days=30  - Manual trigger GSC sync
```

### 4.3 Authentication
- ทุก endpoints ใช้ `JwtAuthGuard`
- ใช้ `req.user.tenantId` สำหรับ multi-tenancy
- Token ได้จาก `POST /api/v1/auth/login`

---

## 5. การทดสอบและ Verification

### 5.1 Runtime Verification Steps
```powershell
# 1. Login และรับ Token
$body = @{ email = "admin@rga.com"; password = "password123" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $login.data.accessToken

# 2. Trigger Sync
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/seo/sync/gsc?days=30" -Method POST -Headers @{ Authorization = "Bearer $token" }

# 3. Verify Data
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/seo/top-keywords" -Method Get -Headers @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/seo/traffic-by-location" -Method Get -Headers @{ Authorization = "Bearer $token" }
```

### 5.2 ผลลัพธ์ที่คาดหวัง
- `POST /seo/sync/gsc` → `{ ok: true }`
- `GET /seo/top-keywords` → array มีข้อมูลจริง (ไม่ใช่ `[]`)
- `GET /seo/traffic-by-location` → array มีข้อมูลจริง (ไม่ใช่ `[]`)

---

## 6. Error Handling และ Troubleshooting

### 6.1 Common Errors
| Error | สาเหตุ | วิธีแก้ |
|-------|---------|---------|
| 401 Unauthorized | Token ไม่ถูก/หมดอายุ | Login ใหม่ |
| 403 Forbidden | Service account ไม่ได้รับสิทธิ์ | Add `client_email` ใน Search Console |
| 500 ENOENT | ไม่พบไฟล์ service account | แก้ `GSC_SERVICE_ACCOUNT_KEY_FILE` |
| 500 Invalid GSC_SITE_URL | URL ไม่ตรงกับ property | ใส่ URL ที่ตรงกับ Search Console |
| Prisma Write Error | Constraint violation | ตรวจสอบ unique constraints |

### 6.2 การ Debug
- **Backend Logs**: ดู console output ขณะรัน sync
- **Environment Variables**: ตรวจสอบว่าโหลดถูกต้อง
- **Search Console**: ยืนยันว่า service account มีสิทธิ์

---

## 7. การทำงานกับ Google Assistant

### 7.1 ข้อมูลที่ Google Assistant สามารถเข้าถึงได้
- **Top Keywords**: keyword, position, volume, traffic, trafficPercentage, url, change
- **Traffic by Location**: location, traffic, trafficPercentage, keywords
- **SEO Summary**: ข้อมูลรวมจาก web analytics + SEO metrics

### 7.2 การตอบสนองของ Google Assistant
```
ผู้ใช้: "SEO ของเว็บเราเดียวยังไง?"
Google Assistant: 
- ดึงข้อมูลล่าสุดจาก SeoTopKeywords
- วิเคราะห์คีย์เวิร์ดที่ทำงานดี
- แสดงอันดับคีย์เวิร์ด
- บอกจำนวน traffic และ performance
```

### 7.3 ประสิทธิของระบบ
- **Data Freshness**: อัพเดททุก 6 ชั่วโมงโดยอัตโนมัติ
- **Performance**: ใช้ database indexes ที่เหมาะสม
- **Scalability**: รองรับหลาย tenants ได้
- **Reliability**: มี logging และ graceful degradation

---

## 8. ไฟล์ที่เกี่ยวข้องทั้งหมด

### 8.1 Backend Files
```
backend/src/modules/seo/
├── seo.service.ts              # Core sync logic
├── seo.controller.ts           # API endpoints
├── seo-sync-scheduler.service.ts # Cron job
├── google-search-console.service.ts # GSC client
└── seo.module.ts              # Module configuration

backend/
├── .env                       # Environment variables
├── .env.example               # Environment template
└── prisma/schema.prisma        # Database schema
```

### 8.2 Frontend Files
```
frontend/
├── public/
│   └── google9509168e5916c34a.html  # Google site verification
└── ...
```

### 8.3 Configuration Files
```
backend/src/config/
└── env.validation.ts           # Environment validation schema
```

---

## 9. สถานะปัจจุบันและขั้นตอนถัดไป

### 9.1 เสร็จแล้ว ✅
- Backend implementation (ทุก files)
- Database schema (Prisma models)
- Git repository (commit + push)
- Google site verification file
- Environment validation schema

### 9.2 ค้างอยู่ ❌
- **Environment Variables**: ยังเป็น placeholder
- **Runtime Verification**: รอแก้ env ก่อน

### 9.3 ขั้นตอนที่คนรับเรื่องต้องทำ
1. **แก้ Environment Variables**:
   ```env
   GSC_SERVICE_ACCOUNT_KEY_FILE="C:\\Users\\Admin\\Desktop\\service-account.json"
   GSC_SITE_URL="http://localhost:5173"
   ```

2. **Verify Domain** ใน Google Search Console:
   - เปิด [Google Search Console](https://search.google.com/search-console/)
   - Add Property → URL prefix → `http://localhost:5173`
   - คลิก Verify

3. **Create Service Account** (ถ้ายังไม่มี):
   - Google Cloud Console → IAM & Admin → Service Accounts
   - Create Service Account → Keys → Add Key → JSON
   - Download และ save ไว้ที่ `C:\Users\Admin\Desktop\service-account.json`

4. **ให้สิทธิ์ Service Account**:
   - เปิดไฟล์ JSON หา `client_email`
   - ไปที่ Google Search Console > property ของคุณ
   - Settings > Users and permissions > Add user
   - ใส่ `client_email` และให้สิทธิ์ "Read"

5. **Restart Backend**:
   ```bash
   cd C:\Users\Admin\Desktop\rga-dashboard-main\backend
   npm run start:dev
   ```

6. **รัน Runtime Verification**:
   ```powershell
   $body = @{ email = "admin@rga.com"; password = "password123" } | ConvertTo-Json
   $login = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
   $token = $login.data.accessToken
   
   # Trigger sync
   Invoke-RestMethod -Uri "http://localhost:3000/api/v1/seo/sync/gsc?days=30" -Method POST -Headers @{ Authorization = "Bearer $token" }
   
   # Verify data
   Invoke-RestMethod -Uri "http://localhost:3000/api/v1/seo/top-keywords" -Method Get -Headers @{ Authorization = "Bearer $token" }
   Invoke-RestMethod -Uri "http://localhost:3000/api/v1/seo/traffic-by-location" -Method Get -Headers @{ Authorization = "Bearer $token" }
   ```

---

## 10. ผลลัพธ์สุดท้าย (เมื่อเสร็จสมบูรณ์)

เมื่อ runtime verification ผ่าน:
- **GSC → DB**: ข้อมูลจาก Google Search Console จะถูก sync ลงฐานข้อมูล
- **Scheduler**: ทำงานอัตโนมัติทุก 6 ชั่วโมง
- **Manual Trigger**: สามารถ sync ตามต้องการได้
- **Frontend SEO**: จะแสดงข้อมูลจริงจาก DB แทน mock data
- **Google Assistant**: จะมีข้อมูล SEO แบบ real-time สำหรับตอบคำถาม
- **Multi-tenancy**: แต่ละ tenant จะมีข้อมูลแยกกัน

---

## 11. สรุป

**Backend implementation สำหรับ GSC Data to SEO Display เสร็จสมบูรณ์แล้ว** พร้อมทั้ง:
- ระบบ sync ข้อมูลจาก Google Search Console
- Scheduler อัตโนมัติทุก 6 ชั่วโมง
- Manual trigger endpoint สำหรับทดสอบ
- Multi-tenancy support
- Error handling และ pagination
- Database optimization ด้วย indexes

**ที่เหลือ**: แค่ตั้งค่า environment variables และรัน runtime verification เพื่อปิดงาน end-to-end

---

## 12. Git History

### Commits ที่เกี่ยวข้อง
- `aa9e0c8` - Initial GSC sync implementation
- `8e48735` - Add Google site verification file

### Branch
- `feature/email-verification-sync-2026-02-13` - ทำงานอยู่บน branch นี้

---

## 13. ข้อมูลติดต่อ

### สำหรับคนรับเรื่องต่อไป
- **Project**: GSC Data to SEO Display
- **Status**: 90% complete, ต้อง runtime verification
- **Priority**: High (Google Assistant รอข้อมูล SEO)
- **Estimated Time**: 15-30 นาทีสำหรับเสร็จ

### สิ่งที่ต้องทำ
1. แก้ environment variables
2. Verify domain ใน Google Search Console
3. รัน runtime verification
4. ตรวจสอบผลลัพธ์

---

**เอกสารนี้ครอบคลุมทุกแงมมุมของโปรเจคต์ GSC Data to SEO Display พร้อมคำอธิบายรายละเอียดสำหรับคนรับเรื่องทำต่อ**
