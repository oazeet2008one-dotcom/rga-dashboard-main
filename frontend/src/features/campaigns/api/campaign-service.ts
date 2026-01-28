// Campaign Service with Adapter Pattern
// Normalizes Backend UPPERCASE enums to Frontend lowercase types
// Supports time-window filtering via startDate/endDate params

import { apiClient } from '@/services/api-client';
import type { Campaign, CampaignStatus, CampaignPlatform } from '../types';
import type { CreateCampaignFormData } from '../types/schema';

// =============================================================================
// Query Parameters Interface
// =============================================================================

export interface CampaignQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    platform?: string;
    status?: string;
    sortBy?: 'name' | 'createdAt' | 'status' | 'platform';
    sortOrder?: 'asc' | 'desc';
    /** List of Campaign IDs to filter by */
    ids?: string[];
    /** Metrics aggregation start date (ISO 8601: YYYY-MM-DD) */
    startDate?: string;
    /** Metrics aggregation end date (ISO 8601: YYYY-MM-DD) */
    endDate?: string;
}

// =============================================================================
// Paginated Response Interface
// =============================================================================

// =============================================================================
// Summary Metrics Interface
// =============================================================================

export interface CampaignSummaryMetrics {
    spend: number;
    budget: number;
    impressions: number;
    clicks: number;
    revenue: number;
    conversions: number;
    roas: number;
    roi: number;
    ctr: number;
    cpc: number;
    cpm: number;
}

export interface CampaignListResponse {
    data: Campaign[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        startDate?: string;
        endDate?: string;
    };
    summary?: CampaignSummaryMetrics;
}

// =============================================================================
// Backend Response Types (Raw API Response)
// =============================================================================

interface BackendCampaign {
    id: string;
    name: string;
    status: string;      // UPPERCASE: "ACTIVE", "PAUSED", "DRAFT", etc.
    platform: string;    // UPPERCASE: "GOOGLE_ADS", "FACEBOOK", "TIKTOK"
    budget: number;
    spend?: number;
    impressions?: number;
    clicks?: number;
    startDate: string;
    endDate?: string;
    externalId?: string;
    // Calculated metrics from backend
    ctr?: number;
    cpc?: number;
    cpm?: number;
    roas?: number;
    roi?: number;
    revenue?: number;
    conversions?: number;
}

// =============================================================================
// Adapter: Platform Mapping (Backend -> Frontend)
// =============================================================================

const PLATFORM_MAP: Record<string, CampaignPlatform> = {
    GOOGLE_ADS: 'google',
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
    TIKTOK: 'tiktok',
    LINE_ADS: 'line',
};

// Reverse mapping for POST requests (Frontend -> Backend)
const PLATFORM_REVERSE_MAP: Record<CampaignPlatform, string> = {
    google: 'GOOGLE_ADS',
    facebook: 'FACEBOOK',
    tiktok: 'TIKTOK',
    line: 'LINE_ADS',
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
        spent: raw.spend ?? 0,
        impressions: raw.impressions ?? 0,
        clicks: raw.clicks ?? 0,
        startDate: raw.startDate,
        endDate: raw.endDate ?? '',
        // Calculated metrics from backend
        ctr: raw.ctr ?? 0,
        cpc: raw.cpc ?? 0,
        cpm: raw.cpm ?? 0,
        roas: raw.roas ?? 0,
        roi: raw.roi ?? 0,
        revenue: raw.revenue ?? 0,
        conversions: raw.conversions ?? 0,
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
     * Fetch all campaigns with optional filtering and time-window metrics
     * 
     * @param params - Query parameters including pagination, filters, and date range
     * @returns Array of normalized campaigns
     */
    async getCampaigns(params: CampaignQueryParams = {}): Promise<Campaign[]> {
        // Build query string from params
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.set('page', String(params.page));
        if (params.limit) queryParams.set('limit', String(params.limit));
        if (params.search) queryParams.set('search', params.search);
        if (params.platform) queryParams.set('platform', params.platform);
        if (params.status) queryParams.set('status', params.status);
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

        // Time-window filtering
        if (params.startDate) queryParams.set('startDate', params.startDate);
        if (params.endDate) queryParams.set('endDate', params.endDate);
        if (params.ids && params.ids.length > 0) queryParams.set('ids', params.ids.join(','));

        const queryString = queryParams.toString();
        const url = queryString ? `/campaigns?${queryString}` : '/campaigns';

        const response = await apiClient.get(url);
        const rawData = response.data;

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

        return items.map(normalizeCampaign);
    },

    /**
     * Fetch campaigns with full pagination metadata
     */
    async getCampaignsPaginated(params: CampaignQueryParams = {}): Promise<CampaignListResponse> {
        const queryParams = new URLSearchParams();

        if (params.page) queryParams.set('page', String(params.page));
        if (params.limit) queryParams.set('limit', String(params.limit));
        if (params.search) queryParams.set('search', params.search);
        if (params.platform) queryParams.set('platform', params.platform);
        if (params.status) queryParams.set('status', params.status);
        if (params.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
        if (params.startDate) queryParams.set('startDate', params.startDate);
        if (params.endDate) queryParams.set('endDate', params.endDate);
        if (params.ids && params.ids.length > 0) queryParams.set('ids', params.ids.join(','));

        const queryString = queryParams.toString();
        const url = queryString ? `/campaigns?${queryString}` : '/campaigns';

        const response = await apiClient.get(url);
        const rawData = response.data;

        // Handle paginated response structure
        let items: BackendCampaign[] = [];
        let meta = { page: 1, limit: 10, total: 0, totalPages: 1 };
        let summary: CampaignSummaryMetrics | undefined;

        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            items = rawData.data || rawData.items || [];
            meta = rawData.meta || meta;
            if ('summary' in rawData) {
                summary = rawData.summary;
            }
        } else if (Array.isArray(rawData)) {
            items = rawData;
            meta = { page: 1, limit: items.length, total: items.length, totalPages: 1 };
        }

        return {
            data: items.map(normalizeCampaign),
            meta,
            summary,
        };
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
