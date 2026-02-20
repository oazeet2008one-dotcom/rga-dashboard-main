/**
 * =============================================================================
 * Scenario Types
 * =============================================================================
 */

export interface ScenarioSpec {
    /** Schema version — MUST be "1.0.0" */
    schemaVersion: '1.0.0';

    /** Canonical name (derived from filename) */
    scenarioId: string;

    /** Human-readable name */
    name: string;

    /** Scenario trend profile */
    trend: 'STABLE' | 'GROWTH' | 'DECLINE' | 'SPIKE';

    /** Base impressions per month (default: 10000) */
    baseImpressions?: number;

    /** Duration in days (default: 30) */
    days?: number;

    /**
     * Fixed date anchor for determinism.
     * If present, overrides the engine default.
     * Format: ISO 8601 (e.g., "2025-01-01T00:00:00Z")
     */
    dateAnchor?: string;

    /**
     * Compatibility aliases for CLI resolution.
     * e.g., ["default"] allows --scenario default
     */
    aliases?: string[];
}

export interface GoldenFixture {
    schemaVersion: '1.0.0';
    scenarioId: string;
    seed: number;
    generatedWith: {
        dateAnchor: string;
        days: number;
        baseImpressions: number;
        platforms: string[];
    };
    generatedAt: string;
    shape: {
        totalCampaigns: number;
        totalMetricRows: number;
        perPlatform: Record<string, {
            campaigns: number;
            metricRows: number;
        }>;
    };
    samples: FixtureSample[];
    checksum: string;
}

export interface FixtureSample {
    platform: string;
    dayIndex: number;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
}
