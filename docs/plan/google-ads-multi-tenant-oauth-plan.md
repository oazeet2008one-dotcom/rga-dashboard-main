# Google Ads Multi-tenant Architecture & Implementation Plan

## 1. Architectural Solution (แนวทางการแก้ไขเชิงโครงสร้าง)
**Stateless & Decoupled Initialization**
- **ปัญหาเดิม**: `GoogleAdsClientService` พึ่งพา `GOOGLE_ADS_LOGIN_CUSTOMER_ID` จาก `.env` (Global Platform MCC) เพื่อใช้เป็น `login_customer_id` ในทุก Request ซึ่งผิดหลักการ Multi-tenant (Scenario B) ที่ลูกค้าแต่ละรายนำบัญชีและ Token ของตัวเองมาเชื่อมต่อ
- **การแก้ไข**: การสร้าง Instance ของ `Customer` (Google Ads Client) จะต้องรับค่า `login_customer_id` ที่มาจาก **Context ของ Tenant นั้นๆ เท่านั้น** (ดึงจาก Database) โค้ดทั้งหมดต้องเป็น Stateless อย่างสมบูรณ์ โดยให้ Controller/Service ระดับบนส่งค่าเหล่านี้มาเป็น Parameter

**การจัดการ `login_customer_id` (MCC vs Direct Account)**
- **กรณีลูกค้าเป็น Agency (มี MCC เป็นของตัวเอง)**: ระบบจะสามารถดึง `parentMccId` ได้จากขั้นตอน OAuth (Account Selection) เมื่อลูกค้าระบุบัญชีปลายทาง ระบบจะบันทึก `parentMccId` นั้นไว้เพื่อในอนาคตจะใช้ค่านี้เป็น `login_customer_id` ในการเรียก API
- **กรณีลูกค้าเป็น End-user (บัญชีโฆษณาตรง ไม่มี MCC)**: ระบบจะบันทึก `login_customer_id` เป็น `null` (หรือใช้ `customerId` ตัวมันเอง) การเรียก API จะใช้ Refresh Token ยิงตรงไปที่บัญชีนั้นๆ โดยไม่ต้องมี `login_customer_id` ที่เป็น Manager

## 2. Database Schema & Migration Strategy
**Schema Updates (`GoogleAdsAccount`)**
เพื่อรองรับโครงสร้าง Tenant ที่มี/ไม่มี MCC เป็นของตัวเอง จำเป็นต้องเพิ่ม Field ใน `GoogleAdsAccount`:
- `loginCustomerId String? @map("login_customer_id")` (เก็บ ID ของ Manager Account หากเชื่อมต่อผ่าน MCC ของลูกค้า)
- `isMccAccount Boolean @default(false) @map("is_mcc_account")` (ระบุว่าบัญชีที่เชื่อมคือบัญชี MCC โดยตรงหรือไม่)

**Migration Strategy**
- สร้าง Prisma Migration: `npx prisma migrate dev --name add_tenant_mcc_fields`
- **Data Backfill**: บัญชีที่มีอยู่เดิม (ถ้ามี) อาจจะใช้งานไม่ได้และต้องให้ลูกค้า Re-authenticate เนื่องจากเราไม่ต้องการให้เชื่อมกับ Global MCC อีกต่อไป หรือหากเป็นระบบภายใน อาจเขียน Script เติมค่า `loginCustomerId` เดิมชั่วคราวเพื่อให้ระบบไม่ล่มกะทันหัน

## 3. Step-by-Step Implementation Plan (ไฟล์ที่ต้องแก้)
การแก้ไขจะไล่ระดับจาก Database ไปจนถึง API Caller (แบบ Stateless)

**Step 1: `backend/prisma/schema.prisma`**
- เพิ่มฟิลด์ `loginCustomerId` และ `isMccAccount` ลงในโมเดล `GoogleAdsAccount`
- ใช้เป็นจุดเชื่อมโยง Token กับบัญชีให้ถูกต้องตาม Topology ของลูกค้าแต่ละราย

**Step 2: `backend/src/modules/integrations/google-ads/services/google-ads-client.service.ts`**
- **Modify**: `getCustomer(customerId: string, refreshToken: string, loginCustomerId?: string)`
  - เปลี่ยนจากการดึง `this.configService.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID')` เป็นการใช้ค่า `loginCustomerId` ที่รับมาจาก Parameter แทน
- **Modify**: `getCustomer` (Internal usage within `getAllSelectableAccounts`)
  - ยกเลิกการเรียกใช้ System MCC ในการ Fetch Account ของลูกค้า ให้ใช้ OAuth Token ของลูกค้ายิงไปที่ Accessible Customers ของเขาเองเท่านั้น

**Step 3: `backend/src/modules/integrations/google-ads/google-ads-oauth.service.ts`**
- **Modify**: `completeConnection(tempToken, customerId, tenantId)`
  - ดึงค่า `parentMccId` ออกมาจาก Cache (ที่เก็บตอนผู้ใช้เลือกบัญชี)
  - นำค่า `parentMccId` บันทึกลงตาราง `GoogleAdsAccount` ในฐานะ `loginCustomerId`

**Step 4: `backend/src/modules/integrations/google-ads/services/google-ads-api.service.ts`**
- **Modify**: `fetchCampaigns(account: any)` และ `fetchCampaignMetrics(...)`
  - นำค่า `account.loginCustomerId` ที่ดึงจาก Database ส่งผ่าน Parameter ไปยัง `this.googleAdsClientService.getCustomer(account.customerId, decryptedToken, account.loginCustomerId)` แทน 

## 4. Edge Cases & Error Handling Strategy
**การจัดการ Error เชิงรุก (Proactive Error Handling)**
- **`invalid_grant` / `USER_PERMISSION_DENIED`**: 
  - หากระบบพบ Error กลุ่มนี้ (Token หมดอายุ, ถูกถอนสิทธิ์, หรือ `loginCustomerId` ไม่ถูกต้อง) Service จะต้องดักจับ (Catch) แบบจำเพาะ
  - ห้าม Loop พยายาม Refresh Token ซ้ำๆ หากตอบเป็น `invalid_grant` ทันทีที่พบ ให้ทำการ Update DB Status -> `DISCONNECTED` (หรือ `ERROR`) ในตาราง `GoogleAdsAccount`
  - ยิง Event ผ่านระบบ Event/Notification ไปยังหน้า Dashboard เพื่อแสดง Alert แจ้งให้ Tenant เข้ามาคลิกปุ่ม "Reconnect"
- **Graceful Failures ใน Unified Sync**: หาก Batch Sync ครอบคลุมหลาย Accounts และบัญชีหนึ่ง Permission ขัดข้อง ระบบต้องไม่ล้มเหลว (Fail-fast) รวบยอด ให้ข้ามบัญชีนั้นและบันทึกลง `SyncLog` ด้วย Error แบบเฉพาะเจาะจง จากนั้นดำเนินการ Sync บัญชีอื่นของ Tenant ต่อไป
