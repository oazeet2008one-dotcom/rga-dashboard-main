/**
 * =============================================================================
 * ToolkitAuthService — Unit Tests (Phase 5B.4)
 * =============================================================================
 */

import 'reflect-metadata';
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import * as jwt from 'jsonwebtoken';
import { ToolkitAuthService } from '../toolkit-auth.service';
import { PrismaClient, UserRole } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
    user: {
        findFirst: mock.fn(),
        create: mock.fn(),
    },
    tenant: {
        findUnique: mock.fn(),
    },
    $disconnect: mock.fn(),
} as unknown as PrismaClient;

describe('ToolkitAuthService', () => {
    let service: ToolkitAuthService;
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset mocks
        (mockPrisma.user.findFirst as any).mock.resetCalls();
        (mockPrisma.user.create as any).mock.resetCalls();
        (mockPrisma.tenant.findUnique as any).mock.resetCalls();
        (mockPrisma.$disconnect as any).mock.resetCalls();

        // Restore env
        process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };

        // Inject mock prisma
        service = new ToolkitAuthService(mockPrisma);
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('getOrCreateAdmin returns existing user if found', async () => {
        const existingUser = { id: 'user-1', email: 'test@example.com', role: 'ADMIN' };
        (mockPrisma.user.findFirst as any).mock.mockImplementation(async () => existingUser);

        const result = await service.getOrCreateAdmin('tenant-1');

        assert.deepStrictEqual(result, existingUser);
        assert.strictEqual((mockPrisma.user.findFirst as any).mock.callCount(), 1);
        assert.strictEqual((mockPrisma.user.create as any).mock.callCount(), 0);
    });

    it('getOrCreateAdmin creates new user if not found and tenant exists', async () => {
        (mockPrisma.user.findFirst as any).mock.mockImplementation(async () => null);
        (mockPrisma.tenant.findUnique as any).mock.mockImplementation(async () => ({ id: 'tenant-1' }));

        const newUser = { id: 'user-new', email: 'toolkit-admin@tenant-1.local', role: 'ADMIN' };
        (mockPrisma.user.create as any).mock.mockImplementation(async () => newUser);

        const result = await service.getOrCreateAdmin('tenant-1');

        assert.deepStrictEqual(result, newUser);
        assert.strictEqual((mockPrisma.user.findFirst as any).mock.callCount(), 1);
        assert.strictEqual((mockPrisma.tenant.findUnique as any).mock.callCount(), 1);
        assert.strictEqual((mockPrisma.user.create as any).mock.callCount(), 1);

        // Check create arguments
        const createArgs = (mockPrisma.user.create as any).mock.calls[0].arguments[0];
        assert.strictEqual(createArgs.data.tenantId, 'tenant-1');
        assert.strictEqual(createArgs.data.role, 'ADMIN'); // Assuming ADMIN string literal works, or use enum if imported
    });

    it('getOrCreateAdmin throws if tenant does not exist', async () => {
        (mockPrisma.user.findFirst as any).mock.mockImplementation(async () => null);
        (mockPrisma.tenant.findUnique as any).mock.mockImplementation(async () => null);

        await assert.rejects(async () => {
            await service.getOrCreateAdmin('tenant-missing');
        }, /Tenant not found: tenant-missing/);

        assert.strictEqual((mockPrisma.user.create as any).mock.callCount(), 0);
    });

    it('generateImpersonationToken throws if JWT_SECRET is missing', () => {
        delete process.env.JWT_SECRET;

        assert.throws(() => {
            service.generateImpersonationToken({ id: '1', email: 'a@b.com' }, 't1');
        }, /Missing JWT_SECRET/);
    });

    it('generateImpersonationToken returns valid JWT', () => {
        const user = { id: 'u1', email: 'test@example.com' };
        const token = service.generateImpersonationToken(user, 't1');

        assert.ok(typeof token === 'string');

        // Verify token
        const decoded = jwt.verify(token, 'test-secret') as any;
        assert.strictEqual(decoded.sub, 'u1');
        assert.strictEqual(decoded.email, 'test@example.com');
    });

    it('disconnect calls prisma disconnect', async () => {
        await service.disconnect();
        assert.strictEqual((mockPrisma.$disconnect as any).mock.callCount(), 1);
    });
});
