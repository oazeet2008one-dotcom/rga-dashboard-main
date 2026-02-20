/**
 * =============================================================================
 * BackendApiClient — Unit Tests (Phase 5B.5)
 * =============================================================================
 */

import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { BackendApiClient } from '../backend-api.client';

describe('BackendApiClient', () => {
    let client: BackendApiClient;
    const originalFetch = global.fetch;
    const mockFetch = mock.fn() as any;

    beforeEach(() => {
        global.fetch = mockFetch;
        process.env.API_BASE_URL = 'http://test-api.local';
        client = new BackendApiClient();
        mockFetch.mock.resetCalls();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('triggerAlertCheck sends correct request', async () => {
        const mockResponse = {
            ok: true,
            json: async () => ({ success: true, alertsCreated: 5 }),
        };
        mockFetch.mock.mockImplementation(async () => mockResponse);

        const result = await client.triggerAlertCheck('token-123', 'tenant-1');

        assert.strictEqual(result.success, true);
        assert.strictEqual(result.alertsCreated, 5);

        assert.strictEqual(mockFetch.mock.callCount(), 1);
        const [url, options] = mockFetch.mock.calls[0].arguments;

        assert.strictEqual(url, 'http://test-api.local/api/v1/alerts/trigger-check');
        assert.strictEqual(options.method, 'POST');
        assert.strictEqual(options.headers['Authorization'], 'Bearer token-123');
        assert.strictEqual(options.headers['x-tenant-id'], 'tenant-1');
        assert.strictEqual(JSON.parse(options.body).timeframe, 'YESTERDAY');
    });

    it('triggerAlertCheck parses error response correctly', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            text: async () => JSON.stringify({ message: 'Invalid timeframe' }),
        };
        mockFetch.mock.mockImplementation(async () => mockResponse);

        await assert.rejects(async () => {
            await client.triggerAlertCheck('token', 'tenant');
        }, /API request failed: 400 Bad Request - Invalid timeframe/);
    });

    it('triggerAlertCheck handles non-JSON error response', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: async () => 'Server crashed',
        };
        mockFetch.mock.mockImplementation(async () => mockResponse);

        await assert.rejects(async () => {
            await client.triggerAlertCheck('token', 'tenant');
        }, /API request failed: 500 Internal Server Error - Server crashed/);
    });

    it('healthCheck returns true on 200 OK', async () => {
        mockFetch.mock.mockImplementation(async () => ({ ok: true }));
        const healthy = await client.healthCheck();
        assert.strictEqual(healthy, true);
    });

    it('healthCheck returns false on error', async () => {
        mockFetch.mock.mockImplementation(async () => ({ ok: false }));
        const healthy = await client.healthCheck();
        assert.strictEqual(healthy, false);
    });

    it('healthCheck returns false on exception', async () => {
        mockFetch.mock.mockImplementation(async () => { throw new Error('Network error'); });
        const healthy = await client.healthCheck();
        assert.strictEqual(healthy, false);
    });
});
