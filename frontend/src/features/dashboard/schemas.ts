// src/features/dashboard/schemas.ts
// =============================================================================
// Zod Schemas for Dashboard API - Strict Runtime Validation
// Based on: docs/api/DASHBOARD_API_SPEC.md
// =============================================================================

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const PeriodEnumSchema = z.enum(['7d', '30d', 'this_month', 'last_month']);
export type PeriodEnum = z.infer<typeof PeriodEnumSchema>;

export const CampaignStatusSchema = z.enum([
    'ACTIVE',
    'PAUSED',
    'DELETED',
    'PENDING',
    'COMPLETED',
    'ENDED',
]);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const AdPlatformSchema = z.enum([
    'GOOGLE_ADS',
    'FACEBOOK',
    'TIKTOK',
    'LINE_ADS',
    'GOOGLE_ANALYTICS',
    'SHOPEE',
    'LAZADA',
]);
export type AdPlatform = z.infer<typeof AdPlatformSchema>;

// =============================================================================
// Nested Schemas
// =============================================================================

/**
 * Aggregated summary metrics for the selected period
 */
export const SummaryMetricsSchema = z
    .object({
        /** Total impressions across all campaigns */
        totalImpressions: z.number().int().nonnegative(),

        /** Total clicks across all campaigns */
        totalClicks: z.number().int().nonnegative(),

        /** Total advertising spend in THB */
        totalCost: z.number().nonnegative(),

        /** Total conversions across all campaigns */
        totalConversions: z.number().int().nonnegative(),

        /** Calculated CTR (clicks / impressions * 100) */
        averageCtr: z.number().nonnegative(),

        /** Calculated ROAS (revenue / spend) */
        averageRoas: z.number().nonnegative(),
    })
    .strict();

export type SummaryMetrics = z.infer<typeof SummaryMetricsSchema>;

/**
 * Percentage growth compared to the previous period
 * Null if previous period has no data
 */
export const GrowthMetricsSchema = z
    .object({
        impressionsGrowth: z.number().nullable(),
        clicksGrowth: z.number().nullable(),
        costGrowth: z.number().nullable(),
        conversionsGrowth: z.number().nullable(),
    })
    .strict();

export type GrowthMetrics = z.infer<typeof GrowthMetricsSchema>;

/**
 * Daily data point for trend charts
 */
export const TrendDataPointSchema = z
    .object({
        /** Date in ISO 8601 format (YYYY-MM-DD) */
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),

        /** Daily impressions */
        impressions: z.number().int().nonnegative(),

        /** Daily clicks */
        clicks: z.number().int().nonnegative(),

        /** Daily spend in THB */
        cost: z.number().nonnegative(),

        /** Daily conversions */
        conversions: z.number().int().nonnegative(),
    })
    .strict();

export type TrendDataPoint = z.infer<typeof TrendDataPointSchema>;

/**
 * Recent campaign with spending info
 */
export const RecentCampaignSchema = z
    .object({
        /** Campaign UUID */
        id: z.string().uuid(),

        /** Campaign display name */
        name: z.string().min(1),

        /** Current campaign status */
        status: CampaignStatusSchema,

        /** Ad platform identifier */
        platform: AdPlatformSchema,

        /** Total spend for this campaign in selected period */
        spending: z.number().nonnegative(),

        /** Budget utilization percentage (optional) */
        budgetUtilization: z.number().nonnegative().optional(),
    })
    .strict();

export type RecentCampaign = z.infer<typeof RecentCampaignSchema>;

/**
 * Response metadata
 */
export const ResponseMetaSchema = z
    .object({
        /** Requested period */
        period: PeriodEnumSchema,

        /** Actual date range used for query */
        dateRange: z
            .object({
                from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
                to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
            })
            .strict(),

        /** Tenant context */
        tenantId: z.string().uuid(),

        /** Response generation timestamp (ISO 8601 datetime) */
        generatedAt: z.string().datetime({ offset: true }),
    })
    .strict();

export type ResponseMeta = z.infer<typeof ResponseMetaSchema>;

// =============================================================================
// Main Response Schema
// =============================================================================

/**
 * Dashboard Overview Data (inner data object after unwrap)
 */
export const DashboardOverviewDataSchema = z
    .object({
        summary: SummaryMetricsSchema,
        growth: GrowthMetricsSchema,
        trends: z.array(TrendDataPointSchema),
        recentCampaigns: z.array(RecentCampaignSchema),
    })
    .strict();

export type DashboardOverviewData = z.infer<typeof DashboardOverviewDataSchema>;

/**
 * Full API Response (before unwrap - for reference)
 * Note: api-client auto-unwraps, so services receive DashboardOverviewData directly
 */
export const DashboardOverviewResponseSchema = z
    .object({
        success: z.literal(true),
        data: DashboardOverviewDataSchema,
        meta: ResponseMetaSchema,
    })
    .strict();

export type DashboardOverviewResponse = z.infer<typeof DashboardOverviewResponseSchema>;

// =============================================================================
// Query Parameters Schema
// =============================================================================

export const DashboardOverviewQuerySchema = z.object({
    period: PeriodEnumSchema.optional(),
    tenantId: z.string().uuid().optional(),
});

export type DashboardOverviewQuery = z.infer<typeof DashboardOverviewQuerySchema>;
