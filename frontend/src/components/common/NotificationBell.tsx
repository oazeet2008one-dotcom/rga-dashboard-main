// =============================================================================
// NotificationBell - Real-time Notification Center with Polling
// =============================================================================

import { useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/api';

// =============================================================================
// Constants
// =============================================================================

const POLL_INTERVAL = 30 * 1000; // 30 seconds

// =============================================================================
// Time Formatting Utility
// =============================================================================

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

// =============================================================================
// Severity Badge Component
// =============================================================================

function SeverityBadge({ severity }: { severity?: string }) {
    if (!severity) return null;

    const config: Record<string, { label: string; className: string }> = {
        CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
        WARNING: { label: 'Warning', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        INFO: { label: 'Info', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    };

    const cfg = config[severity];
    if (!cfg) return null;

    return (
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', cfg.className)}>
            {cfg.label}
        </Badge>
    );
}

// =============================================================================
// Notification Item Component
// =============================================================================

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const severity = (notification.metadata as Record<string, unknown> | null)?.severity as string | undefined;

    return (
        <div
            role="button"
            tabIndex={0}
            className={cn(
                'px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors',
                !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/20'
            )}
            onClick={() => onMarkAsRead(notification.id)}
            onKeyDown={(e) => e.key === 'Enter' && onMarkAsRead(notification.id)}
        >
            <div className="flex items-start gap-3">
                {/* Unread Indicator */}
                {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                )}

                <div className={cn('flex-1 min-w-0', notification.isRead && 'ml-5')}>
                    {/* Title & Severity */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                            {notification.title}
                        </span>
                        <SeverityBadge severity={severity} />
                    </div>

                    {/* Message */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                    </p>

                    {/* Timestamp */}
                    <span className="text-xs text-muted-foreground mt-1 block">
                        {formatTimeAgo(notification.createdAt)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function NotificationSkeleton() {
    return (
        <div className="px-4 py-3 space-y-2">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            ))}
        </div>
    );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState() {
    return (
        <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-1">You're all caught up!</p>
        </div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export function NotificationBell() {
    const {
        notifications,
        unreadCount,
        isLoading,
        isOpen,
        setOpen,
        markAsRead,
        markAllAsRead,
        startPolling,
        stopPolling,
    } = useNotificationStore();

    // Start polling on mount, stop on unmount
    useEffect(() => {
        startPolling(POLL_INTERVAL);
        return () => stopPolling();
    }, [startPolling, stopPolling]);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-xs animate-in zoom-in-50"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <span className="font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="text-xs h-7 px-2"
                        >
                            <CheckCheck className="h-3.5 w-3.5 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notification List */}
                <ScrollArea className="h-[350px]">
                    {isLoading && notifications.length === 0 ? (
                        <NotificationSkeleton />
                    ) : notifications.length === 0 ? (
                        <EmptyState />
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                            />
                        ))
                    )}
                </ScrollArea>

                {/* Footer */}
                <DropdownMenuSeparator />
                <div className="p-2">
                    <Button variant="ghost" className="w-full h-8 text-sm" asChild>
                        <a href="/notifications">View all notifications</a>
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
