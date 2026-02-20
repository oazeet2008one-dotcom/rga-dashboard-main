/**
 * Integration-ish tests: manifest-pipeline.ts — full pipeline lifecycle
 * Runner: node:test (no Jest, no Nest, no DB)
 *
 * Covers:
 *   - BLOCKED manifest (exit 78 semantics)
 *   - SUCCESS manifest
 *   - FAILED manifest (unexpected error)
 *   - Redaction in pipeline output (no secrets leak)
 *   - Best-effort write failure does NOT alter outcome/exit
 *   - emergencyFinalizeAndWrite no-op safety
 */
import { describe, it, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { executeWithManifest, evaluateSafetyGates, emergencyFinalizeAndWrite, getActiveBuilder } from '../manifest-pipeline';
import { promises as fs } from 'fs';
import * as path from 'path';

let tmpDir: string;

before(async () => {
    const base = path.resolve(process.cwd(), 'toolkit-manifests');
    await fs.mkdir(base, { recursive: true });
    tmpDir = await fs.mkdtemp(path.join(base, 'pipeline-test-'));
});

after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
});

// ---------------------------------------------------------------------------
// BLOCKED manifest (env missing → exit 78)
// ---------------------------------------------------------------------------
describe('Pipeline: BLOCKED', () => {
    it('returns BLOCKED when TOOLKIT_ENV missing', async () => {
        const result = await executeWithManifest({
            config: { executionMode: 'CLI', commandName: 'seed-data', commandClassification: 'WRITE' },
            execute: async () => ({ status: 'SUCCESS' as const, exitCode: 0 as const }),
            safetyOptions: { toolkitEnv: undefined, databaseUrl: 'postgresql://x@localhost/db' },
            manifestDir: tmpDir,
        });

        assert.strictEqual(result.status, 'BLOCKED');
        assert.strictEqual(result.exitCode, 78);
    });

    it('writes BLOCKED manifest to disk', async () => {
        const files = await fs.readdir(tmpDir);
        const manifestFiles = files.filter(f => f.endsWith('.manifest.json'));
        assert.ok(manifestFiles.length >= 1, 'at least one manifest written');

        const latest = manifestFiles[manifestFiles.length - 1];
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, latest), 'utf-8'));
        assert.strictEqual(content.status, 'BLOCKED');
        assert.strictEqual(content.exitCode, 78);
    });
});

// ---------------------------------------------------------------------------
// SUCCESS manifest
// ---------------------------------------------------------------------------
describe('Pipeline: SUCCESS', () => {
    it('returns SUCCESS when all gates pass and execute succeeds', async () => {
        const result = await executeWithManifest({
            config: { executionMode: 'CLI', commandName: 'seed-data', commandClassification: 'WRITE' },
            execute: async () => ({ status: 'SUCCESS' as const, exitCode: 0 as const }),
            safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
            manifestDir: tmpDir,
        });

        assert.strictEqual(result.status, 'SUCCESS');
        assert.strictEqual(result.exitCode, 0);
    });

    it('has SAFETY_CHECK step', async () => {
        // Read the latest manifest
        const files = await fs.readdir(tmpDir);
        const manifests = files.filter(f => f.endsWith('.manifest.json')).sort();
        const latest = manifests[manifests.length - 1];
        const content = JSON.parse(await fs.readFile(path.join(tmpDir, latest), 'utf-8'));

        const stepNames = content.steps.map((s: { name: string }) => s.name);
        assert.ok(stepNames.includes('SAFETY_CHECK'), `Steps: ${stepNames}`);
    });
});

// ---------------------------------------------------------------------------
// FAILED manifest (unexpected error in execute)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// FAILED manifest (unexpected error in execute)
// ---------------------------------------------------------------------------
describe('Pipeline: FAILED', () => {
    it('returns FAILED and captures error when execute throws', async () => {
        // Use isolated dir to avoid race conditions with other tests
        const base = path.resolve(process.cwd(), 'toolkit-manifests');
        await fs.mkdir(base, { recursive: true });
        const isolateDir = await fs.mkdtemp(path.join(base, 'pipeline-fail-'));

        try {
            const result = await executeWithManifest({
                config: { executionMode: 'CLI', commandName: 'test-cmd', commandClassification: 'WRITE' },
                execute: async () => { throw new Error('deliberate explosion'); },
                safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
                manifestDir: isolateDir,
            });

            assert.strictEqual(result.status, 'FAILED');
            assert.strictEqual(result.exitCode, 1);

            const files = await fs.readdir(isolateDir);
            const manifests = files.filter(f => f.endsWith('.manifest.json'));
            assert.strictEqual(manifests.length, 1);

            const content = JSON.parse(await fs.readFile(path.join(isolateDir, manifests[0]), 'utf-8'));
            assert.ok(content.results.errors.length > 0, 'Should capture errors in manifest');
            assert.strictEqual(content.results.errors[0].message, 'deliberate explosion');
        } finally {
            await fs.rm(isolateDir, { recursive: true, force: true }).catch(() => { });
        }
    });
});

// ---------------------------------------------------------------------------
// Redaction in pipeline output
// ---------------------------------------------------------------------------
describe('Pipeline: redaction', () => {
    it('does not leak forbidden keys in manifest', async () => {
        await executeWithManifest({
            config: {
                executionMode: 'CLI',
                commandName: 'seed-data',
                commandClassification: 'WRITE',
                args: { API_KEY: 'super-secret-key', tenantId: 'visible' },
            },
            execute: async () => ({ status: 'SUCCESS' as const, exitCode: 0 as const }),
            safetyOptions: {
                toolkitEnv: 'LOCAL',
                databaseUrl: 'postgresql://admin:s3cret@localhost/db',
            },
            manifestDir: tmpDir,
        });

        const files = await fs.readdir(tmpDir);
        const manifests = files.filter(f => f.endsWith('.manifest.json')).sort();
        const latest = manifests[manifests.length - 1];
        const raw = await fs.readFile(path.join(tmpDir, latest), 'utf-8');

        assert.ok(!raw.includes('super-secret-key'), 'API_KEY value not in manifest');
        assert.ok(!raw.includes('s3cret'), 'DB password not in manifest');
    });
});

// ---------------------------------------------------------------------------
// Best-effort write: failure does NOT alter outcome
// ---------------------------------------------------------------------------
describe('Pipeline: best-effort write', () => {
    it('does not throw or alter exit code when manifest dir is invalid', async () => {
        const result = await executeWithManifest({
            config: { executionMode: 'CLI', commandName: 'test-cmd', commandClassification: 'WRITE' },
            execute: async () => ({ status: 'SUCCESS' as const, exitCode: 0 as const }),
            safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
            manifestDir: 'Z:\\definitely\\invalid\\\0path',
        });

        // Pipeline should still report SUCCESS even though write failed
        assert.strictEqual(result.status, 'SUCCESS');
        assert.strictEqual(result.exitCode, 0);
    });
});

// ---------------------------------------------------------------------------
// Safety gates (unit-ish)
// ---------------------------------------------------------------------------
describe('evaluateSafetyGates', () => {
    it('passes for LOCAL + localhost', () => {
        const result = evaluateSafetyGates({
            toolkitEnv: 'LOCAL',
            databaseUrl: 'postgresql://x@localhost/db',
        });
        assert.ok(!result.blocked);
        assert.ok(result.safety.gates.length >= 2);
        assert.ok(result.safety.gates.every(g => g.passed));
    });

    it('blocks when TOOLKIT_ENV missing', () => {
        const result = evaluateSafetyGates({
            toolkitEnv: undefined,
            databaseUrl: 'postgresql://x@localhost/db',
        });
        assert.ok(result.blocked);
        assert.ok(result.blockedGate !== null);
    });

    it('blocks for Supabase-hosted DB', () => {
        const result = evaluateSafetyGates({
            toolkitEnv: 'LOCAL',
            databaseUrl: 'postgresql://x@db.abcdefghijklm.supabase.co/postgres',
        });
        assert.ok(result.blocked);
    });
});

// ---------------------------------------------------------------------------
// emergencyFinalizeAndWrite no-op
// ---------------------------------------------------------------------------
describe('emergencyFinalizeAndWrite', () => {
    it('is no-op when no active builder', () => {
        assert.strictEqual(getActiveBuilder(), null);
        // Must not throw
        emergencyFinalizeAndWrite('SIGINT');
        emergencyFinalizeAndWrite('uncaughtException');
    });
});
