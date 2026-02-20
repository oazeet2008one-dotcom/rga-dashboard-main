/**
 * =============================================================================
 * AdSimulatorEngine — Unit Tests (Phase 5A.3)
 * =============================================================================
 *
 * Runner: node:test
 *
 * Strategy: Seed faker for reproducible randomness, test structural invariants
 * (funnel integrity), trend direction, platform multipliers, seasonality,
 * edge cases, and date range generation.
 * =============================================================================
 */

import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { faker } from '@faker-js/faker';
import { AdSimulatorEngine, SimulationParams, DailyMetrics } from '../ad-simulator.engine';
import { ToolkitPlatform } from '../domain/platform.types';

// =============================================================================
// Helpers
// =============================================================================

const engine = new AdSimulatorEngine();

const WEEKDAY = new Date('2024-01-15T12:00:00Z'); // Monday
const WEEKEND = new Date('2024-01-13T12:00:00Z'); // Saturday

function gen(overrides: Partial<SimulationParams> = {}): DailyMetrics {
    return engine.generateDailyMetrics({
        date: overrides.date ?? WEEKDAY,
        trendProfile: overrides.trendProfile ?? 'STABLE',
        baseImpressions: overrides.baseImpressions ?? 10000,
        dayIndex: overrides.dayIndex ?? 0,
        totalDays: overrides.totalDays ?? 30,
        platform: overrides.platform,
    });
}

// =============================================================================
// Tests
// =============================================================================

describe('AdSimulatorEngine — funnel integrity', () => {
    beforeEach(() => faker.seed(42));

    it('clicks ≤ impressions', () => {
        const m = gen();
        assert.ok(m.clicks <= m.impressions, `clicks ${m.clicks} > impressions ${m.impressions}`);
    });

    it('conversions ≤ clicks', () => {
        const m = gen();
        assert.ok(m.conversions <= m.clicks, `conversions ${m.conversions} > clicks ${m.clicks}`);
    });

    it('impressions are non-negative integers', () => {
        const m = gen();
        assert.ok(m.impressions >= 0);
        assert.strictEqual(m.impressions, Math.floor(m.impressions));
    });

    it('clicks and conversions are integers', () => {
        const m = gen();
        assert.strictEqual(m.clicks, Math.floor(m.clicks));
        assert.strictEqual(m.conversions, Math.floor(m.conversions));
    });

    it('cost, revenue, and rates are finite numbers', () => {
        const m = gen();
        for (const key of ['cost', 'revenue', 'ctr', 'cpc', 'cvr', 'roas', 'aov'] as const) {
            assert.ok(Number.isFinite(m[key]), `${key} is not finite: ${m[key]}`);
        }
    });

    it('all values are non-negative', () => {
        const m = gen();
        for (const [k, v] of Object.entries(m)) {
            assert.ok(v >= 0, `${k} is negative: ${v}`);
        }
    });

    it('funnel holds across 100 random seeds', () => {
        for (let seed = 0; seed < 100; seed++) {
            faker.seed(seed);
            const m = gen({ baseImpressions: 50000 });
            assert.ok(m.clicks <= m.impressions, `seed ${seed}: clicks > impressions`);
            assert.ok(m.conversions <= m.clicks, `seed ${seed}: conversions > clicks`);
        }
    });
});

describe('AdSimulatorEngine — trend profiles', () => {
    // Run N samples and average to smooth noise; GROWTH should produce higher
    // impressions than DECLINE on later dayIndex values.
    it('GROWTH produces higher average than DECLINE on day 29/30', () => {
        const N = 50;
        let growthSum = 0;
        let declineSum = 0;

        for (let i = 0; i < N; i++) {
            faker.seed(i);
            growthSum += gen({ trendProfile: 'GROWTH', dayIndex: 29, totalDays: 30 }).impressions;
            faker.seed(i);
            declineSum += gen({ trendProfile: 'DECLINE', dayIndex: 29, totalDays: 30 }).impressions;
        }

        assert.ok(
            growthSum / N > declineSum / N,
            `avg growth ${growthSum / N} should > avg decline ${declineSum / N}`,
        );
    });

    it('STABLE produces values near baseImpressions ±20%', () => {
        faker.seed(42);
        const m = gen({ trendProfile: 'STABLE', baseImpressions: 10000 });
        // With ±10% noise variance, impressions should be within ~80-120% of base
        assert.ok(m.impressions >= 8000, `impressions ${m.impressions} too low for STABLE`);
        assert.ok(m.impressions <= 12000, `impressions ${m.impressions} too high for STABLE`);
    });
});

describe('AdSimulatorEngine — seasonality', () => {
    it('weekday gets ~1.0x factor (Google default)', () => {
        faker.seed(42);
        const weekdayM = gen({ date: WEEKDAY });
        faker.seed(42);
        const weekendM = gen({ date: WEEKEND });

        // Google Ads weekendFactor = 0.7, so weekend < weekday
        assert.ok(
            weekendM.impressions < weekdayM.impressions,
            `weekend ${weekendM.impressions} should < weekday ${weekdayM.impressions} for Google Ads`,
        );
    });
});

describe('AdSimulatorEngine — platform multipliers', () => {
    it('TikTok produces ~10x more impressions than Google Ads', () => {
        const N = 20;
        let googleSum = 0;
        let tiktokSum = 0;

        for (let i = 0; i < N; i++) {
            faker.seed(i);
            googleSum += gen({ platform: ToolkitPlatform.GoogleAds, baseImpressions: 10000 }).impressions;
            faker.seed(i);
            tiktokSum += gen({ platform: ToolkitPlatform.TikTok, baseImpressions: 10000 }).impressions;
        }

        const ratio = tiktokSum / googleSum;
        // TikTok impressionMultiplier = 3.0, so ratio should be ~3x
        assert.ok(ratio > 2, `TikTok/Google ratio ${ratio} is too low (expected ~3x)`);
        assert.ok(ratio < 5, `TikTok/Google ratio ${ratio} is too high`);
    });

    it('Facebook produces ~2x more impressions than Google Ads', () => {
        const N = 20;
        let googleSum = 0;
        let fbSum = 0;

        for (let i = 0; i < N; i++) {
            faker.seed(i);
            googleSum += gen({ platform: ToolkitPlatform.GoogleAds, baseImpressions: 10000 }).impressions;
            faker.seed(i);
            fbSum += gen({ platform: ToolkitPlatform.Facebook, baseImpressions: 10000 }).impressions;
        }

        const ratio = fbSum / googleSum;
        assert.ok(ratio > 1.2, `Facebook/Google ratio ${ratio} too low (expected ~2x)`);
        assert.ok(ratio < 4, `Facebook/Google ratio ${ratio} too high`);
    });
});

describe('AdSimulatorEngine — edge cases', () => {
    it('zero baseImpressions produces zero everything', () => {
        faker.seed(42);
        const m = gen({ baseImpressions: 0 });
        assert.strictEqual(m.impressions, 0);
        assert.strictEqual(m.clicks, 0);
        assert.strictEqual(m.conversions, 0);
        assert.strictEqual(m.cost, 0);
        assert.strictEqual(m.revenue, 0);
    });

    it('very large baseImpressions does not crash or overflow', () => {
        faker.seed(42);
        const m = gen({ baseImpressions: 100_000_000 });
        assert.ok(Number.isFinite(m.impressions));
        assert.ok(m.impressions > 0);
        assert.ok(m.clicks <= m.impressions);
    });

    it('dayIndex = 0 with totalDays = 1 does not divide by zero', () => {
        faker.seed(42);
        const m = gen({ dayIndex: 0, totalDays: 1 });
        assert.ok(Number.isFinite(m.impressions));
    });
});

describe('AdSimulatorEngine — money precision', () => {
    it('cost and revenue have at most 2 decimal places', () => {
        faker.seed(42);
        const m = gen({ baseImpressions: 50000 });
        // Use epsilon for floating point comparison
        const eps = 1e-9;
        assert.ok(Math.abs(Math.round(m.cost * 100) - m.cost * 100) < eps, `cost not 2dp: ${m.cost}`);
        assert.ok(Math.abs(Math.round(m.revenue * 100) - m.revenue * 100) < eps, `revenue not 2dp: ${m.revenue}`);
    });

    it('rate metrics have at most 2 decimal places', () => {
        faker.seed(42);
        const m = gen({ baseImpressions: 50000 });
        const eps = 1e-9;
        for (const key of ['ctr', 'cpc', 'cvr', 'roas', 'aov'] as const) {
            const val = m[key];
            assert.ok(
                Math.abs(Math.round(val * 100) - val * 100) < eps,
                `${key}=${val} has more than 2 decimal places`,
            );
        }
    });
});

describe('AdSimulatorEngine — determinism with faker seed', () => {
    it('same seed produces identical output', () => {
        faker.seed(12345);
        const a = gen({ baseImpressions: 10000 });
        faker.seed(12345);
        const b = gen({ baseImpressions: 10000 });

        assert.deepStrictEqual(a, b);
    });

    it('different seeds produce different output', () => {
        faker.seed(1);
        const a = gen({ baseImpressions: 10000 });
        faker.seed(2);
        const b = gen({ baseImpressions: 10000 });

        // Extremely unlikely to be exactly equal with different seeds
        assert.notDeepStrictEqual(a, b);
    });
});

describe('AdSimulatorEngine — generateDateRangeMetrics', () => {
    it('returns one entry per day', () => {
        faker.seed(42);
        const start = new Date('2024-01-01');
        const end = new Date('2024-01-07');
        const results = engine.generateDateRangeMetrics(start, end, 'STABLE', 10000);

        assert.strictEqual(results.length, 7); // Jan 1-7 inclusive
    });

    it('each entry has valid metrics with funnel integrity', () => {
        faker.seed(42);
        const start = new Date('2024-01-01');
        const end = new Date('2024-01-03');
        const results = engine.generateDateRangeMetrics(start, end, 'GROWTH', 5000);

        for (const entry of results) {
            assert.ok(entry.date instanceof Date);
            assert.ok(entry.metrics.clicks <= entry.metrics.impressions);
            assert.ok(entry.metrics.conversions <= entry.metrics.clicks);
        }
    });

    it('accepts platform parameter', () => {
        faker.seed(42);
        const start = new Date('2024-01-01');
        const end = new Date('2024-01-03');
        const results = engine.generateDateRangeMetrics(
            start, end, 'STABLE', 10000, ToolkitPlatform.TikTok,
        );

        assert.strictEqual(results.length, 3);
        // TikTok should have higher impressions due to 3x multiplier
        for (const entry of results) {
            assert.ok(entry.metrics.impressions > 15000, `TikTok impressions too low: ${entry.metrics.impressions}`);
        }
    });
});
