/**
 * Integration Auth Hook
 * 
 * Manages OAuth flow, connection status, and account selection.
 * Handles:
 * - Fetching status for all platforms
 * - Initiating OAuth flow (redirect)
 * - Handling OAuth callback (detect URL params, fetch accounts)
 * - Completing connection with selected account
 * - Disconnecting integrations
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { integrationService, parseOAuthCallback, isOAuthCallback } from '../api/integration-service';
import type {
    PlatformId,
    IntegrationStatusResponse,
    TempAccount,
} from '../types';
import { PLATFORM_CONFIGS } from '../types';

// ============================================
// Query Keys
// ============================================

export const integrationQueryKeys = {
    all: ['integrations'] as const,
    status: (platform: PlatformId) => ['integrations', 'status', platform] as const,
    allStatuses: () => ['integrations', 'statuses', 'all'] as const,
};

// ============================================
// Hook
// ============================================

export function useIntegrationAuth() {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();

    // ============================================
    // OAuth Callback State
    // ============================================
    const [callbackState, setCallbackState] = useState<{
        platform: PlatformId | null;
        tempToken: string | null;
        tempAccounts: TempAccount[];
        isDialogOpen: boolean;
    }>({
        platform: null,
        tempToken: null,
        tempAccounts: [],
        isDialogOpen: false,
    });

    // Track pending operations
    const [pendingPlatform, setPendingPlatform] = useState<PlatformId | null>(null);

    // ============================================
    // Fetch All Statuses
    // ============================================
    const {
        data: statuses,
        isLoading: isLoadingStatuses,
        refetch: refetchStatuses,
    } = useQuery({
        queryKey: integrationQueryKeys.allStatuses(),
        queryFn: () => integrationService.getAllStatuses(),
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: true,
    });

    // ============================================
    // Handle OAuth Callback (URL Detection)
    // ============================================
    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);

        if (!isOAuthCallback(searchParams)) {
            return;
        }

        const params = parseOAuthCallback(searchParams);

        // Handle error
        if (params.error) {
            toast.error(`Integration error: ${decodeURIComponent(params.error)}`);
            // Clean URL
            window.history.replaceState({}, '', '/data-sources');
            return;
        }

        // Handle success callback with tempToken
        if (params.tempToken && params.platform) {
            const platform = normalizePlatformId(params.platform);

            if (!platform) {
                toast.error('Unknown platform in callback');
                window.history.replaceState({}, '', '/data-sources');
                return;
            }

            // Clean URL immediately to prevent re-trigger on refresh
            window.history.replaceState({}, '', '/data-sources');

            // Fetch temp accounts
            fetchTempAccountsAndOpenDialog(platform, params.tempToken);
        }
    }, []);

    // ============================================
    // Fetch Temp Accounts
    // ============================================
    const fetchTempAccountsAndOpenDialog = async (
        platform: PlatformId,
        tempToken: string
    ) => {
        try {
            const accounts = await integrationService.getTempAccounts(platform, tempToken);

            if (accounts.length === 0) {
                toast.error('No accounts found. Please check your permissions.');
                return;
            }

            // If only one account, auto-connect
            if (accounts.length === 1) {
                await handleCompleteConnection(platform, tempToken, accounts[0].id);
                return;
            }

            // Multiple accounts - show selection dialog
            setCallbackState({
                platform,
                tempToken,
                tempAccounts: accounts,
                isDialogOpen: true,
            });
        } catch (error) {
            console.error('[useIntegrationAuth] Failed to fetch temp accounts:', error);
            toast.error('Failed to fetch accounts. Please try again.');
        }
    };

    // ============================================
    // Complete Connection Mutation
    // ============================================
    const completeConnectionMutation = useMutation({
        mutationFn: async ({
            platform,
            tempToken,
            externalId,
        }: {
            platform: PlatformId;
            tempToken: string;
            externalId: string;
        }) => {
            return integrationService.completeConnection(platform, tempToken, externalId);
        },
        onSuccess: (data, variables) => {
            const platformName = PLATFORM_CONFIGS[variables.platform].name;
            toast.success(`${platformName} connected successfully!`);

            // Close dialog and reset state
            setCallbackState({
                platform: null,
                tempToken: null,
                tempAccounts: [],
                isDialogOpen: false,
            });

            // Refresh statuses
            queryClient.invalidateQueries({ queryKey: integrationQueryKeys.allStatuses() });
        },
        onError: (error: Error, variables) => {
            const platformName = PLATFORM_CONFIGS[variables.platform].name;
            toast.error(`Failed to connect ${platformName}: ${error.message}`);
        },
    });

    const handleCompleteConnection = async (
        platform: PlatformId,
        tempToken: string,
        externalId: string
    ) => {
        await completeConnectionMutation.mutateAsync({ platform, tempToken, externalId });
    };

    // ============================================
    // Connect (Initiate OAuth)
    // ============================================
    const handleConnect = useCallback(async (platform: PlatformId) => {
        setPendingPlatform(platform);

        try {
            // Special handling for TikTok sandbox
            if (platform === 'tiktok') {
                const authResponse = await integrationService.getAuthUrl(platform);

                if (authResponse.isSandbox) {
                    // Sandbox mode - direct connect
                    const result = await integrationService.connectTikTokSandbox();
                    toast.success('TikTok Sandbox connected successfully!');
                    queryClient.invalidateQueries({ queryKey: integrationQueryKeys.allStatuses() });
                    setPendingPlatform(null);
                    return;
                }

                // Production mode - redirect
                const url = authResponse.url || authResponse.authUrl;
                if (url) {
                    window.location.href = url;
                } else {
                    throw new Error('No auth URL received');
                }
                return;
            }

            // Standard OAuth redirect
            const url = await integrationService.getAuthUrlString(platform);
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No auth URL received');
            }
        } catch (error) {
            console.error('[useIntegrationAuth] Connect error:', error);
            toast.error(`Failed to start ${PLATFORM_CONFIGS[platform].name} connection`);
            setPendingPlatform(null);
        }
    }, [queryClient]);

    // ============================================
    // Disconnect Mutation
    // ============================================
    const disconnectMutation = useMutation({
        mutationFn: async (platform: PlatformId) => {
            return integrationService.disconnect(platform);
        },
        onSuccess: (data, platform) => {
            toast.success(`${PLATFORM_CONFIGS[platform].name} disconnected`);
            queryClient.invalidateQueries({ queryKey: integrationQueryKeys.allStatuses() });
        },
        onError: (error, platform) => {
            toast.error(`Failed to disconnect ${PLATFORM_CONFIGS[platform].name}`);
        },
    });

    const handleDisconnect = useCallback(async (platform: PlatformId) => {
        setPendingPlatform(platform);
        try {
            await disconnectMutation.mutateAsync(platform);
        } finally {
            setPendingPlatform(null);
        }
    }, [disconnectMutation]);

    // ============================================
    // Dialog Controls
    // ============================================
    const closeDialog = useCallback(() => {
        setCallbackState({
            platform: null,
            tempToken: null,
            tempAccounts: [],
            isDialogOpen: false,
        });
    }, []);

    const confirmAccountSelection = useCallback((accountId: string) => {
        if (callbackState.platform && callbackState.tempToken) {
            handleCompleteConnection(
                callbackState.platform,
                callbackState.tempToken,
                accountId
            );
        }
    }, [callbackState.platform, callbackState.tempToken]);

    // ============================================
    // Return Values
    // ============================================
    return {
        // Status data
        statuses,
        isLoadingStatuses,
        refetchStatuses,

        // Get status for specific platform
        getStatus: (platform: PlatformId): IntegrationStatusResponse | null => {
            return statuses?.[platform] ?? null;
        },

        // Actions
        handleConnect,
        handleDisconnect,

        // Pending state
        isPending: (platform: PlatformId) => pendingPlatform === platform,
        isAnyPending: pendingPlatform !== null,

        // Account selection dialog
        accountSelectionDialog: {
            isOpen: callbackState.isDialogOpen,
            platform: callbackState.platform,
            accounts: callbackState.tempAccounts,
            onOpenChange: (open: boolean) => {
                if (!open) closeDialog();
            },
            onConfirm: confirmAccountSelection,
            isPending: completeConnectionMutation.isPending,
        },
    };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize platform string from URL to PlatformId
 */
function normalizePlatformId(platform: string): PlatformId | null {
    const map: Record<string, PlatformId> = {
        'google': 'google',
        'ads': 'google', // Legacy: platform=ads means Google Ads
        'facebook': 'facebook',
        'tiktok': 'tiktok',
        'line': 'line',
    };
    return map[platform.toLowerCase()] ?? null;
}
