// src/features/campaigns/components/campaign-toolbar.tsx
// =============================================================================
// Campaign Toolbar - Search and Filter Controls
// =============================================================================

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
}: CampaignToolbarProps) {
    const handleClearSearch = () => {
        onSearchChange('');
    };

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

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search campaigns..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-9"
                    disabled={isLoading}
                />
                {search && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={handleClearSearch}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                    </Button>
                )}
            </div>

            {/* Status Filter */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[160px] justify-between border-dashed">
                        {status.has('ALL') ? 'All Statuses' : `${status.size} Selected`}
                        <ListFilter className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="start">
                    <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                        checked={status.has('ALL')}
                        onCheckedChange={() => onStatusChange(new Set(['ALL']))}
                        onSelect={(e) => e.preventDefault()}
                    >
                        All Statuses
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {STATUS_OPTIONS.slice(1).map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={status.has(option.value)}
                            onCheckedChange={() => handleToggle(status, onStatusChange, option.value)}
                            onSelect={(e) => e.preventDefault()}
                        >
                            {option.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                    {status.size > 0 && !status.has('ALL') && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onStatusChange(new Set(['ALL']))}
                                className="justify-center text-center text-sm"
                            >
                                Clear filters
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Platform Filter */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[160px] justify-between border-dashed">
                        {platform.has('ALL') ? 'All Platforms' : `${platform.size} Selected`}
                        <ListFilter className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="start">
                    <DropdownMenuLabel>Filter Platform</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                        checked={platform.has('ALL')}
                        onCheckedChange={() => onPlatformChange(new Set(['ALL']))}
                        onSelect={(e) => e.preventDefault()}
                    >
                        All Platforms
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {PLATFORM_OPTIONS.slice(1).map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option.value}
                            checked={platform.has(option.value)}
                            onCheckedChange={() => handleToggle(platform, onPlatformChange, option.value)}
                            onSelect={(e) => e.preventDefault()}
                        >
                            {option.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                    {platform.size > 0 && !platform.has('ALL') && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => onPlatformChange(new Set(['ALL']))}
                                className="justify-center text-center text-sm"
                            >
                                Clear filters
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Only Select Filter */}
            <Button
                variant={showSelectedOnly ? 'default' : 'outline'}
                onClick={() => onShowSelectedOnlyChange(!showSelectedOnly)}
                className="whitespace-nowrap"
            >
                Only Select
            </Button>

            {/* Date Filter */}
            <DashboardDateFilter value={period} onValueChange={onPeriodChange} />
        </div>
    );
}

export default CampaignToolbar;
