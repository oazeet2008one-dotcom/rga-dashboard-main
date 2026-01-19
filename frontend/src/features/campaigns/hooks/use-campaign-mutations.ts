// TanStack Query mutation hooks for campaign CRUD operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CampaignService } from '../api/campaign-service';
import { CAMPAIGNS_QUERY_KEY } from './use-campaigns';
import type { CreateCampaignFormData } from '../types/schema';
import type { Campaign } from '../types';

// =============================================================================
// Shared Types
// =============================================================================
interface MutationOptions {
    onSuccess?: (campaign: Campaign) => void;
    onError?: (error: Error) => void;
}

interface DeleteMutationOptions {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

// =============================================================================
// Create Campaign
// =============================================================================
export function useCreateCampaign(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<Campaign, Error, CreateCampaignFormData>({
        mutationFn: CampaignService.createCampaign,
        onSuccess: (campaign) => {
            queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
            toast.success('Campaign created', {
                description: `"${campaign.name}" has been created successfully.`,
            });
            options?.onSuccess?.(campaign);
        },
        onError: (error) => {
            toast.error('Failed to create campaign', {
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}

// =============================================================================
// Update Campaign
// =============================================================================
export function useUpdateCampaign(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<Campaign, Error, { id: string; data: CreateCampaignFormData }>({
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
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}

// =============================================================================
// Delete Campaign
// =============================================================================
export function useDeleteCampaign(options?: DeleteMutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: CampaignService.deleteCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
            toast.success('Campaign deleted', {
                description: 'The campaign has been permanently removed.',
            });
            options?.onSuccess?.();
        },
        onError: (error) => {
            toast.error('Failed to delete campaign', {
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}

// =============================================================================
// Toggle Campaign Status
// =============================================================================
export function useToggleCampaignStatus(options?: MutationOptions) {
    const queryClient = useQueryClient();

    return useMutation<Campaign, Error, { id: string; currentStatus: Campaign['status'] }>({
        mutationFn: ({ id, currentStatus }) => CampaignService.toggleCampaignStatus(id, currentStatus),
        onSuccess: (campaign) => {
            queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY });
            toast.success(`Campaign ${campaign.status === 'active' ? 'activated' : 'paused'}`, {
                description: `"${campaign.name}" is now ${campaign.status}.`,
            });
            options?.onSuccess?.(campaign);
        },
        onError: (error) => {
            toast.error('Failed to update status', {
                description: error.message || 'An unexpected error occurred.',
            });
            options?.onError?.(error);
        },
    });
}
