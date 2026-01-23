import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface FunnelStage {
    label: string;
    value: number;
    barClassName: string;
    dotClassName: string;
}

export interface ConversionFunnelProps {
    stages?: FunnelStage[];
    className?: string;
    title?: string;
    description?: string;
}

const DEFAULT_STAGES: FunnelStage[] = [
    {
        label: 'Visits',
        value: 0,
        barClassName: 'bg-gradient-to-r from-blue-400 to-sky-200',
        dotClassName: 'bg-blue-400',
    },
    {
        label: 'Add to cart',
        value: 0,
        barClassName: 'bg-gradient-to-r from-orange-500 to-orange-300',
        dotClassName: 'bg-orange-500',
    },
    {
        label: 'Checkout',
        value: 0,
        barClassName: 'bg-gradient-to-r from-amber-400 to-yellow-200',
        dotClassName: 'bg-amber-400',
    },
];

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
      p { margin: 0 0 12px; }
      .muted { color: #6b7280; font-size: 12px; }
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

export function ConversionFunnel({
    stages = DEFAULT_STAGES,
    className,
    title = 'Conversion Funnel',
    description = 'User journey effectiveness',
}: ConversionFunnelProps) {
    const displayStages = stages;
    const max = Math.max(1, ...displayStages.map((s) => s.value));

    const downloadCsv = () =>
        downloadTextFile(
            'conversion-funnel.csv',
            buildFunnelCsv(displayStages),
            'text/csv;charset=utf-8;'
        );

    const downloadPdf = () => {
        const rows = displayStages
            .map((s) => {
                const pct = (s.value / max) * 100;
                return `<tr><td>${escapeHtml(s.label)}</td><td class="right">${escapeHtml(
                    String(s.value)
                )}</td><td class="right">${escapeHtml(pct.toFixed(2))}%</td></tr>`;
            })
            .join('');

        openPrintWindow(title, `
          <h1>${escapeHtml(title)}</h1>
          <p class="muted">${escapeHtml(description)}</p>
          <div class="card">
            <table>
              <thead>
                <tr>
                  <th>Stage</th>
                  <th class="right">Value</th>
                  <th class="right">% of top</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `);
    };

    return (
        <Card className={cn('h-[400px] rounded-3xl border border-border shadow-lg', className)}>
            <CardHeader className="space-y-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-xs" title="Download">
                                <Download className="h-3.5 w-3.5" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={downloadCsv} className="gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={downloadPdf} className="gap-2">
                                <FileText className="h-4 w-4" />
                                PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {displayStages.map((stage) => {
                    const widthPct = clamp((stage.value / max) * 100, 0, 100);

                    return (
                        <div key={stage.label} className="group flex items-center justify-between">
                            <div
                                className={cn(
                                    'relative h-12 overflow-hidden rounded-full shadow-sm transition-all duration-700 ease-out group-hover:shadow-lg group-hover:scale-[1.02] brightness-105',
                                    stage.barClassName
                                )}
                                style={{ width: `${widthPct}%`, maxWidth: '100%' }}
                            >
                                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] mix-blend-overlay" />
                            </div>

                            <div className="ml-6 flex-shrink-0 min-w-[140px] text-right text-sm">
                                <p className="text-base font-semibold text-foreground">{stage.label}</p>
                                <p className="text-3xl font-semibold tracking-tight text-foreground/90">
                                    {stage.value}
                                </p>
                            </div>
                        </div>
                    );
                })}

                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {displayStages.map((stage) => (
                        <span key={stage.label} className="flex items-center gap-1">
                            <span className={cn('h-2 w-2 rounded-full', stage.dotClassName)} />
                            {stage.label}
                        </span>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default ConversionFunnel;
