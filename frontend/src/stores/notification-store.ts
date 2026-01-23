// =============================================================================
// Notification Store - Zustand with Auto-Polling Support
// =============================================================================

import { create } from 'zustand';
import { apiClient } from '@/services/api-client';
import type { Notification } from '@/types/api';

// =============================================================================
// Types
// =============================================================================

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    isLoading: boolean;
    error: string | null;

    // Polling
    pollingInterval: ReturnType<typeof setInterval> | null;

    // Actions
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    dismiss: (id: string) => void;
    setOpen: (open: boolean) => void;
    setLoading: (loading: boolean) => void;

    // API Actions
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;

    // Polling Control
    startPolling: (intervalMs?: number) => void;
    stopPolling: () => void;
}

// =============================================================================
// Default Polling Interval
// =============================================================================

const DEFAULT_POLL_INTERVAL = 30 * 1000; // 30 seconds

// =============================================================================
// Store Implementation
// =============================================================================

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    isLoading: false,
    error: null,
    pollingInterval: null,

    // =========================================================================
    // Local State Setters
    // =========================================================================

    setNotifications: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
        }),

    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
        })),

    setOpen: (open) => set({ isOpen: open }),
    setLoading: (loading) => set({ isLoading: loading }),

    // =========================================================================
    // Optimistic Updates with API Sync
    // =========================================================================

    markAsRead: async (id) => {
        const state = get();
        const notification = state.notifications.find((n) => n.id === id);
        if (!notification || notification.isRead) return;

        // Optimistic update
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id
                    ? { ...n, isRead: true, readAt: new Date().toISOString() }
                    : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        try {
            await apiClient.patch(`/notifications/${id}/read`);
        } catch (error) {
            // Rollback on error
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, isRead: false, readAt: undefined } : n
                ),
                unreadCount: state.unreadCount + 1,
            }));
            console.error('Failed to mark notification as read:', error);
        }
    },

    markAllAsRead: async () => {
        const state = get();
        const previousNotifications = state.notifications;
        const previousUnreadCount = state.unreadCount;

        // Optimistic update
        set((state) => ({
            notifications: state.notifications.map((n) => ({
                ...n,
                isRead: true,
                readAt: n.readAt || new Date().toISOString(),
            })),
            unreadCount: 0,
        }));

        try {
            await apiClient.patch('/notifications/read-all');
        } catch (error) {
            // Rollback on error
            set({
                notifications: previousNotifications,
                unreadCount: previousUnreadCount,
            });
            console.error('Failed to mark all notifications as read:', error);
        }
    },

    dismiss: (id) =>
        set((state) => {
            const notification = state.notifications.find((n) => n.id === id);
            const wasUnread = notification && !notification.isRead;
            return {
                notifications: state.notifications.filter((n) => n.id !== id),
                unreadCount: wasUnread
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount,
            };
        }),

    // =========================================================================
    // API Fetch Actions
    // =========================================================================

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });

        try {
            const response = await apiClient.get('/notifications', {
                params: { limit: 20 },
            });

            const notifications = response.data.data as Notification[];
            set({
                notifications,
                unreadCount: notifications.filter((n) => !n.isRead).length,
                isLoading: false,
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch',
            });
            console.error('Failed to fetch notifications:', error);
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await apiClient.get('/notifications/unread-count');
            set({ unreadCount: response.data.count || 0 });
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    },

    // =========================================================================
    // Polling Control
    // =========================================================================

    startPolling: (intervalMs = DEFAULT_POLL_INTERVAL) => {
        const state = get();

        // Clear existing interval if any
        if (state.pollingInterval) {
            clearInterval(state.pollingInterval);
        }

        // Initial fetch
        get().fetchNotifications();

        // Start new polling interval
        const interval = setInterval(() => {
            get().fetchNotifications();
        }, intervalMs);

        set({ pollingInterval: interval });
    },

    stopPolling: () => {
        const state = get();
        if (state.pollingInterval) {
            clearInterval(state.pollingInterval);
            set({ pollingInterval: null });
        }
    },
}));
