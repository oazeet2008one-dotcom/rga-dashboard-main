// Campaign Module Type Definitions

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';
export type CampaignPlatform = 'facebook' | 'google' | 'tiktok';

export interface Campaign {
    id: string;
    name: string;
    status: CampaignStatus;
    budget: number;
    spent: number;
    impressions: number;
    clicks: number;
    startDate: string; // ISO date string
    endDate: string;   // ISO date string
    platform: CampaignPlatform;
}

// Status badge styling configuration
export const STATUS_STYLES: Record<CampaignStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    paused: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    completed: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    draft: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
};

// Platform display names
export const PLATFORM_LABELS: Record<CampaignPlatform, string> = {
    facebook: 'Facebook',
    google: 'Google Ads',
    tiktok: 'TikTok',
};
