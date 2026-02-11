import { useState, useCallback, useRef, useEffect } from 'react';
import { NotificationButton } from './notification-button';
import { NotificationWindow, type Notification } from './notification-window';

export function NotificationWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Click outside to close (handled at widget level to include both button and window)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem('rga-notifications');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Convert timestamp strings back to Date objects
                return parsed.map((n: any) => ({
                    ...n,
                    timestamp: new Date(n.timestamp)
                }));
            }
        } catch (error) {
            console.error('Failed to load notifications from storage:', error);
        }

        // Default mock data
        return [
            {
                id: '1',
                title: 'Budget Alert',
                message: "Campaign 'Summer Sale' has reached 90% of its daily budget ($450/$500).",
                type: 'warning',
                timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
                isRead: false
            },
            {
                id: '2',
                title: 'Report Ready',
                message: "Your monthly SEO Performance report has been generated successfully.",
                type: 'success',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
                isRead: false
            },
            {
                id: '3',
                title: 'New Feature',
                message: "Check out the new AI Insights module in the sidebar!",
                type: 'info',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                isRead: true
            }
        ];
    });

    // Save to localStorage whenever notifications change
    useEffect(() => {
        localStorage.setItem('rga-notifications', JSON.stringify(notifications));
    }, [notifications]);

    const hasUnread = notifications.some(n => !n.isRead);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleToggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const handleMarkAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }, []);

    const handleMarkAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
    }, []);

    const handleDismiss = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <div ref={widgetRef} className="relative flex flex-col items-end">
            <NotificationWindow
                isOpen={isOpen}
                notifications={notifications}
                onClose={handleClose}
                onMarkAllRead={handleMarkAllRead}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
            />
            <NotificationButton
                isOpen={isOpen}
                hasUnread={hasUnread}
                onClick={handleToggle}
            />
        </div>
    );
}
