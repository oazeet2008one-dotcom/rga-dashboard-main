// =============================================================================
// Export Service - CSV Download with Authenticated Blob Response
// =============================================================================

import { apiClient } from '@/services/api-client';

// =============================================================================
// Types
// =============================================================================

export interface ExportCampaignsParams {
    startDate: string;
    endDate: string;
    platform?: string;
    status?: string;
}

// =============================================================================
// Endpoints
// =============================================================================

const EXPORT_ENDPOINTS = {
    CAMPAIGNS_CSV: '/export/campaigns',
} as const;

// =============================================================================
// API Functions
// =============================================================================

/**
 * Download campaigns report as CSV blob.
 * 
 * Uses `responseType: 'blob'` to handle binary file download.
 * The blob can then be converted to a downloadable file using
 * the useFileDownload hook.
 * 
 * @param params - Export parameters with date range and optional filters
 * @returns Promise<Blob> - The CSV file as a Blob
 * @throws AxiosError if request fails
 * 
 * @example
 * ```ts
 * const blob = await downloadCampaignsCsv({
 *   startDate: '2026-01-01',
 *   endDate: '2026-01-21',
 * });
 * downloadBlob(blob, 'campaigns.csv');
 * ```
 */
export async function downloadCampaignsCsv(
    params: ExportCampaignsParams
): Promise<Blob> {
    const { startDate, endDate, platform, status } = params;

    const response = await apiClient.get<Blob>(
        EXPORT_ENDPOINTS.CAMPAIGNS_CSV,
        {
            params: {
                startDate,
                endDate,
                ...(platform && { platform }),
                ...(status && { status }),
            },
            responseType: 'blob', // 🔑 Critical for binary file download
        }
    );

    return response.data;
}

// =============================================================================
// Service Object (Alternative Pattern)
// =============================================================================

export const exportService = {
    /**
     * Export campaigns to CSV
     */
    downloadCampaignsCsv,
} as const;

export default exportService;
