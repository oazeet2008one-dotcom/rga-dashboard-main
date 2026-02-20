import 'reflect-metadata';
import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { SeedDataCommand, SeedDataCommandHandler } from '../../commands/seed-data.command';
import { ILogger } from '../../core/contracts';
import { ToolkitPlatform } from '../../domain/platform.types';

const mockLogger: ILogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
    child: () => mockLogger,
};

const mockPrisma = {
    campaign: { findFirst: async () => null, create: async () => ({ id: 'camp-1' }) },
    metric: { create: async () => ({}) },
};

const mockSeeder = {
    seed: async () => ({ success: true, status: 'completed', message: 'ok', data: { seededCount: 0 } }),
};

describe('SeedDataCommand validation', () => {
    test('returns failure for unsupported platform', () => {
        const handler = new SeedDataCommandHandler(mockLogger, mockPrisma as any, mockSeeder as any);

        const command = new SeedDataCommand({
            platform: 'INVALID' as ToolkitPlatform,
            days: 30,
            trend: 'GROWTH',
            injectAnomaly: false,
        });

        const result = handler.validate(command);
        assert.strictEqual(result.kind, 'failure');
    });

    test('returns failure for invalid days', () => {
        const handler = new SeedDataCommandHandler(mockLogger, mockPrisma as any, mockSeeder as any);

        const command = new SeedDataCommand({
            platform: ToolkitPlatform.GoogleAds,
            days: 0,
            trend: 'GROWTH',
            injectAnomaly: false,
        });

        const result = handler.validate(command);
        assert.strictEqual(result.kind, 'failure');
    });

    test('accepts upper bound days of 365', () => {
        const handler = new SeedDataCommandHandler(mockLogger, mockPrisma as any, mockSeeder as any);

        const command = new SeedDataCommand({
            platform: ToolkitPlatform.GoogleAds,
            days: 365,
            trend: 'GROWTH',
            injectAnomaly: false,
        });

        const result = handler.validate(command);
        assert.strictEqual(result.kind, 'success');
    });
});
