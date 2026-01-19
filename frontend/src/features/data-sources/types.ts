/**
 * Data Sources / Integrations Types
 * 
 * Standardized types for all ad platform integrations.
 * These match the backend's IntegrationStatusResponse format.
 */

// ============================================
// Platform Identifier
// ============================================

/**
 * Supported integration platforms
 */
export type PlatformId = 'google' | 'facebook' | 'tiktok' | 'line';

/**
 * Platform display configuration
 */
export interface PlatformConfig {
    id: PlatformId;
    name: string;
    icon: string;
    description: string;
    color: string;
}

/**
 * Platform configurations for UI
 */
export const PLATFORM_CONFIGS: Record<PlatformId, PlatformConfig> = {
    google: {
        id: 'google',
        name: 'Google Ads',
        icon: 'google',
        description: 'Connect your Google Ads account to sync campaigns and metrics',
        color: '#4285F4',
    },
    facebook: {
        id: 'facebook',
        name: 'Facebook Ads',
        icon: 'facebook',
        description: 'Connect your Facebook Ads account to sync campaigns',
        color: '#1877F2',
    },
    tiktok: {
        id: 'tiktok',
        name: 'TikTok Ads',
        icon: 'tiktok',
        description: 'Connect your TikTok Ads account to sync campaigns',
        color: '#000000',
    },
    line: {
        id: 'line',
        name: 'LINE Ads',
        icon: 'line',
        description: 'Connect your LINE Ads account to sync campaigns',
        color: '#00C300',
    },
};

// ============================================
// Account Types
// ============================================

/**
 * Connected account in standardized format
 */
export interface IntegrationAccount {
    /** Internal database UUID */
    id: string;
    /** Platform-specific ID (customerId, accountId, advertiserId) */
    externalId: string;
    /** Account display name */
    name: string;
    /** Account status (ACTIVE, ENABLED, PAUSED, etc.) */
    status: string;
}

/**
 * Temporary account returned during OAuth flow
 */
export interface TempAccount {
    /** Platform-specific ID */
    id: string;
    /** Account display name */
    name: string;
    /** Account status */
    status?: string;
    /** Account type (optional) */
    type?: string;
}

// ============================================
// Response Types
// ============================================

/**
 * Standardized integration status response
 * Matches backend IntegrationStatusResponse format
 */
export interface IntegrationStatusResponse {
    /** Whether any accounts are connected */
    isConnected: boolean;
    /** Last sync timestamp across all accounts */
    lastSyncAt: string | null;
    /** List of connected accounts in standardized format */
    accounts: IntegrationAccount[];
}

/**
 * Auth URL response (varies by platform)
 */
export interface AuthUrlResponse {
    /** OAuth URL to redirect user */
    url?: string;
    /** Auth URL alternative field (some platforms use authUrl) */
    authUrl?: string;
    /** Message for user */
    message?: string;
    /** Whether sandbox mode is active (TikTok) */
    isSandbox?: boolean;
    /** Sandbox connect endpoint (TikTok) */
    connectEndpoint?: string;
}

/**
 * Complete connection response
 */
export interface CompleteConnectionResponse {
    success: boolean;
    accountId: string;
    accountName?: string;
}

/**
 * Disconnect response
 */
export interface DisconnectResponse {
    success: boolean;
    message: string;
}

// ============================================
// UI State Types
// ============================================

/**
 * Integration card state for UI
 */
export interface IntegrationCardState {
    platform: PlatformConfig;
    status: IntegrationStatusResponse | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * OAuth flow state
 */
export interface OAuthFlowState {
    platform: PlatformId | null;
    step: 'idle' | 'redirecting' | 'selecting_account' | 'completing' | 'success' | 'error';
    tempToken: string | null;
    tempAccounts: TempAccount[];
    error: string | null;
}
