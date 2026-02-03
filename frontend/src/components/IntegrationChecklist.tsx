import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { BrandLogo } from './ui/brand-logo';
import { PLATFORMS } from '../constants/platforms';
import { useIntegrationStatus, IntegrationStatus } from '../hooks/useIntegrationStatus';

const CHECKLIST_PLATFORM_IDS = [
    'google-ads',
    'facebook-ads',
    'instagram-ads',
    'line-ads',
    'tiktok-ads',
] as const;

const statusKeyMap: Record<string, keyof IntegrationStatus> = {
    'google-ads': 'googleAds',
    'facebook-ads': 'facebookAds',
    // Instagram Ads is part of Meta Ads in this system (shared connection status)
    'instagram-ads': 'facebookAds',
    'line-ads': 'lineAds',
    'tiktok-ads': 'tiktokAds',
};

// Platform-specific styling configuration
const PLATFORM_STYLES: Record<string, {
    bgGradient: string;
    hoverBorder: string;
    iconRing: string;
    glowColor: string;
}> = {
    'google-ads': {
        bgGradient: 'from-red-50/50 to-orange-50/30 dark:from-red-950/20 dark:to-orange-950/10',
        hoverBorder: 'hover:border-red-200 dark:hover:border-red-800',
        iconRing: 'group-hover:ring-red-200/80 dark:group-hover:ring-red-700/50',
        glowColor: 'group-hover:shadow-red-100/50 dark:group-hover:shadow-red-900/30',
    },
    'facebook-ads': {
        bgGradient: 'from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10',
        hoverBorder: 'hover:border-blue-200 dark:hover:border-blue-800',
        iconRing: 'group-hover:ring-blue-200/80 dark:group-hover:ring-blue-700/50',
        glowColor: 'group-hover:shadow-blue-100/50 dark:group-hover:shadow-blue-900/30',
    },
    'instagram-ads': {
        bgGradient: 'from-pink-50/50 to-fuchsia-50/30 dark:from-pink-950/20 dark:to-fuchsia-950/10',
        hoverBorder: 'hover:border-pink-200 dark:hover:border-pink-800',
        iconRing: 'group-hover:ring-pink-200/80 dark:group-hover:ring-pink-700/50',
        glowColor: 'group-hover:shadow-pink-100/50 dark:group-hover:shadow-pink-900/30',
    },
    'line-ads': {
        bgGradient: 'from-emerald-50/50 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/10',
        hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800',
        iconRing: 'group-hover:ring-emerald-200/80 dark:group-hover:ring-emerald-700/50',
        glowColor: 'group-hover:shadow-emerald-100/50 dark:group-hover:shadow-emerald-900/30',
    },
    'tiktok-ads': {
        bgGradient: 'from-slate-50/50 to-gray-50/30 dark:from-slate-950/20 dark:to-gray-950/10',
        hoverBorder: 'hover:border-slate-300 dark:hover:border-slate-700',
        iconRing: 'group-hover:ring-slate-300/80 dark:group-hover:ring-slate-600/50',
        glowColor: 'group-hover:shadow-slate-200/50 dark:group-hover:shadow-slate-800/30',
    },
};

export function IntegrationChecklist() {
    const [, setLocation] = useLocation();
    const { status, isLoading } = useIntegrationStatus();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const platforms = PLATFORMS.filter((p) => CHECKLIST_PLATFORM_IDS.includes(p.id as any));

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6 flex justify-center">
                    <LoadingSpinner text="Loading integration status..." />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full rounded-3xl">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle>Integration Checklist</CardTitle>
                        <CardDescription>Connect data sources for real-time insights</CardDescription>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full px-3 py-2 text-xs font-semibold gap-2 shrink-0"
                        onClick={() => setIsCollapsed((prev) => !prev)}
                    >
                        {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronUp className="h-4 w-4" />
                        )}
                        {isCollapsed ? 'Open' : 'Close'}
                    </Button>
                </div>
            </CardHeader>

            {isCollapsed ? null : (
                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {platforms.map((platform) => {
                            const statusKey = statusKeyMap[platform.id];
                            const isConnected = statusKey ? status[statusKey] : false;

                            // Safe style lookup
                            const defaultStyles = PLATFORM_STYLES['tiktok-ads'];
                            const styles = PLATFORM_STYLES[platform.id] || defaultStyles;

                            const displayName = platform.id === 'line-ads' ? 'LINE Ads' : platform.name;
                            const dotClassName = isConnected
                                ? 'bg-emerald-500 shadow-[0_0_0_3px_rgba(34,197,94,0.15)] animate-pulse'
                                : 'bg-slate-200';

                            return (
                                <button
                                    key={platform.id}
                                    type="button"
                                    className={`
                                        group w-full rounded-2xl px-5 py-4 text-left
                                        transition-all duration-300 ease-out
                                        border bg-gradient-to-br ${styles.bgGradient}
                                        hover:shadow-lg hover:-translate-y-1 ${styles.hoverBorder} ${styles.glowColor}
                                        ${!isConnected ? 'grayscale opacity-60 hover:opacity-80' : ''}
                                    `}
                                    onClick={() => setLocation('/data-sources')}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`
                                                relative h-12 w-12 rounded-full flex items-center justify-center shrink-0
                                                border bg-white dark:bg-slate-900 shadow-sm
                                                transition-all duration-300
                                                group-hover:shadow-md group-hover:scale-110
                                                ring-2 ring-transparent ${styles.iconRing}
                                            `}>
                                                <BrandLogo platformId={platform.id} className="h-7 w-7" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    ADS
                                                </p>
                                                <p className="mt-0.5 text-sm font-bold leading-tight truncate">
                                                    {displayName}
                                                </p>
                                            </div>
                                        </div>

                                        <span className={`mt-1 h-3 w-3 rounded-full transition-transform group-hover:scale-125 ${dotClassName}`} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
