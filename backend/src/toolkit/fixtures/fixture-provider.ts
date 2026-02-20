/**
 * =============================================================================
 * Fixture Provider
 * =============================================================================
 * Loads and validates Golden Fixtures.
 * Enforces:
 * - Integrity: Canonical Checksum verification (Exit 2)
 * - Security: Size caps (Exit 78), Path traversal (Exit 78)
 * - Mode behavior is handled by the caller (Command) skipping the load.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'node:crypto';
import { injectable } from 'tsyringe';
import { GoldenFixture } from '../scenarios/scenario-types';

export interface FixtureProviderOptions {
    baseDir?: string;
}

const MAX_FIXTURE_SIZE = 256 * 1024; // 256 KB
const MAX_ROWS = 1000;

export class FixtureError extends Error {
    constructor(
        public readonly code: string,
        public readonly exitCode: number, // 2 or 78
        message: string
    ) {
        super(message);
        this.name = 'FixtureError';
    }
}

@injectable()
export class FixtureProvider {
    private readonly baseDir: string;

    constructor(options?: FixtureProviderOptions) {
        this.baseDir = options?.baseDir ?? path.join(__dirname, 'golden');
    }

    async loadFixture(scenarioId: string, seed: number): Promise<GoldenFixture> {
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const filePath = path.resolve(this.baseDir, filename);

        // Security: Path containment (Exit 78)
        const rel = path.relative(this.baseDir, filePath);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
            throw new FixtureError('PATH_TRAVERSAL', 78, 'Fixture path traversal violation');
        }

        if (!fs.existsSync(filePath)) {
            throw new FixtureError('FIXTURE_NOT_FOUND', 2, `Fixture file not found: ${filename}`);
        }

        // Security: Size cap (Exit 78)
        const stats = fs.statSync(filePath);
        if (stats.size > MAX_FIXTURE_SIZE) {
            throw new FixtureError('FIXTURE_TOO_LARGE', 78, `Fixture exceeds size limit (${MAX_FIXTURE_SIZE} bytes)`);
        }

        let raw: any;
        try {
            raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e: any) {
            throw new FixtureError('PARSE_ERROR', 2, `Invalid JSON in fixture: ${e.message}`);
        }

        // Validation: Schema Version
        if (raw.schemaVersion !== '1.0.0') {
            throw new FixtureError('UNSUPPORTED_SCHEMA_VERSION', 2, `Unsupported fixture schemaVersion "${raw.schemaVersion}"`);
        }

        // Validation: Scenario ID mismatch
        if (raw.scenarioId !== scenarioId) {
            throw new FixtureError('INVALID_SCENARIO_ID', 2, `Fixture scenarioId "${raw.scenarioId}" matches request "${scenarioId}" mismatch`);
        }

        // Validation: Row Limit
        if (raw.shape?.totalMetricRows > MAX_ROWS) {
            throw new FixtureError('FIXTURE_ROW_LIMIT', 2, `Fixture has too many rows (${raw.shape.totalMetricRows} > ${MAX_ROWS})`);
        }

        // Integrity: Checksum
        // Must compute canonical checksum and compare
        const computed = this.computeChecksum(raw.shape);
        if (computed !== raw.checksum) {
            throw new FixtureError('CHECKSUM_MISMATCH', 2, `Fixture integrity check failed. Stored: ${raw.checksum}, Computed: ${computed}`);
        }

        return raw as GoldenFixture;
    }

    private computeChecksum(shape: any): string {
        const canonical = JSON.stringify(this.deepSortKeys(shape));
        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        return `sha256:${hash}`;
    }

    // Canonical JSON: Deep sort keys, lexicographic
    private deepSortKeys(obj: unknown): unknown {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            // Arrays: Sort lexicographically if they are strings (spec says platforms array sorted)
            // But spec checking shape object.
            // Shape.perPlatform is Record -> sorted keys.
            // Shape arrays? Spec says "Platform array ordering: generatedWith.platforms array is sorted".
            // But checksum covers SHAPE only.
            // Does shape contain arrays?

            // shape.perPlatform is map.
            // Wait, generatedWith is NOT in shape.

            // shape has: totalCampaigns, totalMetricRows, perPlatform.
            // perPlatform values are objects.

            // Does shape have arrays?
            // "perPlatform" keys are sorted.

            // If there's an array in shape (schema doesn't show one), we usually don't sort arrays unless specified.
            // FIXTURES_SPEC says: "Platform array ordering: generatedWith.platforms array is sorted".
            // But generatedWith is NOT in shape.
            // So shape doesn't strictly have arrays?
            // Wait, if we add arrays later.
            // Standard canonical JSON usually avoids sorting arrays.
            // I'll stick to mapping recursive sort.
            return obj.map(v => this.deepSortKeys(v));
        }

        // Object: Sort keys
        const sorted: Record<string, unknown> = {};
        const keys = Object.keys(obj as Record<string, unknown>).sort();
        for (const key of keys) {
            sorted[key] = this.deepSortKeys((obj as Record<string, unknown>)[key]);
        }
        return sorted;
    }
}
