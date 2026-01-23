import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface FinancialBreakdownItem {
    name: string;
    value: number;
    color: string;
}

export interface FinancialSummaryItem {
    label: string;
    value?: number;
    deltaLabel?: string;
    deltaClassName?: string;
}

export interface FinancialOverviewProps {
    className?: string;
    title?: string;
    subtitle?: string;
    roi?: number;
    roiDelta?: number;
    total?: number;
    currency?: string;
    breakdown?: FinancialBreakdownItem[];
    summary?: FinancialSummaryItem[];
}

function formatCompactCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        notation: 'compact',
        maximumFractionDigits: 2,
    }).format(value);
}

function formatCurrency(value: number, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);
}

function buildFinancialCsv(
    breakdown: FinancialBreakdownItem[],
    summary: FinancialSummaryItem[],
    roi: number,
    roiDelta: number,
    total: number
) {
    const lines: string[] = [];

    lines.push('roi,roi_delta,total');
    lines.push([roi.toFixed(2), roiDelta.toFixed(2), String(total)].join(','));
    lines.push('');

    lines.push('breakdown_name,breakdown_value');
    for (const item of breakdown) {
        lines.push([item.name, String(item.value)].join(','));
    }
    lines.push('');

    lines.push('summary_label,summary_value,summary_delta');
    for (const item of summary) {
        lines.push([item.label, item.value == null ? '' : String(item.value), item.deltaLabel ?? ''].join(','));
    }

    return lines.join('\n');
}

function downloadTextFile(filename: string, content: string, mime = 'text/plain;charset=utf-8;') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function openPrintWindow(title: string, bodyHtml: string) {
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;

    win.document.open();
    win.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      h2 { font-size: 12px; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
      .muted { color: #6b7280; font-size: 12px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: left; }
      th { color: #6b7280; font-weight: 600; }
      .right { text-align: right; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`);
    win.document.close();

    win.focus();
    setTimeout(() => {
        win.print();
    }, 150);
}

export function FinancialOverview({
    className,
    title = 'Financial Overview',
    subtitle = 'ROI',
    roi,
    roiDelta,
    total,
    currency = 'USD',
    breakdown = [],
    summary = [],
}: FinancialOverviewProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const computedTotal = total ?? (breakdown.length > 0 ? breakdown.reduce((acc, cur) => acc + cur.value, 0) : 0);

    const hasProvidedTotal = total != null || breakdown.length > 0;
    const canDownload = hasProvidedTotal && roi != null && roiDelta != null;

    const downloadCsv = () => {
        if (computedTotal == null || roi == null || roiDelta == null) return;

        downloadTextFile(
            'financial-overview.csv',
            buildFinancialCsv(breakdown, summary, roi, roiDelta, computedTotal),
            'text/csv;charset=utf-8;'
        );
    };

    const downloadPdf = () => {
        if (computedTotal == null || roi == null || roiDelta == null) return;

        const breakdownRows = breakdown
            .map(
                (b) =>
                    `<tr><td>${escapeHtml(b.name)}</td><td class="right">${escapeHtml(
                        formatCurrency(b.value, currency)
                    )}</td></tr>`
            )
            .join('');

        const summaryRows = summary
            .map(
                (s) =>
                    `<tr><td>${escapeHtml(s.label)}</td><td class="right">${escapeHtml(
                        s.value == null ? '' : formatCurrency(s.value, currency)
                    )}</td><td class="right">${escapeHtml(s.deltaLabel ?? '')}</td></tr>`
            )
            .join('');

        openPrintWindow(title, `
          <h1>${escapeHtml(title)}</h1>
          <div class="muted">${escapeHtml(subtitle)} ${escapeHtml(roi.toFixed(1))}x (+${escapeHtml(
            roiDelta.toFixed(1)
        )} vs last month)</div>
          <h2>Total</h2>
          <div class="card"><strong>${escapeHtml(formatCompactCurrency(computedTotal, currency))}</strong></div>
          <div class="grid">
            <div>
              <h2>Breakdown</h2>
              <div class="card"><table><thead><tr><th>Channel</th><th class="right">Value</th></tr></thead><tbody>${breakdownRows}</tbody></table></div>
            </div>
            <div>
              <h2>Summary</h2>
              <div class="card"><table><thead><tr><th>Metric</th><th class="right">Value</th><th class="right">Change</th></tr></thead><tbody>${summaryRows}</tbody></table></div>
            </div>
          </div>
        `);
    };

    return (
        <Card
            className={cn(
                'relative h-[400px] overflow-hidden rounded-3xl border border-border shadow-lg flex flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl',
                className
            )}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-transparent blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-emerald-500/10 via-amber-500/10 to-transparent blur-3xl"
            />
            <CardHeader className="space-y-1 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block" />
                            {title}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium pl-3.5">
                            {subtitle}{' '}
                            <span className="text-indigo-500">{(roi ?? 0).toFixed(1)}x</span>{' '}
                            {roi != null && roiDelta != null ? (
                                <span className="text-xs text-muted-foreground">
                                    (+{roiDelta.toFixed(1)} vs last month)
                                </span>
                            ) : null}
                        </CardDescription>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-xs" title="Download">
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={downloadCsv} className="gap-2" disabled={!canDownload}>
                                <FileSpreadsheet className="h-4 w-4" />
                                CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadPdf} className="gap-2" disabled={!canDownload}>
                                <FileText className="h-4 w-4" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className="flex flex-col md:flex-row items-center gap-5 w-full">
                        <div className="relative w-full max-w-[320px]">
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={breakdown}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={62}
                                            outerRadius={103}
                                            paddingAngle={2}
                                            stroke="var(--background)"
                                            strokeWidth={3}
                                            activeIndex={activeIndex ?? undefined}
                                            activeShape={(props: any) => (
                                                <Sector
                                                    {...props}
                                                    outerRadius={(props.outerRadius ?? 0) + 6}
                                                />
                                            )}
                                            onMouseLeave={() => setActiveIndex(null)}
                                        >
                                            {breakdown.map((entry, index) => (
                                                <Cell
                                                    key={entry.name}
                                                    fill={entry.color}
                                                    onMouseEnter={() => setActiveIndex(index)}
                                                    className="transition-opacity duration-200"
                                                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            position={{ x: 8, y: 8 }}
                                            formatter={(value: number | string, name: string | number) => {
                                                const label = typeof name === 'string' ? name : String(name ?? '');
                                                return [formatCurrency(Number(value), currency), label];
                                            }}
                                            contentStyle={{
                                                backgroundColor: 'var(--popover)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '0.75rem',
                                                color: 'var(--popover-foreground)',
                                            }}
                                            labelStyle={{ color: 'var(--muted-foreground)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
                                <p className="text-[10px] uppercase text-muted-foreground tracking-wide">TOTAL</p>
                                <p className="text-3xl font-semibold text-foreground leading-tight whitespace-nowrap">
                                    {formatCompactCurrency(computedTotal, currency)}
                                </p>
                            </div>
                        </div>

                        <div className="w-full md:flex-1 space-y-2 text-sm">
                            {breakdown.map((item, index) => (
                                <div
                                    key={item.name}
                                    className={cn(
                                        'rounded-2xl px-4 py-3 flex items-center justify-between border border-border bg-muted/20 transition-all duration-300',
                                        activeIndex === index && 'bg-muted/35 shadow-sm'
                                    )}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className="h-4 w-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="font-semibold text-foreground truncate">{item.name}</span>
                                    </div>
                                    <span className="font-semibold text-foreground whitespace-nowrap">
                                        {formatCurrency(item.value, currency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 text-center border-t border-dashed border-border">
                    {summary.map((item) => (
                        <div key={item.label} className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {item.label}
                            </p>
                            <p className="text-lg font-bold text-foreground tracking-tight">
                                {formatCurrency(item.value ?? 0, currency)}
                            </p>
                            {item.deltaLabel ? (
                                <p className={cn('text-xs font-medium', item.deltaClassName)}>{item.deltaLabel}</p>
                            ) : (
                                <p className="text-xs font-medium text-muted-foreground">0%</p>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default FinancialOverview;
