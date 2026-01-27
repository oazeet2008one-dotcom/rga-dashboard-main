// src/features/campaigns/components/campaigns-table.tsx
// =============================================================================
// Campaigns Table - Sortable Headers & Row Selection
// =============================================================================

import { useState } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import {
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Pause,
    Play,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Columns,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { Campaign, STATUS_STYLES, PLATFORM_LABELS } from '../types';

// =============================================================================
// Types
// =============================================================================

export type SortableColumn = 'name' | 'status' | 'platform' | 'budget' | 'spend' | 'revenue' | 'impressions' | 'clicks' | 'createdAt' | 'ctr' | 'cpc' | 'cpm' | 'roas' | 'roi' | 'date';

export interface CampaignsTableProps {
    campaigns: Campaign[];
    isLoading?: boolean;
    // Sorting
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: SortableColumn) => void;
    // Selection
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleAll: (isChecked: boolean) => void;
    // Actions
    onView?: (campaign: Campaign) => void;
    onEdit?: (campaign: Campaign) => void;
    onDelete?: (campaign: Campaign) => void;
    onToggleStatus?: (campaign: Campaign) => void;
    // Pagination
    page?: number;
    totalPages?: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
}

// =============================================================================
// Formatters
// =============================================================================

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('th-TH').format(num);
};

const COLUMN_LABELS: Record<string, string> = {
    platform: 'Platform',
    budget: 'Budget',
    spend: 'Spent',
    revenue: 'Revenue',
    impressions: 'Impressions',
    clicks: 'Clicks',
    ctr: 'CTR',
    cpc: 'CPC',
    cpm: 'CPM',
    roas: 'ROAS',
    roi: 'ROI',
    date: 'Date',
};



// =============================================================================
// Sortable Header Component
// =============================================================================

interface SortableHeaderProps {
    column: SortableColumn;
    label: string;
    currentSortBy: string;
    currentSortOrder: 'asc' | 'desc';
    onSort: (column: SortableColumn) => void;
    align?: 'left' | 'center' | 'right';
}

function SortableHeader({
    column,
    label,
    currentSortBy,
    currentSortOrder,
    onSort,
    align = 'left',
}: SortableHeaderProps) {
    const isActive = currentSortBy === column;

    const SortIcon = isActive
        ? currentSortOrder === 'asc'
            ? ArrowUp
            : ArrowDown
        : ArrowUpDown;

    return (
        <Button
            variant="ghost"
            size="sm"
            className={`h-8 flex items-center gap-1 hover:bg-muted/50 ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto justify-end' : '-ml-3'
                }`}
            onClick={() => onSort(column)}
        >
            {label}
            <SortIcon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function CampaignsTable({
    campaigns,
    isLoading = false,
    sortBy,
    sortOrder,
    onSort,
    selectedIds,
    onToggleSelect,
    onToggleAll,
    onView,
    onEdit,
    onDelete,
    onToggleStatus,
    page = 1,
    totalPages = 1,
    totalItems = 0,
    pageSize = 10,
    onPageChange,
}: CampaignsTableProps) {
    // Check if all items on this page are selected
    const allSelected = campaigns.length > 0 && campaigns.every((c) => selectedIds.has(c.id));
    // Data check for empty state
    if (campaigns.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
                <div className="rounded-full bg-muted p-4 mb-4">
                    <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">No campaigns found</h3>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or create a new campaign.</p>
            </div>
        );
    }

    // =========================================================================
    // Column Reordering Logic
    // =========================================================================
    const [reorderableColumns, setReorderableColumns] = useState<SortableColumn[]>([
        'platform', 'budget', 'spend', 'revenue', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'roas', 'roi', 'date'
    ]);
    const [draggedColumn, setDraggedColumn] = useState<SortableColumn | null>(null);

    // Column Visibility State with localStorage persistence
    const STORAGE_KEY = 'campaigns-table-visible-columns';
    const [visibleColumns, setVisibleColumns] = useState<Set<SortableColumn>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return new Set(JSON.parse(saved) as SortableColumn[]);
            }
        } catch {
            // Ignore errors, use default
        }
        return new Set(['platform', 'budget', 'spend', 'revenue', 'impressions', 'roi'] as SortableColumn[]);
    });

    // Persist column visibility to localStorage
    const toggleColumn = (column: SortableColumn) => {
        setVisibleColumns(prev => {
            const next = new Set(prev);
            if (next.has(column)) {
                next.delete(column);
            } else {
                next.add(column);
            }
            // Save to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    const handleDragStart = (e: React.DragEvent, col: SortableColumn) => {
        setDraggedColumn(col);
        // Set drag effect
        e.dataTransfer.effectAllowed = 'move';
        // HTML5 Drag ghost image transparency usually handled by browser, 
        // but we can set a dummy image if needed. Default is fine.
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetCol: SortableColumn) => {
        e.preventDefault();
        if (!draggedColumn || draggedColumn === targetCol) return;

        const currentOrder = [...reorderableColumns];
        const dragIndex = currentOrder.indexOf(draggedColumn);
        const dropIndex = currentOrder.indexOf(targetCol);

        if (dragIndex !== -1 && dropIndex !== -1) {
            // Swap
            // Remove dragged
            currentOrder.splice(dragIndex, 1);
            // Insert at new position
            currentOrder.splice(dropIndex, 0, draggedColumn);
            setReorderableColumns(currentOrder);
        }
        setDraggedColumn(null);
    };

    // =========================================================================
    // Cell Renderer Helper
    // =========================================================================
    const renderCell = (campaign: Campaign, col: SortableColumn) => {
        switch (col) {
            case 'platform':
                // Platform Brand Colors
                const pName = campaign.platform.toLowerCase();
                const pColor = pName.includes('facebook') ? 'text-blue-600' :
                    pName.includes('google') ? 'text-red-600' :
                        pName.includes('line') ? 'text-emerald-600' :
                            pName.includes('tiktok') ? 'text-gray-900' : 'text-gray-600';

                return <span className={cn("font-semibold", pColor)}>{PLATFORM_LABELS[campaign.platform]}</span>;
            case 'budget':
                return <span className="font-medium tabular-nums">{formatCurrency(campaign.budget)}</span>;
            case 'spend':
                return <span className="font-medium tabular-nums">{formatCurrency(campaign.spent)}</span>;
            case 'revenue':
                return <span className="font-medium text-emerald-600 tabular-nums">{formatCurrency(campaign.revenue || 0)}</span>;
            case 'impressions':
                return <span className="tabular-nums text-muted-foreground">{formatNumber(campaign.impressions)}</span>;
            case 'clicks':
                return <span className="tabular-nums text-muted-foreground">{formatNumber(campaign.clicks)}</span>;
            case 'ctr':
                return <span className="whitespace-nowrap tabular-nums">{campaign.ctr}%</span>;
            case 'cpc':
                return <span className="whitespace-nowrap tabular-nums">{formatCurrency(campaign.cpc || 0)}</span>;
            case 'cpm':
                return <span className="whitespace-nowrap tabular-nums">{formatCurrency(campaign.cpm || 0)}</span>;
            case 'roas':
                return (
                    <div className={`flex items-center justify-center gap-1 whitespace-nowrap tabular-nums ${campaign.roas && campaign.roas >= 1 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}`}>
                        {campaign.roas && campaign.roas >= 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {campaign.roas}
                    </div>
                );
            case 'roi':
                return (
                    <div className={`flex items-center justify-center gap-1 whitespace-nowrap tabular-nums ${campaign.roi && campaign.roi >= 0 ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}`}>
                        {campaign.roi && campaign.roi >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {campaign.roi}%
                    </div>
                );
            case 'date':
                return (
                    <div className="flex flex-col text-xs text-muted-foreground whitespace-nowrap">
                        <span>{campaign.startDate ? format(new Date(campaign.startDate), 'MMM d, yyyy') : '-'}</span>
                        <span>{campaign.endDate ? format(new Date(campaign.endDate), 'MMM d, yyyy') : '-'}</span>
                    </div>
                );
            default:
                return null;
        }
    };

    const visibleReorderableColumns = reorderableColumns.filter(col => visibleColumns.has(col));

    return (
        <div className="space-y-4">
            {/* Column Toggle Toolbar */}
            {/* Toolbar: Pagination & Column Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
                <div className="text-xs text-muted-foreground order-2 sm:order-1 font-medium">
                    {totalItems > 0 ? (
                        <>
                            Showing <span className="text-foreground">{(page - 1) * pageSize + 1}</span> to <span className="text-foreground">{Math.min(page * pageSize, totalItems)}</span> of <span className="text-foreground">{totalItems}</span> entries
                        </>
                    ) : (
                        "No campaigns found"
                    )}
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-end">
                    {/* Pagination Controls */}
                    <div className="flex items-center space-x-2 mr-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(Math.max(1, page - 1))}
                            disabled={page === 1 || isLoading}
                            className="h-8"
                        >
                            &lt; Previous
                        </Button>
                        <div className="text-sm font-medium whitespace-nowrap">
                            Page {page} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages || isLoading}
                            className="h-8"
                        >
                            Next &gt;
                        </Button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 lg:flex">
                                <Columns className="mr-2 h-4 w-4" />
                                Columns Select
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[150px]">
                            {reorderableColumns.map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col}
                                    className="capitalize"
                                    checked={visibleColumns.has(col)}
                                    onCheckedChange={() => toggleColumn(col)}
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {COLUMN_LABELS[col] || col}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="rounded-xl border shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow>
                            {/* 1. SELECTION (Fixed) */}
                            <TableHead className="w-[50px]">
                                <Switch checked={allSelected} onCheckedChange={(checked) => onToggleAll(!!checked)} aria-label="Select all" />
                            </TableHead>

                            {/* 2. CAMPAIGN NAME (Fixed) */}
                            <TableHead className="w-[250px]">
                                <span className="uppercase text-[11px] font-bold tracking-wider text-gray-500">
                                    <SortableHeader column="name" label="Campaign" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={onSort} />
                                </span>
                            </TableHead>

                            {/* 3. STATUS (Fixed) */}
                            <TableHead className="text-center">
                                <span className="uppercase text-[11px] font-bold tracking-wider text-gray-500">
                                    <SortableHeader column="status" label="Status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={onSort} align="center" />
                                </span>
                            </TableHead>

                            {/* 4. DYNAMIC COLUMNS (Draggable) */}
                            {visibleReorderableColumns.map((col) => (
                                <TableHead
                                    key={col}
                                    className="text-center cursor-move transition-colors hover:bg-muted/30"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, col)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col)}
                                    title="Drag to reorder"
                                >
                                    <span className="uppercase text-[11px] font-bold tracking-wider text-gray-500">
                                        <SortableHeader
                                            column={col}
                                            label={COLUMN_LABELS[col] || col}
                                            currentSortBy={sortBy}
                                            currentSortOrder={sortOrder}
                                            onSort={onSort}
                                            align="center"
                                        />
                                    </span>
                                </TableHead>
                            ))}

                            {/* 5. ACTIONS (Fixed) */}
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.map((campaign) => {
                            const isSelected = selectedIds.has(campaign.id);
                            return (
                                <TableRow
                                    key={campaign.id}
                                    className={cn(
                                        "transition-colors hover:bg-gray-50/80",
                                        isSelected && "bg-blue-50/50 hover:bg-blue-50/70"
                                    )}
                                >
                                    {/* 1. SELECTION */}
                                    <TableCell>
                                        <Switch checked={isSelected} onCheckedChange={() => onToggleSelect(campaign.id)} />
                                    </TableCell>

                                    {/* 2. CAMPAIGN NAME */}
                                    <TableCell>
                                        <Link href={`/campaigns/${campaign.id}`}>
                                            <span className="font-medium hover:underline text-primary cursor-pointer">{campaign.name}</span>
                                        </Link>
                                    </TableCell>

                                    {/* 3. STATUS */}
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className={STATUS_STYLES[campaign.status]}>
                                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                        </Badge>
                                    </TableCell>

                                    {/* 4. DYNAMIC COLUMNS */}
                                    {visibleReorderableColumns.map((col) => (
                                        <TableCell key={col} className="text-center">
                                            {renderCell(campaign, col)}
                                        </TableCell>
                                    ))}

                                    {/* 5. ACTIONS */}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Open menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onView?.(campaign)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEdit?.(campaign)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit Campaign
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onToggleStatus?.(campaign)}>
                                                    {campaign.status === 'active' ? (
                                                        <><Pause className="mr-2 h-4 w-4" /> Pause Campaign</>
                                                    ) : (
                                                        <><Play className="mr-2 h-4 w-4" /> Activate Campaign</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onDelete?.(campaign)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Campaign
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default CampaignsTable;
