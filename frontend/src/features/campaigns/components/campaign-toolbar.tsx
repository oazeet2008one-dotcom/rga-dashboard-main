// src/features/campaigns/components/campaign-toolbar.tsx
// =============================================================================
// Campaign Toolbar - Search and Filter Controls
// =============================================================================

import { useState, useEffect } from 'react';
import { Search, X, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { DashboardDateFilter } from '@/features/dashboard/components/dashboard-date-filter';
import type { PeriodEnum } from '@/features/dashboard/schemas';

// =============================================================================
// Types
// =============================================================================

export interface CampaignToolbarProps {
    /** Current search query */
    search: string;
    /** Callback when search changes */
    onSearchChange: (value: string) => void;
    /** Current status filter */
    status: Set<string>;
    /** Callback when status filter changes */
    onStatusChange: (value: Set<string>) => void;
    /** Current platform filter */
    platform: Set<string>;
    /** Callback when platform filter changes */
    onPlatformChange: (value: Set<string>) => void;
    /** Optional: Show loading state */
    /** Optional: Show loading state */
    isLoading?: boolean;
    /** Current period filter */
    period: PeriodEnum;
    /** Callback when period filter changes */
    onPeriodChange: (value: PeriodEnum) => void;
    /** Toggle to show only selected items */
    showSelectedOnly: boolean;
    /** Callback when show selected only toggle changes */
    onShowSelectedOnlyChange: (value: boolean) => void;
    /** Number of selected campaigns */
    selectedCount: number;
}

// =============================================================================
// Status Filter Options
// =============================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'COMPLETED', label: 'Completed' },
] as const;

const PLATFORM_OPTIONS = [
    { value: 'ALL', label: 'All Platforms' },
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'GOOGLE', label: 'Google Ads' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'LINE_ADS', label: 'Line Ads' },
] as const;

// =============================================================================
// Component
// =============================================================================

export function CampaignToolbar({
    search,
    onSearchChange,
    status,
    onStatusChange,
    platform,
    onPlatformChange,
    isLoading = false,
    period,
    onPeriodChange,
    showSelectedOnly,
    onShowSelectedOnlyChange,
    selectedCount,
}: CampaignToolbarProps) {


    const handleToggle = (
        currentSet: Set<string>,
        onChange: (val: Set<string>) => void,
        value: string
    ) => {
        const next = new Set(currentSet);
        if (value === 'ALL') {
            onChange(new Set(['ALL']));
            return;
        }

        if (next.has('ALL')) {
            next.delete('ALL');
        }

        if (next.has(value)) {
            next.delete(value);
        } else {
            next.add(value);
        }

        if (next.size === 0) {
            onChange(new Set(['ALL']));
        } else {
            onChange(next);
        }
    };

    const [query, setQuery] = useState(search);

    // Sync local state with prop when prop changes (e.g. from URL or other external source)
    useEffect(() => {
        setQuery(search);
    }, [search]);

    const handleSearch = () => {
        onSearchChange(query);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClearSearch = () => {
        setQuery('');
        onSearchChange('');
    };

    return (
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

                {/* Search Input */}
                <div id="tutorial-campaigns-search" className="relative w-full md:max-w-sm group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors duration-200" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search campaigns..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pl-10 pr-10 h-11 bg-gray-50/50 border-transparent hover:bg-gray-50 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 rounded-xl transition-all duration-200"
                        disabled={isLoading}
                    />
                    {query && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">

                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                id="tutorial-campaigns-status-filter"
                                variant="outline"
                                className={`h-10 border-dashed rounded-lg px-3 lg:px-4 font-normal ${status.has('ALL')
                                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    : 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-50'
                                    }`}
                            >
                                <ListFilter className={`mr-2 h-4 w-4 ${status.has('ALL') ? 'opacity-50' : 'text-blue-600'}`} />
                                <span className="truncate max-w-[100px] lg:max-w-none">
                                    {status.has('ALL') ? 'Status' : `${status.size} Selected`}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-xl shadow-xl border-gray-100">
                            <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase px-2 mb-1">Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator className="-mx-2 mb-1" />
                            <DropdownMenuCheckboxItem
                                checked={status.has('ALL')}
                                onCheckedChange={() => onStatusChange(new Set(['ALL']))}
                                className="rounded-lg cursor-pointer"
                            >
                                All Statuses
                            </DropdownMenuCheckboxItem>
                            {STATUS_OPTIONS.slice(1).map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={status.has(option.value)}
                                    onCheckedChange={() => handleToggle(status, onStatusChange, option.value)}
                                    className="rounded-lg cursor-pointer"
                                >
                                    {option.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Platform Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                id="tutorial-campaigns-platform-filter"
                                variant="outline"
                                className={`h-10 border-dashed rounded-lg px-3 lg:px-4 font-normal ${platform.has('ALL')
                                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    : 'border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50'
                                    }`}
                            >
                                <ListFilter className={`mr-2 h-4 w-4 ${platform.has('ALL') ? 'opacity-50' : 'text-indigo-600'}`} />
                                <span className="truncate max-w-[100px] lg:max-w-none">
                                    {platform.has('ALL') ? 'Platform' : `${platform.size} Selected`}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-xl shadow-xl border-gray-100">
                            <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase px-2 mb-1">Filter by Platform</DropdownMenuLabel>
                            <DropdownMenuSeparator className="-mx-2 mb-1" />
                            <DropdownMenuCheckboxItem
                                checked={platform.has('ALL')}
                                onCheckedChange={() => onPlatformChange(new Set(['ALL']))}
                                className="rounded-lg cursor-pointer"
                            >
                                All Platforms
                            </DropdownMenuCheckboxItem>
                            {PLATFORM_OPTIONS.slice(1).map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.value}
                                    checked={platform.has(option.value)}
                                    onCheckedChange={() => handleToggle(platform, onPlatformChange, option.value)}
                                    className="rounded-lg cursor-pointer"
                                >
                                    {option.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

                    {/* Only Select Filter */}
                    <Button
                        id="tutorial-campaigns-selected-only"
                        variant={showSelectedOnly ? 'secondary' : 'ghost'}
                        onClick={() => onShowSelectedOnlyChange(!showSelectedOnly)}
                        disabled={selectedCount === 0}
                        className={`h-10 rounded-lg px-3 font-normal transition-all ${showSelectedOnly
                            ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-md transform scale-105'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            } ${selectedCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Selected Only {selectedCount > 0 && `(${selectedCount})`}
                    </Button>

                    {/* Date Filter - Wrapped for consistent height */}
                    <div id="tutorial-campaigns-date-filter" className="h-10 [&>button]:h-10 [&>button]:rounded-lg [&>button]:border-gray-200 [&>button]:shadow-sm">
                        <DashboardDateFilter value={period} onValueChange={onPeriodChange} />
                    </div>

                    {/* Search Button (Mobile/Desktop consistent) */}
                    <Button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="h-10 rounded-lg px-6 bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all active:scale-95 ml-auto md:ml-0"
                    >
                        Search
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CampaignToolbar;
