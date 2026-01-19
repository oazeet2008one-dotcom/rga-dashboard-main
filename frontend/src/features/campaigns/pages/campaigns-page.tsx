import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { CampaignsTable } from '../components/campaigns-table';
import { CampaignSheet } from '../components/campaign-sheet';
import { useCampaigns } from '../hooks/use-campaigns';
import { useDeleteCampaign, useToggleCampaignStatus } from '../hooks/use-campaign-mutations';
import type { Campaign } from '../types';

export function CampaignsPage() {
    // ==========================================================================
    // State Management
    // ==========================================================================

    // Sheet state: null = closed, undefined = create mode, Campaign = edit mode
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Delete confirmation dialog state
    const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

    // ==========================================================================
    // Data Fetching
    // ==========================================================================
    const { data: campaigns, isLoading, isError, error, refetch } = useCampaigns();

    // ==========================================================================
    // Mutations
    // ==========================================================================
    const deleteMutation = useDeleteCampaign({
        onSuccess: () => setDeletingCampaign(null),
    });

    const toggleStatusMutation = useToggleCampaignStatus();

    // ==========================================================================
    // Action Handlers
    // ==========================================================================

    /** Open sheet in Create mode */
    const handleCreate = () => {
        setEditingCampaign(null);
        setIsSheetOpen(true);
    };

    /** Open sheet in Edit mode with campaign data */
    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setIsSheetOpen(true);
    };

    /** Handle sheet close - reset editing state */
    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            // Small delay to allow sheet animation to complete
            setTimeout(() => setEditingCampaign(null), 300);
        }
    };

    /** View campaign details (placeholder) */
    const handleView = (campaign: Campaign) => {
        console.log('View campaign:', campaign.id);
        // TODO: Navigate to campaign details page
    };

    /** Open delete confirmation dialog */
    const handleDeleteClick = (campaign: Campaign) => {
        setDeletingCampaign(campaign);
    };

    /** Confirm deletion */
    const handleDeleteConfirm = () => {
        if (deletingCampaign) {
            deleteMutation.mutate(deletingCampaign.id);
        }
    };

    /** Toggle campaign status */
    const handleToggleStatus = (campaign: Campaign) => {
        toggleStatusMutation.mutate({
            id: campaign.id,
            currentStatus: campaign.status,
        });
    };

    // ==========================================================================
    // Loading State
    // ==========================================================================
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-8 w-40 mb-2" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                        <Skeleton className="h-10 w-36" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ==========================================================================
    // Error State
    // ==========================================================================
    if (isError) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                    <p className="text-destructive">
                        Failed to load campaigns: {error?.message || 'Unknown error'}
                    </p>
                    <Button variant="outline" onClick={() => refetch()}>
                        <Loader2 className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    // ==========================================================================
    // Render
    // ==========================================================================
    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                        <p className="text-muted-foreground">
                            Manage your advertising campaigns across all platforms.
                        </p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Campaign
                    </Button>
                </div>

                {/* Campaigns Table */}
                <CampaignsTable
                    campaigns={campaigns || []}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onToggleStatus={handleToggleStatus}
                />
            </div>

            {/* Create/Edit Campaign Sheet */}
            <CampaignSheet
                open={isSheetOpen}
                onOpenChange={handleSheetOpenChange}
                campaign={editingCampaign}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deletingCampaign}
                onOpenChange={(open) => !open && setDeletingCampaign(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingCampaign?.name}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
