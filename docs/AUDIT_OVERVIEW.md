# ภาพรวมการตรวจสอบสุขภาพระบบ (Audit Overview)

## 1. หนี้ทางเทคนิค (Technical Debt)
*   **[Backend] Schema Gaps:** ไฟล์ `schema.prisma` เป็นเวอร์ชัน 2.0.0 แต่ยังขาด Entity ที่สำคัญคือ `Ad` (โฆษณา) แม้จะมี Campaigns และ AdGroups แล้ว แต่ส่วนจัดการ Creatives ยังขาดหายไป
*   **[Backend] Integration Stubs:** ส่วน `Data Sources` และ logic การเชื่อมต่อ (Google/FB) ยังเป็นเพียง "Stub" หรือถูก implement ไว้บางส่วน จำเป็นต้องตรวจสอบการจัดการ API token จริง
*   **[Frontend] Type Safety:** แม้จะใช้ TypeScript แต่มีรายงานในอดีตเกี่ยวกับการใช้ `any` และ `@ts-ignore` ในคอมโพเนนต์เก่า (Sprint 1-2)
*   **[General] Test Coverage:** มีการทดสอบแบบ E2E (Playwright/Jest) แต่ Unit test สำหรับ logic ที่ซับซ้อน (เช่น การรวมยอดสถิติ) น่าจะยังมีน้อย

## 2. ช่องโหว่ความปลอดภัย (Security Gaps)
*   **Validation (การตรวจสอบความถูกต้อง):**
    *   ขาด DTO สำหรับตรวจสอบข้อมูล `Ad` (เนื่องจาก Entity ยังไม่มี)
    *   ระบบอัปโหลดไฟล์ยังต้องมีการตรวจสอบความปลอดภัย (MIME type checks, ขนาดไฟล์) สำหรับ Ad Creatives
*   **Access Control (การควบคุมการเข้าถึง):**
    *   ตรวจสอบ Guards ของ `UserRole` ใน Controller ใหม่ทั้งหมด ต้องมั่นใจว่า Role `CLIENT` ไม่สามารถเข้าถึงข้อมูลของ Tenant อื่นได้ (ตรวจสอบ Multi-tenant isolation)

## 3. ช่องโหว่ด้านประสบการณ์ผู้ใช้ (UX Gaps)
*   **Feedback Loops:**
    *   ขาด "Loading Skeletons" ในหน้า Dashboard ที่โหลดข้อมูลเยอะ (ปัจจุบันอาจแสดงเป็นหน้าว่างหรือกระพริบ)
    *   ระบบจัดการ Error เมื่อ API ล้มเหลว ควรมีระบบ Toast/Alert ที่เป็นมาตรฐาน
*   **Empty States (สถานะไม่มีข้อมูล):**
    *   Dashboard ที่มีข้อมูลเป็น 0 (บัญชีใหม่) ควรมีหน้า "เริ่มต้นใช้งาน" ที่เป็นมิตร แทนที่จะเป็นตารางเปล่าๆ

## 4. สิ่งที่แต่ละทีมต้องดำเนินการ (Team-Specific Action Items)
*   **Team A (Front):** ตรวจสอบ `useQuery` hooks เพื่อให้มีการจัดการ error ที่เหมาะสม และทำ Loading Skeletons
*   **Team B (Back):** ทำ security ให้ endpoint `upload` และสรุประบบ `Integration` service
*   **Team C (DB):** เร่งออกแบบตาราง `Ads` และทำ migration
