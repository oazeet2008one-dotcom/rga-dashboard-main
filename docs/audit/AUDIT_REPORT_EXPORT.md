# Audit Report: Export Architecture

> **Generated:** 2026-01-21  
> **Sprint:** 2 - "Export CSV รายงานเบื้องต้น"  
> **Status:** 🟡 Architecture Upgrade Required

---

## Executive Summary

The current `export.service.ts` is **functional but not production-scalable**. It uses a **buffer-based approach** that loads the entire dataset into memory before sending the response. This will fail or cause memory issues with 10,000+ rows.

**Verdict:** Requires refactoring to a **true streaming architecture**.

---

## 1. Current Status Analysis

### 1.1 File: `export.service.ts`

| Aspect | Status | Details |
|--------|--------|---------|
| **Exists** | ✅ Yes | 432 lines of code |
| **CSV Export** | ✅ Implemented | `exportCampaignsToCSV()` method |
| **PDF Export** | ✅ Implemented | `exportMetricsToPDF()` method |
| **Streaming** | ❌ Missing | Uses `Buffer.from()` - loads all data into memory |
| **Controller** | ⚠️ Partial | Embedded in `dashboard.controller.ts` at `/dashboard/export/campaigns/csv` |
| **Security** | ✅ Good | CSV injection protection implemented |
| **Thai Support** | ✅ Good | UTF-8 BOM for Excel Thai language support |

### 1.2 Current Export Endpoint

```typescript
// dashboard.controller.ts:139-158
@Get('export/campaigns/csv')
async exportCampaignsCSV(...) {
  const csv = await this.exportService.exportCampaignsToCSV(user.tenantId, {...});
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);  // ❌ Full buffer sent - NOT streaming
}
```

### 1.3 Critical Issues Found

| ID | Severity | Issue | Impact |
|----|----------|-------|--------|
| **ARCH-001** | 🔴 Critical | Buffer-based export loads entire dataset into memory | OOM crash with 10K+ rows |
| **ARCH-002** | 🟠 High | No dedicated Export Controller | Violates Single Responsibility Principle |
| **ARCH-003** | 🟠 High | Missing date range filtering in export | Cannot generate time-window reports |
| **ARCH-004** | 🟡 Medium | No `StreamableFile` usage | Not leveraging NestJS streaming primitives |
| **ARCH-005** | 🟡 Medium | Uses `json2csv` Parser | Better to use `csv-stringify` for streaming |

---

## 2. Dependencies Audit

### 2.1 Current Packages

```json
// package.json
{
  "json2csv": "^6.0.0-alpha.2",      // ✅ Installed - but not ideal for streaming
  "pdfkit": "^0.17.2",               // ✅ Installed
  "@types/json2csv": "^5.0.7",       // ✅ Type definitions
  "@types/pdfkit": "^0.17.4"         // ✅ Type definitions
}
```

### 2.2 Missing Packages (Recommended)

| Package | Purpose | Status |
|---------|---------|--------|
| `csv-stringify` | Streaming CSV generation | ❌ **Required** |
| `@types/csv-stringify` | TypeScript definitions | ❌ **Required** |

> **IMPORTANT: Install Command:**
> ```bash
> cd backend && npm install csv-stringify && npm install -D @types/csv-stringify
> ```

---

## 3. Architecture Plan: Streaming Export Service

### 3.1 High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Controller    │────▶│   ExportService  │────▶│  Prisma Cursor  │
│ GET /export/... │     │ streamCampaigns  │     │   Pagination    │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                        │
                                 ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  csv-stringify   │◀────│  Batch 500 rows │
                        │ Transform Stream │     │   per query     │
                        └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  StreamableFile │
                        │    Response     │
                        └─────────────────┘
```

### 3.2 Streaming Strategy: Concept Proof

```typescript
import { Injectable, StreamableFile } from '@nestjs/common';
import { stringify } from 'csv-stringify';
import { PassThrough } from 'stream';

// CSV Column Definition
const CSV_COLUMNS = [
  { key: 'date', header: 'Date' },
  { key: 'name', header: 'Campaign Name' },
  { key: 'platform', header: 'Platform' },
  { key: 'status', header: 'Status' },
  { key: 'spend', header: 'Spend ($)' },
  { key: 'impressions', header: 'Impressions' },
  { key: 'clicks', header: 'Clicks' },
  { key: 'ctr', header: 'CTR (%)' },
  { key: 'cpc', header: 'CPC ($)' },
];

@Injectable()
export class ExportService {
  private readonly BATCH_SIZE = 500;

  /**
   * Stream campaigns to CSV using cursor-based pagination
   * Memory-efficient: processes 500 rows at a time
   */
  async streamCampaignsCSV(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StreamableFile> {
    // Create the CSV stringifier stream
    const stringifier = stringify({
      header: true,
      columns: CSV_COLUMNS,
      bom: true, // UTF-8 BOM for Excel Thai support
    });

    // Create a PassThrough stream to pipe data
    const passThrough = new PassThrough();
    stringifier.pipe(passThrough);

    // Start streaming in the background (non-blocking)
    this.streamDataInBackground(tenantId, startDate, endDate, stringifier);

    // Return immediately with StreamableFile
    return new StreamableFile(passThrough, {
      type: 'text/csv',
      disposition: `attachment; filename="campaigns-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`,
    });
  }

  /**
   * Background streaming with cursor pagination
   * Processes BATCH_SIZE rows at a time to prevent memory overload
   */
  private async streamDataInBackground(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    stringifier: ReturnType<typeof stringify>,
  ): Promise<void> {
    let cursor: string | undefined;
    let hasMore = true;

    try {
      while (hasMore) {
        // Fetch batch with cursor pagination
        const campaigns = await this.prisma.campaign.findMany({
          where: {
            tenantId,
            metrics: {
              some: {
                date: { gte: startDate, lte: endDate },
              },
            },
          },
          include: {
            metrics: {
              where: { date: { gte: startDate, lte: endDate } },
            },
          },
          take: this.BATCH_SIZE,
          ...(cursor && {
            skip: 1,
            cursor: { id: cursor },
          }),
          orderBy: { id: 'asc' },
        });

        // Write batch to stream
        for (const campaign of campaigns) {
          const aggregated = this.aggregateMetrics(campaign.metrics);
          stringifier.write({
            date: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
            name: campaign.name,
            platform: campaign.platform,
            status: campaign.status,
            spend: aggregated.spend.toFixed(2),
            impressions: aggregated.impressions,
            clicks: aggregated.clicks,
            ctr: aggregated.ctr.toFixed(2),
            cpc: aggregated.cpc.toFixed(2),
          });
        }

        // Update cursor and check for more
        if (campaigns.length < this.BATCH_SIZE) {
          hasMore = false;
        } else {
          cursor = campaigns[campaigns.length - 1].id;
        }
      }
    } finally {
      stringifier.end(); // Signal end of stream
    }
  }

  private aggregateMetrics(metrics: Metric[]) {
    const spend = metrics.reduce((sum, m) => sum + Number(m.spend || 0), 0);
    const impressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
    const clicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    return {
      spend,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
    };
  }
}
```

### 3.3 Controller Design

```typescript
// New file: export.controller.ts
import { Controller, Get, Query, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Export')
@ApiBearerAuth()
@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('campaigns')
  @ApiOperation({ summary: 'Export campaign performance report as CSV' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-01-21' })
  @ApiQuery({ name: 'platform', required: false, enum: ['GOOGLE_ADS', 'FACEBOOK', 'TIKTOK', 'LINE_ADS'] })
  @Header('Content-Type', 'text/csv')
  async exportCampaigns(
    @CurrentUser('tenantId') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('platform') platform?: string,
  ) {
    return this.exportService.streamCampaignsCSV(
      tenantId,
      new Date(startDate),
      new Date(endDate),
      platform,
    );
  }
}
```

### 3.4 API Contract

**Endpoint:** `GET /api/v1/export/campaigns`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | `string` (ISO date) | ✅ Yes | Start of date range |
| `endDate` | `string` (ISO date) | ✅ Yes | End of date range |
| `platform` | `string` | ❌ No | Filter by platform |
| `status` | `string` | ❌ No | Filter by status |

**Response Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="campaigns-2026-01-01-to-2026-01-21.csv"
Transfer-Encoding: chunked
```

**CSV Columns:**

| Column | Type | Description |
|--------|------|-------------|
| Date | `string` | Date range of the report |
| Campaign Name | `string` | Name of the campaign |
| Platform | `string` | GOOGLE_ADS, FACEBOOK, TIKTOK, LINE_ADS |
| Status | `string` | ACTIVE, PAUSED, COMPLETED, etc. |
| Spend ($) | `number` | Total spend in USD |
| Impressions | `number` | Total impressions |
| Clicks | `number` | Total clicks |
| CTR (%) | `number` | Click-through rate |
| CPC ($) | `number` | Cost per click |

---

## 4. Implementation Checklist

### Phase 1: Dependencies & Setup
- [ ] Install `csv-stringify` package
- [ ] Install `@types/csv-stringify` dev dependency
- [ ] Create `export.module.ts` (if needed)

### Phase 2: Export Controller
- [ ] Create `backend/src/modules/export/export.controller.ts`
- [ ] Implement `GET /api/v1/export/campaigns` endpoint
- [ ] Add query validation DTOs (`ExportCampaignsQueryDto`)
- [ ] Add Swagger documentation

### Phase 3: Streaming Service
- [ ] Add `streamCampaignsCSV()` method to `ExportService`
- [ ] Implement cursor-based pagination (batch size: 500)
- [ ] Pipe `csv-stringify` -> `PassThrough` -> `StreamableFile`
- [ ] Add proper error handling with stream cleanup

### Phase 4: Integration
- [ ] Register `ExportController` in module
- [ ] Add route to `app.module.ts` (if separate module)
- [ ] (Optional) Deprecate old `/dashboard/export/campaigns/csv` endpoint

### Phase 5: Testing & Verification
- [ ] Test with 100 campaigns + 90 days metrics (~9,000 rows)
- [ ] Test with 1,000 campaigns (~90,000 rows) - stress test
- [ ] Verify Excel can open with Thai characters
- [ ] Verify memory usage stays stable during export

---

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| `csv-stringify` type conflicts | Low | Medium | Use `any` casting if needed |
| Stream backpressure issues | Low | High | Implement proper drain handling |
| Prisma cursor pagination edge cases | Medium | Medium | Add comprehensive tests |
| Large exports timeout | Medium | High | Add progress headers or timeout increase |

---

## 6. Recommendation

**Recommended Approach:** Implement streaming in the existing `ExportService` rather than creating a completely new service. This preserves the existing helper methods (`sanitizeCSVValue`, `formatDateSafe`) while upgrading the core export logic.

**Priority:** 🔴 **HIGH** - This is a Sprint 2 deliverable.

**Estimated Effort:** 4-6 hours for full implementation and testing.

---

## Appendix A: File References

| File | Purpose | Location |
|------|---------|----------|
| `export.service.ts` | Existing export service (to be upgraded) | `backend/src/modules/dashboard/export.service.ts` |
| `dashboard.controller.ts` | Current export endpoints | `backend/src/modules/dashboard/dashboard.controller.ts` |
| `campaigns.service.ts` | Query logic to reuse | `backend/src/modules/campaigns/campaigns.service.ts` |
| `campaigns.repository.ts` | Prisma query patterns | `backend/src/modules/campaigns/campaigns.repository.ts` |
