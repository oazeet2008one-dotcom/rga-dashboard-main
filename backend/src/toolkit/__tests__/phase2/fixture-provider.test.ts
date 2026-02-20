import 'reflect-metadata';
import { test, describe, beforeEach, after } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { FixtureProvider, FixtureError } from '../../fixtures/fixture-provider';

const createTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'rga-toolkit-exec-test-'));

describe('FixtureProvider (Phase 2)', () => {
    let tempDir: string;
    let provider: FixtureProvider;

    beforeEach(() => {
        tempDir = createTempDir();
        provider = new FixtureProvider({ baseDir: tempDir });
    });

    after(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('should reject path traversal attempts (Test 17)', async () => {
        await assert.rejects(
            async () => await provider.loadFixture('../secret', 123),
            (err: FixtureError) => {
                assert.strictEqual(err.code, 'PATH_TRAVERSAL');
                assert.strictEqual(err.exitCode, 78);
                return true;
            }
        );
    });

    test('should reject oversized files (>256KB) (Test 18)', async () => {
        const scenarioId = 'oversized';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`; // Fixed filename format
        const largeFile = path.join(tempDir, filename);

        // 256KB + 1 byte
        const content = 'a'.repeat(256 * 1024 + 1);
        fs.writeFileSync(largeFile, content);

        await assert.rejects(
            async () => await provider.loadFixture(scenarioId, seed),
            (err: FixtureError) => {
                assert.strictEqual(err.code, 'FIXTURE_TOO_LARGE'); // Fixed error code expectation
                assert.strictEqual(err.exitCode, 78);
                return true;
            }
        );
    });

    test('should load valid golden fixture and verify checksum (Test 16, 19)', async () => {
        const scenarioId = 'valid';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`; // Ensure filename matches provider logic
        // Provider uses: `${scenarioId}_seed${seed}.fixture.json`;
        // My previous test used dots: `${scenarioId}.${seed}.golden.json`. Checking provider...
        // Provider line 45: const filename = `${scenarioId}_seed${seed}.fixture.json`;

        const file = path.join(tempDir, filename);

        // Valid shape
        const shape = {
            totalCampaigns: 1,
            totalMetricRows: 5,
            perPlatform: {
                google: { campaigns: 1, metricRows: 5 }
            }
        };

        // Canonical sorted JSON creation (manually for test to ensure it matches expectation)
        // Keys: perPlatform, totalCampaigns, totalMetricRows
        // perPlatform keys: google
        const canonical = '{"perPlatform":{"google":{"campaigns":1,"metricRows":5}},"totalCampaigns":1,"totalMetricRows":5}';

        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        const checksum = `sha256:${hash}`;

        const fixtureContent = JSON.stringify({
            schemaVersion: '1.0.0',
            scenarioId: 'valid',
            checksum,
            shape,
            samples: [] // valid empty samples
        });
        fs.writeFileSync(file, fixtureContent);

        const fixture = await provider.loadFixture(scenarioId, seed);
        assert.deepStrictEqual(fixture.shape, shape);
        assert.strictEqual(fixture.checksum, checksum);
    });

    test('should reject fixture with mismatched checksum (Test 19 Fail)', async () => {
        const scenarioId = 'badhash';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const file = path.join(tempDir, filename);

        const shape = { totalMetricRows: 1 };
        // Use WRONG checksum
        const fixtureContent = JSON.stringify({
            schemaVersion: '1.0.0',
            scenarioId: 'badhash',
            checksum: 'sha256:0000000000',
            shape,
            samples: []
        });
        fs.writeFileSync(file, fixtureContent);

        await assert.rejects(
            async () => await provider.loadFixture(scenarioId, seed),
            (err: FixtureError) => {
                assert.strictEqual(err.code, 'CHECKSUM_MISMATCH');
                assert.strictEqual(err.exitCode, 2);
                return true;
            }
        );
    });

    test('should canonicalize key order for checksum verification (Test 19 Canonical)', async () => {
        const scenarioId = 'order';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`;
        const file = path.join(tempDir, filename);

        // Shape with unsorted keys in JS object (order is property creation order usually, but let's be tricky)
        // Key order shouldn't matter for the PROVIDER, as it sorts them.
        // We provide the checksum hash of the SORTED canonical string.

        // Canonical: a:1, b:2
        const canonical = '{"a":1,"b":2}';
        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        const checksum = `sha256:${hash}`;

        // Write fixture file with UN-canonical content (keys inverted)
        const fixtureContent = '{"schemaVersion":"1.0.0","scenarioId":"order","checksum":"' + checksum + '","shape":{"b":2,"a":1},"samples":[]}';
        fs.writeFileSync(file, fixtureContent);

        // Should succeed because provider sorts keys to match 'canonical' hash
        const fixture = await provider.loadFixture(scenarioId, seed);
        // assert fixture loaded
        assert.strictEqual(fixture.scenarioId, 'order');
    });

    test('should reject invalid JSON structure (Test 20)', async () => {
        const scenarioId = 'invalid';
        const seed = 123;
        const filename = `${scenarioId}_seed${seed}.fixture.json`; // Fixed filename format
        const file = path.join(tempDir, filename);

        fs.writeFileSync(file, '{ invalid json ');

        await assert.rejects(
            async () => await provider.loadFixture(scenarioId, seed),
            (err: FixtureError) => {
                assert.strictEqual(err.code, 'PARSE_ERROR');
                assert.strictEqual(err.exitCode, 2);
                return true;
            }
        );
    });
});
