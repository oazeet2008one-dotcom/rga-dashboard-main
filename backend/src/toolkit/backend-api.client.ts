/**
 * =============================================================================
 * Backend API Client
 * =============================================================================
 *
 * A lightweight HTTP client for toolkit scripts to call backend APIs.
 * Handles authentication headers and error responses.
 *
 * Design Principles:
 * - Fail Fast: Throws immediately on HTTP errors
 * - Type Safe: Uses explicit interfaces for responses
 * - Environment Aware: Uses API_BASE_URL from env
 *
 * =============================================================================
 */

import * as dotenv from 'dotenv';
dotenv.config();

// =============================================================================
// EXPORTED INTERFACES
// =============================================================================

/**
 * Response from the alert trigger-check endpoint.
 */
export interface AlertTriggerResponse {
    success: boolean;
    message?: string;
    alertsCreated?: number;
    alertsTriggered?: Array<{
        id: string;
        title: string;
        severity: string;
        campaignName?: string;
    }>;
    error?: string;
}

/**
 * Generic API error response.
 */
export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default API base URL (local development).
 */
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

/**
 * Default request timeout in milliseconds.
 */
const DEFAULT_TIMEOUT_MS = 30000;

// =============================================================================
// BACKEND API CLIENT CLASS
// =============================================================================

/**
 * BackendApiClient provides HTTP utilities for calling backend APIs.
 *
 * @example
 * ```typescript
 * const apiClient = new BackendApiClient();
 *
 * const result = await apiClient.triggerAlertCheck(token, tenantId);
 * console.log(`Alerts created: ${result.alertsCreated}`);
 * ```
 */
export class BackendApiClient {
    private baseUrl: string;
    private timeoutMs: number;

    /**
     * Creates a new BackendApiClient instance.
     *
     * @param baseUrl - Optional override for API base URL
     * @param timeoutMs - Optional request timeout in ms
     */
    constructor(baseUrl?: string, timeoutMs?: number) {
        this.baseUrl = baseUrl || process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
        this.timeoutMs = timeoutMs || DEFAULT_TIMEOUT_MS;
    }

    /**
     * Triggers an alert check for the specified tenant.
     *
     * Calls: POST /api/v1/alerts/trigger-check
     *
     * @param token - JWT Bearer token for authentication
     * @param tenantId - Tenant ID to include in x-tenant-id header
     * @param timeframe - Optional timeframe (default: 'YESTERDAY')
     * @returns Alert trigger response with created alerts
     * @throws Error if request fails or returns non-2xx status
     *
     * @example
     * ```typescript
     * const result = await apiClient.triggerAlertCheck(token, tenantId);
     * if (result.alertsCreated > 0) {
     *   console.log('Alerts were triggered!');
     * }
     * ```
     */
    async triggerAlertCheck(
        token: string,
        tenantId: string,
        timeframe: string = 'YESTERDAY',
    ): Promise<AlertTriggerResponse> {
        const url = `${this.baseUrl}/api/v1/alerts/trigger-check`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-id': tenantId,
                },
                body: JSON.stringify({ timeframe }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage: string;

                try {
                    const errorJson = JSON.parse(errorText) as ApiErrorResponse;
                    errorMessage = errorJson.message || errorJson.error || response.statusText;
                } catch {
                    errorMessage = errorText || response.statusText;
                }

                throw new Error(
                    `API request failed: ${response.status} ${response.statusText} - ${errorMessage}`,
                );
            }

            const data = (await response.json()) as AlertTriggerResponse;
            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Request timeout after ${this.timeoutMs}ms`);
                }
                throw error;
            }

            throw new Error(`Unknown error: ${String(error)}`);
        }
    }

    /**
     * Health check: Verifies the API server is reachable.
     *
     * @returns true if server responds, false otherwise
     */
    async healthCheck(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Gets the configured base URL.
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }
}
