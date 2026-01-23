// src/features/dashboard/components/dashboard-metrics.tsx
// =============================================================================
// Dashboard Metrics Grid - 4 Summary Cards in Responsive Grid
// =============================================================================

import { CreditCard, Eye, MousePointerClick, Target } from 'lucide-react';
import { SummaryCard } from './ui/summary-card';
import { formatCurrencyTHB, formatNumber } from '@/lib/formatters';
import type { SummaryMetrics, GrowthMetrics } from '../schemas';

// =============================================================================
// Types
// =============================================================================

export interface DashboardMetricsProps {
    /** Summary metrics data */
    summary?: SummaryMetrics;
    /** Growth metrics data */
    growth?: GrowthMetrics;
    /** Show loading state */
    loading?: boolean;
}

// =============================================================================
// Metric Configuration
// =============================================================================

interface MetricConfig {
    title: string;
    icon: typeof CreditCard;
    getValue: (summary: SummaryMetrics) => string;
    getTrend: (growth: GrowthMetrics) => number | null;
}

const metricsConfig: MetricConfig[] = [
    {
        title: 'Total Spend',
        icon: CreditCard,
        getValue: (s) => formatCurrencyTHB(s.totalCost),
        getTrend: (g) => g.costGrowth,
    },
    {
        title: 'Impressions',
        icon: Eye,
        getValue: (s) => formatNumber(s.totalImpressions),
        getTrend: (g) => g.impressionsGrowth,
    },
    {
        title: 'Clicks',
        icon: MousePointerClick,
        getValue: (s) => formatNumber(s.totalClicks),
        getTrend: (g) => g.clicksGrowth,
    },
    {
        title: 'Conversions',
        icon: Target,
        getValue: (s) => formatNumber(s.totalConversions),
        getTrend: (g) => g.conversionsGrowth,
    },
];

// =============================================================================
// Main Component
// =============================================================================

export function DashboardMetrics({
    summary,
    growth,
    loading = false,
}: DashboardMetricsProps) {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {metricsConfig.map((metric) => (
                <SummaryCard
                    key={metric.title}
                    title={metric.title}
                    icon={metric.icon}
                    value={summary ? metric.getValue(summary) : metric.getValue({
                        totalImpressions: 0,
                        totalClicks: 0,
                        totalCost: 0,
                        totalConversions: 0,
                        averageCtr: 0,
                        averageRoas: 0,
                    })}
                    trend={growth ? metric.getTrend(growth) : null}
                    trendLabel="vs last period"
                    loading={loading}
                />
            ))}
        </div>
    );
}

export default DashboardMetrics;
