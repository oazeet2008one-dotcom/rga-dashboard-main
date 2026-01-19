// TanStack Query hooks for Ad Groups CRUD operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AdGroupService } from '../api/ad-groups-service';
import type {
    AdGroup,
    CreateAdGroupFormValues,
    UpdateAdGroupFormValues,
} from '../types';

// =============================================================================
// Query Keys
// =============================================================================

// Base key for all ad-groups queries
export const AD_GROUPS_QUERY_KEY = ['ad-groups'] as const;

// Key factory for campaign-specific queries
export const getAdGroupsQueryKey = (campaignId?: string) =>
    campaignId ? [...AD_GROUPS_QUERY_KEY, campaignId] : AD_GROUPS_QUERY_KEY;

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook for fetching ad groups (optionally filtered by campaignId)
 * @param campaignId - Optional: Filter ad groups by parent campaign
 */
export function useAdGroups(campaignId?: string) {
    return useQuery<AdGroup[], Error>({
        queryKey: getAdGroupsQueryKey(campaignId),
        queryFn: () => AdGroupService.getAdGroups(campaignId),
        enabled: !!campaignId, // Only fetch if campaignId is provided
        staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: true,
    });
}

/**
 * Hook for fetching all ad groups (no campaign filter)
 */
export function useAllAdGroups() {
    return useQuery<AdGroup[], Error>({
        queryKey: AD_GROUPS_QUERY_KEY,
        queryFn: () => AdGroupService.getAdGroups(),
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
    });
}

/**
 * Hook for fetching a single ad group by ID
 */
export function useAdGroup(id: string) {
    return useQuery<AdGroup, Error>({
        queryKey: [...AD_GROUPS_QUERY_KEY, 'detail', id],
        queryFn: () => AdGroupService.getAdGroupById(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

interface MutationOptions {
    onSuccess?: (adGroup: AdGroup) => void;
    onError?: (error: Error) => void;
}

interface DeleteMutationOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Hook for creating a new ad group
 */
export function useCreateAdGroup(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<AdGroup, Error, CreateAdGroupFormValues>({
        mutationFn: AdGroupService.createAdGroup,
        onSuccess: (adGroup) => {
            // Invalidate all ad-groups queries to refresh lists
            queryClient.invalidateQueries({ queryKey: AD_GROUPS_QUERY_KEY });
            toast.success('Ad Group created', {
                description: `"${adGroup.name}" has been created successfully.`,
            });
            options?.onSuccess?.(adGroup);
        },
        onError: (error) => {
            toast.error('Failed to create Ad Group', {
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}

/**
 * Hook for updating an existing ad group
 */
export function useUpdateAdGroup(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<AdGroup, Error, { id: string; data: UpdateAdGroupFormValues }>({
        mutationFn: ({ id, data }) => AdGroupService.updateAdGroup(id, data),
        onSuccess: (adGroup) => {
            queryClient.invalidateQueries({ queryKey: AD_GROUPS_QUERY_KEY });
            toast.success('Ad Group updated', {
                description: `"${adGroup.name}" has been updated.`,
            });
            options?.onSuccess?.(adGroup);
        },
        onError: (error) => {
            toast.error('Failed to update Ad Group', {
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}

/**
 * Hook for deleting an ad group
 */
export function useDeleteAdGroup(options?: DeleteMutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: AdGroupService.deleteAdGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AD_GROUPS_QUERY_KEY });
            toast.success('Ad Group deleted', {
                description: 'The ad group has been removed.',
            });
            options?.onSuccess?.();
        },
        onError: (error) => {
            toast.error('Failed to delete Ad Group', {
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}

/**
 * Hook for toggling ad group status (active <-> paused)
 */
export function useToggleAdGroupStatus(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<AdGroup, Error, { id: string; currentStatus: AdGroup['status'] }>({
        mutationFn: ({ id, currentStatus }) =>
            AdGroupService.toggleAdGroupStatus(id, currentStatus),
        onSuccess: (adGroup) => {
            queryClient.invalidateQueries({ queryKey: AD_GROUPS_QUERY_KEY });
            toast.success(`Ad Group ${adGroup.status === 'active' ? 'activated' : 'paused'}`, {
                description: `"${adGroup.name}" is now ${adGroup.status}.`,
            });
            options?.onSuccess?.(adGroup);
        },
        onError: (error) => {
            toast.error('Failed to update status', {
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}
