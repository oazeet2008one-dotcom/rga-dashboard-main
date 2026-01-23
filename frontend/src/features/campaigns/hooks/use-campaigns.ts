// TanStack Query hooks for fetching campaigns with time-window support

import { useQuery } from '@tanstack/react-query';
import { CampaignService, CampaignQueryParams, CampaignListResponse } from '../api/campaign-service';
import type { Campaign } from '../types';

// =============================================================================
// Query Keys Factory
// =============================================================================

export const campaignKeys = {
    all: ['campaigns'] as const,
    list: (params: CampaignQueryParams = {}) => [...campaignKeys.all, 'list', params] as const,
    detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
} as const;

// Legacy key for backward compatibility
export const CAMPAIGNS_QUERY_KEY = campaignKeys.all;

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook for fetching campaigns with optional filtering and time-window metrics.
 * 
 * Uses TanStack Query for caching, background refetching, and error handling.
 * Query key includes params so data refetches when filters change.
 * 
 * @param params - Query parameters (page, limit, search, startDate, endDate, etc.)
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { data } = useCampaigns();
 * 
 * // With time-window filtering
 * const { data } = useCampaigns({
 *     startDate: '2026-01-01',
 *     endDate: '2026-01-07',
 * });
 * 
 * // With pagination and filters
 * const { data } = useCampaigns({
 *     page: 1,
 *     limit: 10,
 *     status: 'ACTIVE',
 *     startDate: '2026-01-01',
 *     endDate: '2026-01-31',
 * });
 * ```
 */
export function useCampaigns(params: CampaignQueryParams = {}) {
    return useQuery<CampaignListResponse, Error>({
        // Include params in query key for automatic refetch on param change
        queryKey: campaignKeys.list(params),
        queryFn: () => CampaignService.getCampaignsPaginated(params),
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: true,
    });
}

/**
 * Hook for fetching a single campaign by ID
 */
export function useCampaign(id: string) {
    return useQuery<Campaign, Error>({
        queryKey: campaignKeys.detail(id),
        queryFn: () => CampaignService.getCampaignById(id),
        enabled: !!id, // Only fetch if ID is provided
        staleTime: 1000 * 60 * 5,
    });
}
