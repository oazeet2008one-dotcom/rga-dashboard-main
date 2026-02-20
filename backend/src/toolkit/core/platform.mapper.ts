/**
 * =============================================================================
 * Platform Mapper (BOUNDARY)
 * =============================================================================
 * 
 * RULES:
 * 1. This is the ONLY file allowed to import @prisma/client Types.
 * 2. It translates between ToolkitPlatform (Domain) and AdPlatform (Persistence).
 */

import { AdPlatform } from '@prisma/client';
import { ToolkitPlatform } from '../domain/platform.types';
import { Result } from '../core/contracts';
import { UnsupportedPlatformError } from '../domain/platform-utils';

export class PlatformMapper {
    // P0-1: Explicit Mapping (FAIL-CLOSED)
    // We map Domain Keys -> Persistence Values
    private static readonly DOMAIN_TO_PERSISTENCE: Record<ToolkitPlatform, AdPlatform> = {
        [ToolkitPlatform.GoogleAds]: AdPlatform.GOOGLE_ADS,
        [ToolkitPlatform.Facebook]: AdPlatform.FACEBOOK,
        [ToolkitPlatform.TikTok]: AdPlatform.TIKTOK,
        [ToolkitPlatform.LineAds]: AdPlatform.LINE_ADS,
        [ToolkitPlatform.Shopee]: AdPlatform.SHOPEE,
        [ToolkitPlatform.Lazada]: AdPlatform.LAZADA,
        [ToolkitPlatform.Instagram]: AdPlatform.INSTAGRAM,
        [ToolkitPlatform.GoogleAnalytics]: AdPlatform.GOOGLE_ANALYTICS,
    };

    /**
     * Domain -> Persistence
     * Fail-closed: returns AdPlatform found in map.
     */
    static toPersistence(domain: ToolkitPlatform): AdPlatform {
        const mapped = PlatformMapper.DOMAIN_TO_PERSISTENCE[domain];
        if (!mapped) {
            // Should theoretically not happen if types are aligned, but runtime safety:
            // We throw here because this is likely a developer error (missing map entry)
            // caught by the boundary or crashing the specific operation safely
            throw new UnsupportedPlatformError(domain, 'toPersistence');
        }
        return mapped;
    }

    /**
     * Persistence -> Domain
     * UNSAFE Input: Persistence might have keys we don't know (e.g. INSTAGRAM)
     */
    static toDomain(raw: AdPlatform | string): Result<ToolkitPlatform> {
        // Validation via explicit reverse lookup or value inclusion
        const values = Object.values(ToolkitPlatform) as string[];
        if (values.includes(raw)) {
            return Result.success(raw as ToolkitPlatform);
        }

        // P0-2: Structured Error
        return Result.failure(new UnsupportedPlatformError(raw, 'toDomain'));
    }
}
