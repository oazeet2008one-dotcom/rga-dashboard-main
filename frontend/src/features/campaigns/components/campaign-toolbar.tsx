// src/features/campaigns/components/campaign-toolbar.tsx
// =============================================================================
// Campaign Toolbar - Search and Filter Controls
// =============================================================================

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    status: string;
    /** Callback when status filter changes */
    onStatusChange: (value: string) => void;
    /** Current platform filter */
    platform: string;
    /** Callback when platform filter changes */
    onPlatformChange: (value: string) => void;
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
            <Select value={status} onValueChange={onStatusChange} disabled={isLoading}>
                <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Platform Filter */}
            <Select value={platform} onValueChange={onPlatformChange} disabled={isLoading}>
                <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                    {PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

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
