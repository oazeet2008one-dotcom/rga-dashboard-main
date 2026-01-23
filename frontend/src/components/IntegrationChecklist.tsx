import { Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from './ui/button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useIntegrationStatus, type IntegrationStatus } from '../hooks/useIntegrationStatus';

type IntegrationItem = {
    id: keyof IntegrationStatus;
    category: string;
    name: string;
    iconUrl: string;
    iconBg: string;
    iconBorder: string;
};

const INTEGRATIONS: IntegrationItem[] = [
    {
        id: 'googleAds',
        category: 'ADS',
        name: 'Google Ads',
        iconUrl: 'https://cdn.simpleicons.org/googleads/ef4444',
        iconBg: 'rgba(0, 0, 0, 0.02)',
        iconBorder: 'hsl(var(--border))',
    },
    {
        id: 'facebookAds',
        category: 'ADS',
        name: 'Facebook',
        iconUrl: 'https://cdn.simpleicons.org/facebook/2563eb',
        iconBg: 'rgba(0, 0, 0, 0.02)',
        iconBorder: 'hsl(var(--border))',
    },
    {
        id: 'lineAds',
        category: 'ADS',
        name: 'LINE OA',
        iconUrl: 'https://cdn.simpleicons.org/line/22c55e',
        iconBg: 'rgba(0, 0, 0, 0.02)',
        iconBorder: 'hsl(var(--border))',
    },
    {
        id: 'tiktokAds',
        category: 'ADS',
        name: 'TikTok Ads',
        iconUrl: 'https://cdn.simpleicons.org/tiktok/FFFFFF',
        iconBg: 'rgb(17, 24, 39)',
        iconBorder: 'rgb(17, 24, 39)',
    },
];

export type IntegrationChecklistProps = {
    status?: Partial<IntegrationStatus>;
    loading?: boolean;
};

export function IntegrationChecklist({ status: statusOverride, loading }: IntegrationChecklistProps) {
    const [, setLocation] = useLocation();
    const { status, isLoading } = useIntegrationStatus();

    const resolvedStatus: IntegrationStatus = {
        ...status,
        ...statusOverride,
    };

    const isBusy = loading ?? isLoading;

    if (isBusy) {
        return (
            <div className="rounded-3xl border bg-card text-card-foreground shadow p-6">
                <div className="flex justify-center">
                    <LoadingSpinner text="Loading integration status..." />
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border bg-card text-card-foreground shadow p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 max-w-4xl">
                    <h2 className="text-[24px] leading-snug font-semibold text-foreground break-words">
                        Integration Checklist
                    </h2>
                    <p className="text-muted-foreground text-[16px] leading-relaxed break-words">
                        Connect data sources for real-time insights
                    </p>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full px-3 py-2 text-xs font-semibold gap-2 shrink-0"
                    onClick={() => setLocation('/data-sources')}
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {INTEGRATIONS.map((item) => {
                    const isConnected = Boolean(resolvedStatus[item.id]);
                    const dotColor = isConnected ? 'rgb(34, 197, 94)' : 'rgb(229, 231, 235)';

                    return (
                        <button
                            key={item.id}
                            type="button"
                            className="w-full rounded-2xl px-5 py-4 text-left transition-all duration-200 border bg-card hover:shadow-sm hover:-translate-y-0.5"
                            onClick={() => setLocation('/data-sources')}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div
                                        className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 border"
                                        style={{ backgroundColor: item.iconBg, borderColor: item.iconBorder }}
                                    >
                                        <img src={item.iconUrl} className="h-7 w-7" alt={item.name} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                            {item.category}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold leading-tight truncate">
                                            {item.name}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className="mt-1 h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: dotColor }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
