// src/lib/token-manager.ts
// =============================================================================
// Standalone Token Storage Module
// NO imports from auth-store or api-client to avoid circular dependency
// =============================================================================

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

function normalizeToken(token: string | null): string | null {
    if (!token) return null;
    const trimmed = token.trim();
    if (!trimmed) return null;
    if (trimmed === 'undefined' || trimmed === 'null') return null;

    const withoutBearerPrefix = trimmed.toLowerCase().startsWith('bearer ')
        ? trimmed.slice('bearer '.length).trim()
        : trimmed;

    if (!withoutBearerPrefix) return null;
    if (/\s/.test(withoutBearerPrefix)) return null;

    return withoutBearerPrefix;
}

function isProbablyJwt(token: string): boolean {
    if (!token) return false;
    if (/\s/.test(token)) return false;
    return token.split('.').length === 3;
}

export interface TokenPair {
    accessToken: string | null;
    refreshToken: string | null;
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
    try {
        return normalizeToken(localStorage.getItem(ACCESS_TOKEN_KEY));
    } catch {
        return null;
    }
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
    try {
        return normalizeToken(localStorage.getItem(REFRESH_TOKEN_KEY));
    } catch {
        return null;
    }
}

/**
 * Get both tokens as a pair
 */
export function getTokens(): TokenPair {
    return {
        accessToken: getAccessToken(),
        refreshToken: getRefreshToken(),
    };
}

/**
 * Store both tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken: string): void {
    try {
        const normalizedAccessToken = normalizeToken(accessToken);
        const normalizedRefreshToken = normalizeToken(refreshToken);

        if (normalizedAccessToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, normalizedAccessToken);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }

        if (normalizedRefreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, normalizedRefreshToken);
        } else {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    } catch (error) {
        console.error('Failed to store tokens:', error);
    }
}

/**
 * Clear all tokens from localStorage (logout)
 */
export function clearTokens(): void {
    try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to clear tokens:', error);
    }
}

/**
 * Check if user has a valid access token
 */
export function hasToken(): boolean {
    const token = getAccessToken();
    return !!token && isProbablyJwt(token);
}
