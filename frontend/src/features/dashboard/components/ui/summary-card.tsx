// src/features/dashboard/components/ui/summary-card.tsx
// =============================================================================
// Summary Card Component - Displays metric with trend indicator
// =============================================================================

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/formatters';

// =============================================================================
// Types
// =============================================================================

export interface SummaryCardProps {
    /** Card title text */
    title: string;
    /** Formatted value string */
    value: string;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Trend percentage (positive = up, negative = down, null = hide) */
    trend: number | null;
    /** Label shown next to trend (e.g., "vs last period") */
    trendLabel?: string;
    /** Show loading skeleton */
    loading?: boolean;
    /** Optional additional className */
    className?: string;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function SummaryCardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="mt-2 h-4 w-20" />
            </CardContent>
        </Card>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function SummaryCard({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel = 'vs last period',
    loading = false,
    className,
}: SummaryCardProps) {
    // Show skeleton when loading
    if (loading) {
        return <SummaryCardSkeleton className={className} />;
    }

    // Determine trend styling
    const isPositive = trend !== null && trend > 0;
    const isNegative = trend !== null && trend < 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <Card className={cn('relative overflow-hidden', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {/* Value */}
                <div className="text-2xl font-bold tracking-tight">{value}</div>

                {/* Trend Indicator */}
                {trend !== null && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                        <TrendIcon
                            className={cn(
                                'h-3 w-3',
                                isPositive && 'text-emerald-500',
                                isNegative && 'text-rose-500'
                            )}
                        />
                        <span
                            className={cn(
                                'font-medium',
                                isPositive && 'text-emerald-500',
                                isNegative && 'text-rose-500'
                            )}
                        >
                            {formatPercentage(trend)}
                        </span>
                        <span className="text-muted-foreground">{trendLabel}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default SummaryCard;
