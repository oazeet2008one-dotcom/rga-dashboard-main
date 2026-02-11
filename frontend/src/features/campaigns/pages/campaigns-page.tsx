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
import { CampaignSummary } from '../components/campaign-summary';
import { CampaignSheet } from '../components/campaign-sheet';
import { CampaignToolbar } from '../components/campaign-toolbar';
import { CampaignAnalytics } from '../components/campaign-analytics';
import { CampaignVisualization } from '../components/campaign-visualization';

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
const MAX_SELECTION_LIMIT = 10;
const GLOBAL_QUERY_LIMIT = 1000;

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
    const [status, setStatus] = useState<Set<string>>(new Set(['ALL']));
    const [platform, setPlatform] = useState<Set<string>>(new Set(['ALL']));

    // Pagination state
    const [page, setPage] = useState(1);

    // Sorting state
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);

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
        // Reset "Only Select" mode when filters change
        setShowSelectedOnly(false);
    }, [debouncedSearch, status, platform, period, sortBy, sortOrder]);

    // ==========================================================================
    // Compute Date Range from Period
    // ==========================================================================
    const dateRange = useMemo(() => getDateRangeFromPeriod(period), [period]);

    // ==========================================================================
    // Data Fetching with All Filters
    // ==========================================================================
    // ==========================================================================
    // Data Fetching with All Filters (Paginated for Table)
    // ==========================================================================
    const { data: campaignsResponse, isLoading, isError, error, refetch, isFetching } = useCampaigns({
        page: showSelectedOnly ? 1 : page,
        limit: showSelectedOnly ? 100 : DEFAULT_PAGE_SIZE, // Show all selected items (up to 100)
        // Only filter by IDs if we have selections
        ids: showSelectedOnly && selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
        search: debouncedSearch || undefined,
        status: status.has('ALL') ? undefined : Array.from(status).join(','),
        platform: platform.has('ALL') ? undefined : Array.from(platform).join(','),
        sortBy: sortBy as any,
        sortOrder,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    const campaigns = campaignsResponse?.data || [];
    const summary = campaignsResponse?.summary;
    const meta = campaignsResponse?.meta;

    // ==========================================================================
    // Global Data Fetching (Unpaginated for Charts/Analytics)
    // ==========================================================================
    // Fetch all items (up to limit) that match the filters, ignoring pagination
    const { data: globalCampaignsResponse, isLoading: isGlobalLoading } = useCampaigns({
        page: 1,
        limit: GLOBAL_QUERY_LIMIT,
        ids: showSelectedOnly
            ? (selectedIds.size > 0 ? Array.from(selectedIds) : ['00000000-0000-0000-0000-000000000000'])
            : undefined,
        search: debouncedSearch || undefined,
        status: status.has('ALL') ? undefined : Array.from(status).join(','),
        platform: platform.has('ALL') ? undefined : Array.from(platform).join(','),
        sortBy: sortBy as any,
        sortOrder,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    const globalCampaigns = globalCampaignsResponse?.data || [];
    // Use global summary if available (it aggregates everything), otherwise fall back to paginated summary
    // Actually, backend usually returns summary for "matching filters" not "matching page", 
    // but just to be safe and consistent with charts, we can use global summary if we wanted.
    // However, the existing 'summary' usually reflects total metrics for the QUERY, not the PAGE.
    // Let's stick with the 'summary' from the main query for the top cards as that's standard,
    // but use 'globalCampaigns' for the charts.

    // Pagination info
    const totalItems = meta?.total ?? 0;
    const totalPages = meta?.totalPages ?? 1;

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
    // Filtered Campaigns for Display
    // ==========================================================================
    // Paginated list for Table
    const displayedCampaigns = campaigns;

    // Full list for Charts
    const displayedGlobalCampaigns = globalCampaigns;

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
                if (next.size >= MAX_SELECTION_LIMIT) {
                    toast.error('Selection limit reached', {
                        description: `You can only select up to ${MAX_SELECTION_LIMIT} campaigns.`
                    });
                    return next;
                }
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleToggleAll = useCallback((isChecked: boolean) => {
        if (!campaigns) return;

        setSelectedIds((prev) => {
            const next = new Set(prev);
            const currentPageIds = campaigns.map((c) => c.id);

            if (isChecked) {
                // Limit selection to max
                const remainingSlots = MAX_SELECTION_LIMIT - next.size;
                if (remainingSlots <= 0) {
                    toast.error('Selection limit reached', { description: `You have already selected ${MAX_SELECTION_LIMIT} campaigns.` });
                    return next;
                }

                const itemsToAdd = currentPageIds.slice(0, remainingSlots);
                itemsToAdd.forEach((id) => next.add(id));

                if (itemsToAdd.length < currentPageIds.length) {
                    toast.info('Selection capped', { description: 'Only some items were selected to stay within the 10-item limit.' });
                }
            } else {
                // Remove all current page items (keep others)
                currentPageIds.forEach((id) => next.delete(id));
            }
            return next;
        });
    }, [campaigns]);

    const handleClearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // ==========================================================================
    // Bulk Action Handlers (TODO: Implement API)
    // ==========================================================================
    const handleBulkPause = useCallback(() => {
        toast.info('Bulk Pause', { description: 'This feature is coming soon.' });
        // TODO: Implement bulk pause API call
    }, []);

    const handleBulkEnable = useCallback(() => {
        toast.info('Bulk Enable', { description: 'This feature is coming soon.' });
        // TODO: Implement bulk enable API call
    }, []);

    const handleBulkDelete = useCallback(() => {
        toast.info('Bulk Delete', { description: 'This feature is coming soon.' });
        // TODO: Implement bulk delete API call
    }, []);

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
                status: status.has('ALL') ? undefined : Array.from(status).join(','),
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
        // Navigate to campaign detail page
        window.location.href = `/campaigns/${campaign.id}`;
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
        // Persist selection on page change (do not clear)
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
                    {/* Summary Skeleton */}
                    <Skeleton className="h-[200px] w-full rounded-3xl" />
                </div>
            </DashboardLayout >
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
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-8 relative z-10">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                        <p className="text-muted-foreground">
                            Manage your advertising campaigns across all platforms.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                    platform={platform}
                    onPlatformChange={setPlatform}
                    isLoading={isFetching}
                    period={period}
                    onPeriodChange={setPeriod}
                    showSelectedOnly={showSelectedOnly}
                    onShowSelectedOnlyChange={setShowSelectedOnly}
                />





                {/* Bulk Action Bar (shown when items selected) */}
                <BulkActionBar
                    selectedCount={selectedIds.size}
                    onClearSelection={handleClearSelection}
                    onPause={handleBulkPause}
                    onEnable={handleBulkEnable}
                    onDelete={handleBulkDelete}
                />

                {/* Pagination Header (Removed - Moved to Table) */}

                {/* Campaigns Table with Sorting and Selection */}
                <CampaignsTable
                    campaigns={displayedCampaigns}
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

                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={DEFAULT_PAGE_SIZE}
                    onPageChange={handlePageChange}
                />



                {/* Campaign Summary Dashboard (Middle Section) */}
                <CampaignSummary summary={campaignsResponse?.summary} isLoading={isLoading} />

                {/* Visualization Panel (Bottom) */}
                {!isLoading && campaignsResponse?.summary && (
                    <>
                        <CampaignVisualization
                            campaigns={displayedGlobalCampaigns}
                            summary={campaignsResponse.summary}
                            onDownload={handleExport}
                        />

                        {/* Campaign Analytics (Conversion Rate) */}
                        <CampaignAnalytics campaigns={displayedGlobalCampaigns} />
                    </>
                )}
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
