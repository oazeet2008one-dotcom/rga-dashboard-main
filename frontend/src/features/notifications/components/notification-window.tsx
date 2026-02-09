import { Bell, Check, Clock, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    timestamp: Date;
    isRead: boolean;
}

interface NotificationWindowProps {
    isOpen: boolean;
    notifications: Notification[];
    onClose: () => void;
    onMarkAllRead: () => void;
    onMarkAsRead: (id: string) => void;
    onDismiss: (id: string) => void;
}

// Format time ago with better precision
function formatTimeAgo(date: Date): string {
    const now = new Date().getTime();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

// Get icon color based on notification type
function getTypeColor(type: Notification['type']): string {
    switch (type) {
        case 'warning': return 'text-amber-500';
        case 'success': return 'text-green-500';
        case 'error': return 'text-red-500';
        default: return 'text-blue-500';
    }
}

export function NotificationWindow({
    isOpen,
    notifications,
    onClose,
    onMarkAllRead,
    onMarkAsRead,
    onDismiss
}: NotificationWindowProps) {
    const windowRef = useRef<HTMLDivElement>(null);

    // Escape key to close
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        }

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={windowRef}
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="fixed top-16 right-6 w-[340px] z-50 origin-top-right"
                >
                    <Card className="shadow-xl border-border/60">
                        <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-primary"
                                        onClick={onMarkAllRead}
                                        title="Mark all as read"
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <ScrollArea className="h-[300px]">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                                    <Bell className="h-10 w-10 mb-2 opacity-20" />
                                    <p className="text-sm">No notifications</p>
                                    <p className="text-xs mt-1">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y text-left">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 hover:bg-slate-50/80 transition-colors relative group",
                                                !notification.isRead ? "bg-blue-50/40" : ""
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Unread indicator */}
                                                <div className="pt-1 shrink-0">
                                                    <span className={cn(
                                                        "block h-2 w-2 rounded-full",
                                                        !notification.isRead ? "bg-blue-500" : "bg-transparent"
                                                    )} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={cn(
                                                            "text-xs truncate",
                                                            !notification.isRead ? "text-foreground font-semibold" : "text-muted-foreground font-medium"
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        <span className={cn("text-[10px] shrink-0", getTypeColor(notification.type))}>
                                                            {formatTimeAgo(notification.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-start gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                                    {!notification.isRead && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                            onClick={() => onMarkAsRead(notification.id)}
                                                            title="Mark as read"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                                        onClick={() => onDismiss(notification.id)}
                                                        title="Dismiss"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        <CardFooter className="p-2 border-t bg-slate-50/50 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground pl-2">
                                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            </span>
                            <Button variant="ghost" className="h-7 text-xs text-muted-foreground px-3" onClick={onClose}>
                                Close
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
