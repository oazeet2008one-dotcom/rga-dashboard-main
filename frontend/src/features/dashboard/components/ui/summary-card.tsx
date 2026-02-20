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
    /** Accent color for the card */
    accentColor?: 'indigo' | 'violet' | 'cyan' | 'amber';
    /** Optional click handler (makes card interactive) */
    onClick?: () => void;
}

// Metric-specific styling configuration
const ACCENT_STYLES = {
    indigo: {
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/30',
        iconColor: 'text-indigo-500 dark:text-indigo-400',
        hoverBorder: 'hover:border-indigo-200 dark:hover:border-indigo-800',
        gradient: 'from-indigo-50/50 via-transparent to-transparent dark:from-indigo-950/20',
    },
    violet: {
        iconBg: 'bg-violet-50 dark:bg-violet-950/30',
        iconColor: 'text-violet-500 dark:text-violet-400',
        hoverBorder: 'hover:border-violet-200 dark:hover:border-violet-800',
        gradient: 'from-violet-50/50 via-transparent to-transparent dark:from-violet-950/20',
    },
    cyan: {
        iconBg: 'bg-cyan-50 dark:bg-cyan-950/30',
        iconColor: 'text-cyan-500 dark:text-cyan-400',
        hoverBorder: 'hover:border-cyan-200 dark:hover:border-cyan-800',
        gradient: 'from-cyan-50/50 via-transparent to-transparent dark:from-cyan-950/20',
    },
    amber: {
        iconBg: 'bg-amber-50 dark:bg-amber-950/30',
        iconColor: 'text-amber-500 dark:text-amber-400',
        hoverBorder: 'hover:border-amber-200 dark:hover:border-amber-800',
        gradient: 'from-amber-50/50 via-transparent to-transparent dark:from-amber-950/20',
    },
};

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
    accentColor = 'indigo',
    onClick,
}: SummaryCardProps) {
    // Show skeleton when loading
    if (loading) {
        return <SummaryCardSkeleton className={className} />;
    }

    // Determine trend styling
    const isPositive = trend !== null && trend > 0;
    const isNegative = trend !== null && trend < 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const accent = ACCENT_STYLES[accentColor];
    const isInteractive = Boolean(onClick);

    return (
        <Card
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(event) => {
                if (!isInteractive) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick?.();
                }
            }}
            className={cn(
                'relative overflow-hidden group',
                'transition-all duration-300 ease-out',
                'hover:shadow-lg hover:-translate-y-1',
                isInteractive && 'cursor-pointer',
                accent.hoverBorder,
                className
            )}
        >
            {/* Gradient overlay */}
            <div className={cn(
                'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                accent.gradient
            )} />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center',
                    'transition-all duration-300 group-hover:scale-110',
                    accent.iconBg
                )}>
                    <Icon className={cn('h-4 w-4', accent.iconColor)} />
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                {/* Value */}
                <div className="text-2xl font-bold tracking-tight">{value}</div>

                {/* Trend Indicator */}
                {trend !== null && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                        <TrendIcon
                            className={cn(
                                'h-3 w-3 transition-transform group-hover:scale-110',
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
