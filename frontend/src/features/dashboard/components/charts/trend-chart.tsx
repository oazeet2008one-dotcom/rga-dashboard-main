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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrencyTHB, formatCompactNumber } from '@/lib/formatters';
import { DashboardDateFilter } from '../dashboard-date-filter';
import type { TrendDataPoint } from '../../schemas';
import type { PeriodEnum } from '../../schemas';

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
    /** Selected period for dashboard data */
    period: PeriodEnum;
    /** Callback when period changes */
    onPeriodChange: (value: PeriodEnum) => void;
    /** Optional class name */
    className?: string;
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
    }>;
    label?: string;
    activeMetric: MetricKey;
}

function CustomTooltip({ active, payload, activeMetric }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const data = payload[0];
    const config = METRIC_CONFIG[activeMetric];
    const formattedDate = format(new Date(data.payload.date), 'dd MMM yyyy');

    return (
        <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
            <p className="text-xs text-muted-foreground mb-1">{formattedDate}</p>
            <div className="flex items-center gap-2">
                <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: config.color }}
                />
                <span className="text-sm font-medium">
                    {config.label}: {config.formatValue(data.value)}
                </span>
            </div>
        </div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function TrendChart({ data, period, onPeriodChange, className }: TrendChartProps) {
    const [activeMetric, setActiveMetric] = useState<MetricKey>('cost');

    const config = METRIC_CONFIG[activeMetric];

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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-4">
                    <CardTitle className="text-base font-semibold">
                        Performance Trends
                    </CardTitle>
                    <DashboardDateFilter
                        value={period}
                        onValueChange={onPeriodChange}
                    />
                </div>
                <Tabs
                    value={activeMetric}
                    onValueChange={(v) => setActiveMetric(v as MetricKey)}
                >
                    <TabsList>
                        <TabsTrigger value="cost" className="text-xs">
                            Cost
                        </TabsTrigger>
                        <TabsTrigger value="impressions" className="text-xs">
                            Impressions
                        </TabsTrigger>
                        <TabsTrigger value="clicks" className="text-xs">
                            Clicks
                        </TabsTrigger>
                        <TabsTrigger value="conversions" className="text-xs">
                            Conversions
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 pb-4">
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
                                className="stroke-muted"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatXAxis}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                tickFormatter={(v) => formatCompactNumber(v)}
                                tick={{ fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                content={<CustomTooltip activeMetric={activeMetric} />}
                                cursor={{ stroke: config.color, strokeWidth: 1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey={activeMetric}
                                stroke={config.color}
                                strokeWidth={2}
                                fill={`url(#${config.gradientId})`}
                                animationDuration={300}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}

export default TrendChart;
