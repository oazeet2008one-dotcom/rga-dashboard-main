/**
 * =============================================================================
 * Math Safety Utility
 * =============================================================================
 *
 * Centralized math safety functions to prevent Division by Zero crashes.
 * These functions guard against Infinity, -Infinity, and NaN values that
 * would cause Postgres error 22P03 ("incorrect binary data format") when
 * saving to DECIMAL columns.
 *
 * Usage:
 *   import { safeFloat, safeDiv } from '@/utils/math-safety.util';
 *
 *   const ctr = safeDiv(clicks, impressions) * 100;
 *   const cpc = safeDiv(spend, clicks);
 *   const roas = safeDiv(revenue, spend);
 *
 * =============================================================================
 */

/**
 * Safely converts a number to a finite value.
 * Returns 0 if the value is Infinity, -Infinity, or NaN.
 *
 * @param val - The number to validate
 * @returns The original value if finite and not NaN, otherwise 0
 *
 * @example
 * safeFloat(100)      // 100
 * safeFloat(Infinity) // 0
 * safeFloat(NaN)      // 0
 * safeFloat(-Infinity) // 0
 */
export function safeFloat(val: number): number {
    return Number.isFinite(val) && !Number.isNaN(val) ? val : 0;
}

/**
 * Safely divides two numbers, preventing Division by Zero.
 * Returns 0 if the denominator is 0, or if the result is Infinity/NaN.
 *
 * @param numerator - The dividend
 * @param denominator - The divisor
 * @returns The division result if safe, otherwise 0
 *
 * @example
 * safeDiv(100, 50)  // 2
 * safeDiv(100, 0)   // 0
 * safeDiv(0, 0)     // 0
 * safeDiv(NaN, 10)  // 0
 */
export function safeDiv(numerator: number, denominator: number): number {
    if (denominator === 0) {
        return 0;
    }
    return safeFloat(numerator / denominator);
}

/**
 * Calculates CTR (Click-Through Rate) as a percentage.
 * Formula: (clicks / impressions) * 100
 *
 * @param clicks - Number of clicks
 * @param impressions - Number of impressions
 * @returns CTR as a percentage (0-100+)
 *
 * @example
 * safeCtr(50, 1000) // 5.0
 * safeCtr(0, 1000)  // 0
 * safeCtr(50, 0)    // 0
 */
export function safeCtr(clicks: number, impressions: number): number {
    return safeDiv(clicks, impressions) * 100;
}

/**
 * Calculates CPC (Cost Per Click).
 * Formula: spend / clicks
 *
 * @param spend - Total spend amount
 * @param clicks - Number of clicks
 * @returns Cost per click
 *
 * @example
 * safeCpc(100, 50) // 2.0
 * safeCpc(100, 0)  // 0
 */
export function safeCpc(spend: number, clicks: number): number {
    return safeDiv(spend, clicks);
}

/**
 * Calculates CPM (Cost Per Mille / Cost Per Thousand Impressions).
 * Formula: (spend / impressions) * 1000
 *
 * @param spend - Total spend amount
 * @param impressions - Number of impressions
 * @returns Cost per thousand impressions
 *
 * @example
 * safeCpm(50, 10000) // 5.0
 * safeCpm(50, 0)     // 0
 */
export function safeCpm(spend: number, impressions: number): number {
    return safeDiv(spend, impressions) * 1000;
}

/**
 * Calculates ROAS (Return On Ad Spend).
 * Formula: revenue / spend
 *
 * @param revenue - Total revenue
 * @param spend - Total spend amount
 * @returns Return on ad spend ratio
 *
 * @example
 * safeRoas(500, 100) // 5.0
 * safeRoas(500, 0)   // 0
 */
export function safeRoas(revenue: number, spend: number): number {
    return safeDiv(revenue, spend);
}

/**
 * Calculates ROI (Return On Investment) as a percentage.
 * Formula: ((revenue - spend) / spend) * 100
 *
 * @param revenue - Total revenue
 * @param spend - Total spend amount
 * @param defaultValue - Value to return when spend is 0 (default: -100)
 * @returns ROI as a percentage
 *
 * @example
 * safeRoi(500, 100)     // 400.0 (400% return)
 * safeRoi(100, 100)     // 0.0 (break even)
 * safeRoi(50, 100)      // -50.0 (50% loss)
 * safeRoi(500, 0)       // -100 (default)
 */
export function safeRoi(
    revenue: number,
    spend: number,
    defaultValue: number = -100,
): number {
    if (spend === 0) {
        return defaultValue;
    }
    return safeFloat(((revenue - spend) / spend) * 100);
}

/**
 * Calculates CPA (Cost Per Action/Acquisition).
 * Formula: spend / conversions
 *
 * @param spend - Total spend amount
 * @param conversions - Number of conversions
 * @returns Cost per conversion
 *
 * @example
 * safeCpa(100, 10) // 10.0
 * safeCpa(100, 0)  // 0
 */
export function safeCpa(spend: number, conversions: number): number {
    return safeDiv(spend, conversions);
}

/**
 * Calculates Conversion Rate as a percentage.
 * Formula: (conversions / clicks) * 100
 *
 * @param conversions - Number of conversions
 * @param clicks - Number of clicks
 * @returns Conversion rate as a percentage
 *
 * @example
 * safeConversionRate(10, 100) // 10.0
 * safeConversionRate(10, 0)   // 0
 */
export function safeConversionRate(
    conversions: number,
    clicks: number,
): number {
    return safeDiv(conversions, clicks) * 100;
}
