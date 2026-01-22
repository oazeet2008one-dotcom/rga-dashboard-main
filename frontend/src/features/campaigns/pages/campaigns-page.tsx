import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

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

import { CampaignsTable, SortableColumn } from '../components/campaigns-table';
import { CampaignSheet } from '../components/campaign-sheet';
import { CampaignToolbar } from '../components/campaign-toolbar';
import { CampaignPagination } from '../components/campaign-pagination';
import { BulkActionBar } from '../components/bulk-action-bar';
import { DashboardDateFilter } from '@/features/dashboard/components/dashboard-date-filter';
import { useDebounce } from '@/hooks/use-debounce';
import { useFileDownload } from '@/hooks/use-file-download';
import { useCampaigns } from '../hooks/use-campaigns';
import { useDeleteCampaign, useToggleCampaignStatus } from '../hooks/use-campaign-mutations';
import { exportService } from '@/features/dashboard/services/export-service';
import type { Campaign } from '../types';
import type { PeriodEnum } from '@/features/dashboard/schemas';

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PAGE_SIZE = 10;

// =============================================================================
// Period to Date Range Converter
// =============================================================================

function getDateRangeFromPeriod(period: PeriodEnum): { startDate: string; endDate: string } {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];

    switch (period) {
        case '7d': {
            const start = new Date(today);
            start.setDate(start.getDate() - 6);
            return { startDate: start.toISOString().split('T')[0], endDate };
        }
        case '30d': {
            const start = new Date(today);
            start.setDate(start.getDate() - 29);
            return { startDate: start.toISOString().split('T')[0], endDate };
        }
        case 'this_month': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { startDate: start.toISOString().split('T')[0], endDate };
        }
        case 'last_month': {
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return {
                startDate: firstDayLastMonth.toISOString().split('T')[0],
                endDate: lastDayLastMonth.toISOString().split('T')[0],
            };
        }
        default:
            return { startDate: endDate, endDate };
    }
}

// =============================================================================
// Main Component
// =============================================================================

export function CampaignsPage() {
    // ==========================================================================
    // State Management
    // ==========================================================================

    // Sheet state
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Delete confirmation dialog state
    const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);

    // Period filter state for time-window metrics
    const [period, setPeriod] = useState<PeriodEnum>('7d');

    // Search and filter state
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('ALL');

    // Pagination state
    const [page, setPage] = useState(1);

    // Sorting state
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Export loading state
    const [isExporting, setIsExporting] = useState(false);

    // Debounce search input
    const debouncedSearch = useDebounce(search, 500);

    // File download hook
    const { downloadBlob } = useFileDownload();

    // ==========================================================================
    // Reset Page on Filter Change
    // ==========================================================================
    useEffect(() => {
        setPage(1);
        // Clear selection on filter change
        setSelectedIds(new Set());
    }, [debouncedSearch, status, period, sortBy, sortOrder]);

    // ==========================================================================
    // Compute Date Range from Period
    // ==========================================================================
    const dateRange = useMemo(() => getDateRangeFromPeriod(period), [period]);

    // ==========================================================================
    // Data Fetching with All Filters
    // ==========================================================================
    const { data: campaigns, isLoading, isError, error, refetch, isFetching } = useCampaigns({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: status !== 'ALL' ? status : undefined,
        sortBy: sortBy as any,
        sortOrder,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    // Pagination info
    const totalItems = campaigns?.length ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / DEFAULT_PAGE_SIZE));

    // ==========================================================================
    // Mutations
    // ==========================================================================
    const deleteMutation = useDeleteCampaign({
        onSuccess: () => {
            setDeletingCampaign(null);
            setSelectedIds(new Set()); // Clear selection after delete
        },
    });

    const toggleStatusMutation = useToggleCampaignStatus();

    // ==========================================================================
    // Sort Handler
    // ==========================================================================
    const handleSort = useCallback((column: SortableColumn) => {
        if (sortBy === column) {
            // Toggle order if clicking same column
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            // Set new column with default desc order
            setSortBy(column);
            setSortOrder('desc');
        }
    }, [sortBy]);

    // ==========================================================================
    // Selection Handlers
    // ==========================================================================
    const handleToggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleToggleAll = useCallback((isChecked: boolean) => {
        if (isChecked && campaigns) {
            // Select all on current page
            setSelectedIds(new Set(campaigns.map((c) => c.id)));
        } else {
            // Clear all
            setSelectedIds(new Set());
        }
    }, [campaigns]);

    const handleClearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // ==========================================================================
    // Bulk Action Handlers (Visual Only - TODO: Implement API)
    // ==========================================================================
    const handleBulkPause = useCallback(() => {
        console.log('Bulk pause:', Array.from(selectedIds));
        // TODO: Implement bulk pause API call
    }, [selectedIds]);

    const handleBulkEnable = useCallback(() => {
        console.log('Bulk enable:', Array.from(selectedIds));
        // TODO: Implement bulk enable API call
    }, [selectedIds]);

    const handleBulkDelete = useCallback(() => {
        console.log('Bulk delete:', Array.from(selectedIds));
        // TODO: Implement bulk delete API call
    }, [selectedIds]);

    // ==========================================================================
    // Export Handler
    // ==========================================================================
    const handleExport = useCallback(async () => {
        setIsExporting(true);

        try {
            // Call API with current filters
            const blob = await exportService.downloadCampaignsCsv({
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                status: status !== 'ALL' ? status : undefined,
            });

            // Generate filename with date
            const today = new Date().toISOString().split('T')[0];
            const filename = `campaigns-report-${today}.csv`;

            // Trigger download
            downloadBlob(blob, filename);

            toast.success('Export successful', {
                description: `Downloaded ${filename}`,
            });
        } catch (err) {
            console.error('Export failed:', err);
            toast.error('Export failed', {
                description: err instanceof Error ? err.message : 'Unable to download CSV report',
            });
        } finally {
            setIsExporting(false);
        }
    }, [dateRange, status, downloadBlob]);

    // ==========================================================================
    // Campaign Action Handlers
    // ==========================================================================
    const handleCreate = () => {
        setEditingCampaign(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setIsSheetOpen(true);
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            setTimeout(() => setEditingCampaign(null), 300);
        }
    };

    const handleView = (campaign: Campaign) => {
        console.log('View campaign:', campaign.id);
    };

    const handleDeleteClick = (campaign: Campaign) => {
        setDeletingCampaign(campaign);
    };

    const handleDeleteConfirm = () => {
        if (deletingCampaign) {
            deleteMutation.mutate(deletingCampaign.id);
        }
    };

    const handleToggleStatus = (campaign: Campaign) => {
        toggleStatusMutation.mutate({
            id: campaign.id,
            currentStatus: campaign.status,
        });
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        setSelectedIds(new Set()); // Clear selection on page change
    };

    // ==========================================================================
    // Loading State
    // ==========================================================================
    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col gap-6 p-4 md:p-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-8 w-40 mb-2" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-40" />
                            <Skeleton className="h-10 w-36" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 flex-1 max-w-sm" />
                        <Skeleton className="h-10 w-40" />
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
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-8">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                        <p className="text-muted-foreground">
                            Manage your advertising campaigns across all platforms.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <DashboardDateFilter value={period} onValueChange={setPeriod} />
                        <Button
                            variant="outline"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Export CSV
                        </Button>
                        <Button onClick={handleCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Campaign
                        </Button>
                    </div>
                </div>

                {/* Time Window Indicator */}
                <div className="text-sm text-muted-foreground">
                    Metrics from <span className="font-medium">{dateRange.startDate}</span> to{' '}
                    <span className="font-medium">{dateRange.endDate}</span>
                    {isFetching && !isLoading && (
                        <span className="ml-2 text-xs">(Updating...)</span>
                    )}
                </div>

                {/* Search and Filter Toolbar */}
                <CampaignToolbar
                    search={search}
                    onSearchChange={setSearch}
                    status={status}
                    onStatusChange={setStatus}
                    isLoading={isFetching}
                />

                {/* Bulk Action Bar (shown when items selected) */}
                <BulkActionBar
                    selectedCount={selectedIds.size}
                    onClearSelection={handleClearSelection}
                    onPause={handleBulkPause}
                    onEnable={handleBulkEnable}
                    onDelete={handleBulkDelete}
                />

                {/* Campaigns Table with Sorting and Selection */}
                <CampaignsTable
                    campaigns={campaigns || []}
                    isLoading={isFetching}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onToggleAll={handleToggleAll}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onToggleStatus={handleToggleStatus}
                />

                {/* Pagination */}
                <CampaignPagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={DEFAULT_PAGE_SIZE}
                    onPageChange={handlePageChange}
                    disabled={isFetching}
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
