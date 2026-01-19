// Campaign Service with Adapter Pattern
// Normalizes Backend UPPERCASE enums to Frontend lowercase types

import { apiClient } from '@/services/api-client';
import type { Campaign, CampaignStatus, CampaignPlatform } from '../types';
import type { CreateCampaignFormData } from '../types/schema';

// =============================================================================
// Backend Response Types (Raw API Response)
// =============================================================================
interface BackendCampaign {
    id: string;
    name: string;
    status: string;      // UPPERCASE: "ACTIVE", "PAUSED", "DRAFT", etc.
    platform: string;    // UPPERCASE: "GOOGLE_ADS", "FACEBOOK", "TIKTOK"
    budget: number;
    spent?: number;
    impressions?: number;
    clicks?: number;
    startDate: string;
    endDate?: string;
    externalId?: string;
}

interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}

// =============================================================================
// Adapter: Platform Mapping (Backend -> Frontend)
// =============================================================================
const PLATFORM_MAP: Record<string, CampaignPlatform> = {
    GOOGLE_ADS: 'google',
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
    TIKTOK: 'tiktok',
    LINE_ADS: 'google', // Fallback for unsupported platforms
};

// Reverse mapping for POST requests (Frontend -> Backend)
const PLATFORM_REVERSE_MAP: Record<CampaignPlatform, string> = {
    google: 'GOOGLE_ADS',
    facebook: 'FACEBOOK',
    tiktok: 'TIKTOK',
};

// =============================================================================
// Adapter: Status Mapping (Backend -> Frontend)
// =============================================================================
const STATUS_MAP: Record<string, CampaignStatus> = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    DRAFT: 'draft',
    COMPLETED: 'completed',
    PENDING: 'draft',    // Map PENDING to draft for UI
    DELETED: 'paused',   // Map DELETED to paused for UI
    ENDED: 'completed',  // Map ENDED to completed for UI
};

// Reverse mapping for POST requests (Frontend -> Backend)
const STATUS_REVERSE_MAP: Record<CampaignStatus, string> = {
    active: 'ACTIVE',
    paused: 'PAUSED',
    draft: 'DRAFT',
    completed: 'COMPLETED',
};

// =============================================================================
// Normalizer Function: Backend -> Frontend
// =============================================================================
function normalizeCampaign(raw: BackendCampaign): Campaign {
    return {
        id: raw.id,
        name: raw.name,
        status: STATUS_MAP[raw.status] || 'draft',
        platform: PLATFORM_MAP[raw.platform] || 'google',
        budget: raw.budget ?? 0,
        spent: raw.spent ?? 0,
        impressions: raw.impressions ?? 0,
        clicks: raw.clicks ?? 0,
        startDate: raw.startDate,
        endDate: raw.endDate ?? '',
    };
}

// =============================================================================
// Payload Transformer: Frontend Form -> Backend DTO
// =============================================================================
interface CreateCampaignPayload {
    name: string;
    platform: string;
    status: string;
    budget: number;
    startDate: string;
    endDate?: string;
}

function toBackendPayload(formData: CreateCampaignFormData): CreateCampaignPayload {
    return {
        name: formData.name,
        platform: PLATFORM_REVERSE_MAP[formData.platform] || formData.platform.toUpperCase(),
        status: STATUS_REVERSE_MAP[formData.status] || formData.status.toUpperCase(),
        budget: formData.budget,
        startDate: formData.startDate.toISOString().split('T')[0], // YYYY-MM-DD
        endDate: formData.endDate
            ? formData.endDate.toISOString().split('T')[0]
            : undefined,
    };
}

// =============================================================================
// Service Functions
// =============================================================================
export const CampaignService = {
    /**
     * Fetch all campaigns with normalized data
     * Handles multiple API response formats with robust unwrapping
     */
    async getCampaigns(): Promise<Campaign[]> {
        const response = await apiClient.get('/campaigns');
        const rawData = response.data;

        // DEBUG: Log raw response to browser console
        console.log('[CampaignService] Raw API Response:', rawData);

        // Robust unwrapping for multiple response formats
        let items: BackendCampaign[] = [];

        if (Array.isArray(rawData)) {
            // Format 1: Direct array [...] (already unwrapped by api-client)
            items = rawData;
        } else if (rawData && typeof rawData === 'object') {
            if (Array.isArray(rawData.data)) {
                // Format 2: Wrapped { data: [...] }
                items = rawData.data;
            } else if (Array.isArray(rawData.items)) {
                // Format 3: Paginated { items: [...], total, page, limit }
                items = rawData.items;
            } else if (Array.isArray(rawData.campaigns)) {
                // Format 4: Named key { campaigns: [...] }
                items = rawData.campaigns;
            } else {
                console.warn('[CampaignService] Unexpected response structure:', rawData);
                items = [];
            }
        } else {
            console.warn('[CampaignService] Invalid response type:', typeof rawData);
            items = [];
        }

        console.log('[CampaignService] Extracted items count:', items.length);
        return items.map(normalizeCampaign);
    },

    /**
     * Fetch single campaign by ID
     */
    async getCampaignById(id: string): Promise<Campaign> {
        const response = await apiClient.get<BackendCampaign>(`/campaigns/${id}`);
        return normalizeCampaign(response.data);
    },

    /**
     * Create a new campaign
     * Transforms frontend form data to backend DTO format
     */
    async createCampaign(formData: CreateCampaignFormData): Promise<Campaign> {
        const payload = toBackendPayload(formData);
        const response = await apiClient.post<BackendCampaign>('/campaigns', payload);
        return normalizeCampaign(response.data);
    },

    /**
     * Update existing campaign
     */
    async updateCampaign(id: string, formData: Partial<CreateCampaignFormData>): Promise<Campaign> {
        const payload: Partial<CreateCampaignPayload> = {};

        if (formData.name) payload.name = formData.name;
        if (formData.platform) payload.platform = PLATFORM_REVERSE_MAP[formData.platform];
        if (formData.status) payload.status = STATUS_REVERSE_MAP[formData.status];
        if (formData.budget) payload.budget = formData.budget;
        if (formData.startDate) payload.startDate = formData.startDate.toISOString().split('T')[0];
        if (formData.endDate) payload.endDate = formData.endDate.toISOString().split('T')[0];

        const response = await apiClient.put<BackendCampaign>(`/campaigns/${id}`, payload);
        return normalizeCampaign(response.data);
    },

    /**
     * Delete campaign
     */
    async deleteCampaign(id: string): Promise<void> {
        await apiClient.delete(`/campaigns/${id}`);
    },

    /**
     * Toggle campaign status (active <-> paused)
     */
    async toggleCampaignStatus(id: string, currentStatus: CampaignStatus): Promise<Campaign> {
        const newStatus = currentStatus === 'active' ? 'PAUSED' : 'ACTIVE';
        const response = await apiClient.patch<BackendCampaign>(`/campaigns/${id}`, {
            status: newStatus,
        });
        return normalizeCampaign(response.data);
    },
};
