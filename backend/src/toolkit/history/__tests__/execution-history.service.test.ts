/**
 * =============================================================================
 * ExecutionHistoryService — Unit Tests (Phase 5B.2)
 * =============================================================================
 */

import 'reflect-metadata';
import { describe, it, beforeEach, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { ExecutionHistoryService } from '../execution-history.service';
import { ExecutionHistoryRepository } from '../execution-history.repository';
import { ILogger } from '../../core';
import { ExecutionState, ExecutionTrigger } from '../../trigger/execution-trigger.model';
import { ExecutionResult } from '../../services/alert-execution.service';

// =============================================================================
// Mocks
// =============================================================================

const mockLogger = {
    info: mock.fn(),
    warn: mock.fn(),
    error: mock.fn(),
    debug: mock.fn(),
} as unknown as ILogger;

const mockRepo = {
    record: mock.fn(),
    findRecentByTenant: mock.fn(),
    countExecutionsInWindow: mock.fn(),
    getMostRecent: mock.fn(),
    getExecutionSummary: mock.fn(),
} as unknown as ExecutionHistoryRepository;

// =============================================================================
// Tests
// =============================================================================

describe('ExecutionHistoryService', () => {
    let service: ExecutionHistoryService;

    beforeEach(() => {
        (mockRepo.record as any).mock.resetCalls();
        (mockRepo.findRecentByTenant as any).mock.resetCalls();
        (mockRepo.countExecutionsInWindow as any).mock.resetCalls();
        (mockRepo.getMostRecent as any).mock.resetCalls();
        (mockRepo.getExecutionSummary as any).mock.resetCalls();
        (mockLogger.warn as any).mock.resetCalls();

        service = new ExecutionHistoryService(mockRepo, mockLogger);
    });

    const mockState: ExecutionState = {
        executionId: 'exec-1',
        status: 'COMPLETED',
        startedAt: new Date('2023-01-01T10:00:00Z'),
        completedAt: new Date('2023-01-01T10:00:05Z'),
        trigger: {
            executionId: 'exec-1',
            tenantId: 'tenant-1',
            triggerType: 'MANUAL',
            requestedBy: 'user-1',
            createdAt: new Date('2023-01-01T10:00:00Z'),
            dryRun: false,
        } as ExecutionTrigger,
    };

    const mockResult: ExecutionResult = {
        status: 'COMPLETED',
        runId: 'exec-1',
        context: {} as any,
        timing: { durationMs: 5000 } as any,
        summary: { triggeredCount: 2 } as any,
        triggeredAlerts: [],
    };

    it('records execution successfully', async () => {
        (mockRepo.record as any).mock.mockImplementation(async () => undefined);

        const record = await service.recordExecution(mockState, mockResult);

        assert.strictEqual(record.executionId, 'exec-1');
        assert.strictEqual(record.status, 'COMPLETED');
        assert.strictEqual((mockRepo.record as any).mock.callCount(), 1);
    });

    it('handles persistence failure gracefully logPersistenceFailures=true', async () => {
        const error = new Error('DB Error');
        (mockRepo.record as any).mock.mockImplementation(async () => { throw error; });

        // Should NOT throw
        const record = await service.recordExecution(mockState, mockResult);

        assert.strictEqual(record.executionId, 'exec-1');
        // Verify it logged a warning
        assert.strictEqual((mockLogger.warn as any).mock.callCount(), 1);
        const [msg, meta] = (mockLogger.warn as any).mock.calls[0].arguments;
        assert.ok(msg.includes('Failed to record execution history'));
        assert.strictEqual(meta.error, 'DB Error');
    });

    it('findRecent delegates to repo', async () => {
        const mockHistory = [{ executionId: '1' }];
        (mockRepo.findRecentByTenant as any).mock.mockImplementation(async () => ({ records: mockHistory, totalCount: 1 }));

        const result = await service.findRecent('tenant-1', { limit: 5 });

        assert.deepStrictEqual(result.records, mockHistory);
        assert.strictEqual((mockRepo.findRecentByTenant as any).mock.calls[0].arguments[0], 'tenant-1');
        assert.strictEqual((mockRepo.findRecentByTenant as any).mock.calls[0].arguments[1].limit, 5);
    });

    it('getMostRecent returns null if no history', async () => {
        (mockRepo.getMostRecent as any).mock.mockImplementation(async () => null);

        const result = await service.getMostRecent('tenant-1');
        assert.strictEqual(result, null);
    });

    it('getMostRecent returns first item', async () => {
        const mockHistory = { executionId: '1', finishedAt: new Date() };
        (mockRepo.getMostRecent as any).mock.mockImplementation(async () => mockHistory);

        const result = await service.getMostRecent('tenant-1');
        assert.deepStrictEqual(result, mockHistory);
    });

    it('isInCooldown returns false if no previous execution', async () => {
        (mockRepo.getMostRecent as any).mock.mockImplementation(async () => null);

        const inCooldown = await service.isInCooldown('tenant-1', 60000, new Date());
        assert.strictEqual(inCooldown, false);
    });

    it('isInCooldown returns true if within window', async () => {
        const now = new Date('2023-01-01T12:00:00Z');
        const recent = { executionId: '1', finishedAt: new Date('2023-01-01T11:59:30Z') }; // 30s ago
        (mockRepo.getMostRecent as any).mock.mockImplementation(async () => recent);

        const inCooldown = await service.isInCooldown('tenant-1', 60000, now); // 60s cooldown
        assert.strictEqual(inCooldown, true);
    });

    it('isInCooldown returns false if outside window', async () => {
        const now = new Date('2023-01-01T12:00:00Z');
        const recent = { executionId: '1', finishedAt: new Date('2023-01-01T11:58:00Z') }; // 2m ago
        (mockRepo.getMostRecent as any).mock.mockImplementation(async () => recent);

        const inCooldown = await service.isInCooldown('tenant-1', 60000, now); // 60s cooldown
        assert.strictEqual(inCooldown, false);
    });

    it('getRemainingCooldown returns correct ms', async () => {
        const now = new Date('2023-01-01T12:00:00Z');
        const recent = { executionId: '1', finishedAt: new Date('2023-01-01T11:59:30Z') }; // 30s ago
        (mockRepo.getMostRecent as any).mock.mockImplementation(async () => recent);

        const remaining = await service.getRemainingCooldown('tenant-1', 60000, now);
        assert.strictEqual(remaining, 30000);
    });

    it('wouldExceedRateLimit delegates to countInWindow', async () => {
        (mockRepo.countExecutionsInWindow as any).mock.mockImplementation(async () => 5);

        const exceeded = await service.wouldExceedRateLimit('tenant-1', 5, 3600000);
        assert.strictEqual(exceeded, true); // 5 >= 5

        const notExceeded = await service.wouldExceedRateLimit('tenant-1', 6, 3600000);
        assert.strictEqual(notExceeded, false); // 5 < 6
    });
});
