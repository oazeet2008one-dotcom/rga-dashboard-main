// src/features/dashboard/pages/dashboard-page.tsx
// =============================================================================
// Dashboard Page - Main Entry Point
// Uses standardized DashboardLayout with Shadcn Sidebar
// =============================================================================

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { IntegrationChecklist } from '@/components/IntegrationChecklist';
import { DashboardMetrics } from '../components/dashboard-metrics';
import { AiSummaries } from '../components/ai-summaries';
import { DashboardDateFilter } from '../components/dashboard-date-filter';
import { TrendChart } from '../components/charts/trend-chart';
import { RecentCampaigns } from '../components/widgets/recent-campaigns';
import { ConversionFunnel } from '../components/widgets/conversion-funnel';
import { FinancialOverview } from '../components/widgets/financial-overview';
import { useDashboardOverview } from '../hooks/use-dashboard';
import type { AdPlatform, PeriodEnum, RecentCampaign } from '../schemas';

// =============================================================================
// Error State Component
// =============================================================================

interface ErrorStateProps {
    error: Error;
    onRetry?: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to load dashboard data</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                <span>{error.message || 'An unexpected error occurred. Please try again.'}</span>
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        Retry
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}

function formatPercentDelta(value: number | null | undefined) {
    if (value == null) return undefined;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

function deltaClassName(value: number | null | undefined) {
    if (value == null) return undefined;
    return value >= 0 ? 'text-emerald-500/70' : 'text-rose-400/70';
}

function combineGrowth(a: number | null | undefined, b: number | null | undefined): number | null {
    if (a == null || b == null) return null;
    return ((1 + a / 100) * (1 + b / 100) - 1) * 100;
}

const PLATFORM_LABELS: Partial<Record<AdPlatform, string>> = {
    GOOGLE_ADS: 'GOOGLE ADS',
    FACEBOOK: 'FACEBOOK',
    INSTAGRAM: 'INSTAGRAM',
    TIKTOK: 'TIKTOK',
    LINE_ADS: 'LINE',
    // GA4 removed - not an advertising platform
};

const PLATFORM_COLORS: Partial<Record<AdPlatform, string>> = {
    GOOGLE_ADS: '#94a3b8',
    FACEBOOK: '#1877F2',
    INSTAGRAM: '#DD2A7B',
    TIKTOK: '#111827',
    LINE_ADS: '#06C755',
    // GA4 removed - not an advertising platform
};

// Only advertising platforms (exclude GA4 - web analytics)
const PLATFORM_ORDER: AdPlatform[] = [
    'GOOGLE_ADS',
    'FACEBOOK',
    'INSTAGRAM',
    'TIKTOK',
    'LINE_ADS',
];

function buildPlatformBreakdown(campaigns: RecentCampaign[] | undefined) {
    const sums = new Map<AdPlatform, number>();
    for (const key of PLATFORM_ORDER) sums.set(key, 0);

    for (const c of campaigns ?? []) {
        // Skip GA4 - it's web analytics, not an ad platform
        if (c.platform === 'GOOGLE_ANALYTICS') continue;

        const prev = sums.get(c.platform) ?? 0;
        sums.set(c.platform, prev + (c.spending ?? 0));
    }

    return PLATFORM_ORDER.map((platform) => ({
        name: PLATFORM_LABELS[platform] ?? platform,
        value: sums.get(platform) ?? 0,
        color: PLATFORM_COLORS[platform] ?? '#94a3b8',
    }));
}

function buildPlatformFunnelStages(campaigns: RecentCampaign[] | undefined) {
    const platformData = new Map<AdPlatform, {
        impressions: number;
        clicks: number;
        conversions: number;
    }>();

    // Initialize
    for (const platform of PLATFORM_ORDER) {
        platformData.set(platform, { impressions: 0, clicks: 0, conversions: 0 });
    }

    // Aggregate by platform
    for (const campaign of campaigns ?? []) {
        if (campaign.platform === 'GOOGLE_ANALYTICS') continue;

        const current = platformData.get(campaign.platform);
        if (current) {
            current.impressions += campaign.impressions;
            current.clicks += campaign.clicks;
            current.conversions += campaign.conversions;
        }
    }

    // Convert to funnel stages
    return PLATFORM_ORDER.map((platform) => {
        const data = platformData.get(platform)!;
        return {
            platform: PLATFORM_LABELS[platform] ?? platform,
            impressions: data.impressions,
            clicks: data.clicks,
            conversions: data.conversions,
            color: PLATFORM_COLORS[platform] ?? '#94a3b8',
        };
    }).filter(p => p.impressions > 0);
}

// =============================================================================
// Main Page Component
// =============================================================================

export function DashboardPage() {
    // Period state for date filtering
    const [period, setPeriod] = useState<PeriodEnum>('30d');
    const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();

    // Fetch dashboard data with selected period or custom range
    const { data, isLoading, error, refetch } = useDashboardOverview({
        period,
        startDate: customRange?.from ? format(customRange.from, 'yyyy-MM-dd') : undefined,
        endDate: customRange?.to ? format(customRange.to, 'yyyy-MM-dd') : undefined,
    });

    const financialBreakdown = useMemo(
        () => buildPlatformBreakdown(data?.recentCampaigns),
        [data?.recentCampaigns]
    );

    // Calculate platform funnel stages from campaigns
    const platformFunnelStages = useMemo(
        () => buildPlatformFunnelStages(data?.recentCampaigns),
        [data?.recentCampaigns]
    );

    // Calculate funnel stages from data
    const funnelStages = useMemo(() => {
        if (!data) return [];

        const impressions = data.summary.totalImpressions;
        const clicks = data.summary.totalClicks;
        const conversions = data.summary.totalConversions;

        return [
            {
                label: 'Impressions',
                value: impressions,
                barClassName: 'bg-gradient-to-r from-blue-400 to-blue-500',
                dotClassName: 'bg-blue-500',
            },
            {
                label: 'Clicks',
                value: clicks,
                barClassName: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
                dotClassName: 'bg-emerald-500',
            },
            {
                label: 'Conversions',
                value: conversions,
                barClassName: 'bg-gradient-to-r from-violet-400 to-violet-500',
                dotClassName: 'bg-violet-500',
            },
        ];
    }, [data]);

    const totalCost = data?.summary.totalCost ?? 0;
    const roas = data?.summary.averageRoas ?? 0;
    const estimatedRevenue = totalCost * roas;
    const estimatedProfit = estimatedRevenue - totalCost;

    return (
        <DashboardLayout>
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {/* Page Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                        <p className="text-muted-foreground">
                            Monitor your advertising performance across all platforms.
                        </p>
                    </div>
                </div>

                <section id="integration-checklist">
                    <h3 className="sr-only">Integration Checklist</h3>
                    <IntegrationChecklist />
                </section>

                {/* Error State */}
                {error && <ErrorState error={error} onRetry={refetch} />}

                {/* Metrics Grid */}
                <section>
                    <h3 className="sr-only">Key Performance Metrics</h3>
                    <DashboardMetrics
                        summary={data?.summary}
                        growth={data?.growth}
                        loading={isLoading}
                    />
                </section>

                {/* AI Summaries */}
                <section>
                    <h3 className="sr-only">AI Summaries</h3>
                    {isLoading ? (
                        <Skeleton className="h-[160px] w-full rounded-3xl" />
                    ) : (
                        <AiSummaries summary={data?.summary} growth={data?.growth} />
                    )}
                </section>

                {/* Charts & Campaigns Grid - Responsive Layout */}
                <section id="performance-trends">
                    <h3 className="sr-only">Performance Trends & Recent Campaigns</h3>
                    <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                        {/* Trend Chart - 4/7 on desktop */}
                        <div className="col-span-1 lg:col-span-4">
                            {isLoading ? (
                                <Skeleton className="h-[400px] w-full rounded-lg" />
                            ) : (
                                <TrendChart
                                    data={data?.trends ?? []}
                                    period={period}
                                    onPeriodChange={setPeriod}
                                    customRange={customRange}
                                    onCustomRangeChange={setCustomRange}
                                />
                            )}
                        </div>

                        {/* Recent Campaigns - 3/7 on desktop */}
                        <div className="col-span-1 lg:col-span-3">
                            {isLoading ? (
                                <Skeleton className="h-[400px] w-full rounded-lg" />
                            ) : (
                                <RecentCampaigns campaigns={data?.recentCampaigns ?? []} />
                            )}
                        </div>
                    </div>
                </section>

                {/* Financial Overview & Conversion Funnel */}
                <section id="conversion-funnel">
                    <h3 className="sr-only">Financial Overview & Conversion Funnel</h3>
                    <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
                        {isLoading ? (
                            <Skeleton className="h-[400px] w-full rounded-3xl" />
                        ) : (
                            <FinancialOverview
                                subtitle="ROAS"
                                roi={data?.summary.averageRoas ?? 0}
                                total={totalCost}
                                currency="THB"
                                breakdown={financialBreakdown}
                                summary={[
                                    {
                                        label: 'Revenue',
                                        value: estimatedRevenue,
                                        deltaLabel: formatPercentDelta(combineGrowth(data?.growth.costGrowth, data?.growth.roasGrowth)),
                                        deltaClassName: deltaClassName(combineGrowth(data?.growth.costGrowth, data?.growth.roasGrowth)),
                                    },
                                    {
                                        label: 'Profit',
                                        value: estimatedProfit,
                                        deltaLabel: formatPercentDelta(combineGrowth(data?.growth.costGrowth, data?.growth.roiGrowth)),
                                        deltaClassName: deltaClassName(combineGrowth(data?.growth.costGrowth, data?.growth.roiGrowth)),
                                    },
                                    {
                                        label: 'Cost',
                                        value: totalCost,
                                        deltaLabel: formatPercentDelta(data?.growth.costGrowth),
                                        deltaClassName: deltaClassName(data?.growth.costGrowth),
                                    },
                                ]}
                            />
                        )}

                        {isLoading ? (
                            <Skeleton className="h-[400px] w-full rounded-3xl" />
                        ) : (
                            <ConversionFunnel stages={funnelStages} platformStages={platformFunnelStages} />
                        )}
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}

export default DashboardPage;
