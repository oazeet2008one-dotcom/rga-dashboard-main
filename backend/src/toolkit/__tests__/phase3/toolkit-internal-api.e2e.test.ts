import 'reflect-metadata';
import { beforeEach, afterEach, describe, test } from 'node:test';
import * as assert from 'node:assert';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ToolkitController } from '../../api/toolkit.controller';
import { ToolkitCommandExecutorService } from '../../api/toolkit-command-executor.service';
import { ToolkitInternalGuard } from '../../api/toolkit-internal.guard';
import { ToolkitQueryService } from '../../api/toolkit-query.service';
import { createToolkitValidationPipe } from '../../api/toolkit-validation.pipe';

describe('Toolkit Internal API (e2e)', () => {
    const internalApiKey = 'test-internal-api-key';
    let app: INestApplication;

    const queryServiceMock: any = {
        getMetrics: async () => ({ metrics: [{ id: 'm1' }], count: 1 }),
        getAlerts: async () => ({ alerts: [{ id: 'a1' }], count: 1 }),
        getAlertHistory: async () => ({ history: [{ id: 'h1' }], count: 1 }),
    };

    const commandExecutorMock: any = {
        executeCommand: async () => ({
            kind: 'success',
            value: { success: true },
        }),
        issueHardResetToken: () => ({
            token: 'RTH.token.secret',
            expiresAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
    };

    beforeEach(async () => {
        process.env.NODE_ENV = 'development';
        process.env.TOOLKIT_INTERNAL_API_ENABLED = 'true';
        process.env.TOOLKIT_INTERNAL_API_KEY = internalApiKey;

        const moduleRef = await Test.createTestingModule({
            controllers: [ToolkitController],
            providers: [
                ToolkitInternalGuard,
                {
                    provide: ToolkitQueryService,
                    useValue: queryServiceMock,
                },
                {
                    provide: ToolkitCommandExecutorService,
                    useValue: commandExecutorMock,
                },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(createToolkitValidationPipe());
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    test('GET /internal/metrics should return data with internal key', async () => {
        const response = await request(app.getHttpServer())
            .get('/internal/metrics')
            .query({ tenantId: 'tenant-1' })
            .set('x-toolkit-internal-key', internalApiKey)
            .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.strictEqual(response.body.data.count, 1);
    });

    test('POST /internal/reset-tenant should reject dryRun=false without confirmWrite', async () => {
        await request(app.getHttpServer())
            .post('/internal/reset-tenant')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
                tenantId: 'tenant-1',
                dryRun: false,
                confirmWrite: false,
            })
            .expect(400);
    });

    test('POST /internal/reset-tenant should pass when confirmWrite=true', async () => {
        let capturedDryRun: boolean | null = null;
        commandExecutorMock.executeCommand = async (
            _command: unknown,
            params: { dryRun: boolean },
        ) => {
            capturedDryRun = params.dryRun;
            return { kind: 'success', value: { success: true } };
        };

        await request(app.getHttpServer())
            .post('/internal/reset-tenant')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
                tenantId: 'tenant-1',
                dryRun: false,
                confirmWrite: true,
            })
            .expect(200);

        assert.strictEqual(capturedDryRun, false);
    });

    test('POST /internal/reset-tenant/hard/token should return token payload', async () => {
        const response = await request(app.getHttpServer())
            .post('/internal/reset-tenant/hard/token')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
                tenantId: 'tenant-1',
            })
            .expect(200);

        assert.strictEqual(response.body.success, true);
        assert.strictEqual(response.body.data.token, 'RTH.token.secret');
        assert.strictEqual(response.body.data.expiresAt, '2026-01-01T00:00:00.000Z');
    });

    test('POST /internal/reset-tenant/hard should reject invalid destructiveAck', async () => {
        await request(app.getHttpServer())
            .post('/internal/reset-tenant/hard')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
                tenantId: 'tenant-1',
                confirmationToken: 'RTH.token.secret',
                confirmedAt: '2026-01-01T00:00:00.000Z',
                destructiveAck: 'WRONG_ACK',
                dryRun: false,
                confirmWrite: true,
            })
            .expect(400);
    });

    test('POST /internal/reset-tenant/hard should pass when payload is valid', async () => {
        let capturedDryRun: boolean | null = null;
        commandExecutorMock.executeCommand = async (
            _command: unknown,
            params: { dryRun: boolean },
        ) => {
            capturedDryRun = params.dryRun;
            return { kind: 'success', value: { success: true } };
        };

        await request(app.getHttpServer())
            .post('/internal/reset-tenant/hard')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
                tenantId: 'tenant-1',
                confirmationToken: 'RTH.token.secret',
                confirmedAt: '2026-01-01T00:00:00.000Z',
                destructiveAck: 'HARD_RESET',
                dryRun: false,
                confirmWrite: true,
            })
            .expect(200);

        assert.strictEqual(capturedDryRun, false);
    });

    test('POST /internal/alert-scenario should map SAFETY_BLOCK to 403', async () => {
        commandExecutorMock.executeCommand = async () => ({
            kind: 'failure',
            error: {
                name: 'SafetyBlockedError',
                code: 'SAFETY_BLOCK',
                message: 'Execution blocked by safety gate',
                isRecoverable: false,
            },
        });

        await request(app.getHttpServer())
            .post('/internal/alert-scenario')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
                tenantId: 'tenant-1',
                seedBaseline: true,
                injectAnomaly: false,
                days: 30,
                dryRun: true,
            })
            .expect(403);
    });

    test('POST /internal/alert-scenario should map CONCURRENCY_LIMIT to 429', async () => {
        commandExecutorMock.executeCommand = async () => ({
            kind: 'failure',
            error: {
                name: 'ToolkitConcurrencyLimitError',
                code: 'CONCURRENCY_LIMIT',
                message: 'Maximum concurrent toolkit commands reached (5). Retry later.',
                isRecoverable: true,
            },
        });

        await request(app.getHttpServer())
            .post('/internal/alert-scenario')
            .set('x-toolkit-internal-key', internalApiKey)
            .send({
                tenantId: 'tenant-1',
                seedBaseline: true,
                injectAnomaly: false,
                days: 30,
                dryRun: true,
            })
            .expect(429);
    });
});
