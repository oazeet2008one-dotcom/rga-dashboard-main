import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompactNumber } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { SeoService } from "../api";
import { DashboardDateFilter } from "@/features/dashboard/components/dashboard-date-filter";

type PeriodEnum = '7d' | '30d' | 'this_month' | 'last_month' | 'custom';
type MetricKey =
    | 'organicTraffic'
    | 'paidTraffic'
    | 'impressions'
    | 'paidTrafficCost'
    | 'avgPosition'
    | 'referringDomains'
    | 'dr'
    | 'ur'
    | 'organicTrafficValue'
    | 'organicPages'
    | 'crawledPages';

interface MetricConfig {
    label: string;
    color: string;
    gradientId: string;
    formatValue: (value: number) => string;
    isCurrency?: boolean;
    isComingSoon?: boolean; // Flag for disabled metrics
}

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
    organicTraffic: {
        label: 'Organic Traffic',
        color: '#f97316', // Orange-500
        gradientId: 'gradientTraffic',
        formatValue: formatCompactNumber,
    },
    paidTraffic: {
        label: 'Paid Traffic',
        color: '#10b981', // Emerald-500
        gradientId: 'gradientPaidTraffic',
        formatValue: formatCompactNumber,
    },
    impressions: {
        label: 'Impressions',
        color: '#8b5cf6', // Violet-500
        gradientId: 'gradientImpressions',
        formatValue: formatCompactNumber,
    },
    paidTrafficCost: {
        label: 'Paid Traffic Cost',
        color: '#ef4444', // Red-500
        gradientId: 'gradientCost',
        formatValue: (v) => `฿${formatCompactNumber(v)}`,
        isCurrency: true
    },
    avgPosition: {
        label: 'Position',
        color: '#f59e0b', // Amber-500
        gradientId: 'gradientAvgPosition',
        formatValue: (v) => v.toFixed(1)
    },
    // Additional SEO Metrics
    referringDomains: {
        label: 'Referring Domains',
        color: '#3b82f6', // Blue-500
        gradientId: 'gradientRefDomains',
        formatValue: formatCompactNumber,
    },
    dr: { label: 'Domain Rating', color: '#64748b', gradientId: 'gDr', formatValue: (v) => v.toString() },
    ur: { label: 'URL Rating', color: '#64748b', gradientId: 'gUr', formatValue: (v) => v.toString() },
    organicTrafficValue: { label: 'Organic Traffic Value', color: '#f97316', gradientId: 'gOtv', formatValue: (v) => `฿${formatCompactNumber(v)}` },
    organicPages: { label: 'Organic Pages', color: '#10b981', gradientId: 'gOp', formatValue: formatCompactNumber, isComingSoon: true },
    crawledPages: { label: 'Crawled Pages', color: '#8b5cf6', gradientId: 'gCp', formatValue: formatCompactNumber, isComingSoon: true },
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    activeMetrics: MetricKey[];
}

function CustomTooltip({ active, payload, activeMetrics }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const data = payload[0];
    const formattedDate = format(new Date(data.payload.date), 'dd MMM yyyy');

    return (
        <div className="rounded-xl border bg-popover/95 backdrop-blur-sm px-4 py-3 shadow-xl">
            <p className="text-xs font-semibold text-muted-foreground mb-2 pb-2 border-b">{formattedDate}</p>
            <div className="flex flex-col gap-1.5">
                {activeMetrics.map(metricKey => {
                    const config = METRIC_CONFIG[metricKey];
                    // Skip if metric is placeholder/coming soon and not in payload
                    if (config.isComingSoon || data.payload[metricKey] === undefined) return null;

                    const item = payload.find((p: any) => p.dataKey === metricKey);
                    const value = item ? item.value : 0;

                    return (
                        <div key={metricKey} className="flex items-center justify-between gap-6 min-w-[140px]">
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-2 w-2 rounded-full ring-2 ring-transparent"
                                    style={{ backgroundColor: config.color }}
                                />
                                <span className="text-sm text-foreground/80">{config.label}</span>
                            </div>
                            <span className="text-sm font-bold font-mono">
                                {config.formatValue(value)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">No data available for the selected period</p>
        </div>
    );
}

export function SeoPerformanceChart() {
    const [period, setPeriod] = useState<PeriodEnum>('7d');
    const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
    const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(['organicTraffic', 'avgPosition']);

    // Helper to calculate days for API based on period
    const getDaysFromPeriod = (p: PeriodEnum, custom?: { from: Date; to: Date }): number => {
        if (p === '7d') return 7;
        if (p === '30d') return 30;
        if (p === 'this_month') {
            const now = new Date();
            return now.getDate(); // Days so far this month
        }
        if (p === 'last_month') return 30; // Approximation for now
        if (p === 'custom' && custom) {
            const diffTime = Math.abs(custom.to.getTime() - custom.from.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 30;
    };

    const days = getDaysFromPeriod(period, customRange);

    const { data, isLoading } = useQuery({
        queryKey: ['seo-history', days],
        queryFn: () => SeoService.getHistory(days)
    });

    const toggleMetric = (metric: MetricKey) => {
        const config = METRIC_CONFIG[metric];
        if (config.isComingSoon) return;

        setActiveMetrics((prev) => {
            if (prev.includes(metric)) {
                if (prev.length === 1) return prev; // Keep at least one active
                return prev.filter((m) => m !== metric);
            }
            return [...prev, metric];
        });
    };

    // Format XAxis tick
    const formatXAxis = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd MMM');
        } catch {
            return dateStr;
        }
    };

    // Memoize gradient definitions
    const gradientDefs = useMemo(
        () => (
            <defs>
                {Object.entries(METRIC_CONFIG).map(([key, cfg]) => (
                    <linearGradient
                        key={key}
                        id={cfg.gradientId}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop offset="5%" stopColor={cfg.color} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                    </linearGradient>
                ))}
            </defs>
        ),
        []
    );

    const hasData = data && data.length > 0;

    if (isLoading) {
        return <Card className="h-[400px] animate-pulse bg-white/50" />;
    }

    return (
        <Card className="h-[400px] flex flex-col shadow-sm">
            <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                    <CardTitle className="text-base font-semibold">
                        Performance Trends
                    </CardTitle>
                </div>
                <DashboardDateFilter
                    value={period}
                    onValueChange={(val) => setPeriod(val)}
                    customRange={customRange}
                    onCustomRangeChange={(range) => setCustomRange(range)}
                />
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-4 pt-2">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            {gradientDefs}
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted/30"
                                vertical={false}
                                stroke="#ccc" // fallback
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatXAxis}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                                dy={10}
                            />
                            <YAxis
                                tickFormatter={(v) => formatCompactNumber(v)}
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                                width={45}
                                orientation="right"
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                content={<CustomTooltip activeMetrics={activeMetrics} />}
                                cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />

                            {activeMetrics.map(metric => {
                                const config = METRIC_CONFIG[metric];
                                return (
                                    <Area
                                        key={metric}
                                        type="monotone"
                                        dataKey={metric}
                                        stroke={config.color}
                                        strokeWidth={2}
                                        fill={`url(#${config.gradientId})`}
                                        animationDuration={500}
                                        activeDot={{ r: 4, strokeWidth: 0 }}
                                    />
                                );
                            })}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
            {/* Metric Toggles - Responsive Grid */}
            <div className="px-6 pb-6 pt-2">
                <div className="flex flex-wrap gap-2 max-w-full">
                    {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
                        const config = METRIC_CONFIG[key];
                        const isActive = activeMetrics.includes(key);
                        const isComingSoon = config.isComingSoon;

                        return (
                            <button
                                key={key}
                                onClick={() => toggleMetric(key)}
                                disabled={isComingSoon}
                                className={`
                                    flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border whitespace-nowrap
                                    ${isActive
                                        ? 'bg-primary/10 border-primary/20 text-foreground shadow-sm'
                                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                    ${isComingSoon ? 'opacity-40 cursor-not-allowed bg-muted/20' : ''}
                                `}
                                style={isActive ? {
                                    borderColor: config.color,
                                    backgroundColor: `${config.color}15`,
                                    color: config.color
                                } : undefined}
                            >
                                <div
                                    className={`h-2 w-2 rounded-full transition-all ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}
                                    style={{ backgroundColor: config.color }}
                                />
                                {config.label} {isComingSoon && '(Soon)'}
                            </button>
                        );
                    })}
                </div>
            </div>
            {/* Legend (Optional: Can remove if toggles are sufficient, keeping for clarity on what's shown below chart if desired, but toggles act as legend now) */}
        </Card>
    );
}
