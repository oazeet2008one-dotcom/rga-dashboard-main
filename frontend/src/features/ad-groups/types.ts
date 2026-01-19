// Ad Groups Types and Interfaces
// Matches Backend AdGroup entity

// =============================================================================
// Enums
// =============================================================================

export type AdGroupStatus = 'active' | 'paused' | 'deleted' | 'archived';

// =============================================================================
// Main Entity Interface
// =============================================================================

export interface AdGroup {
    id: string;
    name: string;
    status: AdGroupStatus;
    campaignId: string;
    tenantId?: string;
    externalId?: string;
    budget?: number | null;
    bidAmount?: number | null;
    bidType?: string | null;
    targeting?: Record<string, unknown> | null;
    createdAt?: string;
    updatedAt?: string;
    // Populated from backend include
    campaign?: {
        id: string;
        name: string;
        platform: string;
        status?: string;
    };
}

// =============================================================================
// Form Value Interfaces
// =============================================================================

export interface CreateAdGroupFormValues {
    name: string;
    campaignId: string;
    status?: AdGroupStatus;
    budget?: number;
    bidAmount?: number;
    bidType?: string;
    targeting?: Record<string, unknown>;
    externalId?: string;
}

export type UpdateAdGroupFormValues = Partial<Omit<CreateAdGroupFormValues, 'campaignId'>>;

// =============================================================================
// API Response Types
// =============================================================================

export interface AdGroupListResponse {
    data: AdGroup[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
