// src/features/dashboard/hooks/use-dashboard.ts
// =============================================================================
// TanStack Query Hooks for Dashboard Data
// =============================================================================

import { useQuery } from '@tanstack/react-query';
import { getDashboardOverview } from '../services/dashboard.service';
import type { DashboardOverviewData, PeriodEnum } from '../schemas';

// =============================================================================
// Query Keys Factory
// =============================================================================

export const dashboardKeys = {
    all: ['dashboard'] as const,
    overview: () => [...dashboardKeys.all, 'overview'] as const,
    overviewByPeriod: (period: PeriodEnum, tenantId?: string) =>
        [...dashboardKeys.overview(), { period, tenantId }] as const,
} as const;

// =============================================================================
// Query Options Type
// =============================================================================

interface UseDashboardOverviewOptions {
    /** Time period for aggregation */
    period?: PeriodEnum;
    /** Explicit tenant override (SUPER_ADMIN only) */
    tenantId?: string;
    /** Enable/disable the query */
    enabled?: boolean;
    /** Refetch interval in milliseconds (0 = disabled) */
    refetchInterval?: number;
    /** Stale time in milliseconds */
    staleTime?: number;
}

// =============================================================================
// Hook: useDashboardOverview
// =============================================================================

/**
 * Fetches dashboard overview data using TanStack Query.
 *
 * Features:
 * - Automatic caching and deduplication
 * - Background refetch on window focus
 * - Keeps previous data while fetching (no flickering)
 * - Type-safe with Zod validation
 *
 * @param options - Query configuration options
 * @returns TanStack Query result with dashboard data
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { data, isLoading, error } = useDashboardOverview({ period: '7d' });
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return <DashboardSummary summary={data.summary} />;
 * }
 * ```
 */
export function useDashboardOverview(options: UseDashboardOverviewOptions = {}) {
    const {
        period = '7d',
        tenantId,
        enabled = true,
        refetchInterval = 0,
        staleTime = 5 * 60 * 1000, // 5 minutes default
    } = options;

    return useQuery<DashboardOverviewData, Error>({
        queryKey: dashboardKeys.overviewByPeriod(period, tenantId),
        queryFn: () => getDashboardOverview({ period, tenantId }),
        enabled,
        staleTime,
        refetchInterval: refetchInterval > 0 ? refetchInterval : undefined,
        refetchOnWindowFocus: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // TanStack Query v4 uses keepPreviousData boolean option
        keepPreviousData: true,
    });
}

// =============================================================================
// Hook: useDashboardSummary (Derived Data)
// =============================================================================

/**
 * Helper hook that extracts just the summary metrics.
 * Useful when only summary data is needed.
 */
export function useDashboardSummary(options: UseDashboardOverviewOptions = {}) {
    const query = useDashboardOverview(options);

    return {
        ...query,
        data: query.data?.summary,
    };
}

// =============================================================================
// Hook: useDashboardTrends (Derived Data)
// =============================================================================

/**
 * Helper hook that extracts trend data for charts.
 */
export function useDashboardTrends(options: UseDashboardOverviewOptions = {}) {
    const query = useDashboardOverview(options);

    return {
        ...query,
        data: query.data?.trends ?? [],
    };
}

// =============================================================================
// Hook: useRecentCampaigns (Derived Data)
// =============================================================================

/**
 * Helper hook that extracts recent campaigns list.
 */
export function useRecentCampaigns(options: UseDashboardOverviewOptions = {}) {
    const query = useDashboardOverview(options);

    return {
        ...query,
        data: query.data?.recentCampaigns ?? [],
    };
}
