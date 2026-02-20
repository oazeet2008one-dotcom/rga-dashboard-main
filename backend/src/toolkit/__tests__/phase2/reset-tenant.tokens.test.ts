import 'reflect-metadata';
import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { TenantResetService } from '../../services/tenant-reset.service';

function createService() {
    const txClient = {
        metric: { deleteMany: async () => ({ count: 10 }) },
        alert: { deleteMany: async () => ({ count: 2 }) },
        alertHistory: { deleteMany: async () => ({ count: 3 }) },
        alertRule: { deleteMany: async () => ({ count: 1 }) },
        campaign: { deleteMany: async () => ({ count: 4 }) },
    };

    const prisma = {
        tenant: {
            findUnique: async ({ where }: any) => {
                if (where.id === 'tenant-a' || where.id === 'tenant-b') {
                    return { id: where.id, name: where.id };
                }
                return null;
            },
        },
        $transaction: async (callback: any) => callback(txClient),
    };

    return new TenantResetService(prisma as any);
}

describe('TenantResetService hard reset confirmation tokens', () => {
    test('accepts server-issued token once, then rejects replay', async () => {
        const service = createService();
        const issued = service.generateConfirmationToken('tenant-a');

        const first = await service.hardReset('tenant-a', {
            mode: 'HARD',
            confirmationToken: issued.token,
            confirmedAt: new Date(),
        });

        assert.strictEqual(first.success, true);

        const replay = await service.hardReset('tenant-a', {
            mode: 'HARD',
            confirmationToken: issued.token,
            confirmedAt: new Date(),
        });

        assert.strictEqual(replay.success, false);
        assert.ok((replay.error || '').includes('already used'));
    });

    test('rejects forged token even when format looks valid', async () => {
        const service = createService();

        const result = await service.hardReset('tenant-a', {
            mode: 'HARD',
            confirmationToken: 'RTH.fake-id.fake-secret',
            confirmedAt: new Date(),
        });

        assert.strictEqual(result.success, false);
        assert.ok((result.error || '').includes('unknown') || (result.error || '').includes('Invalid'));
    });

    test('rejects token used for a different tenant', async () => {
        const service = createService();
        const issued = service.generateConfirmationToken('tenant-a');

        const result = await service.hardReset('tenant-b', {
            mode: 'HARD',
            confirmationToken: issued.token,
            confirmedAt: new Date(),
        });

        assert.strictEqual(result.success, false);
        assert.ok((result.error || '').includes('tenant mismatch'));
    });
});

