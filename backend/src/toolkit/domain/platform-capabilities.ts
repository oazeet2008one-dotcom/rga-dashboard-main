/**
 * =============================================================================
 * Platform Capabilities Registry
 * =============================================================================
 * 
 * Drives valid actions (CLI choices, seeding checks) dynamically.
 * Eliminates hardcoded validation lists.
 */

import { ToolkitPlatform, ALL_TOOLKIT_PLATFORMS } from './platform.types';

export interface PlatformCapabilityDef {
    readonly label: string;
    readonly icon: string;
    readonly isSeedable: boolean;     // Can be the target of "seed-data"
    readonly isSimulatable: boolean;  // Has ad-simulator logic (metrics generation)
}

export const PLATFORM_CAPABILITIES: Record<ToolkitPlatform, PlatformCapabilityDef> = {
    [ToolkitPlatform.GoogleAds]: {
        label: 'Google Ads',
        icon: '🔍',
        isSeedable: true,
        isSimulatable: true
    },
    [ToolkitPlatform.Facebook]: {
        label: 'Facebook',
        icon: '📘',
        isSeedable: true,
        isSimulatable: true
    },
    [ToolkitPlatform.TikTok]: {
        label: 'TikTok',
        icon: '🎵',
        isSeedable: true,
        isSimulatable: true
    },
    [ToolkitPlatform.LineAds]: {
        label: 'LINE Ads',
        icon: '💬',
        isSeedable: true,
        isSimulatable: true
    },
    [ToolkitPlatform.Shopee]: {
        label: 'Shopee Ads',
        icon: '🛒',
        isSeedable: true,
        isSimulatable: true
    },
    [ToolkitPlatform.Lazada]: {
        label: 'Lazada Ads',
        icon: '🛍️',
        isSeedable: true,
        isSimulatable: true
    },
    [ToolkitPlatform.Instagram]: {
        label: 'Instagram Ads',
        icon: 'IG',
        isSeedable: false,
        isSimulatable: false
    },
    [ToolkitPlatform.GoogleAnalytics]: {
        label: 'Google Analytics',
        icon: '📊',
        isSeedable: false, // Cannot be seeded via ad-simulator
        isSimulatable: false
    }
};

// Derived Helpers
export const SEEDABLE_PLATFORMS = ALL_TOOLKIT_PLATFORMS.filter(
    p => PLATFORM_CAPABILITIES[p].isSeedable
);

export const SIMULATABLE_PLATFORMS = ALL_TOOLKIT_PLATFORMS.filter(
    p => PLATFORM_CAPABILITIES[p].isSimulatable
);
