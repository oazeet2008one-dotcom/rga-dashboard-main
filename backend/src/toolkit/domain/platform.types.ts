/**
 * =============================================================================
 * Platform Identity Domain Types
 * =============================================================================
 * 
 * DESIGN:
 * This is the Canonical Source of Truth for Platform Identity in the Toolkit.
 * It is DECOUPLED from the Database Schema (AdPlatform).
 * 
 * Rules:
 * 1. Do NOT import @prisma/client here.
 * 2. Add new platforms here FIRST, then map them in PlatformMapper.
 */

export enum ToolkitPlatform {
    GoogleAds = 'GOOGLE_ADS',
    Facebook = 'FACEBOOK',
    TikTok = 'TIKTOK',
    LineAds = 'LINE_ADS',
    GoogleAnalytics = 'GOOGLE_ANALYTICS',
    Shopee = 'SHOPEE',
    Lazada = 'LAZADA',
    Instagram = 'INSTAGRAM',
}

// Runtime list helper
export const ALL_TOOLKIT_PLATFORMS = Object.values(ToolkitPlatform);
