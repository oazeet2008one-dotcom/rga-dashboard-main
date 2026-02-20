import 'reflect-metadata';
import { test, describe, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { VerifyScenarioCommandHandler, VerifyScenarioCommand } from '../../commands/verify-scenario.command';
import { ExecutionContextFactory } from '../../core';

// Manual Mocks for CLI Context
const mockLogger = {
    info: () => { },
    warn: () => { },
    error: () => { },
    debug: () => { },
    log: () => { }
} as any;

const mockPrisma = {} as any;
const mockLoader = {
    load: async (id: string) => ({ scenarioId: id, name: 'Test', trend: 'GROWTH' })
} as any;

describe('VerifyScenarioCommand Check (Phase 3)', () => {
    let handler: VerifyScenarioCommandHandler;
    let mockVerificationService: any;
    let mockReportWriter: any;

    beforeEach(() => {
        mockVerificationService = {
            verifyScenario: async () => ({
                meta: {
                    version: '1.0.0',
                    generator: 'test',
                    createdAt: new Date().toISOString(),
                    runId: 'run-1',
                    scenarioId: 'baseline',
                    tenantId: 'tenant-1',
                },
                summary: {
                    status: 'PASS',
                    totalChecks: 1,
                    passed: 1,
                    failed: 0,
                    warnings: 0,
                    durationMs: 1,
                },
                results: [],
                provenance: {
                    isMockData: true,
                    sourcePrefix: 'toolkit:',
                },
            }),
        };
        mockReportWriter = {
            writeReport: async () => 'artifacts/reports/verify-mock.json',
        };

        handler = new VerifyScenarioCommandHandler(
            mockLogger,
            mockPrisma,
            mockLoader,
            mockVerificationService,
            mockReportWriter,
        );
    });

    test('Should validate required parameters', () => {
        const cmd = new VerifyScenarioCommand({ scenarioId: '', tenantId: '' });
        const result = handler.validate(cmd);
        assert.ok(result.kind === 'failure');
        assert.match(result.error!.message, /Scenario ID is required/);
    });

    test('Should validate tenant ID', () => {
        const cmd = new VerifyScenarioCommand({ scenarioId: 'test', tenantId: '' });
        const result = handler.validate(cmd);
        assert.ok(result.kind === 'failure');
        assert.match(result.error!.message, /Tenant ID is required/);
    });

    test('Should pass validation with valid params', () => {
        const cmd = new VerifyScenarioCommand({ scenarioId: 'test', tenantId: 'tenant-1' });
        const result = handler.validate(cmd);
        assert.ok(result.kind === 'success');
    });

    test('Should map WARN summary semantics deterministically', async () => {
        (handler as any).runWithManifest = async () => ({
            status: 'SUCCESS',
            exitCode: 0,
            manifestPath: 'toolkit-manifests/mock.manifest.json',
            manifest: {
                status: 'SUCCESS',
                steps: [
                    {
                        name: 'VERIFY',
                        summary: 'Verification WARN: 8 passed, 0 failed, 2 warnings.',
                    },
                ],
                results: {
                    filesystemWrites: {
                        pathsMasked: ['artifacts/reports/verify-mock.json'],
                    },
                },
            },
        });

        const cmd = new VerifyScenarioCommand({ scenarioId: 'baseline', tenantId: 'tenant-1' });
        const context = ExecutionContextFactory.create({
            tenantId: 'tenant-1' as any,
            runId: 'run-1',
            dryRun: false,
            verbose: true,
            logger: mockLogger,
            printer: {
                log: () => { },
                warn: () => { },
                error: () => { },
                header: () => { },
                spinner: () => ({ start: () => { }, succeed: () => { }, fail: () => { }, stop: () => { } }),
            },
        });

        const result = await handler.execute(cmd, context);
        assert.ok(result.kind === 'success');
        assert.strictEqual(result.value.status, 'WARN');
        assert.deepStrictEqual(result.value.summary, {
            status: 'WARN',
            passed: 8,
            failed: 0,
            warnings: 2,
        });
    });
});
