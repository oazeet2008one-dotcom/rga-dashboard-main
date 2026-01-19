/**
 * Data Source Card Component
 * 
 * Displays integration status for a single platform.
 * Shows connection state, connected account, and action buttons.
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Loader2,
    Link as LinkIcon,
    Unlink,
    RefreshCw,
    ExternalLink,
} from 'lucide-react';
import type { PlatformId, IntegrationStatusResponse, PlatformConfig } from '../types';
import { PLATFORM_CONFIGS } from '../types';

// Platform-specific icons (inline SVGs for better control)
const PlatformIcons: Record<PlatformId, React.ReactNode> = {
    google: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    ),
    facebook: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    ),
    tiktok: (
        <svg viewBox="0 0 24 24" className="h-8 w-8">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="currentColor" />
        </svg>
    ),
    line: (
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#00C300">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
    ),
};

interface DataSourceCardProps {
    /** Platform identifier */
    platform: PlatformId;
    /** Integration status response */
    status?: IntegrationStatusResponse | null;
    /** Whether status is loading */
    isLoading?: boolean;
    /** Callback when connect button clicked */
    onConnect: () => void;
    /** Callback when disconnect button clicked */
    onDisconnect: () => void;
    /** Whether connect/disconnect is in progress */
    isPending?: boolean;
}

export function DataSourceCard({
    platform,
    status,
    isLoading = false,
    onConnect,
    onDisconnect,
    isPending = false,
}: DataSourceCardProps) {
    const config = PLATFORM_CONFIGS[platform];
    const isConnected = status?.isConnected ?? false;
    const primaryAccount = status?.accounts?.[0];

    // Format last sync date
    const formatLastSync = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <Card className="relative overflow-hidden">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-9 w-24" />
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden">
            {/* Status indicator stripe */}
            <div
                className={`absolute top-0 left-0 right-0 h-1 ${isConnected ? 'bg-green-500' : 'bg-gray-300'
                    }`}
            />

            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-12 w-12 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${config.color}10` }}
                        >
                            {PlatformIcons[platform]}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{config.name}</CardTitle>
                            <CardDescription className="text-sm">
                                {config.description}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={isConnected ? 'default' : 'secondary'}>
                        {isConnected ? 'Connected' : 'Not Connected'}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pb-3">
                {isConnected && primaryAccount ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{primaryAccount.name}</span>
                            <span className="text-muted-foreground">
                                ({primaryAccount.externalId})
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <RefreshCw className="h-4 w-4" />
                            <span>Last sync: {formatLastSync(status?.lastSyncAt ?? null)}</span>
                        </div>
                        {status?.accounts && status.accounts.length > 1 && (
                            <div className="text-muted-foreground">
                                +{status.accounts.length - 1} more account(s)
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">
                        Connect your {config.name} account to sync campaigns and metrics.
                    </div>
                )}
            </CardContent>

            <CardFooter className="gap-2">
                {isConnected ? (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDisconnect}
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Unlink className="mr-2 h-4 w-4" />
                            )}
                            Disconnect
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <a
                                href={`https://${platform === 'google' ? 'ads.google.com' : platform === 'facebook' ? 'business.facebook.com' : platform === 'tiktok' ? 'ads.tiktok.com' : 'manager.line.biz'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Dashboard
                            </a>
                        </Button>
                    </>
                ) : (
                    <Button onClick={onConnect} disabled={isPending}>
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <LinkIcon className="mr-2 h-4 w-4" />
                        )}
                        Connect {config.name}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
