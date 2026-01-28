// Ad Groups Service with Adapter Pattern
// Normalizes Backend UPPERCASE enums to Frontend lowercase types

import { apiClient } from '@/services/api-client';
import type {
    AdGroup,
    AdGroupStatus,
    CreateAdGroupFormValues,
    UpdateAdGroupFormValues,
    AdGroupListResponse,
} from '../types';

// =============================================================================
// Backend Response Types (Raw API Response)
// =============================================================================
interface BackendAdGroup {
    id: string;
    name: string;
    status: string; // UPPERCASE: "ACTIVE", "PAUSED", "DELETED", "ARCHIVED"
    campaignId: string;
    tenantId?: string;
    externalId?: string | null;
    budget?: number | null;
    bidAmount?: number | null;
    bidType?: string | null;
    targeting?: Record<string, unknown> | null;
    createdAt?: string;
    updatedAt?: string;
    campaign?: {
        id: string;
        name: string;
        platform: string;
        status?: string;
    };
}

// =============================================================================
// Adapter: Status Mapping (Backend -> Frontend)
// =============================================================================
const STATUS_MAP: Record<string, AdGroupStatus> = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    DELETED: 'deleted',
    ARCHIVED: 'archived',
};

// Reverse mapping for POST/PATCH requests (Frontend -> Backend)
const STATUS_REVERSE_MAP: Record<AdGroupStatus, string> = {
    active: 'ACTIVE',
    paused: 'PAUSED',
    deleted: 'DELETED',
    archived: 'ARCHIVED',
};

// =============================================================================
// Normalizer Function: Backend -> Frontend
// =============================================================================
function normalizeAdGroup(raw: BackendAdGroup): AdGroup {
    return {
        id: raw.id,
        name: raw.name,
        status: STATUS_MAP[raw.status] || 'active',
        campaignId: raw.campaignId,
        tenantId: raw.tenantId,
        externalId: raw.externalId ?? undefined,
        budget: raw.budget,
        bidAmount: raw.bidAmount,
        bidType: raw.bidType,
        targeting: raw.targeting,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        campaign: raw.campaign,
    };
}

// =============================================================================
// Payload Transformer: Frontend Form -> Backend DTO
// =============================================================================
interface CreateAdGroupPayload {
    name: string;
    campaignId: string;
    status?: string;
    budget?: number;
    bidAmount?: number;
    bidType?: string;
    targeting?: Record<string, unknown>;
    externalId?: string;
}

function toBackendPayload(formData: CreateAdGroupFormValues): CreateAdGroupPayload {
    const payload: CreateAdGroupPayload = {
        name: formData.name,
        campaignId: formData.campaignId,
    };

    if (formData.status) {
        payload.status = STATUS_REVERSE_MAP[formData.status] || formData.status.toUpperCase();
    }
    if (formData.budget !== undefined) {
        payload.budget = formData.budget;
    }
    if (formData.bidAmount !== undefined) {
        payload.bidAmount = formData.bidAmount;
    }
    if (formData.bidType) {
        payload.bidType = formData.bidType;
    }
    if (formData.targeting) {
        payload.targeting = formData.targeting;
    }
    if (formData.externalId) {
        payload.externalId = formData.externalId;
    }

    return payload;
}

// =============================================================================
// Service Functions
// =============================================================================
export const AdGroupService = {
    /**
     * Fetch ad groups with optional campaignId filter
     * @param campaignId - Optional: Filter by parent campaign
     */
    async getAdGroups(campaignId?: string): Promise<AdGroup[]> {
        const params = campaignId ? { campaignId } : {};
        const response = await apiClient.get<AdGroupListResponse>('/ad-groups', { params });
        const rawData = response.data;

        // Handle different response formats
        let items: BackendAdGroup[] = [];

        if (Array.isArray(rawData)) {
            // Direct array (unwrapped by api-client)
            items = rawData;
        } else if (rawData && typeof rawData === 'object') {
            if (Array.isArray((rawData as AdGroupListResponse).data)) {
                // Standard paginated response { data: [...], meta: {...} }
                items = (rawData as AdGroupListResponse).data as unknown as BackendAdGroup[];
            } else if (Array.isArray((rawData as unknown as { items: BackendAdGroup[] }).items)) {
                // Legacy paginated { items: [...] }
                items = (rawData as unknown as { items: BackendAdGroup[] }).items;
            }
        }

        return items.map(normalizeAdGroup);
    },

    /**
     * Fetch single ad group by ID
     */
    async getAdGroupById(id: string): Promise<AdGroup> {
        const response = await apiClient.get<BackendAdGroup>(`/ad-groups/${id}`);
        return normalizeAdGroup(response.data);
    },

    /**
     * Create a new ad group
     * Transforms frontend form data to backend DTO format
     */
    async createAdGroup(formData: CreateAdGroupFormValues): Promise<AdGroup> {
        const payload = toBackendPayload(formData);
        const response = await apiClient.post<BackendAdGroup>('/ad-groups', payload);
        return normalizeAdGroup(response.data);
    },

    /**
     * Update existing ad group
     */
    async updateAdGroup(id: string, formData: UpdateAdGroupFormValues): Promise<AdGroup> {
        const payload: Partial<CreateAdGroupPayload> = {};

        if (formData.name) payload.name = formData.name;
        if (formData.status) payload.status = STATUS_REVERSE_MAP[formData.status];
        if (formData.budget !== undefined) payload.budget = formData.budget;
        if (formData.bidAmount !== undefined) payload.bidAmount = formData.bidAmount;
        if (formData.bidType !== undefined) payload.bidType = formData.bidType;
        if (formData.targeting !== undefined) payload.targeting = formData.targeting;
        if (formData.externalId !== undefined) payload.externalId = formData.externalId;

        const response = await apiClient.patch<BackendAdGroup>(`/ad-groups/${id}`, payload);
        return normalizeAdGroup(response.data);
    },

    /**
     * Delete ad group (soft delete)
     */
    async deleteAdGroup(id: string): Promise<void> {
        await apiClient.delete(`/ad-groups/${id}`);
    },

    /**
     * Toggle ad group status (active <-> paused)
     */
    async toggleAdGroupStatus(id: string, currentStatus: AdGroupStatus): Promise<AdGroup> {
        const newStatus = currentStatus === 'active' ? 'PAUSED' : 'ACTIVE';
        const response = await apiClient.patch<BackendAdGroup>(`/ad-groups/${id}`, {
            status: newStatus,
        });
        return normalizeAdGroup(response.data);
    },
};
