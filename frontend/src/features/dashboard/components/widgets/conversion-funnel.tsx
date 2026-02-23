import { useRef } from 'react';
import { Download, HelpCircle, Eye, MousePointer2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogo } from '@/components/ui/brand-logo';
import { cn } from '@/lib/utils';
import { formatCompactNumber, formatNumber } from '@/lib/formatters';
import { downloadCsv } from '@/lib/download-utils';
import { ExportDropdown } from '@/components/ui/export-dropdown';

export interface FunnelStage {
    label: string;
    value: number;
    barClassName: string;
    dotClassName: string;
}

export interface PlatformFunnelStage {
    id?: string;
    platform: string;
    impressions: number;
    clicks: number;
    conversions: number;
    color: string;
}

export interface ConversionFunnelProps {
    stages?: FunnelStage[];
    platformStages?: PlatformFunnelStage[];
    className?: string;
    title?: string;
    description?: string;
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function buildFunnelCsv(stages: FunnelStage[]) {
    const max = Math.max(1, ...stages.map((s) => s.value));
    const rows = stages.map((s) => {
        const pct = (s.value / max) * 100;
        return [s.label, String(s.value), pct.toFixed(2)].join(',');
    });

    return ['stage,value,percentage', ...rows].join('\n');
}

export function ConversionFunnel({
    stages = [],
    platformStages = [],
    className,
    title = 'Conversion Funnel',
    description = 'User journey effectiveness',
}: ConversionFunnelProps) {
    const displayStages = stages;
    const hasData = displayStages.length > 0;
    const hasPlatformData = platformStages.length > 0;
    const max = Math.max(1, ...displayStages.map((s) => s.value));

    const cardRef = useRef<HTMLDivElement>(null);

    const handleExportCsv = () => {
        downloadCsv(
            'conversion-funnel.csv',
            buildFunnelCsv(displayStages)
        );
    };

    return (
        <Card ref={cardRef} className={cn('h-auto rounded-3xl border border-border shadow-lg', className)}>
            <CardHeader className="space-y-1 pb-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>

                    <ExportDropdown
                        filename="conversion-funnel"
                        targetElement={cardRef.current}
                        onExportCsv={hasData ? handleExportCsv : undefined}
                        disabled={!hasData}
                    />
                </div>
            </CardHeader>

            {hasData ? (
                <CardContent className="space-y-6">
                    {/* Main Funnel Visualization */}
                    <div className="space-y-4 pt-2">
                        {displayStages.map((stage, index) => {
                            const widthPct = clamp((stage.value / max) * 100, 0, 100);
                            const nextStage = displayStages[index + 1];
                            const conversionRate = nextStage && stage.value > 0
                                ? ((nextStage.value / stage.value) * 100).toFixed(1)
                                : null;

                            return (
                                <div key={stage.label}>
                                    <div className="group flex items-center justify-between gap-4">
                                        <div
                                            className={cn(
                                                'relative h-10 overflow-hidden rounded-full shadow-sm transition-all duration-700 ease-out group-hover:shadow-lg group-hover:scale-[1.01] brightness-105',
                                                stage.barClassName
                                            )}
                                            style={{ width: `${widthPct}%`, minWidth: '40px' }}
                                        >
                                            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] mix-blend-overlay" />
                                        </div>

                                        <div className="flex flex-col items-end min-w-[100px] text-right">
                                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stage.label}</span>
                                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                                <span className="md:hidden">{formatCompactNumber(stage.value)}</span>
                                                <span className="hidden md:inline">{formatNumber(stage.value)}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Conversion rate connector */}
                                    {conversionRate && (
                                        <div className="relative h-8 ml-8 my-1 flex items-center">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                                                <span>↓</span>
                                                <span className="font-medium">{conversionRate}% conversion</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {hasPlatformData && (
                        <div className="pt-6 border-t border-border/40">
                            <h4 className="text-sm font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                                Platform Performance
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium border border-slate-200">Breakdown</span>
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-1 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                                {platformStages?.map((platform) => (
                                    <div
                                        key={platform.platform}
                                        className="group relative overflow-hidden flex flex-wrap items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <div className="flex items-center gap-3 min-w-[130px] relative z-10">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm group-hover:scale-105 transition-transform">
                                                <BrandLogo platformId={platform.id || platform.platform} className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-bold text-slate-800 block">{platform.platform}</span>
                                                <div className="h-1 w-12 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${clamp((platform.conversions / max) * 100 * 2, 10, 100)}%`,
                                                            backgroundColor: platform.color || '#94a3b8'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-1 items-center justify-end gap-x-8 gap-y-2 flex-wrap text-sm relative z-10">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 mb-0.5 text-slate-400">
                                                    <Eye className="h-3 w-3" />
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider">Impr.</span>
                                                </div>
                                                <span className="font-semibold text-slate-600 tabular-nums">
                                                    <span className="md:hidden">{formatCompactNumber(platform.impressions)}</span>
                                                    <span className="hidden md:inline">{formatNumber(platform.impressions)}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 mb-0.5 text-slate-400">
                                                    <MousePointer2 className="h-3 w-3" />
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider">Clicks</span>
                                                </div>
                                                <span className="font-semibold text-slate-600 tabular-nums">
                                                    <span className="md:hidden">{formatCompactNumber(platform.clicks)}</span>
                                                    <span className="hidden md:inline">{formatNumber(platform.clicks)}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end min-w-[70px]">
                                                <div className="flex items-center gap-1 mb-0.5 text-indigo-400">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Conv.</span>
                                                </div>
                                                <span className="text-base font-bold tabular-nums text-slate-800">
                                                    <span className="md:hidden">{formatCompactNumber(platform.conversions)}</span>
                                                    <span className="hidden md:inline">{formatNumber(platform.conversions)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            ) : (
                <CardContent className="flex h-[280px] items-center justify-center">
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">No funnel data yet</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Connect a data source to start seeing funnel metrics.
                        </p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

export default ConversionFunnel;
