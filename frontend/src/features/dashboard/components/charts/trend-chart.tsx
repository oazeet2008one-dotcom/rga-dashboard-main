// src/features/dashboard/components/charts/trend-chart.tsx
// =============================================================================
// TrendChart Component - Performance Trends Visualization
// =============================================================================

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
import { Button } from '@/components/ui/button';
import { formatCurrencyTHB, formatCompactNumber } from '@/lib/formatters';
import type { TrendDataPoint, PeriodEnum } from '../../schemas';
import { DashboardDateFilter } from '../../components/dashboard-date-filter';

// =============================================================================
// Types & Constants
// =============================================================================

type MetricKey = 'cost' | 'impressions' | 'clicks' | 'conversions';

interface MetricConfig {
    label: string;
    color: string;
    gradientId: string;
    formatValue: (value: number) => string;
}

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
    cost: {
        label: 'Cost',
        color: '#10b981', // Emerald-500
        gradientId: 'gradientCost',
        formatValue: formatCurrencyTHB,
    },
    impressions: {
        label: 'Impressions',
        color: '#3b82f6', // Blue-500
        gradientId: 'gradientImpressions',
        formatValue: formatCompactNumber,
    },
    clicks: {
        label: 'Clicks',
        color: '#f59e0b', // Amber-500
        gradientId: 'gradientClicks',
        formatValue: formatCompactNumber,
    },
    conversions: {
        label: 'Conversions',
        color: '#8b5cf6', // Violet-500
        gradientId: 'gradientConversions',
        formatValue: formatCompactNumber,
    },
};

// =============================================================================
// Props Interface
// =============================================================================

interface TrendChartProps {
    /** Array of trend data points */
    data: TrendDataPoint[];
    /** Optional class name */
    className?: string;

    // Date Filter Props
    period: PeriodEnum;
    onPeriodChange: (value: any) => void;
    customRange: { from: Date; to: Date } | undefined;
    onCustomRangeChange: (range: { from: Date; to: Date } | undefined) => void;
}

// =============================================================================
// Empty State Component
// =============================================================================

function EmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">No data available for the selected period</p>
        </div>
    );
}

// =============================================================================
// Custom Tooltip Component
// =============================================================================

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        dataKey: string;
        payload: TrendDataPoint;
        color: string;
    }>;
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
                    // Find the payload item for this metric
                    const item = payload.find(p => p.dataKey === metricKey);
                    if (!item) return null;

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
                                {config.formatValue(item.value)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function TrendChart({
    data,
    className,
    period,
    onPeriodChange,
    customRange,
    onCustomRangeChange
}: TrendChartProps) {
    const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(['cost', 'impressions', 'clicks']);

    // Toggle metric selection
    const toggleMetric = (metric: MetricKey) => {
        setActiveMetrics((prev) => {
            // If already active, remove it (but prevent removing the last one)
            if (prev.includes(metric)) {
                if (prev.length === 1) return prev; // Keep at least one active
                return prev.filter((m) => m !== metric);
            }
            // Otherwise add it
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

    return (
        <Card className={`h-[400px] flex flex-col ${className ?? ''}`}>
            <CardHeader className="flex flex-col gap-4 space-y-0 pb-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                    <CardTitle className="text-base font-semibold">
                        Performance Trends
                    </CardTitle>
                    <DashboardDateFilter
                        value={period}
                        onValueChange={onPeriodChange}
                        customRange={customRange}
                        onCustomRangeChange={onCustomRangeChange}
                    />
                </div>

                {/* Metric Toggles */}
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
                        const config = METRIC_CONFIG[key];
                        const isActive = activeMetrics.includes(key);
                        return (
                            <button
                                key={key}
                                onClick={() => toggleMetric(key)}
                                className={`
                                    flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 border
                                    ${isActive
                                        ? 'bg-primary/10 border-primary/20 text-foreground shadow-sm'
                                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                `}
                                style={isActive ? {
                                    borderColor: config.color,
                                    backgroundColor: `${config.color}15`, // 15 = roughly 8% opacity hex
                                    color: config.color
                                } : undefined}
                            >
                                <div
                                    className={`h-2 w-2 rounded-full transition-all ${isActive ? 'opacity-100' : 'opacity-40 grayscale'}`}
                                    style={{ backgroundColor: config.color }}
                                />
                                {config.label}
                            </button>
                        );
                    })}
                </div>
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
                                tick={false}
                                tickLine={false}
                                axisLine={false}
                                width={45}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                content={<CustomTooltip activeMetrics={activeMetrics} />}
                                cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
                                // Only render if active
                                if (!activeMetrics.includes(key)) return null;
                                const config = METRIC_CONFIG[key];
                                return (
                                    <Area
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
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
        </Card>
    );
}

export default TrendChart;
