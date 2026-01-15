# Dashboard Overview API Specification

> **Version:** 1.0.0  
> **Status:** DRAFT - Pending Approval  
> **Last Updated:** 2026-01-15  
> **Author:** Backend Architecture Team

---

## Endpoint Description

| Property | Value |
|----------|-------|
| **Method** | `GET` |
| **URL** | `/api/v1/dashboard/overview` |
| **Authentication** | Bearer Token (JWT Required) |
| **Rate Limit** | 60 requests/minute |

---

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | `PeriodEnum` | No | `'7d'` | Time period for aggregation |
| `tenantId` | `UUID` | No | *Extracted from JWT* | Explicit tenant override (SUPER_ADMIN only) |

### PeriodEnum Values

```typescript
type PeriodEnum = '7d' | '30d' | 'this_month' | 'last_month';
```

| Value | Description | Date Range Example (if today is 2026-01-15) |
|-------|-------------|---------------------------------------------|
| `7d` | Last 7 days | 2026-01-09 → 2026-01-15 |
| `30d` | Last 30 days | 2025-12-17 → 2026-01-15 |
| `this_month` | Current calendar month | 2026-01-01 → 2026-01-15 |
| `last_month` | Previous calendar month | 2025-12-01 → 2025-12-31 |

---

## TypeScript Interfaces

```typescript
// ============================================================
// Request & Response DTOs
// ============================================================

/**
 * Query parameters for dashboard overview endpoint
 */
export interface DashboardOverviewQueryDto {
  period?: PeriodEnum;
  tenantId?: string; // UUID - SUPER_ADMIN only
}

export type PeriodEnum = '7d' | '30d' | 'this_month' | 'last_month';

// ============================================================
// Response Payload
// ============================================================

/**
 * Main response structure for GET /api/v1/dashboard/overview
 */
export interface DashboardOverviewResponse {
  success: boolean;
  data: DashboardOverviewData;
  meta: ResponseMeta;
}

export interface DashboardOverviewData {
  summary: SummaryMetrics;
  growth: GrowthMetrics;
  trends: TrendDataPoint[];
  recentCampaigns: RecentCampaign[];
}

// ============================================================
// Nested Interfaces
// ============================================================

/**
 * Aggregated summary metrics for the selected period
 * Source: `metrics` table aggregated by tenantId + date range
 */
export interface SummaryMetrics {
  /** Total impressions across all campaigns */
  totalImpressions: number;
  
  /** Total clicks across all campaigns */
  totalClicks: number;
  
  /** Total advertising spend in THB */
  totalCost: number;
  
  /** Total conversions across all campaigns */
  totalConversions: number;
  
  /** Calculated CTR (clicks / impressions * 100) */
  averageCtr: number;
  
  /** Calculated ROAS (revenue / spend) */
  averageRoas: number;
}

/**
 * Percentage growth compared to the previous period
 * Formula: ((current - previous) / previous) * 100
 * Null if previous period has no data
 */
export interface GrowthMetrics {
  /** Impressions growth percentage */
  impressionsGrowth: number | null;
  
  /** Clicks growth percentage */
  clicksGrowth: number | null;
  
  /** Cost/Spend growth percentage */
  costGrowth: number | null;
  
  /** Conversions growth percentage */
  conversionsGrowth: number | null;
}

/**
 * Daily data point for trend charts
 * One record per day within the selected period
 */
export interface TrendDataPoint {
  /** Date in ISO 8601 format (YYYY-MM-DD) */
  date: string;
  
  /** Daily impressions */
  impressions: number;
  
  /** Daily clicks */
  clicks: number;
  
  /** Daily spend in THB */
  cost: number;
  
  /** Daily conversions */
  conversions: number;
}

/**
 * Top 5 recently active campaigns
 * Sorted by: status=ACTIVE first, then by updatedAt DESC
 */
export interface RecentCampaign {
  /** Campaign UUID */
  id: string;
  
  /** Campaign display name */
  name: string;
  
  /** Current campaign status */
  status: CampaignStatus;
  
  /** Ad platform identifier */
  platform: AdPlatform;
  
  /** Total spend for this campaign in selected period */
  spending: number;
  
  /** Budget utilization percentage (spending / budget * 100) */
  budgetUtilization?: number;
}

// Enum types matching Prisma schema
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'PENDING' | 'COMPLETED' | 'ENDED';
export type AdPlatform = 'GOOGLE_ADS' | 'FACEBOOK' | 'TIKTOK' | 'LINE_ADS' | 'GOOGLE_ANALYTICS' | 'SHOPEE' | 'LAZADA';

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** Requested period */
  period: PeriodEnum;
  
  /** Actual date range used for query */
  dateRange: {
    from: string; // ISO 8601 date
    to: string;   // ISO 8601 date
  };
  
  /** Tenant context */
  tenantId: string;
  
  /** Response generation timestamp */
  generatedAt: string; // ISO 8601 datetime
}
```

---

## JSON Response Example

Based on seed data structure (`Summer Sale 2026`, `Brand Awareness Q1` campaigns):

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalImpressions": 455000,
      "totalClicks": 18500,
      "totalCost": 42500.00,
      "totalConversions": 625,
      "averageCtr": 4.07,
      "averageRoas": 3.85
    },
    "growth": {
      "impressionsGrowth": 12.5,
      "clicksGrowth": 8.3,
      "costGrowth": -5.2,
      "conversionsGrowth": 15.7
    },
    "trends": [
      {
        "date": "2026-01-15",
        "impressions": 65000,
        "clicks": 2650,
        "cost": 6100.00,
        "conversions": 95
      },
      {
        "date": "2026-01-14",
        "impressions": 68000,
        "clicks": 2750,
        "cost": 6250.00,
        "conversions": 88
      },
      {
        "date": "2026-01-13",
        "impressions": 62000,
        "clicks": 2520,
        "cost": 5850.00,
        "conversions": 92
      },
      {
        "date": "2026-01-12",
        "impressions": 66500,
        "clicks": 2700,
        "cost": 6050.00,
        "conversions": 90
      },
      {
        "date": "2026-01-11",
        "impressions": 64000,
        "clicks": 2600,
        "cost": 5950.00,
        "conversions": 85
      },
      {
        "date": "2026-01-10",
        "impressions": 67000,
        "clicks": 2680,
        "cost": 6150.00,
        "conversions": 88
      },
      {
        "date": "2026-01-09",
        "impressions": 62500,
        "clicks": 2600,
        "cost": 6150.00,
        "conversions": 87
      }
    ],
    "recentCampaigns": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Summer Sale 2026",
        "status": "ACTIVE",
        "platform": "GOOGLE_ADS",
        "spending": 28500.00,
        "budgetUtilization": 57.0
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "Brand Awareness Q1",
        "status": "ACTIVE",
        "platform": "FACEBOOK",
        "spending": 14000.00,
        "budgetUtilization": 46.7
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "TikTok Viral Challenge",
        "status": "PENDING",
        "platform": "TIKTOK",
        "spending": 0.00,
        "budgetUtilization": 0.0
      }
    ]
  },
  "meta": {
    "period": "7d",
    "dateRange": {
      "from": "2026-01-09",
      "to": "2026-01-15"
    },
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "generatedAt": "2026-01-15T11:06:26+07:00"
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired access token"
  }
}
```

### 403 Forbidden (tenantId override without SUPER_ADMIN)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Tenant override requires SUPER_ADMIN role"
  }
}
```

### 400 Bad Request (invalid period)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid period value",
    "details": {
      "period": "Must be one of: 7d, 30d, this_month, last_month"
    }
  }
}
```

---

## Data Source Mapping

| Response Field | Prisma Model | Aggregation |
|----------------|--------------|-------------|
| `summary.*` | `Metric` | `SUM()` grouped by `tenantId` with date filter |
| `growth.*` | `Metric` | Compare current vs previous period sums |
| `trends[]` | `Metric` | `GROUP BY date` with `SUM()` for each metric |
| `recentCampaigns[]` | `Campaign` + `Metric` | Join campaigns with aggregated spending |

### SQL Reference (Pseudocode)

```sql
-- Summary Metrics
SELECT 
  SUM(impressions) as totalImpressions,
  SUM(clicks) as totalClicks,
  SUM(spend) as totalCost,
  SUM(conversions) as totalConversions
FROM metrics
WHERE tenant_id = :tenantId
  AND date BETWEEN :startDate AND :endDate;

-- Trends (Daily)
SELECT 
  date,
  SUM(impressions) as impressions,
  SUM(clicks) as clicks,
  SUM(spend) as cost,
  SUM(conversions) as conversions
FROM metrics
WHERE tenant_id = :tenantId
  AND date BETWEEN :startDate AND :endDate
GROUP BY date
ORDER BY date ASC;

-- Recent Campaigns with Spending
SELECT 
  c.id, c.name, c.status, c.platform,
  COALESCE(SUM(m.spend), 0) as spending
FROM campaigns c
LEFT JOIN metrics m ON c.id = m.campaign_id
  AND m.date BETWEEN :startDate AND :endDate
WHERE c.tenant_id = :tenantId
GROUP BY c.id
ORDER BY 
  CASE WHEN c.status = 'active' THEN 0 ELSE 1 END,
  c.updated_at DESC
LIMIT 5;
```

---

## Implementation Notes

> [!IMPORTANT]
> **Multi-tenancy**: Always filter by `tenantId` from JWT token. Never trust client-provided `tenantId` unless the user has `SUPER_ADMIN` role.

> [!TIP]
> **Performance**: Consider caching the response with a TTL of 5 minutes per `tenantId + period` combination. The dashboard is likely to be the most frequently accessed endpoint.

> [!NOTE]
> **Growth Calculation Edge Cases**:
> - If previous period has zero values, return `null` for growth (avoid division by zero)
> - Negative growth should be displayed as-is (e.g., `-5.2%`)

---

## Approval Checklist

- [ ] **Interface Contract**: TypeScript interfaces approved
- [ ] **JSON Structure**: Response format confirmed
- [ ] **Query Parameters**: Period enum values sufficient
- [ ] **Error Handling**: Error response format acceptable
- [ ] **Performance**: Caching strategy approved

---

**Next Step**: Once approved, proceed to implement `DashboardController` and `DashboardService` in NestJS.
