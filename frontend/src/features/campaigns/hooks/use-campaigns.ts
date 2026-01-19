// TanStack Query hook for fetching campaigns

import { useQuery } from '@tanstack/react-query';
import { CampaignService } from '../api/campaign-service';
import type { Campaign } from '../types';

// Query key for cache management
export const CAMPAIGNS_QUERY_KEY = ['campaigns'] as const;

/**
 * Hook for fetching all campaigns
 * Uses TanStack Query for caching, background refetching, and error handling
 */
export function useCampaigns() {
    return useQuery<Campaign[], Error>({
        queryKey: CAMPAIGNS_QUERY_KEY,
        queryFn: CampaignService.getCampaigns,
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: true,
    });
}

/**
 * Hook for fetching a single campaign by ID
 */
export function useCampaign(id: string) {
    return useQuery<Campaign, Error>({
        queryKey: [...CAMPAIGNS_QUERY_KEY, id],
        queryFn: () => CampaignService.getCampaignById(id),
        enabled: !!id, // Only fetch if ID is provided
        staleTime: 1000 * 60 * 5,
    });
}
