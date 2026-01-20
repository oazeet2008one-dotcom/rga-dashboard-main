// src/features/dashboard/components/widgets/recent-campaigns.tsx
// =============================================================================
// Recent Campaigns Widget - Displays Top Campaigns with Platform & Spend
// =============================================================================

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrencyTHB } from '@/lib/formatters';
import type { RecentCampaign, CampaignStatus, AdPlatform } from '../../schemas';

// =============================================================================
// Platform Icons (SVG Inline for Performance)
// =============================================================================

const PlatformIcons: Record<AdPlatform, React.ReactNode> = {
    GOOGLE_ADS: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="#4285F4"
            />
        </svg>
    ),
    FACEBOOK: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    ),
    TIKTOK: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
        </svg>
    ),
    LINE_ADS: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#00B900">
            <path d="M12 2C6.48 2 2 5.82 2 10.5c0 4.17 3.68 7.66 8.66 8.36.34.07.8.22.92.5.1.26.07.66.03.93l-.15.89c-.04.26-.2 1.03.89.56s5.93-3.49 8.09-5.98C21.9 13.09 22 11.36 22 10.5 22 5.82 17.52 2 12 2z" />
        </svg>
    ),
    GOOGLE_ANALYTICS: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#F9AB00">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
    ),
    SHOPEE: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#EE4D2D">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
    ),
    LAZADA: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0F146D">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
        </svg>
    ),
};

// =============================================================================
// Status Badge Styling
// =============================================================================

const STATUS_STYLES: Record<CampaignStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    ACTIVE: { variant: 'default', label: 'Active' },
    PAUSED: { variant: 'secondary', label: 'Paused' },
    PENDING: { variant: 'outline', label: 'Pending' },
    COMPLETED: { variant: 'outline', label: 'Completed' },
    ENDED: { variant: 'secondary', label: 'Ended' },
    DELETED: { variant: 'destructive', label: 'Deleted' },
};

// =============================================================================
// Platform Display Names
// =============================================================================

const PLATFORM_NAMES: Record<AdPlatform, string> = {
    GOOGLE_ADS: 'Google Ads',
    FACEBOOK: 'Facebook',
    TIKTOK: 'TikTok',
    LINE_ADS: 'LINE Ads',
    GOOGLE_ANALYTICS: 'Analytics',
    SHOPEE: 'Shopee',
    LAZADA: 'Lazada',
};

// =============================================================================
// Props Interface
// =============================================================================

interface RecentCampaignsProps {
    /** Array of recent campaigns from API */
    campaigns: RecentCampaign[];
    /** Optional class name */
    className?: string;
}

// =============================================================================
// Main Component
// =============================================================================

export function RecentCampaigns({ campaigns, className }: RecentCampaignsProps) {
    const hasData = campaigns && campaigns.length > 0;

    return (
        <Card className={`h-[400px] flex flex-col ${className ?? ''}`}>
            <CardHeader>
                <CardTitle className="text-base font-semibold">
                    Recent Campaigns
                </CardTitle>
                <CardDescription>
                    {hasData
                        ? `${campaigns.length} campaign${campaigns.length > 1 ? 's' : ''} in selected period`
                        : 'No campaigns found'}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-0">
                {!hasData ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        <p className="text-sm">No campaign data available</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-4">
                            {campaigns.map((campaign) => {
                                const statusStyle = STATUS_STYLES[campaign.status] || STATUS_STYLES.PENDING;
                                const platformName = PLATFORM_NAMES[campaign.platform] || campaign.platform;
                                const PlatformIcon = PlatformIcons[campaign.platform];

                                return (
                                    <div
                                        key={campaign.id}
                                        className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                    >
                                        {/* Left: Platform Icon + Info */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                                {PlatformIcon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium leading-none">
                                                    {campaign.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {platformName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: Badge + Spend */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <Badge variant={statusStyle.variant} className="text-xs">
                                                {statusStyle.label}
                                            </Badge>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">
                                                    {formatCurrencyTHB(campaign.spending)}
                                                </p>
                                                {campaign.budgetUtilization !== undefined && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {campaign.budgetUtilization.toFixed(0)}% used
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}

export default RecentCampaigns;
