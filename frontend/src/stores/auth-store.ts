// src/stores/auth-store.ts
// =============================================================================
// Authentication State Management (Zustand)
// Uses token-manager.ts for token storage to avoid circular dependency
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/api';
import { apiClient } from '@/services/api-client';
import { authEvents, AUTH_EVENTS } from '@/lib/auth-events';
import {
    setTokens,
    clearTokens,
    getAccessToken,
    getRefreshToken,
} from '@/lib/token-manager';

// =============================================================================
// Types
// =============================================================================
interface RegisterData {
    email: string;
    password: string;
    name: string;
    companyName: string;
}

interface AuthState {
    // State
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    clearError: () => void;
    initializeAuth: () => void;
}

// =============================================================================
// Store
// =============================================================================
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial State
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: false,
            error: null,

            // Login Action
            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post('/auth/login', {
                        email,
                        password,
                    });

                    // ✅ Contract: api-client interceptor auto-unwraps { success, data }
                    // So response.data already contains { user, accessToken, refreshToken }
                    const { accessToken, refreshToken, user } = response.data;

                    // ✅ Use token-manager (single source of truth)
                    setTokens(accessToken, refreshToken);

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: unknown) {
                    const err = error as {
                        response?: {
                            data?: {
                                message?: string;
                                error?: string;  // Contract error code
                                lockoutMinutes?: number;
                                remainingAttempts?: number;
                            }
                        }
                    };
                    const errorData = err.response?.data;
                    let message = errorData?.message || 'Login failed';

                    // ✅ Contract: Handle error codes per AUTH_INTERFACE_CONTRACT.md
                    switch (errorData?.error) {
                        case 'ACCOUNT_LOCKED':
                            message = `Account is locked. Please try again in ${errorData.lockoutMinutes || 30} minutes.`;
                            break;
                        case 'INVALID_CREDENTIALS':
                            if (errorData.remainingAttempts !== undefined) {
                                message = `Invalid credentials. ${errorData.remainingAttempts} attempts remaining.`;
                            }
                            break;
                        case 'TOKEN_EXPIRED':
                            message = 'Your session has expired. Please login again.';
                            break;
                    }

                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            // Register Action
            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post('/auth/register', data);

                    // ✅ Contract: api-client interceptor auto-unwraps { success, data }
                    // So response.data already contains { user, accessToken, refreshToken }
                    const { accessToken, refreshToken, user } = response.data;

                    // ✅ Use token-manager (single source of truth)
                    setTokens(accessToken, refreshToken);

                    set({
                        user,
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: unknown) {
                    const err = error as {
                        response?: {
                            data?: {
                                message?: string;
                                error?: string;  // Contract error code
                            }
                        }
                    };
                    const errorData = err.response?.data;
                    let message = errorData?.message || 'Registration failed';

                    // ✅ Contract: Handle error codes per AUTH_INTERFACE_CONTRACT.md
                    if (errorData?.error === 'EMAIL_EXISTS') {
                        message = 'This email is already registered. Please login instead.';
                    }

                    set({ error: message, isLoading: false });
                    throw error;
                }
            },

            // Logout Action
            logout: () => {
                // ✅ Use token-manager (single source of truth)
                clearTokens();
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    error: null,
                });
            },

            // Set User
            setUser: (user) => set({ user, isAuthenticated: !!user }),

            // Clear Error
            clearError: () => set({ error: null }),

            // Initialize Auth (called on app mount)
            initializeAuth: () => {
                // ✅ Read from token-manager (single source of truth)
                const accessToken = getAccessToken();
                const refreshToken = getRefreshToken();
                const { user } = get();

                if (accessToken && user) {
                    set({
                        accessToken,
                        refreshToken,
                        isAuthenticated: true,
                        isInitialized: true,
                    });
                } else {
                    set({
                        accessToken: null,
                        refreshToken: null,
                        user: null,
                        isAuthenticated: false,
                        isInitialized: true,
                    });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            // ✅ Only persist user data, tokens are managed by token-manager
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => {
                // Called when store is rehydrated from localStorage
                return (state: AuthState | undefined) => {
                    if (state) {
                        // ✅ Sync tokens from token-manager on rehydrate
                        state.accessToken = getAccessToken();
                        state.refreshToken = getRefreshToken();
                        state.isInitialized = true;
                    }
                };
            },
        }
    )
);

// =============================================================================
// Auth Events Listener (Session Expired)
// =============================================================================
// Subscribe to session expired events from api-client
authEvents.on(AUTH_EVENTS.SESSION_EXPIRED, () => {
    useAuthStore.getState().logout();
});

// =============================================================================
// Selectors (for optimized re-renders)
// =============================================================================
export const selectUser = (state: AuthState) => state.user;
export const selectAccessToken = (state: AuthState) => state.accessToken;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectError = (state: AuthState) => state.error;
