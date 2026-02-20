import { describe, test, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { executeWithSafetyManifest } from '../../core/safety-execution';
import { IExecutionContext, IUiPrinter, ILogger, Result, createTenantId } from '../../core/contracts';
import { PrismaClient } from '@prisma/client';

const mockLogger: ILogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => mockLogger,
};

const mockPrinter: IUiPrinter = {
    log: () => { },
    warn: () => { },
    error: () => { },
    header: () => { },
    spinner: () => ({ start: () => { }, succeed: () => { }, fail: () => { }, stop: () => { } }),
};

function buildContext(dryRun = false): IExecutionContext {
    return {
        tenantId: createTenantId('11111111-1111-1111-1111-111111111111'),
        correlationId: 'corr-test',
        startedAt: new Date(),
        dryRun,
        verbose: true,
        runId: 'run-test',
        logger: mockLogger,
        printer: mockPrinter,
        with(props) {
            return { ...this, ...props } as IExecutionContext;
        },
        elapsedMs() {
            return 0;
        },
    };
}

describe('executeWithSafetyManifest', () => {
    let oldEnv: NodeJS.ProcessEnv;
    let prisma: PrismaClient;

    beforeEach(() => {
        oldEnv = { ...process.env };
        prisma = new PrismaClient();
    });

    afterEach(async () => {
        process.env = oldEnv;
        await prisma.$disconnect();
    });

    test('blocks unsafe host before handler execution', async () => {
        process.env.TOOLKIT_ENV = 'DEV';
        process.env.DATABASE_URL = 'postgresql://x@db.abcdefghijklm.supabase.co/postgres';
        process.env.TOOLKIT_SAFE_DB_HOSTS = 'localhost,127.0.0.1';

        let executed = false;

        const { result, pipeline } = await executeWithSafetyManifest({
            commandName: 'reset-tenant',
            executionMode: 'CLI',
            context: buildContext(false),
            prisma,
            skipSchemaParityPreflight: true,
            execute: async () => {
                executed = true;
                return Result.success({ ok: true });
            },
        });

        assert.strictEqual(executed, false);
        assert.strictEqual(result.kind, 'failure');
        assert.strictEqual(pipeline?.status, 'BLOCKED');
    });

    test('executes handler when host is allowlisted', async () => {
        process.env.TOOLKIT_ENV = 'DEV';
        process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/rga_dev';
        process.env.TOOLKIT_SAFE_DB_HOSTS = 'localhost,127.0.0.1';

        let executed = false;

        const { result, pipeline } = await executeWithSafetyManifest({
            commandName: 'seed-google-ads',
            executionMode: 'CLI',
            context: buildContext(true),
            prisma,
            skipSchemaParityPreflight: true,
            execute: async () => {
                executed = true;
                return Result.success({ ok: true });
            },
        });

        assert.strictEqual(executed, true);
        assert.strictEqual(result.kind, 'success');
        assert.strictEqual(pipeline?.status, 'SUCCESS');
    });

    test('blocks execution when schema parity preflight fails', async () => {
        process.env.TOOLKIT_ENV = 'DEV';
        process.env.DATABASE_URL =
            'postgresql://postgres:password@localhost:5432/rga_dev?schema=invalid-schema!';
        process.env.TOOLKIT_SAFE_DB_HOSTS = 'localhost,127.0.0.1';

        let executed = false;

        const { result, pipeline } = await executeWithSafetyManifest({
            commandName: 'seed-google-ads',
            executionMode: 'CLI',
            context: buildContext(true),
            prisma,
            execute: async () => {
                executed = true;
                return Result.success({ ok: true });
            },
        });

        assert.strictEqual(executed, false);
        assert.strictEqual(result.kind, 'failure');
        assert.strictEqual(result.error.code, 'SCHEMA_PARITY_VIOLATION');
        assert.strictEqual(pipeline?.status, 'BLOCKED');
    });
});
