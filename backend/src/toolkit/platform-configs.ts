/**
 * =============================================================================
 * Platform Simulation Configurations
 * =============================================================================
 *
 * Configuration registry for multi-platform ad simulation.
 * Each platform has unique performance characteristics based on:
 * - Industry benchmarks (WordStream, Meta Business Suite, TikTok For Business)
 * - Thailand digital advertising market data
 *
 * Usage:
 *   import { PLATFORM_CONFIGS, getPlatformConfig } from './platform-configs';
 *   const config = getPlatformConfig(AdPlatform.TIKTOK);
 *   console.log(config.impressionMultiplier); // 10.0
 *
 * =============================================================================
 */

import { ToolkitPlatform } from './domain/platform.types';
import { PLATFORM_ALIASES as DOMAIN_PLATFORM_ALIASES } from './domain/platform-utils';

// =============================================================================
// INTERFACE DEFINITION
// =============================================================================

/**
 * Configuration interface controlling platform-specific simulation behavior.
 * These parameters adjust the funnel logic in AdSimulatorEngine.
 */
export interface PlatformSimulationConfig {
    /** Platform identifier for type safety */
    platform: ToolkitPlatform;

    /** Human-readable label */
    label: string;

    // =========================================================================
    // RATE RANGES (as decimals, e.g., 0.02 = 2%)
    // =========================================================================

    /** Click-Through Rate range [min, max] */
    ctrRange: [number, number];

    /** Cost Per Click range [min, max] in currency units (THB) */
    cpcRange: [number, number];

    /** Conversion Rate range [min, max] */
    cvrRange: [number, number];

    /** Average Order Value range [min, max] in currency units (THB) */
    aovRange: [number, number];

    // =========================================================================
    // VOLUME MODIFIERS
    // =========================================================================

    /**
     * Multiplier for base impressions.
     * E.g., TikTok = 10x because of massive reach + low engagement.
     */
    impressionMultiplier: number;

    // =========================================================================
    // BEHAVIORAL PROFILES (Optional)
    // =========================================================================

    /**
     * Weekend performance factor.
     * Default: 0.7 = 30% lower on weekends (business platforms).
     * TikTok: 1.2 = 20% higher on weekends (entertainment).
     */
    weekendFactor?: number;

    /**
     * Distribution profile for spend patterns.
     * - 'EVEN': Equal spend across day
     * - 'PEAK_EVENING': Higher spend 6pm-10pm
     * - 'PEAK_LUNCH': Higher spend 11am-2pm
     */
    distributionProfile?: 'EVEN' | 'PEAK_EVENING' | 'PEAK_LUNCH' | 'PEAK_MORNING';
}

// =============================================================================
// PLATFORM CONFIGURATIONS REGISTRY
// =============================================================================

/**
 * Platform Configuration Registry.
 * Provides benchmark parameters for each supported ad platform.
 *
 * Data Sources:
 * - Google Ads: WordStream industry benchmarks
 * - Facebook: Meta Business Suite averages
 * - TikTok: TikTok For Business 2024 benchmarks
 * - LINE Ads: Thailand digital advertising reports
 * - Shopee/Lazada: E-commerce platform advertising data
 */
// NOTE: We use Partial or specific Pick if we don't want to enforce all platforms
// But for now, we only implement the ones that are simulatable.
export const PLATFORM_CONFIGS: Record<string, PlatformSimulationConfig> = {
    // =========================================================================
    // GOOGLE ADS (BASELINE - matches original hardcoded values)
    // =========================================================================
    [ToolkitPlatform.GoogleAds]: {
        platform: ToolkitPlatform.GoogleAds,
        label: 'Google Ads',
        ctrRange: [0.015, 0.045],       // 1.5% - 4.5% (Search + Display blend)
        cpcRange: [0.5, 3.5],           // THB 0.50 - 3.50
        cvrRange: [0.02, 0.08],         // 2% - 8%
        aovRange: [50, 200],            // THB 50 - 200
        impressionMultiplier: 1.0,      // Baseline
        weekendFactor: 0.7,             // -30% on weekends
        distributionProfile: 'EVEN',
    },

    // =========================================================================
    // FACEBOOK (META)
    // High Impressions, Lower CTR, Good Conversion
    // =========================================================================
    [ToolkitPlatform.Facebook]: {
        platform: ToolkitPlatform.Facebook,
        label: 'Facebook',
        ctrRange: [0.008, 0.025],       // 0.8% - 2.5% (Feed scrolling)
        cpcRange: [0.3, 2.0],           // Cheaper clicks typically
        cvrRange: [0.015, 0.06],        // Slightly lower CVR than search
        aovRange: [40, 150],            // Lower AOV (impulse buys)
        impressionMultiplier: 2.5,      // Higher volume
        weekendFactor: 1.2,             // +20% on weekends (Leisure time)
        distributionProfile: 'PEAK_EVENING',
    },

    // =========================================================================
    // TIKTOK
    // Viral potential, Low CPC, Volatile
    // =========================================================================
    [ToolkitPlatform.TikTok]: {
        platform: ToolkitPlatform.TikTok,
        label: 'TikTok',
        ctrRange: [0.005, 0.03],        // 0.5% - 3%
        cpcRange: [0.2, 1.5],           // Very cheap clicks
        cvrRange: [0.01, 0.04],         // Harder to convert
        aovRange: [30, 100],            // Low ticket items
        impressionMultiplier: 3.0,      // Massive volume
        weekendFactor: 1.3,             // +30% on weekends
        distributionProfile: 'PEAK_EVENING',
    },

    // =========================================================================
    // LINE ADS
    // High Trust, Steady, Expensive
    // =========================================================================
    [ToolkitPlatform.LineAds]: {
        platform: ToolkitPlatform.LineAds,
        label: 'LINE Ads',
        ctrRange: [0.01, 0.03],         // 1% - 3%
        cpcRange: [1.0, 5.0],           // Expensive (thb)
        cvrRange: [0.03, 0.10],         // High conversion (Chat/Trust)
        aovRange: [100, 500],           // High AOV
        impressionMultiplier: 0.8,      // Lower volume
        weekendFactor: 0.9,             // Slight drop
        distributionProfile: 'PEAK_MORNING',
    },

    // =========================================================================
    // E-COMMERCE (SHOPEE/LAZADA)
    // High Intent, High CVR, Low CPC
    // =========================================================================
    [ToolkitPlatform.Shopee]: {
        platform: ToolkitPlatform.Shopee,
        label: 'Shopee Ads',
        ctrRange: [0.02, 0.06],
        cpcRange: [0.5, 3.0],
        cvrRange: [0.05, 0.15],         // High intent
        aovRange: [50, 300],
        impressionMultiplier: 1.2,
        weekendFactor: 1.5,             // Shopping peak
        distributionProfile: 'PEAK_EVENING'
    },
    [ToolkitPlatform.Lazada]: {
        platform: ToolkitPlatform.Lazada,
        label: 'Lazada Ads',
        ctrRange: [0.02, 0.05],
        cpcRange: [0.5, 2.5],
        cvrRange: [0.04, 0.12],
        aovRange: [50, 250],
        impressionMultiplier: 1.1,
        weekendFactor: 1.4,
        distributionProfile: 'PEAK_EVENING'
    },
};

/**
 * Retrieves platform configuration with fallback to Google Ads.
 * Ensures backward compatibility when platform is undefined.
 *
 * @param platform - The ad platform enum value (optional)
 * @returns The platform configuration (defaults to GOOGLE_ADS)
 */
export function getPlatformConfig(platform?: ToolkitPlatform): PlatformSimulationConfig {
    if (!platform) {
        return PLATFORM_CONFIGS[ToolkitPlatform.GoogleAds];
    }
    return PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS[ToolkitPlatform.GoogleAds];
}

/**
 * List of platforms that support simulation.
 */
export const SIMULATABLE_PLATFORMS: ToolkitPlatform[] = [
    ToolkitPlatform.GoogleAds,
    ToolkitPlatform.Facebook,
    ToolkitPlatform.TikTok,
    ToolkitPlatform.LineAds,
    ToolkitPlatform.Shopee,
    ToolkitPlatform.Lazada,
];

/**
 * Maps CLI shorthand names to ToolkitPlatform enum values.
 */
export const PLATFORM_ALIASES: Record<string, ToolkitPlatform> = DOMAIN_PLATFORM_ALIASES;

/**
 * Returns platform-specific emoji.
 */
export function getPlatformIcon(platform: ToolkitPlatform): string {
    const icons: Record<string, string> = {
        [ToolkitPlatform.GoogleAds]: '๐”',
        [ToolkitPlatform.Facebook]: '๐“',
        [ToolkitPlatform.TikTok]: '๐ต',
        [ToolkitPlatform.LineAds]: '๐’ฌ',
        [ToolkitPlatform.Shopee]: '๐’',
        [ToolkitPlatform.Lazada]: '๐๏ธ',
        [ToolkitPlatform.Instagram]: 'IG',
        [ToolkitPlatform.GoogleAnalytics]: '๐“',
    };
    return icons[platform] || '๐“';
}

