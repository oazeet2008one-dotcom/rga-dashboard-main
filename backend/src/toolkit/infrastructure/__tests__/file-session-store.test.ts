/**
 * =============================================================================
 * FileSessionStore — Unit Tests (Phase 5B.6)
 * =============================================================================
 */

import 'reflect-metadata';
import { describe, it, beforeEach, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { FileSessionStore } from '../file-session-store';
import { IFileSystem } from '../../core/file-system';

class MockFileSystem implements IFileSystem {
    exists = mock.fn();
    readFile = mock.fn();
    writeFile = mock.fn();
    mkdir = mock.fn();
    rename = mock.fn();
    rm = mock.fn();
}

describe('FileSessionStore', () => {
    let store: FileSessionStore;
    let mockFs: MockFileSystem;

    beforeEach(() => {
        mockFs = new MockFileSystem();

        // Default behavior: File does not exist initially
        (mockFs.exists as any).mock.mockImplementation(() => false);

        store = new FileSessionStore(mockFs);
    });

    it('initializes and creates directory if missing', async () => {
        (mockFs.exists as any).mock.mockImplementation(() => false);

        await store.getLastTenantId(); // Triggers ensureInitialized

        // Should check dir
        assert.ok((mockFs.exists as any).mock.callCount() >= 1);
        // Should create dir
        assert.strictEqual((mockFs.mkdir as any).mock.callCount(), 1);
    });

    it('loads existing data', async () => {
        const storedData = {
            version: 1,
            lastTenantId: 'tenant-1',
            cache: {},
            history: [],
        };

        // Mock directory exists, file exists
        (mockFs.exists as any).mock.mockImplementation(() => true);
        (mockFs.readFile as any).mock.mockImplementation(async () => JSON.stringify(storedData));

        const tenantId = await store.getLastTenantId();

        assert.deepStrictEqual(tenantId, 'tenant-1');
        assert.strictEqual((mockFs.readFile as any).mock.callCount(), 1);
    });

    it('saves data on setLastTenantId', async () => {
        await store.setLastTenantId('tenant-2' as any);

        assert.strictEqual((mockFs.writeFile as any).mock.callCount(), 1);
        const [path, content] = (mockFs.writeFile as any).mock.calls[0].arguments;
        assert.ok(path.endsWith('.tmp'));
        assert.ok(content.includes('tenant-2'));

        assert.strictEqual((mockFs.rename as any).mock.callCount(), 1);
    });

    it('respects cache expiration', async () => {
        // Mock data with expired and valid cache
        const now = Date.now();
        const storedData = {
            version: 1,
            lastTenantId: null,
            cache: {
                'valid': { value: 'v1', expiresAt: new Date(now + 10000).toISOString() },
                'expired': { value: 'v2', expiresAt: new Date(now - 10000).toISOString() },
            },
            history: [],
        };

        (mockFs.exists as any).mock.mockImplementation(() => true);
        (mockFs.readFile as any).mock.mockImplementation(async () => JSON.stringify(storedData));

        const valid = await store.getCache('valid');
        assert.strictEqual(valid, 'v1');

        const expired = await store.getCache('expired');
        assert.strictEqual(expired, null);

        // Should have saved to remove expired entry
        assert.strictEqual((mockFs.writeFile as any).mock.callCount(), 1);
    });

    it('limits history size to 100', async () => {
        // Pre-fill 100 entries
        const history = Array(100).fill(null).map((_, i) => ({ command: `cmd${i}` }));

        // Mock initial load
        const storedData = { version: 1, lastTenantId: null, cache: {}, history };
        (mockFs.exists as any).mock.mockImplementation(() => true);
        (mockFs.readFile as any).mock.mockImplementation(async () => JSON.stringify(storedData));

        // Add 101st entry
        await store.addToHistory({ command: 'new', timestamp: new Date(), success: true, durationMs: 10 } as any);

        // Verify save content has 100 items and 'new' is first
        const saveCall = (mockFs.writeFile as any).mock.calls[0];
        const savedData = JSON.parse(saveCall.arguments[1]);

        assert.strictEqual(savedData.history.length, 100);
        assert.strictEqual(savedData.history[0].command, 'new');
        assert.strictEqual(savedData.history[99].command, 'cmd98'); // cmd99 pushed out
    });
});
