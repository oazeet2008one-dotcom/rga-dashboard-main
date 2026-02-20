import 'reflect-metadata';
import { test, describe, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ScenarioLoader, ScenarioError } from '../../scenarios/scenario-loader';

// Helper to create temp directory
const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rga-toolkit-test-'));

describe('ScenarioLoader (Phase 2)', () => {
    let tempDir: string;
    let loader: ScenarioLoader;

    beforeEach(() => {
        tempDir = createTempDir();
        loader = new ScenarioLoader();
        loader.setBaseDir(tempDir);
    });

    after(() => {
        // Cleanup temp dir
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('should reject path traversal attempts (Test 2)', async () => {
        // Attempt to access parent directory
        await assert.rejects(
            async () => await loader.load('../secret'),
            (err: ScenarioError) => {
                assert.strictEqual(err.code, 'PATH_TRAVERSAL');
                assert.strictEqual(err.exitCode, 78);
                return true;
            }
        );
    });

    test('should reject absolute paths (Test 1)', async () => {
        // Windows absolute path simulation or Unix
        // Using a path that triggers the PATH_TRAVERSAL error in loader
        // Loader checks for / or \ in input first
        const absPath = process.platform === 'win32' ? 'C:\\secret' : '/etc/passwd';
        await assert.rejects(
            async () => await loader.load(absPath),
            (err: ScenarioError) => {
                assert.strictEqual(err.code, 'PATH_TRAVERSAL');
                assert.strictEqual(err.exitCode, 78);
                return true;
            }
        );
    });

    test('should reject oversized files (>64KB) (Test 7/G2b)', async () => {
        // Create file with valid ID name
        const largeFile = path.join(tempDir, 'large.yaml');
        const content = 'a'.repeat(64 * 1024 + 1); // 64KB + 1 byte
        fs.writeFileSync(largeFile, content);

        await assert.rejects(
            async () => await loader.load('large'),
            (err: ScenarioError) => {
                assert.strictEqual(err.code, 'FILE_TOO_LARGE');
                assert.strictEqual(err.exitCode, 78);
                return true;
            }
        );
    });

    test('should reject multi-document YAML (Test 15)', async () => {
        const multiDocFile = path.join(tempDir, 'multidoc.yaml');
        const content = `
name: First
schemaVersion: 1.0.0
trend: STABLE
---
name: Second
schemaVersion: 1.0.0
trend: GROWTH
        `;
        fs.writeFileSync(multiDocFile, content);

        await assert.rejects(
            async () => await loader.load('multidoc'),
            (err: ScenarioError) => {
                assert.strictEqual(err.code, 'MULTI_DOCUMENT_NOT_ALLOWED');
                assert.strictEqual(err.exitCode, 2);
                return true;
            }
        );
    });

    test('should load valid YAML scenario (Test 4)', async () => {
        const file = path.join(tempDir, 'valid.yaml');
        const content = `
name: Valid Scenario
schemaVersion: 1.0.0
trend: GROWTH
days: 45
        `;
        fs.writeFileSync(file, content);

        const spec = await loader.load('valid');
        assert.strictEqual(spec.name, 'Valid Scenario');
        assert.strictEqual(spec.trend, 'GROWTH');
        assert.strictEqual(spec.days, 45);
        assert.strictEqual(spec.scenarioId, 'valid'); // Filename based ID
    });

    test('should load valid JSON scenario', async () => {
        const file = path.join(tempDir, 'jsonvalid.json');
        const content = JSON.stringify({
            name: 'JSON Scenario',
            schemaVersion: '1.0.0',
            trend: 'STABLE',
            baseImpressions: 5000
        });
        fs.writeFileSync(file, content);

        const spec = await loader.load('jsonvalid');
        assert.strictEqual(spec.name, 'JSON Scenario');
        assert.strictEqual(spec.trend, 'STABLE');
        assert.strictEqual(spec.baseImpressions, 5000);
    });

    test('should resolve aliases (Test 6)', async () => {
        // Create baseline.yaml containing alias definition?
        // Loader logic: scans all files, checks 'aliases' field matching requested ID.
        // So we need a file that HAS 'aliases: ["baseline"]'.
        const file = path.join(tempDir, 'realname.yaml');
        const content = `
name: Real Name
schemaVersion: 1.0.0
trend: STABLE
aliases:
  - baseline
`;
        fs.writeFileSync(file, content);

        // Load 'baseline' (alias for realname.yaml)
        const spec = await loader.load('baseline');
        assert.strictEqual(spec.scenarioId, 'realname'); // ID is filename stem
        assert.strictEqual(spec.trend, 'STABLE');
    });

    test('should reject invalid validation constraints (Test 9-14)', async () => {
        const file = path.join(tempDir, 'invalid.yaml');
        // Missing name and trend
        fs.writeFileSync(file, 'days: 10\nschemaVersion: 1.0.0\n');

        await assert.rejects(
            async () => await loader.load('invalid'),
            (err: ScenarioError) => {
                // validation error code varies based on first missing field
                // likely VALIDATION_ERROR or specific field error logic from validator?
                // Loader says: throw new ScenarioError(validation.errors[0].code, 2, ...)
                // Validation error for missing name/trend: probably 'invalid_type' or 'required'?
                // Zod returns specific codes. validator maps them.
                // Let's check error message or code.
                // Test expected valid Zod error code.
                // But Validator logic might wrap it.
                // Let's assert Exit Code 2 and generic message/code presence
                assert.strictEqual(err.exitCode, 2);
                return true;
            }
        );
    });
});
