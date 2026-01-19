# Ad Groups Module - Deep Code Analysis & Audit Report

> **Topic**: 8 - Ad Groups Module  
> **Parent Entity**: Campaign (Topic 6)  
> **Target Entity**: AdGroup  
> **Date**: 2026-01-19  

---

## Executive Summary

> [!CAUTION]
> **CRITICAL: The AdGroup entity does not exist in the current codebase.**

After a comprehensive analysis of the backend codebase, this audit reveals that:

1. **No `AdGroup` model** exists in `prisma/schema.prisma`
2. **No `ad-groups` module** exists in `src/modules/`
3. **No references to AdGroup** found anywhere in backend or frontend code
4. **This is a complete gap** - the entire AdGroup feature needs to be built from scratch

---

## 1. Database Schema Analysis (`prisma/schema.prisma`)

### 1.1 AdGroup Model Status

| Item | Status |
|------|--------|
| `AdGroup` model | ❌ **DOES NOT EXIST** |
| Relation to `Campaign` | ❌ **NOT DEFINED** |
| `onDelete: Cascade` | ❌ **N/A** |
| Any AdGroup fields | ❌ **N/A** |

### 1.2 Current Campaign Model (Parent Entity)

The `Campaign` model exists (lines 483-535) with the following structure:

```prisma
model Campaign {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId      String         @map("tenant_id") @db.Uuid
  integrationId String?        @map("integration_id") @db.Uuid
  externalId    String?        @map("external_id") @db.VarChar(255)
  name          String         @map("name") @db.VarChar(255)
  platform      AdPlatform     @map("platform")
  campaignType  String?        @map("campaign_type") @db.VarChar(50)
  objective     String?        @map("objective") @db.VarChar(50)
  status        CampaignStatus @default(ACTIVE) @map("status")
  budget        Decimal?       @map("budget") @db.Decimal(15, 2)
  budgetType    String?        @map("budget_type") @db.VarChar(20)
  currency      String         @default("THB") @map("currency") @db.VarChar(3)
  startDate     DateTime?      @map("start_date") @db.Date
  endDate       DateTime?      @map("end_date") @db.Date
  lastSyncedAt  DateTime?      @map("last_synced_at")
  syncStatus    SyncStatus?    @default(PENDING) @map("sync_status")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  
  // Relations - NO AdGroup relation exists!
  metrics Metric[]
  alerts  Alert[]
}
```

> [!IMPORTANT]
> The `Campaign` model has **no relation to AdGroup**. This must be added when creating the AdGroup model.

---

## 2. Module Structure Analysis (`src/modules/ad-groups/*`)

### 2.1 Module Existence Check

| Component | Status |
|-----------|--------|
| `ad-groups/` directory | ❌ **DOES NOT EXIST** |
| Controller | ❌ **NOT FOUND** |
| Service | ❌ **NOT FOUND** |
| Repository | ❌ **NOT FOUND** |
| DTOs | ❌ **NOT FOUND** |
| Module file | ❌ **NOT FOUND** |

### 2.2 Existing Modules (Reference Architecture)

The following modules exist in `src/modules/`:

| Module | Files |
|--------|-------|
| `campaigns/` | controller, service, repository, DTOs ✅ |
| `alerts/` | 3 files |
| `audit-logs/` | 2 files |
| `auth/` | 11 files |
| `dashboard/` | 9 files |
| `integrations/` | 45 files |
| `notification/` | 7 files |
| `users/` | 8 files |

---

## 3. Reference: Campaigns Module Architecture

Since AdGroup should follow the same patterns as Campaign, here's the reference architecture:

### 3.1 Controller Endpoints (`campaigns.controller.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/campaigns` | Create a new campaign |
| `GET` | `/campaigns` | Get all campaigns (paginated, filterable) |
| `GET` | `/campaigns/:id` | Get a campaign by ID |
| `PUT` | `/campaigns/:id` | Update a campaign |
| `DELETE` | `/campaigns/:id` | Soft delete a campaign |
| `GET` | `/campaigns/:id/metrics` | Get campaign metrics |

### 3.2 DTOs Pattern

**CreateCampaignDto** (`dto/create-campaign.dto.ts`):
- Uses `class-validator` decorators
- Uses `class-transformer` for value transformation
- References Prisma enums directly (`CampaignStatus`, `AdPlatform`)

**QueryCampaignsDto** (`dto/query-campaigns.dto.ts`):
- Implements pagination (`page`, `limit`)
- Implements filtering (`search`, `platform`, `status`)
- Implements sorting (`sortBy`, `sortOrder`)

**UpdateCampaignDto** (`dto/update-campaign.dto.ts`):
- Extends `PartialType(CreateCampaignDto)`

### 3.3 Service Pattern

- Uses Repository pattern for data access
- Integrates with `AuditLogsService` for tracking
- Implements `normalizeCampaign()` for response transformation
- Returns paginated responses with meta information

---

## 4. Gap Analysis

### 4.1 Missing Components (CRITICAL)

| Priority | Component | Status | Required Action |
|----------|-----------|--------|-----------------|
| 🔴 P0 | `AdGroup` Prisma Model | ❌ Missing | Create schema model |
| 🔴 P0 | `ad-groups.module.ts` | ❌ Missing | Create NestJS module |
| 🔴 P0 | `ad-groups.controller.ts` | ❌ Missing | Create controller with endpoints |
| 🔴 P0 | `ad-groups.service.ts` | ❌ Missing | Create business logic |
| 🔴 P0 | `ad-groups.repository.ts` | ❌ Missing | Create Prisma data access |
| 🔴 P0 | `CreateAdGroupDto` | ❌ Missing | Create with `campaignId` required |
| 🔴 P0 | `UpdateAdGroupDto` | ❌ Missing | Create partial update DTO |
| 🔴 P0 | `QueryAdGroupsDto` | ❌ Missing | Create with `campaignId` filter |
| 🟡 P1 | Campaign→AdGroup relation | ❌ Missing | Add relation in schema |
| 🟡 P1 | AdGroup status enum | ❌ Missing | Consider creating `AdGroupStatus` enum |

### 4.2 Essential Endpoints (NOT IMPLEMENTED)

| Method | Endpoint | Description | Exists? |
|--------|----------|-------------|---------|
| `POST` | `/ad-groups` | Create ad group | ❌ |
| `GET` | `/ad-groups` | List all ad groups | ❌ |
| `GET` | `/ad-groups/:id` | Get ad group by ID | ❌ |
| `PUT` | `/ad-groups/:id` | Update ad group | ❌ |
| `DELETE` | `/ad-groups/:id` | Delete ad group | ❌ |
| `GET` | `/campaigns/:id/ad-groups` | **Get Ad Groups by Campaign ID** | ❌ **ESSENTIAL FOR UI** |

### 4.3 Frontend Integration Gap

| Component | Status |
|-----------|--------|
| Ad Groups reference in frontend | ❌ Not found |
| Ad Groups service/hook | ❌ Not found |
| Ad Groups page/component | ❌ Not found |

---

## 5. Recommended Schema Design

### 5.1 Proposed `AdGroup` Model

```prisma
/// AdGroup Status - สถานะของ Ad Group
enum AdGroupStatus {
  ACTIVE    @map("active")
  PAUSED    @map("paused")
  DELETED   @map("deleted")
  PENDING   @map("pending")

  @@map("ad_group_status")
}

/// AdGroup - กลุ่มโฆษณาภายใต้ Campaign
model AdGroup {
  id         String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String        @map("tenant_id") @db.Uuid
  campaignId String        @map("campaign_id") @db.Uuid
  externalId String?       @map("external_id") @db.VarChar(255)
  name       String        @map("name") @db.VarChar(255)
  status     AdGroupStatus @default(ACTIVE) @map("status")

  // Budget
  budget     Decimal? @map("budget") @db.Decimal(15, 2)
  bidAmount  Decimal? @map("bid_amount") @db.Decimal(15, 4)
  bidType    String?  @map("bid_type") @db.VarChar(50)

  // Targeting (JSONB for flexibility)
  targeting  Json?    @map("targeting") @db.JsonB

  // Timestamps
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  ads        Ad[]     // Future: relation to Ad entity

  @@unique([tenantId, campaignId, externalId], name: "ad_groups_tenant_campaign_external_unique")
  @@index([tenantId], name: "idx_ad_groups_tenant")
  @@index([campaignId], name: "idx_ad_groups_campaign")
  @@index([status], name: "idx_ad_groups_status")
  @@index([tenantId, campaignId], name: "idx_ad_groups_tenant_campaign")
  @@map("ad_groups")
}
```

### 5.2 Campaign Model Update (Add Relation)

```diff
model Campaign {
  // ... existing fields ...
  
  // Relations
  tenant             Tenant              @relation(...)
  metrics            Metric[]
  alerts             Alert[]
+ adGroups           AdGroup[]           // NEW: Add relation to AdGroup
}
```

### 5.3 Tenant Model Update (Add Relation)

```diff
model Tenant {
  // ... existing fields ...
  
  // Relations
  campaigns Campaign[]
+ adGroups  AdGroup[]  // NEW: Add relation to AdGroup
}
```

---

## 6. Proposed API Specification

### 6.1 Endpoints Table

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/ad-groups` | Create new ad group | ✅ JWT |
| `GET` | `/ad-groups` | List ad groups (with `campaignId` filter) | ✅ JWT |
| `GET` | `/ad-groups/:id` | Get ad group by ID | ✅ JWT |
| `PUT` | `/ad-groups/:id` | Update ad group | ✅ JWT |
| `DELETE` | `/ad-groups/:id` | Delete ad group | ✅ JWT |
| `GET` | `/campaigns/:id/ad-groups` | Get ad groups by campaign | ✅ JWT |

### 6.2 DTO Requirements

**CreateAdGroupDto**:
```typescript
{
  name: string;          // Required
  campaignId: string;    // Required (UUID) - ESSENTIAL
  status?: AdGroupStatus;
  budget?: number;
  bidAmount?: number;
  bidType?: string;
  targeting?: object;
  externalId?: string;
}
```

**UpdateAdGroupDto**:
```typescript
// PartialType(CreateAdGroupDto) - All fields optional
// Note: campaignId should NOT be updatable
```

**QueryAdGroupsDto**:
```typescript
{
  campaignId?: string;   // ESSENTIAL for UI filtering
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

---

## 7. Implementation Roadmap

### Phase 1: Schema & Database (Priority: P0)
1. Add `AdGroupStatus` enum to `schema.prisma`
2. Add `AdGroup` model to `schema.prisma`
3. Update `Campaign` model with `adGroups` relation
4. Update `Tenant` model with `adGroups` relation
5. Run `prisma generate` and `prisma migrate`

### Phase 2: Backend Module (Priority: P0)
1. Create `src/modules/ad-groups/` directory structure
2. Implement `ad-groups.repository.ts`
3. Implement `ad-groups.service.ts`
4. Implement DTOs (`create-ad-group.dto.ts`, `update-ad-group.dto.ts`, `query-ad-groups.dto.ts`)
5. Implement `ad-groups.controller.ts`
6. Implement `ad-groups.module.ts`
7. Register in `app.module.ts`

### Phase 3: Testing (Priority: P1)
1. Unit tests for service
2. Integration tests for controller endpoints
3. E2E tests for CRUD operations

### Phase 4: Frontend Integration (Priority: P2)
1. Create ad-groups service
2. Create TanStack Query hooks
3. Create Ad Groups page/components

---

## 8. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| No AdGroup entity exists | 🔴 High | Full implementation required |
| Breaking change to Campaign model | 🟡 Medium | Migration is additive (new relation) |
| Missing audit logging | 🟡 Medium | Follow campaigns pattern |
| No cascading delete setup | 🟡 Medium | Include `onDelete: Cascade` from Campaign |

---

## 9. Conclusion

The **AdGroup module is completely missing** from the current codebase. This represents a significant gap in the data hierarchy:

```
Tenant
  └── Campaign (✅ Exists)
        └── AdGroup (❌ MISSING)
              └── Ad (❌ MISSING - Future)
```

**Recommended Next Step**: Begin Phase 1 implementation by adding the `AdGroup` model to the Prisma schema, following the proposed design in Section 5.

---

*Report generated by: Senior Backend Architect (Schema & API Auditor)*  
*Analysis Date: 2026-01-19*
