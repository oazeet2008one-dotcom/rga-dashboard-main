// src/features/dashboard/services/dashboard.service.ts
// =============================================================================
// Dashboard API Service - Type-Safe with Zod Validation
// =============================================================================

import { apiClient } from '@/services/api-client';
import {
    DashboardOverviewDataSchema,
    DashboardOverviewQuery,
    PeriodEnum,
    type DashboardOverviewData,
} from '../schemas';

// =============================================================================
// Service Configuration
// =============================================================================

const DASHBOARD_ENDPOINTS = {
    OVERVIEW: '/dashboard/overview',
} as const;

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetches dashboard overview data with runtime validation.
 *
 * @param params - Query parameters (period, tenantId)
 * @returns Validated DashboardOverviewData
 * @throws ZodError if response doesn't match schema
 * @throws AxiosError if network/auth fails
 *
 * @example
 * ```ts
 * const data = await getDashboardOverview({ period: '7d' });
 * console.log(data.summary.totalImpressions);
 * ```
 */
export async function getDashboardOverview(
    params: DashboardOverviewQuery = {}
): Promise<DashboardOverviewData> {
    const { period = '7d', tenantId } = params;

    const response = await apiClient.get<DashboardOverviewData>(
        DASHBOARD_ENDPOINTS.OVERVIEW,
        {
            params: {
                period,
                ...(tenantId && { tenantId }),
            },
        }
    );

    // ✅ Runtime validation using Zod
    // This catches any backend contract violations early
    const validatedData = DashboardOverviewDataSchema.parse(response.data);

    return validatedData;
}

// =============================================================================
// Service Object (Alternative Pattern for Grouping)
// =============================================================================

export const dashboardOverviewService = {
    /**
     * Get dashboard overview with default period
     */
    getOverview: getDashboardOverview,

    /**
     * Get overview for specific period
     */
    getOverviewByPeriod: (period: PeriodEnum) =>
        getDashboardOverview({ period }),

    /**
     * Get overview for specific tenant (SUPER_ADMIN only)
     */
    getOverviewByTenant: (tenantId: string, period: PeriodEnum = '7d') =>
        getDashboardOverview({ period, tenantId }),
} as const;

// Default export for convenience
export default dashboardOverviewService;
