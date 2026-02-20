/**
 * =============================================================================
 * Architecture Guard Tests — Platform Identity Boundary (Phase 1A)
 * =============================================================================
 *
 * These tests enforce the Platform Identity Boundary defined in ADR-001.
 * They are pure file-scan + in-memory assertions with NO DB or network.
 *
 * Run via: npm run toolkit:test
 * =============================================================================
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Helpers ────────────────────────────────────────────────────────────────

// __dirname = src/toolkit/manifest/__tests__
// Go up 2 levels: __tests__ -> manifest -> toolkit
const TOOLKIT_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Recursively collect all .ts files under a directory,
 * excluding node_modules, dist, __tests__, and .d.ts files.
 */
function collectTsFiles(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', 'dist', '__tests__', '.git'].includes(entry.name)) continue;
            results.push(...collectTsFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Convert absolute path to repo-relative path (forward slashes for portability).
 */
function toRepoRelative(absPath: string): string {
    // Resolve to backend/ root (parent of src/)
    const backendRoot = path.resolve(TOOLKIT_ROOT, '..', '..');
    return path.relative(backendRoot, absPath).replace(/\\/g, '/');
}

// ─── Guard A: AdPlatform Isolation ──────────────────────────────────────────

describe('Guard: AdPlatform coupling confined to mapper', () => {

    // The ONE file allowed to import AdPlatform from @prisma/client
    const BOUNDARY_FILE = path.resolve(TOOLKIT_ROOT, 'core', 'platform.mapper.ts');

    // Known transition debt: files that still reference AdPlatform for Prisma
    // query parameter types. These are tracked for Phase 1B cleanup.
    const KNOWN_TRANSITION_DEBT: string[] = [
        path.resolve(TOOLKIT_ROOT, 'services', 'google-ads-seeder.service.ts'),
        path.resolve(TOOLKIT_ROOT, 'commands', 'seed-data.command.ts'),
    ];

    const ALLOWED_FILES = new Set([
        BOUNDARY_FILE,
        ...KNOWN_TRANSITION_DEBT,
    ].map(f => path.normalize(f)));

    it('no toolkit file outside boundary + known-debt imports AdPlatform from @prisma/client', () => {
        const allFiles = collectTsFiles(TOOLKIT_ROOT);
        const violations: { file: string; line: number; content: string }[] = [];

        // Pattern: import line that pulls AdPlatform from @prisma/client
        const IMPORT_PATTERN = /import\s+\{[^}]*\bAdPlatform\b[^}]*\}\s+from\s+['"]@prisma\/client['"]/;

        for (const file of allFiles) {
            const normalized = path.normalize(file);
            if (ALLOWED_FILES.has(normalized)) continue;

            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                if (IMPORT_PATTERN.test(lines[i])) {
                    violations.push({
                        file: toRepoRelative(file),
                        line: i + 1,
                        content: lines[i].trim(),
                    });
                }
            }
        }

        if (violations.length > 0) {
            const report = violations
                .map(v => `  ${v.file}:${v.line} → ${v.content}`)
                .join('\n');
            assert.fail(
                `AdPlatform coupling detected outside boundary!\n` +
                `Allowed: src/toolkit/core/platform.mapper.ts\n` +
                `Known debt: ${KNOWN_TRANSITION_DEBT.map(toRepoRelative).join(', ')}\n` +
                `New violations:\n${report}`
            );
        }
    });

    it('known transition debt is exactly 2 files (no silent growth)', () => {
        assert.equal(
            KNOWN_TRANSITION_DEBT.length,
            2,
            'Transition debt count changed! Update this test if debt was intentionally added/removed.'
        );
    });

    it('boundary file (platform.mapper.ts) exists and imports AdPlatform', () => {
        assert.ok(
            fs.existsSync(BOUNDARY_FILE),
            `Boundary file missing: ${toRepoRelative(BOUNDARY_FILE)}`
        );
        const content = fs.readFileSync(BOUNDARY_FILE, 'utf-8');
        assert.match(
            content,
            /import\s+\{[^}]*\bAdPlatform\b[^}]*\}\s+from\s+['"]@prisma\/client['"]/,
            'Boundary file should import AdPlatform from @prisma/client'
        );
    });
});

// ─── Guard B: Capability-Driven Platform Availability ───────────────────────

describe('Guard: platform availability derived from capabilities', () => {

    // Import the capability-derived lists (pure, no DB/network)
    // We use dynamic require to stay compatible with transpileOnly mode
    const capabilitiesPath = path.resolve(TOOLKIT_ROOT, 'domain', 'platform-capabilities.ts');
    const typesPath = path.resolve(TOOLKIT_ROOT, 'domain', 'platform.types.ts');

    it('SEEDABLE_PLATFORMS includes Shopee and Lazada when configured as seedable', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PLATFORM_CAPABILITIES, SEEDABLE_PLATFORMS } = require(capabilitiesPath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ToolkitPlatform } = require(typesPath);

        // Verify Shopee is configured as seedable
        assert.equal(
            PLATFORM_CAPABILITIES[ToolkitPlatform.Shopee]?.isSeedable,
            true,
            'Shopee should be configured as seedable in PLATFORM_CAPABILITIES'
        );
        // Verify Lazada is configured as seedable
        assert.equal(
            PLATFORM_CAPABILITIES[ToolkitPlatform.Lazada]?.isSeedable,
            true,
            'Lazada should be configured as seedable in PLATFORM_CAPABILITIES'
        );

        // Verify derived list includes them
        assert.ok(
            SEEDABLE_PLATFORMS.includes(ToolkitPlatform.Shopee),
            `SEEDABLE_PLATFORMS must include Shopee. Got: [${SEEDABLE_PLATFORMS.join(', ')}]`
        );
        assert.ok(
            SEEDABLE_PLATFORMS.includes(ToolkitPlatform.Lazada),
            `SEEDABLE_PLATFORMS must include Lazada. Got: [${SEEDABLE_PLATFORMS.join(', ')}]`
        );

        console.log(`    ✓ SEEDABLE_PLATFORMS = [${SEEDABLE_PLATFORMS.join(', ')}]`);
    });

    it('SIMULATABLE_PLATFORMS includes Shopee and Lazada when configured', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PLATFORM_CAPABILITIES, SIMULATABLE_PLATFORMS } = require(capabilitiesPath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ToolkitPlatform } = require(typesPath);

        assert.equal(
            PLATFORM_CAPABILITIES[ToolkitPlatform.Shopee]?.isSimulatable,
            true,
            'Shopee should be configured as simulatable'
        );
        assert.equal(
            PLATFORM_CAPABILITIES[ToolkitPlatform.Lazada]?.isSimulatable,
            true,
            'Lazada should be configured as simulatable'
        );

        assert.ok(
            SIMULATABLE_PLATFORMS.includes(ToolkitPlatform.Shopee),
            `SIMULATABLE_PLATFORMS must include Shopee. Got: [${SIMULATABLE_PLATFORMS.join(', ')}]`
        );
        assert.ok(
            SIMULATABLE_PLATFORMS.includes(ToolkitPlatform.Lazada),
            `SIMULATABLE_PLATFORMS must include Lazada. Got: [${SIMULATABLE_PLATFORMS.join(', ')}]`
        );

        console.log(`    ✓ SIMULATABLE_PLATFORMS = [${SIMULATABLE_PLATFORMS.join(', ')}]`);
    });
});

// ─── Guard C: Config Registry Coverage ──────────────────────────────────────

describe('Guard: PLATFORM_CONFIGS covers all simulatable platforms', () => {

    it('every simulatable platform has a config entry in PLATFORM_CONFIGS', () => {
        const configsPath = path.resolve(TOOLKIT_ROOT, 'platform-configs.ts');
        const capabilitiesPath2 = path.resolve(TOOLKIT_ROOT, 'domain', 'platform-capabilities.ts');

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PLATFORM_CONFIGS } = require(configsPath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { SIMULATABLE_PLATFORMS } = require(capabilitiesPath2);

        const missing: string[] = [];
        for (const platform of SIMULATABLE_PLATFORMS) {
            if (!PLATFORM_CONFIGS[platform]) {
                missing.push(platform);
            }
        }

        assert.equal(
            missing.length,
            0,
            `Missing PLATFORM_CONFIGS entries for simulatable platforms: [${missing.join(', ')}]`
        );

        console.log(`    ✓ All ${SIMULATABLE_PLATFORMS.length} simulatable platforms have config entries`);
    });
});
