/**
 * =============================================================================
 * Mock Metric Provider
 * =============================================================================
 *
 * Implementation of IMetricProvider that loads metric snapshots from fixtures
 * or generates them deterministically.
 *
 * Design Principles:
 * - Stateless: No instance state
 * - Deterministic: Same context → same metrics (with optional seed)
 * - Replaceable: Can be swapped with real API/DB provider later
 * - Side-effect free: Only reads fixtures or generates data
 * =============================================================================
 */

import { IMetricProvider } from '../services/alert-execution.service';
import { MetricSnapshot, BaselineSnapshot } from '../services/alert-engine.service';
import { SimulationContext, SimulationMode } from './simulation-context';

// Deterministic pseudo-random generator (seeded)
class SeededRandom {
    private seed: number;

    constructor(seed: string) {
        // Simple hash of seed string to number
        this.seed = seed.split('').reduce((acc, char) => {
            return ((acc << 5) - acc) + char.charCodeAt(0) | 0;
        }, 0);
    }

    /**
     * Generate next random number between 0 and 1
     * Linear congruential generator for determinism
     */
    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return (this.seed >>> 0) / 4294967296;
    }

    /**
     * Generate integer in range [min, max]
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Generate float in range [min, max]
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }
}

/**
 * Mock implementation of IMetricProvider
 */
export class MockMetricProvider implements IMetricProvider {
    private readonly rng: SeededRandom;

    constructor(private readonly context: SimulationContext) {
        // Initialize RNG with context seed or generate from context hash
        const seed = context.seed ?? this.hashContext(context);
        this.rng = new SeededRandom(seed);
    }

    /**
     * Fetch metric snapshots for current period
     *
     * Data sources (in order):
     * 1. Fixture file (if mode is FIXTURE or HYBRID)
     * 2. Deterministic generator (if mode is GENERATED or HYBRID)
     * 3. Metric overrides (applied last)
     */
    async fetchSnapshots(
        tenantId: string,
        dateRange: { start: Date; end: Date }
    ): Promise<MetricSnapshot[]> {
        // Validate tenant
        if (tenantId !== this.context.tenantId) {
            throw new Error(
                `Tenant mismatch: provider configured for ${this.context.tenantId}, ` +
                `but fetchSnapshots called with ${tenantId}`
            );
        }

        let snapshots: MetricSnapshot[] = [];

        // Try fixture first
        if (this.context.mode === 'FIXTURE' || this.context.mode === 'HYBRID') {
            const fixtureSnapshots = await this.loadMetricFixtures();
            if (fixtureSnapshots.length > 0) {
                snapshots = fixtureSnapshots;
            }
        }

        // Generate if needed
        if (
            snapshots.length === 0 &&
            (this.context.mode === 'GENERATED' || this.context.mode === 'HYBRID')
        ) {
            snapshots = this.generateDeterministicSnapshots();
        }

        // Apply overrides
        if (this.context.metricOverrides) {
            snapshots = this.applyOverrides(snapshots);
        }

        // Update date to match context
        snapshots = snapshots.map((s) => ({
            ...s,
            date: this.context.dateRange.end,
        }));

        return snapshots;
    }

    /**
     * Fetch baseline snapshots for comparison
     *
     * Returns metrics from previous period for DROP_PERCENT evaluation
     */
    async fetchBaselines(
        tenantId: string,
        campaignIds: string[],
        baselineDateRange: { start: Date; end: Date }
    ): Promise<Map<string, BaselineSnapshot>> {
        // Validate tenant
        if (tenantId !== this.context.tenantId) {
            throw new Error(
                `Tenant mismatch: provider configured for ${this.context.tenantId}, ` +
                `but fetchBaselines called with ${tenantId}`
            );
        }

        const baselines = new Map<string, BaselineSnapshot>();

        // Try to load baseline fixtures
        const baselineFixtures = await this.loadBaselineFixtures();

        for (const campaignId of campaignIds) {
            // Check for fixture first
            const fixture = baselineFixtures.get(campaignId);
            if (fixture) {
                baselines.set(campaignId, fixture);
                continue;
            }

            // Generate deterministic baseline
            const generated = this.generateDeterministicBaseline(campaignId);
            baselines.set(campaignId, generated);
        }

        return baselines;
    }

    // =========================================================================
    // Fixture Loading
    // =========================================================================

    private async loadMetricFixtures(): Promise<MetricSnapshot[]> {
        const basePath = this.context.fixtureBasePath ?? './fixtures';
        const path = `${basePath}/metrics/${this.context.scenarioName}.json`;

        try {
            const module = await import(path);
            const data = module.default ?? module;

            if (Array.isArray(data)) {
                return data.map((s) => this.validateAndNormalizeSnapshot(s));
            }

            return [];
        } catch {
            return [];
        }
    }

    private async loadBaselineFixtures(): Promise<Map<string, BaselineSnapshot>> {
        const basePath = this.context.fixtureBasePath ?? './fixtures';
        const path = `${basePath}/metrics/${this.context.scenarioName}-baseline.json`;

        const baselines = new Map<string, BaselineSnapshot>();

        try {
            const module = await import(path);
            const data = module.default ?? module;

            if (typeof data === 'object' && data !== null) {
                for (const [campaignId, snapshot] of Object.entries(data)) {
                    const baseline = this.validateAndNormalizeBaseline(snapshot as Record<string, unknown>);
                    if (baseline) {
                        baselines.set(campaignId, baseline);
                    }
                }
            }
        } catch {
            // No baseline fixture found
        }

        return baselines;
    }

    // =========================================================================
    // Deterministic Generation
    // =========================================================================

    private generateDeterministicSnapshots(): MetricSnapshot[] {
        // Generate 1-3 campaigns deterministically
        const campaignCount = this.rng.nextInt(1, 3);
        const snapshots: MetricSnapshot[] = [];

        for (let i = 0; i < campaignCount; i++) {
            snapshots.push(this.generateCampaignSnapshot(i));
        }

        return snapshots;
    }

    private generateCampaignSnapshot(index: number): MetricSnapshot {
        const campaignId = `campaign-${index}`;

        // Generate metrics based on scenario
        switch (this.context.scenarioName) {
            case 'zero-conversion':
                return this.generateZeroConversionSnapshot(campaignId);

            case 'drop-spend':
                return this.generateDropSpendSnapshot(campaignId);

            case 'high-roas':
                return this.generateHighRoasSnapshot(campaignId);

            case 'missing-metrics':
                return this.generatePartialSnapshot(campaignId);

            default:
                return this.generateDefaultSnapshot(campaignId);
        }
    }

    private generateZeroConversionSnapshot(campaignId: string): MetricSnapshot {
        const impressions = this.rng.nextInt(5000, 50000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.01, 0.05));
        const spend = this.rng.nextFloat(1000, 10000);

        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions: 0, // Zero conversions!
                spend,
                revenue: 0,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: 0,
                roas: 0,
            },
        };
    }

    private generateDropSpendSnapshot(campaignId: string): MetricSnapshot {
        const impressions = this.rng.nextInt(3000, 15000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.02, 0.04));
        const spend = this.rng.nextFloat(500, 3000); // Lower spend

        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions: this.rng.nextInt(1, 20),
                spend,
                revenue: spend * this.rng.nextFloat(0.8, 3.0),
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: clicks > 0 ? 0.05 : 0,
                roas: 1.5,
            },
        };
    }

    private generateHighRoasSnapshot(campaignId: string): MetricSnapshot {
        const impressions = this.rng.nextInt(10000, 100000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.03, 0.08));
        const conversions = Math.floor(clicks * this.rng.nextFloat(0.02, 0.08));
        const spend = this.rng.nextFloat(5000, 20000);
        const revenue = spend * this.rng.nextFloat(5.0, 10.0); // Very high ROAS

        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions,
                spend,
                revenue,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: conversions / clicks,
                roas: revenue / spend,
            },
        };
    }

    private generatePartialSnapshot(campaignId: string): MetricSnapshot {
        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions: this.rng.nextInt(1000, 10000),
                clicks: this.rng.nextInt(10, 500),
                conversions: this.rng.nextInt(0, 5),
                spend: this.rng.nextFloat(100, 2000),
                revenue: 0, // Missing!
                ctr: 0, // Will be calculated
                cpc: 0, // Will be calculated
                cvr: 0, // Will be calculated
                roas: 0, // Will be calculated
            },
        };
    }

    private generateDefaultSnapshot(campaignId: string): MetricSnapshot {
        const impressions = this.rng.nextInt(5000, 50000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.02, 0.05));
        const conversions = Math.floor(clicks * this.rng.nextFloat(0.01, 0.05));
        const spend = this.rng.nextFloat(1000, 15000);
        const revenue = spend * this.rng.nextFloat(0.5, 4.0);

        return {
            tenantId: this.context.tenantId,
            campaignId,
            date: this.context.dateRange.end,
            platform: 'GOOGLE_ADS',
            metrics: {
                impressions,
                clicks,
                conversions,
                spend,
                revenue,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: conversions / clicks,
                roas: revenue / spend,
            },
        };
    }

    private generateDeterministicBaseline(campaignId: string): BaselineSnapshot {
        // Generate a baseline that's typically higher than current
        // for drop-detection scenarios
        const impressions = this.rng.nextInt(10000, 50000);
        const clicks = Math.floor(impressions * this.rng.nextFloat(0.04, 0.08));
        const spend = this.rng.nextFloat(5000, 20000);

        const duration = this.context.dateRange.end.getTime() - this.context.dateRange.start.getTime();
        const baselineEnd = new Date(this.context.dateRange.start.getTime() - 1);
        const baselineStart = new Date(baselineEnd.getTime() - duration);

        return {
            metrics: {
                impressions,
                clicks,
                conversions: Math.floor(clicks * 0.05),
                spend,
                revenue: spend * 2,
                ctr: clicks / impressions,
                cpc: spend / clicks,
                cvr: 0.05,
                roas: 2,
            },
            dateRange: {
                start: baselineStart,
                end: baselineEnd,
            },
        };
    }

    // =========================================================================
    // Utilities
    // =========================================================================

    private applyOverrides(snapshots: MetricSnapshot[]): MetricSnapshot[] {
        const overrides = this.context.metricOverrides ?? {};

        return snapshots.map((snapshot) => ({
            ...snapshot,
            metrics: {
                ...snapshot.metrics,
                ...overrides,
            },
        }));
    }

    private validateAndNormalizeSnapshot(data: unknown): MetricSnapshot {
        // Basic validation and normalization
        const s = data as Record<string, unknown>;

        return {
            tenantId: String(s.tenantId ?? this.context.tenantId),
            campaignId: String(s.campaignId ?? 'unknown'),
            date: new Date(String(s.date)),
            platform: String(s.platform ?? 'GOOGLE_ADS'),
            metrics: this.validateMetrics(s.metrics as Record<string, number>),
        };
    }

    private validateAndNormalizeBaseline(data: Record<string, unknown>): BaselineSnapshot | null {
        if (!data.metrics || !data.dateRange) return null;

        return {
            metrics: this.validateMetrics(data.metrics as Record<string, number>),
            dateRange: {
                start: new Date(String((data.dateRange as { start: string }).start)),
                end: new Date(String((data.dateRange as { end: string }).end)),
            },
        };
    }

    private validateMetrics(m: Record<string, number>): MetricSnapshot['metrics'] {
        return {
            impressions: m.impressions ?? 0,
            clicks: m.clicks ?? 0,
            conversions: m.conversions ?? 0,
            spend: m.spend ?? 0,
            revenue: m.revenue ?? 0,
            ctr: m.ctr ?? 0,
            cpc: m.cpc ?? 0,
            cvr: m.cvr ?? 0,
            roas: m.roas ?? 0,
        };
    }

    private hashContext(context: SimulationContext): string {
        // Simple hash for seed generation
        return `${context.scenarioName}:${context.tenantId}:${context.dateRange.start.toISOString()}`;
    }
}
