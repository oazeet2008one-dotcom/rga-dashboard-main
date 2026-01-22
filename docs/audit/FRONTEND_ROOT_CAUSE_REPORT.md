# 🎨 รายงานวิเคราะห์ช่องว่างและสาเหตุต้นตอของ Frontend

**วันที่ตรวจสอบ:** 22 มกราคม 2569  
**ผู้ตรวจสอบ:** Senior Frontend Architect (ระบบวิเคราะห์เชิงลึกอัตโนมัติ)  
**สถานะ:** ⚠️ **พบช่องว่างหลายจุด**

---

## สรุปภาพรวม

รายงานฉบับนี้บันทึกการเปรียบเทียบระหว่าง **ข้อกำหนด** (ตาม `API_CONTRACT_AUDIT.md`) กับ **โค้ด Frontend ปัจจุบัน** ใน `frontend/src`

> [!CAUTION]
> Frontend มี **ไฟล์ zombie 1 ไฟล์**, **การใช้ `any` มากกว่า 35 จุด**, **Component แบบ mock 100%**, และ **ไม่มีการจัดการ 403 Forbidden**

---

## 1. 🎭 Fake UI และ Mock Data ที่เปิดเผย (วิกฤต)

*Components ที่ดูเหมือนของจริงแต่จริงๆ แล้วเป็น hardcoded*

| Component Path | สถานะ | หลักฐาน (บรรทัด) | คำอธิบายช่องว่าง |
|----------------|-------|------------------|------------------|
| `src/components/dashboard/DeviceBreakdownWidget.tsx` | ❌ Fake | บรรทัด 6-10 | ใช้ `const data = [{device: 'Mobile'...}]` แทน API hook - 100% mock data |
| `src/components/dashboard/AnalyticsWidget.tsx` | ⚠️ บางส่วน | บรรทัด 10, 62, 156 | มี `isMockData` prop และแสดง mock indicator แต่ยังมี mock fallback |
| `src/pages/Campaigns.legacy.tsx` | 👻 Zombie | ทั้งไฟล์ | ไฟล์ legacy 265 บรรทัด ยังมีอยู่ในโปรเจค แม้จะถูก comment ว่า "replaces legacy" ใน App.tsx |

### ไฟล์ Zombie ที่ยังเหลืออยู่

| ไฟล์ | สถานะ | ความเสี่ยง |
|------|-------|-----------|
| `src/pages/Campaigns.legacy.tsx` | ❌ มีอยู่ | เพิ่ม bundle size โดยไม่จำเป็น, อาจเกิด import ผิดพลาด |

---

## 2. 🛡️ ช่องว่างด้าน Error Handling (ความเสี่ยง UX)

### 2.1 การจัดการ 401/403

| ไฟล์/โมดูล | สถานะ 401 | สถานะ 403 | ปัญหา |
|------------|-----------|-----------|-------|
| `src/services/api-client.ts` | ✅ มี (บรรทัด 106-166) | ❌ ขาดหาย | มี refresh token logic สำหรับ 401 แต่ **ไม่มีการจัดการ 403 Forbidden** เลย |
| `src/lib/auth-events.ts` | ✅ มี | ❌ ขาดหาย | `dispatchSessionExpired()` สำหรับ 401 แต่ไม่มี event สำหรับ permission denied |

*ความเสี่ยง:* **Backend ใหม่ส่ง 403 เมื่อไม่มีสิทธิ์ แต่ Frontend จะแสดง generic error หรือ white screen**

### 2.2 ErrorBoundary

| ไฟล์ | สถานะ | หมายเหตุ |
|------|-------|----------|
| `src/main.tsx` | ✅ มี (บรรทัด 5-10) | Wraps entire app |
| `src/App.tsx` | ✅ มี (บรรทัด 100-108) | Wraps routes |
| `src/components/ErrorBoundary.tsx` | ✅ Implement แล้ว | Class component with error UI |

*สรุป:* ErrorBoundary มีครอบคลุมทั้ง app ✅

### 2.3 Error Handling ใน Catch Blocks

| ไฟล์ | บรรทัด | ปัญหา |
|------|--------|-------|
| `src/pages/Login.tsx` | 45 | `catch (err: any)` - สูญเสีย error type |
| `src/pages/Register.tsx` | 63 | `catch (err: any)` - สูญเสีย error type |
| `src/hooks/useOAuthFlow.ts` | 46 | `catch (error: any)` - สูญเสีย error type |
| `src/hooks/useGA4OAuthFlow.ts` | 46 | `catch (error: any)` - สูญเสีย error type |
| `src/hooks/useCrudOperations.ts` | 40, 76, 106, 120 | 4 catch blocks ที่ใช้ `any` |
| `src/components/integrations/tiktok/TikTokAdsCard.tsx` | 66, 80, 100 | 3 catch blocks ที่ใช้ `any` |
| `src/components/integrations/tiktok/TikTokAccountSelectModal.tsx` | 57, 86 | 2 catch blocks ที่ใช้ `any` |

*สาเหตุต้นตอ:* **ไม่มี Error Type System** - ไม่มี typed error classes สำหรับ API errors

---

## 3. 🐛 Architecture และ Quality Defects

### 3.1 การใช้ `any` Type (พบมากกว่า 35 จุด)

| ไฟล์ | Function/Variable | ปัญหา |
|------|-------------------|-------|
| `src/features/dashboard/components/DashboardKPIs.tsx:13` | `overview: any` | Props ไม่มี type |
| `src/features/dashboard/components/DashboardAISummary.tsx:5` | `overview: any` | Props ไม่มี type |
| `src/hooks/useCrudOperations.ts:9-16` | 6 parameters ที่เป็น `any` | Generic hook มี type holes |
| `src/lib/errorHandler.ts:7` | `showApiError(error: any)` | Error handler ไม่รู้จัก error structure |
| `src/components/OverviewChart.tsx:19` | `CustomTooltip = ({...}: any)` | Recharts tooltip ไม่มี type |
| `src/components/integrations/tiktok/TikTokAdsCard.tsx:13` | `accounts: any[]` | Account list ไม่มี type |
| `src/components/integrations/line/LineAdsCard.tsx:90` | `(account: any)` | Map callback ไม่มี type |
| `src/components/integrations/google-ads/GoogleAdsCard.tsx:15` | `icon: any` | Icon prop ไม่มี type |
| `src/components/integrations/google-analytics/GoogleAnalyticsCard.tsx:14` | `icon: any` | Icon prop ไม่มี type |
| `src/components/integrations/DataSourceCard.tsx:8` | `icon: any` | Icon prop ไม่มี type |
| `src/components/dashboard/AnalyticsWidget.tsx:19` | `rows: any[]` | Row data ไม่มี type |

*สาเหตุต้นตอ:* **ขาด Strict TypeScript** - `"strict": true` อาจไม่ได้บังคับใช้ หรือ `any` ถูกอนุญาต

### 3.2 Prop Drilling

| Component Chain | ความลึก | ปัญหา |
|-----------------|--------|-------|
| `DashboardPage → DashboardKPIs → SummaryCard` | 3 levels | ใกล้ขีดจำกัด |
| `DataSourcesPage → IntegrationCard → AccountItem` | 3 levels | ใกล้ขีดจำกัด |

*สรุป:* ไม่พบ prop drilling ที่รุนแรง (> 3 levels) ✅

### 3.3 Legacy Code Remnants

| ไฟล์ | บรรทัด | Comment/Reference |
|------|--------|-------------------|
| `src/App.tsx` | 12 | "// ✅ NEW: replaces legacy pages/Dashboard" |
| `src/App.tsx` | 14 | "// ✅ NEW: replaces legacy pages/Campaigns" |
| `src/App.tsx` | 53 | "Legacy integrations page - kept for backward compatibility" |
| `src/features/campaigns/hooks/use-campaigns.ts` | 17 | "Legacy key for backward compatibility" |
| `src/features/data-sources/hooks/use-integration-auth.ts` | 328 | "'ads': 'google', // Legacy: platform=ads" |

---

## 4. 📉 Type Mismatches (Contract Violations)

### 4.1 Enum Value Mismatches (ตาม `API_CONTRACT_AUDIT.md`)

| Field | Frontend Zod Schema | Backend Prisma Enum | สถานะ |
|-------|---------------------|---------------------|-------|
| `platform` | `['facebook', 'google', 'tiktok']` (lowercase) | `GOOGLE_ADS`, `FACEBOOK`, `TIKTOK` | ❌ **ไม่ตรงกัน** |
| `status` | `['active', 'draft', 'paused']` (lowercase) | `ACTIVE`, `DRAFT`, `PAUSED` | ⚠️ **ต้อง Transform** |

*ตำแหน่ง:* `src/features/campaigns/types/schema.ts` บรรทัด 19, 24

### 4.2 Field Type Conflicts

| Field | Frontend Type | Backend Type | ช่องว่าง |
|-------|---------------|-------------|----------|
| `budget` | `number` (Zod coerced) | `Decimal` (Prisma) | ⚠️ ต้อง serialize/deserialize |
| `budget` in `Campaign` interface | `string \| number` | `Decimal` | ⚠️ Union type ไม่ชัดเจน |
| `spend` in `Metric` interface | `string \| null` | `Decimal` | ⚠️ String expectation |

*ตำแหน่ง:* `src/types/api.ts` บรรทัด 21, 68

### 4.3 Required vs Optional Mismatch

| Field | Frontend | Backend | ปัญหา |
|-------|----------|---------|-------|
| `budget` | ✅ Required (Zod) | ⚪ Optional (DTO) | Frontend จะ validate แต่ backend accepts null |
| `startDate` | ✅ Required (Zod) | ⚪ Optional (DTO) | Frontend จะ validate แต่ backend accepts null |
| `status` | ✅ Required (Zod) | ⚪ Optional (DTO: defaults ACTIVE) | Possible mismatch |

---

## 5. 📊 สถิติสรุป

| หมวดหมู่ | จำนวน |
|----------|-------|
| **Fake UI Components** | 2 รายการ |
| **Zombie Files** | 1 ไฟล์ |
| **การใช้ `any` Type** | 35+ จุด |
| **Catch Blocks ที่ไม่มี Type** | 15+ จุด |
| **การจัดการ 403** | ❌ ไม่มี |
| **Enum Mismatches** | 2 fields |
| **Type Conflicts** | 3 fields |
| **Legacy References** | 5 จุด |

---

## 6. ตารางความเสี่ยง

| ความเสี่ยง | ความรุนแรง | โอกาสเกิด | ผลกระทบ |
|-----------|-----------|-----------|---------|
| ไม่มีการจัดการ 403 | 🔴 วิกฤต | สูง | User เห็น white screen เมื่อ permission denied |
| Mock data ใน DeviceBreakdown | 🟠 สูง | แน่นอน | User เห็น metrics ปลอม |
| Enum value mismatches | 🟠 สูง | แน่นอน | API validation failures |
| Any type abuse | 🟡 ปานกลาง | สูง | Runtime errors ไม่ถูก catch ตอน compile |
| Zombie files | 🟢 ต่ำ | ต่ำ | Bundle size เพิ่ม ~11KB |

---

## 7. ไฟล์ที่ต้องตรวจสอบเพิ่มเติม

1. `src/services/api-client.ts` - เพิ่ม 403 interceptor
2. `src/features/campaigns/types/schema.ts` - แก้ enum values
3. `src/components/dashboard/DeviceBreakdownWidget.tsx` - เปลี่ยนเป็น API data
4. `src/pages/Campaigns.legacy.tsx` - ลบหรือ archive

---

*สิ้นสุดรายงาน*

**สร้างเมื่อ:** 22 มกราคม 2569 เวลา 11:13:23 น. (UTC+7)  
**Audit Protocol:** เข้มงวด (โหมดไม่เสนอวิธีแก้ไข)
