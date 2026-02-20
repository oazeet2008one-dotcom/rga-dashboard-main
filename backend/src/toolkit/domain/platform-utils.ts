/**
 * =============================================================================
 * Platform Domain Utilities
 * =============================================================================
 */

import { ToolkitPlatform } from './platform.types';
import { Result } from '../core/contracts';
import { ToolkitError } from '../core/contracts';

// Legacy Aliases moved from platform-configs.ts
export const PLATFORM_ALIASES: Record<string, ToolkitPlatform> = {
    'google': ToolkitPlatform.GoogleAds,
    'google_ads': ToolkitPlatform.GoogleAds,
    'facebook': ToolkitPlatform.Facebook,
    'meta': ToolkitPlatform.Facebook,
    'tiktok': ToolkitPlatform.TikTok,
    'line': ToolkitPlatform.LineAds,
    'line_ads': ToolkitPlatform.LineAds,
    'shopee': ToolkitPlatform.Shopee,
    'lazada': ToolkitPlatform.Lazada,
    'instagram': ToolkitPlatform.Instagram,
    'ig': ToolkitPlatform.Instagram,
};

export class UnsupportedPlatformError extends ToolkitError {
    readonly code = 'UNSUPPORTED_PLATFORM';
    readonly isRecoverable = false;

    constructor(
        public readonly value: string,
        public readonly context: string
    ) {
        super(`Unsupported platform '${value}' in context '${context}'`);
    }
}

export function normalizePlatformInput(input: string): Result<ToolkitPlatform> {
    const normalized = input.toLowerCase().trim();

    // 1. Check aliases
    if (PLATFORM_ALIASES[normalized]) {
        return Result.success(PLATFORM_ALIASES[normalized]);
    }

    // 2. Check canonical values (case-insensitive)
    const canonical = Object.values(ToolkitPlatform).find(
        p => p.toLowerCase() === normalized
    );

    if (canonical) {
        return Result.success(canonical);
    }

    return Result.failure(new UnsupportedPlatformError(input, 'normalizePlatformInput'));
}
