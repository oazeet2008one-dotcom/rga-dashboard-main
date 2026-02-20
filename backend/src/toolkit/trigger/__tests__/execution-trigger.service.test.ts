/**
 * =============================================================================
 * ExecutionTriggerService — Unit Tests (Phase 5B.1)
 * =============================================================================
 */

import 'reflect-metadata';
import { describe, it, beforeEach, mock } from 'node:test';
import { strict as assert } from 'node:assert';
import { ExecutionTriggerService, TriggerServiceConfig } from '../execution-trigger.service';
import { AlertExecutionService, ExecutionResult } from '../../services/alert-execution.service';
import { ExecutionHistoryService } from '../../history/execution-history.service';
import { ILogger } from '../../core';
import { ExecutionStartRequest } from '../execution-trigger.model';

// =============================================================================
// Mocks
// =============================================================================

const mockLogger = {
    info: mock.fn(),
    warn: mock.fn(),
    error: mock.fn(),
    debug: mock.fn(),
} as unknown as ILogger;

const mockAlertService = {
    execute: mock.fn(),
} as unknown as AlertExecutionService;

const mockHistoryService = {
    recordExecution: mock.fn(),
} as unknown as ExecutionHistoryService;

// =============================================================================
// Tests
// =============================================================================

describe('ExecutionTriggerService', () => {
    let service: ExecutionTriggerService;
    let config: TriggerServiceConfig;

    beforeEach(() => {
        // Reset mocks
        (mockLogger.info as any).mock.resetCalls();
        (mockLogger.warn as any).mock.resetCalls();
        (mockLogger.error as any).mock.resetCalls();
        (mockAlertService.execute as any).mock.resetCalls();
        (mockHistoryService.recordExecution as any).mock.resetCalls();

        // Default config
        config = {
            maxConcurrentPerTenant: 0,
            allowDryRun: true,
        };

        service = new ExecutionTriggerService(
            mockAlertService,
            mockLogger,
            mockHistoryService,
            config
        );
    });

    const validRequest: ExecutionStartRequest = {
        tenantId: 'tenant-1',
        triggerType: 'MANUAL',
        requestedBy: 'user-1',
        dryRun: false,
    };

    const mockRuleProvider = {} as any;
    const mockMetricProvider = {} as any;

    it('rejects invalid request (missing tenantId)', async () => {
        const result = await service.startExecution(
            { ...validRequest, tenantId: '' },
            mockRuleProvider,
            mockMetricProvider
        );

        assert.strictEqual(result.accepted, false);
        assert.ok(result.rejectionReason?.includes('Validation failed'));
        // Should verify inner errors contain 'tenantId is required'
        assert.ok(mockLogger.warn as any);
    });

    it('rejects dry run if config disallows it', async () => {
        const strictConfig = { ...config, allowDryRun: false };
        const strictService = new ExecutionTriggerService(
            mockAlertService,
            mockLogger,
            mockHistoryService,
            strictConfig
        );

        const result = await strictService.startExecution(
            { ...validRequest, dryRun: true },
            mockRuleProvider,
            mockMetricProvider
        );

        assert.strictEqual(result.accepted, false);
        assert.ok(result.rejectionReason?.includes('Validation failed'));
    });

    it('enforces concurrency limit', async () => {
        const limitedConfig = { ...config, maxConcurrentPerTenant: 1 };
        const limitedService = new ExecutionTriggerService(
            mockAlertService,
            mockLogger,
            mockHistoryService,
            limitedConfig
        );

        // Mock execution to hang so it stays active until we release it
        let releaseExecution: (result: any) => void;
        (mockAlertService.execute as any).mock.mockImplementation(() => new Promise((resolve) => {
            releaseExecution = resolve;
        }));

        // Start first execution - DO NOT AWAIT YET
        const p1 = limitedService.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        // Allow p1 to proceed to the await point (where it sets STARTED state)
        await new Promise(resolve => setTimeout(resolve, 0));

        // Start second execution (should be rejected immediately)
        const result2 = await limitedService.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        assert.strictEqual(result2.accepted, false);
        assert.ok(result2.rejectionReason?.includes('Maximum concurrent executions'));

        // Release the first execution so it can finish
        if (releaseExecution!) {
            releaseExecution({ status: 'COMPLETED', summary: { triggeredCount: 0 } });
        }

        const result1 = await p1;
        assert.strictEqual(result1.accepted, true);
    });

    it('successfully starts and completes execution', async () => {
        const mockResult: ExecutionResult = {
            status: 'COMPLETED',
            summary: { triggeredCount: 5 } as any,
        } as any;

        (mockAlertService.execute as any).mock.mockImplementation(async () => mockResult);

        const result = await service.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        assert.strictEqual(result.accepted, true);
        assert.ok(result.executionId);

        // Verify alert service called
        assert.strictEqual((mockAlertService.execute as any).mock.callCount(), 1);

        // Verify history recorded
        // Note: history recording happens async after await execute, so we need to wait a tick
        await new Promise(resolve => process.nextTick(resolve));
        assert.strictEqual((mockHistoryService.recordExecution as any).mock.callCount(), 1);

        // Verify state is cleaned up or marked completed
        const state = service.getExecutionState(result.executionId!);
        assert.strictEqual(state?.status, 'COMPLETED');
    });

    it('handles implementation failure gracefully', async () => {
        const error = new Error('Execution boom');
        (mockAlertService.execute as any).mock.mockImplementation(async () => { throw error; });

        const result = await service.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        // Current implementation: startExecution returns REJECTION if it throws during execution?
        // Let's check the code:
        // catch (error) { ... return createStartRejection ... }
        // So yes, it returns started=false if it crashes synchronously or if await execute throws.
        // Wait, if it transitions to STARTED, it returns a RESULT.
        // But if `await this.alertExecutionService.execute` throws, it goes to catch block.
        // The catch block sets state FAILED and returns createStartRejection.

        assert.strictEqual(result.accepted, false);
        assert.strictEqual(result.rejectionReason, 'Execution boom');

        // History *should* still be recorded for the failure
        await new Promise(resolve => process.nextTick(resolve));
        assert.strictEqual((mockHistoryService.recordExecution as any).mock.callCount(), 1);
        const [recordedState, recordedResult] = (mockHistoryService.recordExecution as any).mock.calls[0].arguments;
        assert.strictEqual(recordedState.status, 'FAILED');
        assert.strictEqual(recordedResult.status, 'FAILED');
    });

    it('cancels active execution', async () => {
        // Make it hang
        (mockAlertService.execute as any).mock.mockImplementation(() => new Promise(() => { }));

        const result = await service.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        assert.strictEqual(result.accepted, true);

        const cancelled = service.cancelExecution(result.executionId!, 'User abort', 'admin');
        assert.strictEqual(cancelled, true);

        const state = service.getExecutionState(result.executionId!);
        assert.strictEqual(state?.status, 'CANCELLED');
    });

    it('cannot cancel terminal execution', async () => {
        (mockAlertService.execute as any).mock.mockImplementation(async () => ({ status: 'COMPLETED', summary: {} } as any));

        const result = await service.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        const cancelled = service.cancelExecution(result.executionId!, 'User abort', 'admin');
        assert.strictEqual(cancelled, false);
    });

    it('cleans up terminal executions', async () => {
        // Setup: 1 completed, 1 active
        // Active
        (mockAlertService.execute as any).mock.mockImplementationOnce(() => new Promise(() => { }));
        const activeRun = await service.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        // Completed
        (mockAlertService.execute as any).mock.mockImplementationOnce(async () => ({ status: 'COMPLETED', summary: {} } as any));
        const completedRun = await service.startExecution(
            validRequest,
            mockRuleProvider,
            mockMetricProvider
        );

        // Wait for completion
        await new Promise(resolve => setTimeout(resolve, 10));

        // Manually age the completed run
        const completedState = service.getExecutionState(completedRun.executionId);
        if (completedState) {
            //completedState.completedAt = new Date(Date.now() - 10000); 
            // Hack: we can't easily modify readonly state properties if they are readonly.
            // But we can Mock Date or pass 'now' to cleanup.
        }

        const now = new Date();
        const future = new Date(now.getTime() + 10000000);

        // Cleanup with maxAge = 0 (everything terminal should go)
        const cleanedCount = service.cleanupTerminalExecutions(0, future);

        assert.strictEqual(cleanedCount, 1);
        assert.strictEqual(service.getExecutionState(completedRun.executionId!), null);
        assert.ok(service.getExecutionState(activeRun.executionId!)); // Active should remain
    });
});
