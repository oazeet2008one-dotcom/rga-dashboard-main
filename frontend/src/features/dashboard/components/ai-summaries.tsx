import type { GrowthMetrics, SummaryMetrics } from '../schemas';
import { formatCurrencyTHBDecimal } from '@/lib/formatters';

type ItemKey = 'cpm' | 'ctr' | 'roas' | 'roi';

type SummaryItem = {
    key: ItemKey;
    label: string;
    value: string;
    delta: number | null | undefined;
    accentClassName: string;
};

function formatDelta(value: number | null | undefined) {
    if (value == null) return undefined;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

function deltaBadgeClassName(value: number | null | undefined) {
    if (value == null) return 'bg-slate-500/10 text-slate-500';
    return value >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
}

// formatCurrencyTHBDecimal now imported from @/lib/formatters

export interface AiSummariesProps {
    summary?: SummaryMetrics;
    growth?: GrowthMetrics;
}

export function AiSummaries({ summary, growth }: AiSummariesProps) {
    const items: SummaryItem[] = [
        {
            key: 'cpm',
            label: 'CPM',
            value: summary ? formatCurrencyTHBDecimal(summary.averageCpm) : formatCurrencyTHBDecimal(0),
            delta: growth?.cpmGrowth,
            accentClassName: 'group-hover:text-blue-500',
        },
        {
            key: 'ctr',
            label: 'CTR',
            value: summary ? `${summary.averageCtr.toFixed(1)}%` : '0.0%',
            delta: growth?.ctrGrowth,
            accentClassName: 'group-hover:text-emerald-500',
        },
        {
            key: 'roas',
            label: 'ROAS',
            value: summary ? `${summary.averageRoas.toFixed(1)}` : '0.0',
            delta: growth?.roasGrowth,
            accentClassName: 'group-hover:text-purple-500',
        },
        {
            key: 'roi',
            label: 'ROI',
            value: summary ? `${summary.averageRoi.toFixed(0)}%` : '0%',
            delta: growth?.roiGrowth,
            accentClassName: 'group-hover:text-orange-500',
        },
    ];

    return (
        <div className="rounded-3xl border border-border bg-card p-4 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-semibold tracking-tight">AI Summaries</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Core metrics efficiency</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {items.map((item) => (
                    <div
                        key={item.key}
                        className="rounded-xl p-3 border border-border bg-card shadow-sm hover:border-muted-foreground/30 transition-all duration-300 hover:shadow-md cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p
                                className={`text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors ${item.accentClassName}`}
                            >
                                {item.label}
                            </p>
                            <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${deltaBadgeClassName(item.delta)}`}
                            >
                                {formatDelta(item.delta) ?? '—'}
                            </span>
                        </div>
                        <p className="text-lg font-bold tracking-tight leading-none mb-1">{item.value}</p>
                        <p className="text-[11px] text-muted-foreground">From last period</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default AiSummaries;
