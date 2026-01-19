/**
 * Integration Service (Adapter Pattern)
 * 
 * Provides a unified interface for all platform integrations.
 * Normalizes inconsistent backend APIs to a standard format.
 * 
 * Key Responsibilities:
 * 1. Route mapping (platform -> API endpoints)
 * 2. Request normalization (externalId -> customerId/accountId/advertiserId)
 * 3. Response normalization (unwrap platform-specific structures)
 */

import { apiClient } from '@/services/api-client';
import type {
    PlatformId,
    IntegrationStatusResponse,
    TempAccount,
    AuthUrlResponse,
    CompleteConnectionResponse,
    DisconnectResponse,
} from '../types';

// ============================================
// Route Configuration
// ============================================

interface PlatformRoutes {
    /** Auth base URL (e.g., /auth/google/ads) */
    authBaseUrl: string;
    /** Integration base URL (e.g., /integrations/google-ads) */
    integrationBaseUrl: string;
    /** Field name for externalId in complete request */
    externalIdField: 'customerId' | 'accountId' | 'advertiserId';
}

/**
 * Platform-specific route configuration
 * Maps platform ID to correct backend endpoints
 */
const PLATFORM_ROUTES: Record<PlatformId, PlatformRoutes> = {
    google: {
        authBaseUrl: '/auth/google/ads',
        integrationBaseUrl: '/integrations/google-ads',
        externalIdField: 'customerId',
    },
    facebook: {
        authBaseUrl: '/auth/facebook/ads',
        integrationBaseUrl: '/integrations/facebook-ads',
        externalIdField: 'accountId',
    },
    tiktok: {
        // Note: TikTok uses /auth/tiktok (no /ads suffix)
        authBaseUrl: '/auth/tiktok',
        integrationBaseUrl: '/integrations/tiktok-ads',
        externalIdField: 'advertiserId',
    },
    line: {
        authBaseUrl: '/auth/line/ads',
        integrationBaseUrl: '/integrations/line-ads',
        externalIdField: 'accountId', // Placeholder, LINE OAuth not implemented
    },
};

// ============================================
// Response Normalizers
// ============================================

/**
 * Normalize temp accounts response
 * TikTok returns { accounts: [...] }, others return array directly
 */
function normalizeTempAccounts(response: unknown): TempAccount[] {
    // If response is already an array, return it
    if (Array.isArray(response)) {
        return response as TempAccount[];
    }

    // If response has accounts property (TikTok style), extract it
    if (response && typeof response === 'object' && 'accounts' in response) {
        const wrapped = response as { accounts: TempAccount[] };
        return wrapped.accounts;
    }

    // Fallback: return empty array
    console.warn('[IntegrationService] Unexpected temp accounts response format:', response);
    return [];
}

/**
 * Normalize auth URL response
 * Some platforms use 'url', others use 'authUrl'
 */
function normalizeAuthUrl(response: AuthUrlResponse): string | null {
    return response.url || response.authUrl || null;
}

// ============================================
// Integration Service
// ============================================

export const integrationService = {
    /**
     * Get OAuth authorization URL for a platform
     */
    async getAuthUrl(platform: PlatformId): Promise<AuthUrlResponse> {
        const routes = PLATFORM_ROUTES[platform];
        const response = await apiClient.get<AuthUrlResponse>(`${routes.authBaseUrl}/url`);
        return response.data;
    },

    /**
     * Get normalized OAuth URL string
     */
    async getAuthUrlString(platform: PlatformId): Promise<string | null> {
        const response = await this.getAuthUrl(platform);
        return normalizeAuthUrl(response);
    },

    /**
     * Get temporary accounts for selection after OAuth callback
     * Normalizes response to always return TempAccount[]
     */
    async getTempAccounts(platform: PlatformId, tempToken: string): Promise<TempAccount[]> {
        const routes = PLATFORM_ROUTES[platform];
        const response = await apiClient.get(
            `${routes.authBaseUrl}/temp-accounts?tempToken=${encodeURIComponent(tempToken)}`
        );
        return normalizeTempAccounts(response.data);
    },

    /**
     * Complete connection with selected account
     * Normalizes externalId to platform-specific field name
     */
    async completeConnection(
        platform: PlatformId,
        tempToken: string,
        externalId: string
    ): Promise<CompleteConnectionResponse> {
        const routes = PLATFORM_ROUTES[platform];

        // Build request payload with correct field name
        const payload: Record<string, string> = {
            tempToken,
            [routes.externalIdField]: externalId,
        };

        const response = await apiClient.post<CompleteConnectionResponse>(
            `${routes.authBaseUrl}/complete`,
            payload
        );
        return response.data;
    },

    /**
     * Get integration status for a platform
     * Returns standardized IntegrationStatusResponse
     */
    async getStatus(platform: PlatformId): Promise<IntegrationStatusResponse> {
        const routes = PLATFORM_ROUTES[platform];
        const response = await apiClient.get<IntegrationStatusResponse>(
            `${routes.integrationBaseUrl}/status`
        );
        return response.data;
    },

    /**
     * Disconnect a platform integration
     */
    async disconnect(platform: PlatformId): Promise<DisconnectResponse> {
        const routes = PLATFORM_ROUTES[platform];
        const response = await apiClient.delete<DisconnectResponse>(routes.integrationBaseUrl);
        return response.data;
    },

    /**
     * Get all platform statuses
     * Useful for dashboard/overview
     */
    async getAllStatuses(): Promise<Record<PlatformId, IntegrationStatusResponse | null>> {
        const platforms: PlatformId[] = ['google', 'facebook', 'tiktok', 'line'];
        const results: Record<PlatformId, IntegrationStatusResponse | null> = {
            google: null,
            facebook: null,
            tiktok: null,
            line: null,
        };

        // Fetch all in parallel, handle individual failures gracefully
        const promises = platforms.map(async (platform) => {
            try {
                results[platform] = await this.getStatus(platform);
            } catch (error) {
                console.warn(`[IntegrationService] Failed to get status for ${platform}:`, error);
                results[platform] = null;
            }
        });

        await Promise.all(promises);
        return results;
    },

    // ============================================
    // Platform-Specific Methods (TikTok Sandbox)
    // ============================================

    /**
     * Check if TikTok is in sandbox mode
     */
    async isTikTokSandbox(): Promise<boolean> {
        const response = await this.getAuthUrl('tiktok');
        return response.isSandbox === true;
    },

    /**
     * Connect TikTok sandbox account (when in sandbox mode)
     */
    async connectTikTokSandbox(): Promise<CompleteConnectionResponse> {
        const response = await apiClient.post<CompleteConnectionResponse>(
            '/auth/tiktok/connect-sandbox'
        );
        return response.data;
    },

    // ============================================
    // Sync Operations
    // ============================================

    /**
     * Trigger manual sync for Google Ads
     */
    async syncGoogleAds(): Promise<{ success: boolean; message: string }> {
        const response = await apiClient.post('/integrations/google-ads/sync');
        return response.data;
    },
};

// ============================================
// Helper: Parse OAuth Callback
// ============================================

export interface OAuthCallbackParams {
    status?: string;
    tempToken?: string;
    platform?: string;
    error?: string;
}

/**
 * Parse OAuth callback query parameters from URL
 */
export function parseOAuthCallback(searchParams: URLSearchParams): OAuthCallbackParams {
    return {
        status: searchParams.get('status') || undefined,
        tempToken: searchParams.get('tempToken') || undefined,
        platform: searchParams.get('platform') || undefined,
        error: searchParams.get('error') || undefined,
    };
}

/**
 * Check if URL contains OAuth callback parameters
 */
export function isOAuthCallback(searchParams: URLSearchParams): boolean {
    return !!(searchParams.get('tempToken') || searchParams.get('error'));
}
