/**
 * Unit tests: manifest-writer.ts — Atomic file I/O
 * Runner: node:test (no Jest)
 */
import { describe, it, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { ManifestWriter } from '../manifest-writer';
import { ManifestDocument, MANIFEST_SCHEMA_VERSION } from '../types';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TRUNCATION_LIMITS } from '../redactor';

// Minimal valid manifest for testing
function createTestManifest(overrides?: Partial<ManifestDocument>): ManifestDocument {
    return {
        schemaVersion: MANIFEST_SCHEMA_VERSION,
        runId: 'test-run-id-1234',
        status: 'SUCCESS',
        exitCode: 0,
        executionMode: 'CLI',
        tty: false,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 100,
        runtime: { toolkitVersion: '0.0.0', nodeVersion: process.version, os: process.platform, pid: process.pid },
        invocation: {
            commandName: 'test-cmd',
            commandClassification: 'WRITE',
            args: {},
            flags: { dryRun: false, noDryRun: false, force: false, yes: false, verbose: false, manifestDir: null, seed: null, scenario: null },
            confirmation: { tierUsed: 'NONE', confirmationMethod: null, confirmed: false },
        },
        safety: {
            policyVersion: '1.0.0',
            gates: [],
            envSummary: { toolkitEnv: 'LOCAL', classification: 'ALLOWED' },
            dbSafetySummary: { dbHostMasked: 'localhost', dbNameMasked: 'test', classification: 'SAFE', matchedRule: null },
        },
        tenant: { tenantId: 'test-tenant', tenantSlug: null, tenantDisplayName: null, tenantResolution: 'EXPLICIT' },
        steps: [],
        results: { writesPlanned: null, writesApplied: null, externalCalls: null, filesystemWrites: null, warnings: [], errors: [] },
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Filename generation
// ---------------------------------------------------------------------------
describe('ManifestWriter.generateFilename', () => {
    it('follows {runId}_{command}_{timestamp}.manifest.json format', () => {
        const filename = ManifestWriter.generateFilename('run-123', 'seed-data');
        assert.ok(filename.startsWith('run-123_'));
        assert.ok(filename.includes('seed-data'));
        assert.ok(filename.endsWith('.manifest.json'));
    });
});

// ---------------------------------------------------------------------------
// Atomic write
// ---------------------------------------------------------------------------
describe('ManifestWriter.write', () => {
    let tmpDir: string;

    before(async () => {
        const base = path.resolve(process.cwd(), 'toolkit-manifests');
        await fs.mkdir(base, { recursive: true });
        tmpDir = await fs.mkdtemp(path.join(base, 'writer-test-'));
    });

    after(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
    });

    it('writes valid JSON manifest to disk', async () => {
        const manifest = createTestManifest();
        const writtenPath = await ManifestWriter.write(manifest, tmpDir);

        assert.ok(writtenPath !== null, 'write returned a path');
        assert.ok(writtenPath!.endsWith('.manifest.json'));

        const content = await fs.readFile(writtenPath!, 'utf-8');
        const parsed = JSON.parse(content);
        assert.strictEqual(parsed.status, 'SUCCESS');
        assert.strictEqual(parsed.runId, 'test-run-id-1234');
    });

    it('leaves no orphan .tmp_ files', async () => {
        const manifest = createTestManifest({ runId: 'orphan-test' });
        await ManifestWriter.write(manifest, tmpDir);

        const files = await fs.readdir(tmpDir);
        const tmpFiles = files.filter(f => f.startsWith('.tmp_'));
        assert.strictEqual(tmpFiles.length, 0);
    });

    it('returns null for invalid directory (best-effort, does not throw)', async () => {
        const manifest = createTestManifest();
        // NUL char in path always fails on all platforms
        const result = await ManifestWriter.write(manifest, 'Z:\\invalid\\\0path');
        assert.strictEqual(result, null);
    });

    it('returns null when manifest exceeds size cap', async () => {
        const oversized = createTestManifest({
            runId: 'oversized-manifest-test',
            results: {
                writesPlanned: null,
                writesApplied: null,
                externalCalls: null,
                filesystemWrites: null,
                warnings: [],
                errors: [
                    {
                        code: 'OVERSIZED_TEST',
                        message: 'x'.repeat(TRUNCATION_LIMITS.MAX_MANIFEST_BYTES + 1),
                        isRecoverable: false,
                    },
                ],
            },
        });

        const result = await ManifestWriter.write(oversized, tmpDir);
        assert.strictEqual(result, null);

        const files = await fs.readdir(tmpDir);
        const oversizedFiles = files.filter((f) => f.includes('oversized-manifest-test'));
        assert.strictEqual(oversizedFiles.length, 0);
    });
});

// ---------------------------------------------------------------------------
// resolveDir
// ---------------------------------------------------------------------------
describe('ManifestWriter.resolveDir', () => {
    it('uses flag value when provided and allowlisted', () => {
        const requested = path.resolve(process.cwd(), 'toolkit-manifests', 'custom');
        const dir = ManifestWriter.resolveDir(requested);
        assert.ok(dir.length > 0);
        assert.strictEqual(dir, requested);
    });

    it('falls back to default when flag is undefined', () => {
        const dir = ManifestWriter.resolveDir(undefined);
        assert.ok(dir.length > 0);
    });
});
