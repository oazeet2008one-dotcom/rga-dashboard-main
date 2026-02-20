import 'reflect-metadata';
import { test, describe, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ReportWriter } from '../../../modules/verification/report-writer';
import { ManifestBuilder } from '../../manifest/manifest-builder';
import { CommandClassification } from '../../manifest/types';

describe('ReportWriter & Manifest (Phase 3)', () => {
    let writer: ReportWriter;
    let tempDir: string;
    let originalAllowedReportRoots: string | undefined;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rga-verify-test-'));
        originalAllowedReportRoots = process.env.TOOLKIT_ALLOWED_REPORT_ROOTS;
        process.env.TOOLKIT_ALLOWED_REPORT_ROOTS = tempDir;
        writer = new ReportWriter();
    });

    afterEach(() => {
        if (originalAllowedReportRoots === undefined) {
            delete process.env.TOOLKIT_ALLOWED_REPORT_ROOTS;
        } else {
            process.env.TOOLKIT_ALLOWED_REPORT_ROOTS = originalAllowedReportRoots;
        }

        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    // P1: T6 - Safe Report Writer
    test('T6: Should write report atomically and canonicalize JSON', async () => {
        const result: any = {
            meta: { runId: 'test-run-1' },
            results: [],
            // Unsorted keys to test canonicalization
            summary: { b: 2, a: 1 }
        };

        const filePath = await writer.writeReport(result, tempDir);

        assert.ok(fs.existsSync(filePath), 'Report file should exist');

        const content = fs.readFileSync(filePath, 'utf8');
        // Canonical check: "a":1 comes before "b":2
        assert.ok(content.includes('"a":1,"b":2'), 'JSON should be canonicalized (sorted keys)');
    });

    test('T6: Should prevent path traversal via runId', async () => {
        // Attempt to write outside tempDir via runId manipulation
        const result: any = { meta: { runId: '../traversal' } };

        await assert.rejects(
            async () => await writer.writeReport(result, tempDir),
            (err: any) => {
                assert.match(err.message, /Invalid Run ID/);
                return true;
            }
        );
    });

    // P1: T7 - Manifest Verify Creation
    test('T7: Should initialize Manifest with VERIFY type equivalent and targetRunId', () => {
        // Simulating usage in verify-scenario command
        const builder = new ManifestBuilder({
            commandName: 'verify-scenario',
            commandClassification: 'READ',
            executionMode: 'CLI',
            args: { scenario: 'test', targetRunId: 'system-run-123' }
        });

        const doc = builder.finalize('SUCCESS', 0);

        assert.strictEqual(doc.invocation.commandName, 'verify-scenario');
        assert.deepStrictEqual(doc.invocation.args, { scenario: 'test', targetRunId: 'system-run-123' });
    });
});
