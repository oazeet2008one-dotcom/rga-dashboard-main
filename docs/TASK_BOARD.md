# กระดานงาน (Task Board - Next Actions)

**เป้าหมายหลัก:** ทำให้ฟีเจอร์ "Ads Management" (หัวข้อที่ 9) เสร็จสมบูรณ์ และแสดง "Dashboard Real Data"

## [TEAM A] Frontend Team (React/UI)
*   **Feature: Ads Management**
    *   [ ] สร้างโครงสร้างโฟลเดอร์ `features/ads/`
    *   [ ] สร้างคอมโพเนนต์ `AdsTable` (Columns: รูปภาพ, พาดหัว, สถานะ, ตัวชี้วัด)
    *   [ ] สร้าง `CreateAdDialog` ด้วย Multi-step form:
        *   Step 1: เลือก Ad Group
        *   Step 2: อัปโหลดสื่อ (รูปภาพ/วิดีโอ)
        *   Step 3: ข้อความ (พาดหัว, รายละเอียด)
    *   [ ] เชื่อมต่อ `react-dropzone` สำหรับการอัปโหลดไฟล์
*   **Feature: Dashboard**
    *   [ ] เปลี่ยน Mock Data ใน `DashboardPage` เป็น Hook API จริง (`useDashboardMetrics`)
    *   [ ] ทำตัวกรอง "Date Range Picker" ที่เป็น Global state
*   **Cleanup:**
    *   [ ] ตรวจสอบและแก้ไข type `any` ใน `src/types/`

## [TEAM B] Backend Team (NestJS/API)
*   **Feature: Ads Management**
    *   [ ] สร้าง `AdsModule`, `AdsController`, `AdsService`
    *   [ ] พัฒนา CRUD Endpoints:
        *   `GET /ads` (กรองตาม AdGroup/Campaign)
        *   `POST /ads` (สร้างโดยผูกกับ AdGroup)
        *   `PATCH /ads/:id` (อัปเดตสถานะ/เนื้อหา)
    *   [ ] พัฒนาระบบอัปโหลดไฟล์:
        *   เพิ่ม `Multer` รองรับการอัปโหลดรูปภาพ/วิดีโอ
        *   จัดเก็บไฟล์ (MinIO/S3 หรือ Local สำหรับ dev) และบันทึก URL ลง DB
*   **Feature: Dashboard**
    *   [ ] พัฒนา `DashboardController.getMetrics()`:
        *   รวมข้อมูลจากตาราง `Metric` (รวม impressions, clicks, spend)
        *   กรองตาม `tenantId` และ `dateRange`

## [TEAM C] Database & DevOps Team
*   **Database Schema (`prisma/schema.prisma`)**
    *   [ ] **ออกแบบ Model `Ad`:**
        ```prisma
        model Ad {
          id        String   @id @default(uuid())
          adGroupId String
          headline  String
          imageUrl  String?
          status    AdStatus @default(ACTIVE)
          // ... relations and metrics
        }
        ```
    *   [ ] รัน Migration: `npx prisma migrate dev --name add_ads_table`
    *   [ ] สร้าง Indexes เฉพาะเพื่อประสิทธิภาพ (เช่น `idx_ads_adgroup`)
*   **DevOps**
    *   [ ] ตรวจสอบ Docker Compose เพื่อให้แน่ใจว่ามีการทำ persistent volume สำหรับไฟล์ที่อัปโหลด (กรณีใช้ local storage)
