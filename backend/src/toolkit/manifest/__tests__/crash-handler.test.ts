/**
 * Child-process crash handler tests: exit code determinism
 * Runner: node:test (no Jest)
 *
 * These tests spawn child Node processes to verify:
 *   - SIGINT → exit code 130
 *   - uncaughtException → exit code 1
 *   - Listener count stability across multiple pipeline runs
 */
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { spawn } from 'child_process';
import * as path from 'path';
import { executeWithManifest, emergencyFinalizeAndWrite, getActiveBuilder } from '../manifest-pipeline';
import { promises as fs } from 'fs';

const backendRoot = path.resolve(__dirname, '../../../..');

// ---------------------------------------------------------------------------
// Helper: spawn child process
// ---------------------------------------------------------------------------
function spawnChild(script: string, timeoutMs = 15000): Promise<{ code: number | null; stderr: string }> {
    return new Promise((resolve) => {
        const child = spawn('node', ['-e', script], {
            cwd: backendRoot,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stderr = '';
        child.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });

        child.on('exit', (code) => resolve({ code, stderr }));

        setTimeout(() => {
            child.kill('SIGKILL');
            resolve({ code: null, stderr: stderr + '\n[TIMEOUT]' });
        }, timeoutMs);
    });
}

// ---------------------------------------------------------------------------
// Test 1: SIGINT exit code 130
// ---------------------------------------------------------------------------
describe('Crash: SIGINT exit code', () => {
    it('exits with 130 when SIGINT handler fires', async () => {
        // On Windows, child.kill('SIGINT') doesn't work (no POSIX signals).
        // Have the child self-emit SIGINT via process.emit.
        const script = `
            require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', target: 'ES2021', esModuleInterop: true } });
            const { emergencyFinalizeAndWrite } = require('./src/toolkit/manifest/manifest-pipeline');

            process.on('SIGINT', () => {
                emergencyFinalizeAndWrite('SIGINT');
                process.exit(130);
            });

            setTimeout(() => { process.emit('SIGINT', 'SIGINT'); }, 100);
            setInterval(() => {}, 1000);
        `;

        const { code } = await spawnChild(script);
        assert.strictEqual(code, 130, `Expected exit code 130, got ${code}`);
    });
});

// ---------------------------------------------------------------------------
// Test 2: uncaughtException exit code 1
// ---------------------------------------------------------------------------
describe('Crash: uncaughtException exit code', () => {
    it('exits with 1 when uncaughtException handler fires', async () => {
        const script = `
            require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', target: 'ES2021', esModuleInterop: true } });
            const { emergencyFinalizeAndWrite } = require('./src/toolkit/manifest/manifest-pipeline');

            process.on('uncaughtException', (err) => {
                emergencyFinalizeAndWrite('uncaughtException');
                process.exit(1);
            });

            setTimeout(() => { throw new Error('deliberate crash'); }, 50);
        `;

        const { code } = await spawnChild(script);
        assert.strictEqual(code, 1, `Expected exit code 1, got ${code}`);
    });
});

// ---------------------------------------------------------------------------
// Test 3: Listener count stability across sequential pipeline runs
// ---------------------------------------------------------------------------
describe('Crash: listener accumulation', () => {
    it('pipeline adds zero process-level listeners across 3 runs', async () => {
        const before = {
            sigint: process.listenerCount('SIGINT'),
            uncaught: process.listenerCount('uncaughtException'),
            unhandled: process.listenerCount('unhandledRejection'),
        };

        const base = path.resolve(process.cwd(), 'toolkit-manifests');
        await fs.mkdir(base, { recursive: true });
        const tmpDir = await fs.mkdtemp(path.join(base, 'accum-test-'));
        try {
            for (let i = 0; i < 3; i++) {
                await executeWithManifest({
                    config: { executionMode: 'CLI', commandName: `test-${i}`, commandClassification: 'WRITE' },
                    execute: async () => ({ status: 'SUCCESS' as const, exitCode: 0 as const }),
                    safetyOptions: { toolkitEnv: 'LOCAL', databaseUrl: 'postgresql://x@localhost/db' },
                    manifestDir: tmpDir,
                });
            }

            assert.strictEqual(process.listenerCount('SIGINT'), before.sigint, 'SIGINT count unchanged');
            assert.strictEqual(process.listenerCount('uncaughtException'), before.uncaught, 'uncaughtException count unchanged');
            assert.strictEqual(process.listenerCount('unhandledRejection'), before.unhandled, 'unhandledRejection count unchanged');
        } finally {
            await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
        }
    });
});

// ---------------------------------------------------------------------------
// Test 4: activeBuilder cleared after pipeline
// ---------------------------------------------------------------------------
describe('Crash: activeBuilder lifecycle', () => {
    it('no active builder after pipeline completes', () => {
        assert.strictEqual(getActiveBuilder(), null);
    });

    it('emergencyFinalizeAndWrite is no-op when no active builder', () => {
        // Must not throw
        emergencyFinalizeAndWrite('SIGINT');
        emergencyFinalizeAndWrite('uncaughtException');
        emergencyFinalizeAndWrite('unhandledRejection');
    });
});
