# API Contract Audit Report

**Audit Date:** 2026-01-16  
**Auditor:** Backend Integration Team  
**Status:** ❌ **FAIL**

---

## Executive Summary

The `CreateCampaignDto` in the backend **DOES NOT** fully align with the Frontend Zod Schema expectations. There are critical discrepancies in **enum value casing** and **field requirements** that will cause validation failures during API integration.

---

## File Location

**Backend DTO Path:** [create-campaign.dto.ts](file:///c:/Users/User/Desktop/rga-dashboard-main/backend/src/modules/campaigns/dto/create-campaign.dto.ts)

---

## Comparison Table

| Field Name | Frontend Type | Frontend Required | Backend DTO Type | Backend Required | Status |
|------------|---------------|-------------------|------------------|------------------|--------|
| `name` | `string` | ✅ Required | `string` | ✅ Required (`@IsNotEmpty`) | ✅ Match |
| `platform` | `enum('facebook', 'google', 'tiktok')` | ✅ Required | `AdPlatform` (enum: `GOOGLE_ADS`, `FACEBOOK`, `TIKTOK`, `LINE_ADS`, `GOOGLE_ANALYTICS`, `SHOPEE`, `LAZADA`) | ✅ Required | ❌ **Mismatch** |
| `status` | `enum('active', 'draft', 'paused')` | ✅ Required | `CampaignStatus` (enum: `ACTIVE`, `PAUSED`, `DELETED`, `PENDING`, `COMPLETED`, `ENDED`) | ⚪ Optional (`@IsOptional`) | ❌ **Mismatch** |
| `budget` | `number` (positive float) | ✅ Required | `number` | ⚪ Optional (`@IsOptional`) | ❌ **Mismatch** |
| `startDate` | `string` (ISO Date) | ✅ Required | `string` (`@IsDateString`) | ⚪ Optional (`@IsOptional`) | ❌ **Mismatch** |
| `endDate` | `string` (ISO Date) | ⚪ Optional | `string` (`@IsDateString`) | ⚪ Optional | ✅ Match |

---

## Discrepancy Analysis

### 1. ❌ Platform Enum Values

**Issue:** Frontend sends lowercase values, but backend expects Prisma enum values.

| Frontend Value | Backend Expected Value |
|----------------|------------------------|
| `'google'` | `GOOGLE_ADS` |
| `'facebook'` | `FACEBOOK` |
| `'tiktok'` | `TIKTOK` |

> [!CAUTION]
> The frontend value `'google'` does not have a direct match to `GOOGLE_ADS`. This is a semantic mismatch that will cause validation errors.

---

### 2. ❌ Status Enum Values

**Issue:** Frontend expects `'draft'` status, but backend does not have a `DRAFT` enum value.

| Frontend Value | Backend Enum Available? |
|----------------|-------------------------|
| `'active'` | ✅ `ACTIVE` (via `@map("active")`) |
| `'draft'` | ❌ **NOT AVAILABLE** |
| `'paused'` | ✅ `PAUSED` (via `@map("paused")`) |

> [!WARNING]
> The `DRAFT` status does not exist in the Prisma `CampaignStatus` enum. Backend alternatives: `PENDING`, `DELETED`, `COMPLETED`, `ENDED`.

---

### 3. ❌ Required Field Discrepancies

| Field | Frontend | Backend | Issue |
|-------|----------|---------|-------|
| `budget` | Required | Optional | Backend allows `null`, frontend does not |
| `startDate` | Required | Optional | Backend allows `null`, frontend does not |
| `status` | Required | Optional | Backend defaults to `ACTIVE` if not sent |

---

### 4. ℹ️ Extra Backend Field

The backend DTO includes an additional `externalId` field that is **not present** in the frontend schema:

```typescript
@ApiProperty({ example: 'google_ads_campaign_123', required: false })
@IsString()
@IsOptional()
externalId?: string;
```

This is acceptable as it's optional and used for platform-synced campaigns.

---

## Code Evidence

### Backend DTO: `create-campaign.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { CampaignStatus, AdPlatform } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale 2024' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AdPlatform })
  @IsEnum(AdPlatform)
  platform: AdPlatform;

  @ApiProperty({ enum: CampaignStatus, example: 'ACTIVE' })
  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'google_ads_campaign_123', required: false })
  @IsString()
  @IsOptional()
  externalId?: string;
}
```

### Prisma Enum Definitions

```prisma
enum CampaignStatus {
  ACTIVE    @map("active")
  PAUSED    @map("paused")
  DELETED   @map("deleted")
  PENDING   @map("pending")
  COMPLETED @map("completed")
  ENDED     @map("ended")
}

enum AdPlatform {
  GOOGLE_ADS       @map("google_ads")
  FACEBOOK         @map("facebook")
  TIKTOK           @map("tiktok")
  LINE_ADS         @map("line_ads")
  GOOGLE_ANALYTICS @map("google_analytics")
  SHOPEE           @map("shopee")
  LAZADA           @map("lazada")
}
```

---

## Action Plan

### Priority 1: Critical Fixes (Backend)

| # | Action | File | Change |
|---|--------|------|--------|
| 1 | Add `DRAFT` status to Prisma enum | `schema.prisma` | Add `DRAFT @map("draft")` to `CampaignStatus` |
| 2 | Run Prisma migration | Terminal | `npx prisma migrate dev --name add-draft-status` |
| 3 | Align platform values | - | **Decision Required:** Either update frontend to use `GOOGLE_ADS` or add transform pipe |

### Priority 2: Field Requirement Alignment

| # | Action | File | Change |
|---|--------|------|--------|
| 4 | Make `budget` required | `create-campaign.dto.ts` | Remove `@IsOptional()`, add `@IsNotEmpty()`, `@Min(0)` |
| 5 | Make `startDate` required | `create-campaign.dto.ts` | Remove `@IsOptional()`, add `@IsNotEmpty()` |
| 6 | Make `status` required (optional) | `create-campaign.dto.ts` | Remove `@IsOptional()` if frontend always sends it |

### Priority 3: Optional Improvements

| # | Action | Description |
|---|--------|-------------|
| 7 | Add `@Transform()` decorator | Auto-convert lowercase enum values to uppercase |
| 8 | Add `@IsPositive()` validation | Ensure `budget` is a positive number |

---

## Recommended DTO After Fix

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsDateString,
  IsPositive 
} from 'class-validator';
import { CampaignStatus, AdPlatform } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Sale 2024' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AdPlatform })
  @Transform(({ value }) => value?.toUpperCase().replace('GOOGLE', 'GOOGLE_ADS'))
  @IsEnum(AdPlatform)
  platform: AdPlatform;

  @ApiProperty({ enum: CampaignStatus, example: 'ACTIVE' })
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(CampaignStatus)
  status: CampaignStatus; // Now required

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive()
  budget: number; // Now required

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string; // Now required

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'google_ads_campaign_123', required: false })
  @IsString()
  @IsOptional()
  externalId?: string;
}
```

---

## Sign-Off

| Role | Name | Status |
|------|------|--------|
| Backend Engineer | - | ⏳ Pending Review |
| Frontend Engineer | - | ⏳ Pending Review |
| Tech Lead | - | ⏳ Pending Approval |
