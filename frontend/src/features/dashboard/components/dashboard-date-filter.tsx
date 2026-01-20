// src/features/dashboard/components/dashboard-date-filter.tsx
// =============================================================================
// Dashboard Date Filter - Period Selection Dropdown
// =============================================================================

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import type { PeriodEnum } from '../schemas';

// =============================================================================
// Types
// =============================================================================

export interface DashboardDateFilterProps {
    /** Currently selected period */
    value: PeriodEnum;
    /** Callback when period changes */
    onValueChange: (value: PeriodEnum) => void;
    /** Optional className */
    className?: string;
}

// =============================================================================
// Period Options
// =============================================================================

const PERIOD_OPTIONS: { value: PeriodEnum; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
];

// =============================================================================
// Component
// =============================================================================

export function DashboardDateFilter({
    value,
    onValueChange,
    className,
}: DashboardDateFilterProps) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className={`w-[160px] ${className ?? ''}`}>
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default DashboardDateFilter;
