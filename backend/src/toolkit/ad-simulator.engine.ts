/**
 * =============================================================================
 * Ad Simulator Engine
 * =============================================================================
 *
 * A dedicated, reusable service class that encapsulates ALL simulation logic
 * for generating realistic ad performance data. This engine applies:
 *
 * 1. Seasonality: Weekend vs Weekday performance variations (platform-specific)
 * 2. Trend Profiles: Growth, Decline, or Stable patterns over time
 * 3. Random Noise: Natural variance to prevent artificially smooth graphs
 * 4. Funnel Logic: Strict CTR/CVR relationships with platform-specific ranges
 *
 * Design Principles:
 * - Interface-First: All inputs/outputs are strongly typed
 * - No DB Dependency: Returns plain objects (Prisma import for AdPlatform only)
 * - Math Safety: Uses centralized utilities for division/float operations
 * - Realism: Outputs mimic real ad platform performance patterns
 * - Multi-Platform: Supports Google, Facebook, TikTok, LINE, Shopee, Lazada
 *
 * Usage:
 *   const engine = new AdSimulatorEngine();
 *
 *   // Default (Google Ads behavior)
 *   const metrics = engine.generateDailyMetrics({
 *     date: new Date(),
 *     trendProfile: 'GROWTH',
 *     baseImpressions: 10000,
 *   });
 *
 *   // TikTok-specific simulation (10x impressions, lower CTR)
 *   const tiktokMetrics = engine.generateDailyMetrics({
 *     date: new Date(),
 *     trendProfile: 'GROWTH',
 *     baseImpressions: 10000,
 *     platform: AdPlatform.TIKTOK,
 *   });
 *
 * =============================================================================
 */

import { faker } from '@faker-js/faker';
import { isWeekend } from 'date-fns';
import { ToolkitPlatform } from './domain/platform.types';
import {
    safeDiv,
    safeFloat,
    safeCtr,
    safeCpc,
    safeRoas,
    safeConversionRate,
} from '../utils/math-safety.util';
import {
    getPlatformConfig,
    PlatformSimulationConfig,
} from './platform-configs';

// =============================================================================
// EXPORTED INTERFACES
// =============================================================================

/**
 * Input parameters for generating daily ad metrics.
 */
export interface SimulationParams {
    /** The date for which to generate metrics */
    date: Date;

    /** The trend profile determining growth/decline patterns */
    trendProfile: 'GROWTH' | 'DECLINE' | 'STABLE' | 'SPIKE';

    /** The baseline anchor for impressions (before modifiers) */
    baseImpressions: number;

    /**
     * Optional: Day index within the simulation period (0-based).
     * Used for calculating trend progression. Defaults to 0.
     */
    dayIndex?: number;

    /**
     * Optional: Total number of days in the simulation period.
     * Used for normalizing trend effects. Defaults to 30.
     */
    totalDays?: number;

    /**
     * Optional: The ad platform to simulate.
     * Different platforms have unique CTR, CPC, CVR, AOV ranges,
     * impression multipliers, and weekend behavior.
     * Defaults to GOOGLE_ADS for backward compatibility.
     */
    platform?: ToolkitPlatform;
}

/**
 * Output interface representing a complete set of daily ad metrics.
 * All count metrics (impressions, clicks, conversions) are integers.
 * All money/rate metrics are 2-decimal floats.
 */
export interface DailyMetrics {
    /** Total ad impressions (integer) */
    impressions: number;

    /** Total clicks (integer, <= impressions) */
    clicks: number;

    /** Total ad spend in currency units (2-decimal float) */
    cost: number;

    /** Total conversions (integer, <= clicks) */
    conversions: number;

    /** Total revenue from conversions (2-decimal float) */
    revenue: number;

    /** Click-Through Rate as percentage (2-decimal float) */
    ctr: number;

    /** Cost Per Click in currency units (2-decimal float) */
    cpc: number;

    /** Conversion Rate as percentage (2-decimal float) */
    cvr: number;

    /** Return On Ad Spend ratio (2-decimal float) */
    roas: number;

    /** Average Order Value in currency units (2-decimal float) */
    aov: number;
}

// =============================================================================
// SIMULATION ENGINE CLASS
// =============================================================================

/**
 * AdSimulatorEngine encapsulates all math and randomization logic
 * for generating realistic daily ad performance metrics.
 *
 * The engine applies a deterministic pipeline:
 * Base Impressions -> Seasonality -> Trend -> Noise -> Funnel Logic
 *
 * @example
 * ```typescript
 * const engine = new AdSimulatorEngine();
 *
 * // Generate metrics for a single day
 * const metrics = engine.generateDailyMetrics({
 *   date: new Date('2024-01-15'),
 *   trendProfile: 'GROWTH',
 *   baseImpressions: 10000,
 *   dayIndex: 14,
 *   totalDays: 30,
 * });
 *
 * console.log(metrics.impressions); // ~12500 (with growth + noise)
 * console.log(metrics.ctr);         // 2.5 - 4.0% range (Google Ads)
 * console.log(metrics.roas);        // 2.0 - 5.0 range
 *
 * // TikTok simulation (10x impressions, lower engagement)
 * const tiktokMetrics = engine.generateDailyMetrics({
 *   date: new Date('2024-01-15'),
 *   trendProfile: 'GROWTH',
 *   baseImpressions: 10000,
 *   dayIndex: 14,
 *   totalDays: 30,
 *   platform: ToolkitPlatform.TikTok,
 * });
 *
 * console.log(tiktokMetrics.impressions); // ~125000 (10x multiplier)
 * console.log(tiktokMetrics.ctr);         // 0.3 - 1.2% range (TikTok)
 * ```
 */
export class AdSimulatorEngine {
    // =========================================================================
    // CONFIGURATION CONSTANTS
    // =========================================================================

    /** Weekday performance multiplier (baseline) */
    private readonly WEEKDAY_FACTOR = 1.0;

    /** Weekend performance reduction (30% lower) - DEFAULT for Google Ads */
    private readonly WEEKEND_FACTOR = 0.7;

    /** Maximum daily growth rate for GROWTH profile */
    private readonly MAX_GROWTH_RATE = 0.5; // +50% over period

    /** Maximum daily decline rate for DECLINE profile */
    private readonly MAX_DECLINE_RATE = 0.4; // -40% over period

    /** Default noise variance percentage */
    private readonly DEFAULT_NOISE_VARIANCE = 0.1; // ±10%

    // =========================================================================
    // NOTE: Platform-specific CTR, CPC, CVR, AOV ranges are now defined in
    // platform-configs.ts. The following constants are kept as fallbacks
    // for backward compatibility and internal reference.
    // =========================================================================

    // CTR Realistic Ranges (Google Ads benchmarks - kept as fallback)
    private readonly CTR_MIN = 0.015; // 1.5%
    private readonly CTR_MAX = 0.045; // 4.5%

    // CPC Realistic Ranges (in currency units - kept as fallback)
    private readonly CPC_MIN = 0.5;
    private readonly CPC_MAX = 3.5;

    // CVR Realistic Ranges (kept as fallback)
    private readonly CVR_MIN = 0.02; // 2%
    private readonly CVR_MAX = 0.08; // 8%

    // AOV Realistic Ranges (kept as fallback)
    private readonly AOV_MIN = 50;
    private readonly AOV_MAX = 200;

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Returns the seasonality factor based on day of week and platform.
     * Different platforms have different weekend behavior:
     * - Google Ads: 30% lower on weekends (business queries drop)
     * - TikTok: 20% HIGHER on weekends (entertainment peaks)
     * - Shopee/Lazada: 10% higher on weekends (shopping time)
     *
     * @param date - The date to check
     * @param config - The platform configuration
     * @returns Multiplier based on platform weekend factor
     */
    private getSeasonalityFactor(
        date: Date,
        config: PlatformSimulationConfig,
    ): number {
        if (!isWeekend(date)) {
            return this.WEEKDAY_FACTOR; // Always 1.0 on weekdays
        }

        // Use platform-specific weekend factor, or default to class constant
        return config.weekendFactor ?? this.WEEKEND_FACTOR;
    }

    /**
     * Applies linear trend progression based on the trend profile.
     *
     * - GROWTH: Linearly increases up to MAX_GROWTH_RATE over the period
     * - DECLINE: Linearly decreases up to MAX_DECLINE_RATE over the period
     * - STABLE: Returns 1.0 (no change)
     * - SPIKE: Returns 1.0 normally, but with 5% chance of 5x spike
     *
     * @param baseValue - The value to apply trend to
     * @param trendProfile - The trend type
     * @param dayIndex - Current day in the period (0-based)
     * @param totalDays - Total days in the simulation period
     * @returns The trend-adjusted value
     */
    private applyTrend(
        baseValue: number,
        trendProfile: 'GROWTH' | 'DECLINE' | 'STABLE' | 'SPIKE',
        dayIndex: number,
        totalDays: number,
    ): number {
        // Normalize day index to 0-1 range
        const progress = safeDiv(dayIndex, Math.max(totalDays - 1, 1));

        let trendMultiplier = 1.0;

        switch (trendProfile) {
            case 'GROWTH':
                // Linear growth: 1.0 at start, up to 1.5 at end
                trendMultiplier = 1.0 + progress * this.MAX_GROWTH_RATE;
                break;

            case 'DECLINE':
                // Linear decline: 1.0 at start, down to 0.6 at end
                trendMultiplier = 1.0 - progress * this.MAX_DECLINE_RATE;
                break;

            case 'SPIKE':
                // Spike logic: 5% chance of 5x multiplier
                // Using faker to maintain determinism within the seed stream
                const isSpike = faker.datatype.boolean({ probability: 0.05 });
                trendMultiplier = isSpike ? 5.0 : 1.0;
                break;

            case 'STABLE':
            default:
                trendMultiplier = 1.0;
                break;
        }

        return safeFloat(baseValue * trendMultiplier);
    }

    /**
     * Applies random noise to a value to prevent artificially smooth graphs.
     * CRITICAL: This creates natural variance in the data.
     *
     * @param value - The base value to add noise to
     * @param variancePercent - The maximum variance (e.g., 0.1 for ±10%)
     * @returns The value with random noise applied
     */
    private applyNoise(
        value: number,
        variancePercent: number = this.DEFAULT_NOISE_VARIANCE,
    ): number {
        // Generate random factor between (1 - variance) and (1 + variance)
        // Using faker for consistent randomness patterns
        const noiseFactor = faker.number.float({
            min: 1 - variancePercent,
            max: 1 + variancePercent,
            fractionDigits: 4,
        });

        return safeFloat(value * noiseFactor);
    }

    /**
     * Applies funnel logic to convert impressions into downstream metrics.
     * Enforces strict funnel integrity: Clicks <= Impressions, Conversions <= Clicks
     *
     * Uses platform-specific ranges for CTR, CPC, CVR, and AOV.
     * Each platform has different typical performance characteristics.
     *
     * @param impressions - The final impression count after all modifiers
     * @param config - The platform configuration with rate ranges
     * @returns Partial DailyMetrics with all funnel-derived values
     */
    private applyFunnel(
        impressions: number,
        config: PlatformSimulationConfig,
    ): Partial<DailyMetrics> {
        // Generate daily CTR within platform-specific range
        const dailyCtr = faker.number.float({
            min: config.ctrRange[0],
            max: config.ctrRange[1],
            fractionDigits: 4,
        });

        // Generate daily CPC within platform-specific range
        const dailyCpc = faker.number.float({
            min: config.cpcRange[0],
            max: config.cpcRange[1],
            fractionDigits: 2,
        });

        // Generate daily CVR within platform-specific range
        const dailyCvr = faker.number.float({
            min: config.cvrRange[0],
            max: config.cvrRange[1],
            fractionDigits: 4,
        });

        // Generate daily AOV within platform-specific range
        const dailyAov = faker.number.float({
            min: config.aovRange[0],
            max: config.aovRange[1],
            fractionDigits: 2,
        });

        // =====================================================================
        // FUNNEL CALCULATIONS (with strict integrity constraints)
        // =====================================================================

        // Clicks = Impressions * CTR (MUST be <= Impressions)
        const rawClicks = impressions * dailyCtr;
        const clicks = Math.min(Math.floor(rawClicks), impressions);

        // Cost = Clicks * CPC
        const cost = safeFloat(clicks * dailyCpc);

        // Conversions = Clicks * CVR (MUST be <= Clicks)
        const rawConversions = clicks * dailyCvr;
        const conversions = Math.min(Math.floor(rawConversions), clicks);

        // Revenue = Conversions * AOV
        const revenue = safeFloat(conversions * dailyAov);

        // =====================================================================
        // DERIVED METRICS (using math-safety utilities)
        // =====================================================================

        // Actual CTR based on realized clicks (may differ slightly from dailyCtr)
        const actualCtr = safeCtr(clicks, impressions);

        // Actual CPC based on realized cost and clicks
        const actualCpc = safeCpc(cost, clicks);

        // Actual CVR based on realized conversions and clicks
        const actualCvr = safeConversionRate(conversions, clicks);

        // ROAS = Revenue / Cost
        const roas = safeRoas(revenue, cost);

        // Actual AOV based on realized revenue and conversions
        const actualAov = safeDiv(revenue, conversions);

        return {
            clicks,
            cost: this.roundToTwoDecimals(cost),
            conversions,
            revenue: this.roundToTwoDecimals(revenue),
            ctr: this.roundToTwoDecimals(actualCtr),
            cpc: this.roundToTwoDecimals(actualCpc),
            cvr: this.roundToTwoDecimals(actualCvr),
            roas: this.roundToTwoDecimals(roas),
            aov: this.roundToTwoDecimals(actualAov),
        };
    }

    /**
     * Rounds a number to exactly 2 decimal places.
     * Used for money and rate metrics.
     *
     * @param value - The value to round
     * @returns The value rounded to 2 decimal places
     */
    private roundToTwoDecimals(value: number): number {
        return Math.round(value * 100) / 100;
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Generates a complete set of daily ad metrics based on simulation parameters.
     *
     * Processing Pipeline:
     * 1. Start with baseImpressions
     * 2. Apply seasonality factor (weekend reduction)
     * 3. Apply trend progression (growth/decline)
     * 4. Apply random noise (±10% variance)
     * 5. Calculate funnel metrics (clicks, cost, conversions, revenue)
     * 6. Derive rate metrics (CTR, CPC, CVR, ROAS, AOV)
     *
     * @param params - The simulation parameters
     * @returns Complete DailyMetrics object with all calculated values
     *
     * @example
     * ```typescript
     * const engine = new AdSimulatorEngine();
     * const metrics = engine.generateDailyMetrics({
     *   date: new Date('2024-01-15'),
     *   trendProfile: 'GROWTH',
     *   baseImpressions: 10000,
     *   dayIndex: 7,
     *   totalDays: 30,
     * });
     * ```
     */
    public generateDailyMetrics(params: SimulationParams): DailyMetrics {
        const {
            date,
            trendProfile,
            baseImpressions,
            dayIndex = 0,
            totalDays = 30,
            platform,
        } = params;

        // =====================================================================
        // STEP 0: Resolve Platform Configuration
        // Defaults to GOOGLE_ADS for backward compatibility
        // =====================================================================
        const config = getPlatformConfig(platform);

        // =====================================================================
        // STEP 1: Apply Platform Impression Multiplier
        // TikTok = 10x, Facebook = 2x, Shopee = 0.8x, etc.
        // =====================================================================
        const platformAdjustedImpressions =
            baseImpressions * config.impressionMultiplier;

        // =====================================================================
        // STEP 2: Apply Seasonality (platform-specific weekend factor)
        // =====================================================================
        const seasonalityFactor = this.getSeasonalityFactor(date, config);
        const afterSeasonality = platformAdjustedImpressions * seasonalityFactor;

        // =====================================================================
        // STEP 3: Apply Trend
        // =====================================================================
        const afterTrend = this.applyTrend(
            afterSeasonality,
            trendProfile,
            dayIndex,
            totalDays,
        );

        // =====================================================================
        // STEP 4: Apply Noise (CRITICAL for realistic graphs)
        // =====================================================================
        const afterNoise = this.applyNoise(afterTrend);

        // =====================================================================
        // STEP 5: Finalize Impressions (ensure integer)
        // =====================================================================
        const finalImpressions = Math.max(0, Math.floor(afterNoise));

        // =====================================================================
        // STEP 6: Apply Funnel Logic (with platform-specific ranges)
        // =====================================================================
        const funnelMetrics = this.applyFunnel(finalImpressions, config);

        // =====================================================================
        // STEP 7: Return Complete Metrics Object
        // =====================================================================
        return {
            impressions: finalImpressions,
            clicks: funnelMetrics.clicks ?? 0,
            cost: funnelMetrics.cost ?? 0,
            conversions: funnelMetrics.conversions ?? 0,
            revenue: funnelMetrics.revenue ?? 0,
            ctr: funnelMetrics.ctr ?? 0,
            cpc: funnelMetrics.cpc ?? 0,
            cvr: funnelMetrics.cvr ?? 0,
            roas: funnelMetrics.roas ?? 0,
            aov: funnelMetrics.aov ?? 0,
        };
    }

    /**
     * Generates metrics for a date range.
     * Convenience method for batch generation.
     *
     * @param startDate - The start date of the range
     * @param endDate - The end date of the range (inclusive)
     * @param trendProfile - The trend profile to apply
     * @param baseImpressions - The baseline impression anchor
     * @param platform - Optional: The ad platform to simulate (defaults to GOOGLE_ADS)
     * @returns Array of DailyMetrics, one per day in the range
     *
     * @example
     * ```typescript
     * // Generate 30 days of TikTok metrics
     * const metrics = engine.generateDateRangeMetrics(
     *   startDate,
     *   endDate,
     *   'GROWTH',
     *   10000,
     *   AdPlatform.TIKTOK,
     * );
     * ```
     */
    public generateDateRangeMetrics(
        startDate: Date,
        endDate: Date,
        trendProfile: 'GROWTH' | 'DECLINE' | 'STABLE' | 'SPIKE',
        baseImpressions: number,
        platform?: ToolkitPlatform,
    ): { date: Date; metrics: DailyMetrics }[] {
        const results: { date: Date; metrics: DailyMetrics }[] = [];

        // Calculate total days in range
        const msPerDay = 24 * 60 * 60 * 1000;
        const totalDays =
            Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) +
            1;

        // Generate metrics for each day
        const current = new Date(startDate);
        let dayIndex = 0;

        while (current <= endDate) {
            const metrics = this.generateDailyMetrics({
                date: new Date(current),
                trendProfile,
                baseImpressions,
                dayIndex,
                totalDays,
                platform, // Pass platform through to daily generator
            });

            results.push({
                date: new Date(current),
                metrics,
            });

            current.setDate(current.getDate() + 1);
            dayIndex++;
        }

        return results;
    }
}
