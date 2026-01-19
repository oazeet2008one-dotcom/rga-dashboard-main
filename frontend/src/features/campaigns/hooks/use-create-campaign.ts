// TanStack Query mutation hook for creating campaigns

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CampaignService } from '../api/campaign-service';
import { CAMPAIGNS_QUERY_KEY } from './use-campaigns';
import type { CreateCampaignFormData } from '../types/schema';
import type { Campaign } from '../types';

interface UseCreateCampaignOptions {
    onSuccess?: (campaign: Campaign) => void;
    onError?: (error: Error) => void;
}

/**
 * Mutation hook for creating a new campaign
 * Automatically invalidates campaigns cache on success
 */
export function useCreateCampaign(options?: UseCreateCampaignOptions) {
    const queryClient = useQueryClient();

    return useMutation<Campaign, Error, CreateCampaignFormData>({
        mutationFn: CampaignService.createCampaign,
        onSuccess: (campaign) => {
            // Invalidate and refetch campaigns list
            queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });

            // Show success toast
            toast.success('Campaign created', {
                description: `"${campaign.name}" has been created successfully.`,
            });

            // Call custom success handler
            options?.onSuccess?.(campaign);
        },
        onError: (error) => {
            // Show error toast
            toast.error('Failed to create campaign', {
                description: error.message || 'An unexpected error occurred.',
            });

            // Call custom error handler
            options?.onError?.(error);
        },
    });
}

/**
 * Mutation hook for updating a campaign
 */
export function useUpdateCampaign(options?: UseCreateCampaignOptions) {
    const queryClient = useQueryClient();

    return useMutation<Campaign, Error, { id: string; data: Partial<CreateCampaignFormData> }>({
        mutationFn: ({ id, data }) => CampaignService.updateCampaign(id, data),
        onSuccess: (campaign) => {
            queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
            toast.success('Campaign updated', {
                description: `"${campaign.name}" has been updated.`,
            });
            options?.onSuccess?.(campaign);
        },
        onError: (error) => {
            toast.error('Failed to update campaign', {
                description: error.message,
            });
            options?.onError?.(error);
        },
    });
}

/**
 * Mutation hook for deleting a campaign
 */
export function useDeleteCampaign() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: CampaignService.deleteCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
            toast.success('Campaign deleted');
        },
        onError: (error) => {
            toast.error('Failed to delete campaign', {
                description: error.message,
            });
        },
    });
}

/**
 * Mutation hook for toggling campaign status
 */
export function useToggleCampaignStatus() {
    const queryClient = useQueryClient();

    return useMutation<Campaign, Error, { id: string; currentStatus: Campaign['status'] }>({
        mutationFn: ({ id, currentStatus }) => CampaignService.toggleCampaignStatus(id, currentStatus),
        onSuccess: (campaign) => {
            queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
            toast.success(`Campaign ${campaign.status === 'active' ? 'activated' : 'paused'}`, {
                description: `"${campaign.name}" is now ${campaign.status}.`,
            });
        },
        onError: (error) => {
            toast.error('Failed to update status', {
                description: error.message,
            });
        },
    });
}
