// src/features/dashboard/components/dashboard-metrics.tsx
// =============================================================================
// Dashboard Metrics Grid - 4 Summary Cards in Responsive Grid
// =============================================================================

import { CreditCard, Eye, MousePointerClick, Target } from 'lucide-react';
import { useLocation } from 'wouter';
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
    getRawValue: (summary: SummaryMetrics) => number;
    getValue: (summary: SummaryMetrics) => string;
    getTrend: (growth: GrowthMetrics) => number | null;
    accentColor: 'indigo' | 'violet' | 'cyan' | 'amber';
}

const metricsConfig: MetricConfig[] = [
    {
        title: 'Total Spend',
        icon: CreditCard,
        getRawValue: (s) => s.totalCost,
        getValue: (s) => formatCurrencyTHB(s.totalCost),
        getTrend: (g) => g.costGrowth,
        accentColor: 'indigo',
    },
    {
        title: 'Impressions',
        icon: Eye,
        getRawValue: (s) => s.totalImpressions,
        getValue: (s) => formatNumber(s.totalImpressions),
        getTrend: (g) => g.impressionsGrowth,
        accentColor: 'violet',
    },
    {
        title: 'Clicks',
        icon: MousePointerClick,
        getRawValue: (s) => s.totalClicks,
        getValue: (s) => formatNumber(s.totalClicks),
        getTrend: (g) => g.clicksGrowth,
        accentColor: 'cyan',
    },
    {
        title: 'Conversions',
        icon: Target,
        getRawValue: (s) => s.totalConversions,
        getValue: (s) => formatNumber(s.totalConversions),
        getTrend: (g) => g.conversionsGrowth,
        accentColor: 'amber',
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
    const [, setLocation] = useLocation();

    const isOverviewAllZero = Boolean(
        summary &&
        summary.totalCost === 0 &&
        summary.totalImpressions === 0 &&
        summary.totalClicks === 0 &&
        summary.totalConversions === 0
    );

    const handleMetricClick = (metric: MetricConfig) => {
        if (loading) return;
        if (!summary) return;

        if (isOverviewAllZero) {
            setLocation('/ecommerce-insights#pricing');
            return;
        }

        const rawValue = metric.getRawValue(summary);
        if (rawValue === 0) {
            setLocation('/ecommerce-insights#pricing');
        }
    };

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {metricsConfig.map((metric) => (
                <SummaryCard
                    key={metric.title}
                    title={metric.title}
                    icon={metric.icon}
                    accentColor={metric.accentColor as any}
                    value={summary ? metric.getValue(summary) : metric.getValue({
                        totalImpressions: 0,
                        totalClicks: 0,
                        totalCost: 0,
                        totalConversions: 0,
                        averageCtr: 0,
                        averageRoas: 0,
                        averageCpm: 0,
                        averageRoi: 0,
                    })}
                    trend={growth ? metric.getTrend(growth) : null}
                    trendLabel="vs last period"
                    loading={loading}
                    onClick={() => handleMetricClick(metric)}
                />
            ))}
        </div>
    );
}

export default DashboardMetrics;
