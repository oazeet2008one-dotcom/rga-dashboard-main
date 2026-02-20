/**
 * =============================================================================
 * Phase 2.4.4.1 — Runtime Validation Harness (PATCHED)
 * =============================================================================
 *
 * Runtime validation for SchedulerRunner with fixture-derived policy values.
 *
 * Usage:
 *   npm run validate:runtime:scheduler
 *
 * Exit codes:
 *   0 = all tests PASS
 *   1 = any test FAIL
 *
 * REQUIREMENTS:
 * - All policy values derived from fixtures at runtime (NO hardcoding)
 * - Fresh repo/service per run for determinism (Test A)
 * - ISO 8601 timestamps only
 * =============================================================================
 */

// =============================================================================
// BOOTSTRAP: reflect-metadata MUST be first import (tsyringe requirement)
// =============================================================================
import 'reflect-metadata';

// =============================================================================
// REGRESSION GUARD: Verify reflect-metadata is active before any tsyringe usage
// =============================================================================
if (typeof (Reflect as any).getMetadata !== 'function') {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════════╗');
    console.error('║  BOOTSTRAP_ERROR: reflect-metadata not loaded before tsyringe usage ║');
    console.error('╚════════════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('This script requires reflect-metadata to be imported before any');
    console.error('modules that use tsyringe decorators (@injectable, @inject).');
    console.error('');
    console.error('Fix: Ensure "import \'reflect-metadata\'" is the FIRST import in this file.');
    console.error('');
    process.exit(1);
}

// =============================================================================
// APPLICATION IMPORTS (after reflect-metadata bootstrap)
// =============================================================================

import { SchedulerRunner, RunnerDependencies } from '../../runner/scheduler-runner';
import { TickResult, RunnerScheduleDecision, TriggerCandidate } from '../../runner/scheduler-runner.model';
import { FixtureScheduleProvider } from '../../schedules/fixture-schedule.provider';
import { ScheduledExecution } from '../../schedules/scheduled-execution.model';
import { SchedulePolicyService } from '../../schedule/schedule-policy.service';
import { ExecutionHistoryService } from '../../history/execution-history.service';
import { InMemoryExecutionHistoryRepository } from '../../history/execution-history.inmemory';
import { createExecutionHistoryRecord } from '../../history/execution-history.model';
import { ILogger } from '../../core/contracts';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// CONSTANTS (fixed test parameters only, NOT policy values)
// =============================================================================

const FIXED_NOW_ISO = '2024-01-15T14:00:00.000Z'; // 09:00 EST (UTC-5)
const FIXED_NOW = new Date(FIXED_NOW_ISO);
const TENANT_1 = 'tenant-1';
const TENANT_2 = 'tenant-2';

// Schedule IDs from fixtures/schedules/tenant-1.json
const SCHEDULE_COOLDOWN_TEST = 'sched-exec-morning-check';
const SCHEDULE_RATELIMIT_TEST = 'sched-exec-frequent-monitor';

// =============================================================================
// MOCK LOGGER
// =============================================================================

const mockLogger: ILogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: (...args: any[]) => console.error('[ERROR]', ...args),
    child: () => mockLogger,
};

// =============================================================================
// TEST RESULT TYPE
// =============================================================================

interface TestResult {
    name: string;
    passed: boolean;
    details: string[];
    errors: string[];
}

// =============================================================================
// FIXTURE PATH RESOLUTION (with evidence + fail-fast)
// =============================================================================

function resolveFixturePath(): string {
    // Try to find fixtures directory
    const possiblePaths = [
        path.join(__dirname, '..', '..', 'fixtures', 'schedules'),
        path.join(process.cwd(), 'src', 'toolkit', 'fixtures', 'schedules'),
        path.join(process.cwd(), 'dist', 'toolkit', 'fixtures', 'schedules'),
    ];

    for (const dir of possiblePaths) {
        if (fs.existsSync(dir)) {
            return dir;
        }
    }

    // Return first option as fallback (will fail gracefully with clear error)
    return possiblePaths[0]!;
}

function verifyFixtureFile(fixturePath: string, tenantId: string): void {
    const filePath = path.join(fixturePath, `${tenantId}.json`);
    if (!fs.existsSync(filePath)) {
        console.error('');
        console.error('╔════════════════════════════════════════════════════════════════════╗');
        console.error('║  FIXTURE_ERROR: missing fixture file                               ║');
        console.error('╚════════════════════════════════════════════════════════════════════╝');
        console.error('');
        console.error(`Expected file: ${filePath}`);
        console.error('');
        console.error('Attempted paths:');
        const attemptedPaths = [
            path.join(__dirname, '..', '..', 'fixtures', 'schedules'),
            path.join(process.cwd(), 'src', 'toolkit', 'fixtures', 'schedules'),
            path.join(process.cwd(), 'dist', 'toolkit', 'fixtures', 'schedules'),
        ];
        attemptedPaths.forEach(p => console.error(`  - ${p}`));
        console.error('');
        process.exit(1);
    }
}

// =============================================================================
// SETUP HELPERS
// =============================================================================

/**
 * Load schedule from fixture by ID.
 * Fails if schedule not found or required policy fields missing.
 */
async function loadScheduleFromFixture(
    scheduleId: string,
    fixtureProvider: FixtureScheduleProvider
): Promise<{ schedule: ScheduledExecution; result: TestResult }> {
    const result: TestResult = {
        name: `Load schedule ${scheduleId}`,
        passed: false,
        details: [],
        errors: [],
    };

    const schedules = await fixtureProvider.getSchedulesForTenant(TENANT_1);
    const schedule = schedules.find(s => s.id === scheduleId);

    if (!schedule) {
        result.errors.push(`Schedule not found: ${scheduleId}`);
        return { schedule: null as any, result };
    }

    result.details.push(`Found schedule: ${scheduleId}`);
    result.details.push(`Schedule type: ${schedule.schedule.type}`);
    result.passed = true;

    return { schedule, result };
}

/**
 * Create a fresh test context with new repo/service.
 * Used for each run in Test A to ensure determinism.
 */
function createFreshTestContext(fixtureProvider: FixtureScheduleProvider): {
    runner: SchedulerRunner;
    historyService: ExecutionHistoryService;
    historyRepo: InMemoryExecutionHistoryRepository;
} {
    const historyRepo = new InMemoryExecutionHistoryRepository();
    const historyService = new ExecutionHistoryService(historyRepo, mockLogger);
    const schedulePolicyService = new SchedulePolicyService();

    const deps: RunnerDependencies = {
        scheduleProvider: fixtureProvider,
        schedulePolicyService,
        executionHistoryService: historyService,
    };

    const runner = new SchedulerRunner(deps, mockLogger);

    return { runner, historyService, historyRepo };
}

/**
 * Seed a single execution with deterministic timestamp.
 */
async function seedExecution(
    historyRepo: InMemoryExecutionHistoryRepository,
    tenantId: string,
    finishedAt: Date,
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'COMPLETED',
    referenceNow: Date = FIXED_NOW
): Promise<void> {
    const record = createExecutionHistoryRecord({
        executionId: `exec-${tenantId}-${finishedAt.getTime()}`,
        tenantId,
        triggerType: 'PROGRAMMATIC',
        requestedBy: 'test',
        status,
        startedAt: new Date(finishedAt.getTime() - 1000),
        finishedAt,
        dryRun: false,
        ruleCount: 1,
        triggeredAlertCount: 0,
    });

    // CRITICAL: Pass referenceNow to prevent eviction of "old" records (relative to real wall clock)
    await historyRepo.record(record, referenceNow);
}

// =============================================================================
// COMPARISON HELPERS
// =============================================================================

function compareDecisions(a: RunnerScheduleDecision, b: RunnerScheduleDecision): string[] {
    const diffs: string[] = [];
    if (a.scheduleId !== b.scheduleId) diffs.push(`scheduleId: ${a.scheduleId} vs ${b.scheduleId}`);
    if (a.shouldTrigger !== b.shouldTrigger) diffs.push(`shouldTrigger: ${a.shouldTrigger} vs ${b.shouldTrigger}`);
    if (a.blockedBy !== b.blockedBy) diffs.push(`blockedBy: ${a.blockedBy} vs ${b.blockedBy}`);
    if (a.reason !== b.reason) diffs.push(`reason differs`);
    if (a.nextEligibleAt !== b.nextEligibleAt) {
        diffs.push(`nextEligibleAt: ${a.nextEligibleAt} vs ${b.nextEligibleAt}`);
    }
    return diffs;
}

function compareCandidates(a: TriggerCandidate, b: TriggerCandidate): string[] {
    const diffs: string[] = [];
    if (a.scheduleId !== b.scheduleId) diffs.push(`scheduleId differs`);
    if (a.tenantId !== b.tenantId) diffs.push(`tenantId differs`);
    if (a.executionParams.triggerType !== b.executionParams.triggerType) {
        diffs.push(`triggerType differs`);
    }
    if (a.executionParams.requestedBy !== b.executionParams.requestedBy) {
        diffs.push(`requestedBy differs`);
    }
    return diffs;
}

// =============================================================================
// EVIDENCE HELPERS (INSTRUMENTATION)
// =============================================================================

function printScheduleEvidence(schedule: ScheduledExecution, now: Date, decision?: RunnerScheduleDecision) {
    console.log('\n[EVIDENCE] --- Schedule Details ---');
    console.log(`[EVIDENCE] id: ${schedule.id}`);
    console.log(`[EVIDENCE] type: ${schedule.schedule.type}`);
    console.log(`[EVIDENCE] timezone: ${schedule.schedule.timezone}`);
    console.log(`[EVIDENCE] config: ${JSON.stringify(schedule.schedule.config)}`);
    console.log(`[EVIDENCE] enabled: ${schedule.schedule.enabled}`);

    // Timezone proof
    try {
        const localNow = now.toLocaleString('en-US', { timeZone: schedule.schedule.timezone });
        console.log(`[EVIDENCE] fixedNow ISO: ${now.toISOString()}`);
        console.log(`[EVIDENCE] fixedNow Local: ${localNow} (${schedule.schedule.timezone})`);
        const hour = parseInt(localNow.split(', ')[1].split(':')[0]); // simple parsing
        console.log(`[EVIDENCE] Computed Local Hour: ~${hour}`);
    } catch {
        console.log('[EVIDENCE] (Timezone format error)');
    }

    console.log('[EVIDENCE] --- Policy ---');
    console.log(`[EVIDENCE] allowedTimeWindows: ${JSON.stringify(schedule.policy.allowedTimeWindows)}`);
    console.log(`[EVIDENCE] excludedDates: ${JSON.stringify(schedule.policy.excludedDates)}`);
    console.log(`[EVIDENCE] excludedDaysOfWeek: ${JSON.stringify(schedule.policy.excludedDaysOfWeek)}`);
    console.log(`[EVIDENCE] cooldownPeriodMs: ${schedule.policy.cooldownPeriodMs}`);
    console.log(`[EVIDENCE] maxExecutionsPerWindow: ${schedule.policy.maxExecutionsPerWindow}`);
    console.log(`[EVIDENCE] executionWindowMs: ${schedule.policy.executionWindowMs}`);

    if (decision) {
        console.log('[EVIDENCE] --- Decision ---');
        console.log(`[EVIDENCE] shouldTrigger: ${decision.shouldTrigger}`);
        console.log(`[EVIDENCE] blockedBy: ${decision.blockedBy}`);
        console.log(`[EVIDENCE] reason: ${decision.reason}`);
        console.log(`[EVIDENCE] nextEligibleAt: ${decision.nextEligibleAt}`);
        console.log(`[EVIDENCE] Gate: ${decision.blockedBy}`);
    }

    console.log('[EVIDENCE] --- Fixture Snippet ---');
    const snippet = { ...schedule, policy: undefined, schedule: { ...schedule.schedule, config: '...' } };
    console.log(JSON.stringify(schedule, null, 2));
}

async function printHistoryEvidence(
    historyService: ExecutionHistoryService,
    tenantId: string,
    windowMs: number,
    now: Date,
    repo: InMemoryExecutionHistoryRepository
) {
    console.log(`\n[EVIDENCE] --- History Wiring Proof (${tenantId}) ---`);
    const totalCount = repo.getTenantRecordCount(tenantId);
    console.log(`[EVIDENCE] Repo Total Records for Tenant: ${totalCount}`);

    const summary = await historyService.getSummary(tenantId, windowMs, now);
    console.log(`[EVIDENCE] executionsInWindow (Summary): ${summary.totalExecutions}`);

    const cutoff = new Date(now.getTime() - windowMs);
    console.log(`[EVIDENCE] cutoffStart: ${cutoff.toISOString()}`);
    console.log(`[EVIDENCE] checkWindowMs: ${windowMs}`);

    const recent = await historyService.findRecent(tenantId, { limit: 20 });
    const records = recent.records;
    console.log(`[EVIDENCE] Found Records via Service: ${records.length}`);

    if (records.length > 0) {
        records.sort((a, b) => a.finishedAt.getTime() - b.finishedAt.getTime());
        const show = [...records.slice(0, 5)];
        if (records.length > 5) show.push(...records.slice(records.length - 2));

        show.forEach(r => {
            const inWindow = r.finishedAt >= cutoff && r.finishedAt <= now;
            console.log(`[EVIDENCE] Record: ${r.finishedAt.toISOString()} | In Window? ${inWindow}`);
        });
    } else {
        console.log(`[EVIDENCE] No records found in service query.`);
    }
}


async function runTestA_Determinism(fixtureProvider: FixtureScheduleProvider): Promise<TestResult> {
    const result: TestResult = {
        name: 'Test A: Determinism Repeatability (3 runs)',
        passed: false,
        details: [],
        errors: [],
    };

    try {
        // Load schedule from fixture
        const { schedule, result: loadResult } = await loadScheduleFromFixture(SCHEDULE_COOLDOWN_TEST, fixtureProvider);
        if (!loadResult.passed) {
            result.errors.push(...loadResult.errors);
            return result;
        }

        // Verify required policy field exists
        if (schedule.policy.cooldownPeriodMs === undefined) {
            result.errors.push(`BLOCKED: missing cooldownPeriodMs in policy for scheduleId=${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }

        const cooldownMs = schedule.policy.cooldownPeriodMs;
        result.details.push(`Derived cooldownPeriodMs: ${cooldownMs}ms`);

        // Execute 3 runs with FRESH repo/service each time
        const results: TickResult[] = [];
        for (let i = 0; i < 3; i++) {
            // Fresh context for each run
            const { runner, historyRepo } = createFreshTestContext(fixtureProvider);

            // Seed identical history (execution at cooldown/2 ago)
            const lastExecutionTime = new Date(FIXED_NOW.getTime() - cooldownMs / 2);
            await seedExecution(historyRepo, TENANT_1, lastExecutionTime);

            // Run tick
            const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);
            results.push(tickResult);
        }

        // Compare results
        const base = results[0];
        for (let i = 1; i < results.length; i++) {
            const current = results[i];

            if (current.tenantId !== base.tenantId) {
                result.errors.push(`Run ${i + 1}: tenantId mismatch`);
            }
            if (current.now !== base.now) {
                result.errors.push(`Run ${i + 1}: now mismatch`);
            }
            if (current.evaluatedCount !== base.evaluatedCount) {
                result.errors.push(`Run ${i + 1}: evaluatedCount mismatch`);
            }
            if (current.triggeredCount !== base.triggeredCount) {
                result.errors.push(`Run ${i + 1}: triggeredCount mismatch`);
            }

            // Compare decisions deeply
            if (current.decisions.length !== base.decisions.length) {
                result.errors.push(`Run ${i + 1}: decisions length mismatch`);
            } else {
                for (let j = 0; j < current.decisions.length; j++) {
                    const diffs = compareDecisions(current.decisions[j], base.decisions[j]);
                    if (diffs.length > 0) {
                        result.errors.push(`Run ${i + 1}, Decision ${j}: ${diffs.join(', ')}`);
                    }
                }
            }

            // Compare candidates deeply
            if (current.triggerCandidates.length !== base.triggerCandidates.length) {
                result.errors.push(`Run ${i + 1}: candidates length mismatch`);
            } else {
                for (let j = 0; j < current.triggerCandidates.length; j++) {
                    const diffs = compareCandidates(
                        current.triggerCandidates[j],
                        base.triggerCandidates[j]
                    );
                    if (diffs.length > 0) {
                        result.errors.push(`Run ${i + 1}, Candidate ${j}: ${diffs.join(', ')}`);
                    }
                }
            }
        }

        result.details.push(`Executed 3 runs with fresh repo/service per run`);
        result.details.push(`fixedNow: ${FIXED_NOW_ISO}`);
        result.details.push(`Evaluated ${base.evaluatedCount} schedules per run`);

        if (result.errors.length === 0) {
            result.passed = true;
        }
    } catch (e) {
        result.errors.push(`Exception: ${(e as Error).message}`);
    }

    return result;
}

async function runTestB_Cooldown(fixtureProvider: FixtureScheduleProvider): Promise<TestResult> {
    const result: TestResult = {
        name: 'Test B: Cooldown Block',
        passed: false,
        details: [],
        errors: [],
    };

    try {
        // Load schedule from fixture
        const { schedule, result: loadResult } = await loadScheduleFromFixture(SCHEDULE_COOLDOWN_TEST, fixtureProvider);
        if (!loadResult.passed) {
            result.errors.push(...loadResult.errors);
            return result;
        }

        // Verify required policy field exists
        if (schedule.policy.cooldownPeriodMs === undefined) {
            result.errors.push(`BLOCKED: missing cooldownPeriodMs in policy for scheduleId=${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }

        const cooldownMs = schedule.policy.cooldownPeriodMs;
        result.details.push(`scheduleId: ${SCHEDULE_COOLDOWN_TEST}`);
        result.details.push(`Derived cooldownPeriodMs: ${cooldownMs}ms`);

        // Setup fresh context
        // Setup fresh context
        const { runner, historyRepo, historyService } = createFreshTestContext(fixtureProvider);

        // Seed history: execution at (now - cooldown/2) = within cooldown
        const lastExecutionTime = new Date(FIXED_NOW.getTime() - cooldownMs / 2);
        await seedExecution(historyRepo, TENANT_1, lastExecutionTime);

        result.details.push(`lastExecutionFinishedAt: ${lastExecutionTime.toISOString()}`);

        // EVIDENCE
        console.log(`\n[EVIDENCE] --- Test B Pre-Flight Check ---`);
        console.log(`[EVIDENCE] scheduleId: ${schedule.id}`);
        console.log(`[EVIDENCE] type: ${schedule.schedule.type}`);
        console.log(`[EVIDENCE] schedule.timezone: ${schedule.schedule.timezone}`);
        console.log(`[EVIDENCE] schedule.config: ${JSON.stringify(schedule.schedule.config)}`);
        console.log(`[EVIDENCE] enabled: ${schedule.schedule.enabled}`);
        console.log(`[EVIDENCE] fixedNow ISO: ${FIXED_NOW.toISOString()}`);
        console.log(`[EVIDENCE] fixedNow Local: ${FIXED_NOW.toLocaleString('en-US', { timeZone: schedule.schedule.timezone })} (${schedule.schedule.timezone})`);

        console.log(`[EVIDENCE] policy.allowedTimeWindows: ${JSON.stringify(schedule.policy.allowedTimeWindows)}`);
        console.log(`[EVIDENCE] policy.excludedDaysOfWeek: ${JSON.stringify(schedule.policy.excludedDaysOfWeek)}`);
        console.log(`[EVIDENCE] policy.excludedDates: ${JSON.stringify(schedule.policy.excludedDates)}`);
        console.log(`[EVIDENCE] policy.cooldownPeriodMs: ${schedule.policy.cooldownPeriodMs}`);
        console.log(`[EVIDENCE] policy.maxExecutionsPerWindow: ${schedule.policy.maxExecutionsPerWindow}`);
        console.log(`[EVIDENCE] policy.executionWindowMs: ${schedule.policy.executionWindowMs}`);

        // Manually check gate conditions to predict FIRST_BLOCKING_GATE
        const localDate = new Date(FIXED_NOW.toLocaleString('en-US', { timeZone: schedule.schedule.timezone }));
        // Note: toLocaleString returns a string, creating a Date from it in local context might be tricky without parsing, 
        // but for logging purposes we just want to see the values.
        // Let's try to infer if it matches the config hour=9
        console.log(`[EVIDENCE] Config Hour: ${schedule.schedule.config['hour']}`);

        await printHistoryEvidence(historyService, TENANT_1, cooldownMs, FIXED_NOW, historyRepo);

        // Execute tick
        const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);

        // Find decision for target schedule
        const decision = tickResult.decisions.find(d => d.scheduleId === SCHEDULE_COOLDOWN_TEST);

        if (decision) printScheduleEvidence(schedule, FIXED_NOW, decision);
        else printScheduleEvidence(schedule, FIXED_NOW, undefined);

        if (!decision) {
            result.errors.push(`Decision not found for schedule ${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }

        result.details.push(`shouldTrigger: ${decision.shouldTrigger}`);
        result.details.push(`blockedBy: ${decision.blockedBy}`);
        result.details.push(`nextEligibleAt: ${decision.nextEligibleAt}`);

        // Calculate expected nextEligibleAt
        const expectedNextEligible = new Date(lastExecutionTime.getTime() + cooldownMs);

        if (decision.shouldTrigger !== false) {
            result.errors.push(`Expected shouldTrigger=false, got ${decision.shouldTrigger}`);
        }
        if (decision.blockedBy !== 'COOLDOWN') {
            result.errors.push(`Expected blockedBy='COOLDOWN', got '${decision.blockedBy}'`);
        }
        if (decision.nextEligibleAt !== expectedNextEligible.toISOString()) {
            result.errors.push(
                `Expected nextEligibleAt='${expectedNextEligible.toISOString()}', got '${decision.nextEligibleAt}'`
            );
        }

        if (result.errors.length === 0) {
            result.passed = true;
        }
    } catch (e) {
        result.errors.push(`Exception: ${(e as Error).message}`);
    }

    return result;
}

async function runTestC_RateLimit(fixtureProvider: FixtureScheduleProvider): Promise<TestResult> {
    const result: TestResult = {
        name: 'Test C: Rate-Limit Block',
        passed: false,
        details: [],
        errors: [],
    };

    try {
        // Load schedule from fixture
        const { schedule, result: loadResult } = await loadScheduleFromFixture(SCHEDULE_RATELIMIT_TEST, fixtureProvider);
        if (!loadResult.passed) {
            result.errors.push(...loadResult.errors);
            return result;
        }

        // Verify required policy fields exist
        if (schedule.policy.maxExecutionsPerWindow === undefined) {
            result.errors.push(`BLOCKED: missing maxExecutionsPerWindow in policy for scheduleId=${SCHEDULE_RATELIMIT_TEST}`);
            return result;
        }
        if (schedule.policy.executionWindowMs === undefined) {
            result.errors.push(`BLOCKED: missing executionWindowMs in policy for scheduleId=${SCHEDULE_RATELIMIT_TEST}`);
            return result;
        }

        const maxExecutions = schedule.policy.maxExecutionsPerWindow;
        const windowMs = schedule.policy.executionWindowMs;

        result.details.push(`scheduleId: ${SCHEDULE_RATELIMIT_TEST}`);
        result.details.push(`windowMs source: policy.executionWindowMs`);
        result.details.push(`windowMs value: ${windowMs}ms`);
        result.details.push(`maxExecutionsPerWindow: ${maxExecutions}`);

        // Setup fresh context
        // Setup fresh context
        const { runner, historyRepo, historyService } = createFreshTestContext(fixtureProvider);

        // Seed history: maxExecutions executions evenly spaced within window
        for (let i = 0; i < maxExecutions; i++) {
            const offsetMs = (i + 1) * (windowMs / (maxExecutions + 1));
            const execTime = new Date(FIXED_NOW.getTime() - offsetMs);
            await seedExecution(historyRepo, TENANT_1, execTime);
        }

        result.details.push(`Seeded ${maxExecutions} executions within ${windowMs}ms window`);

        // EVIDENCE
        // EVIDENCE & FAIL FAST
        console.log(`\n[EVIDENCE] --- Test C Pre-Flight Check ---`);
        const cutoffStart = new Date(FIXED_NOW.getTime() - windowMs);
        console.log(`[EVIDENCE] cutoffStart: ${cutoffStart.toISOString()}`);

        const summary = await historyService.getSummary(TENANT_1, windowMs, FIXED_NOW);
        console.log(`[EVIDENCE] executionsInWindow: ${summary.totalExecutions}`);

        if (summary.totalExecutions === 0) {
            result.errors.push('FATAL: History seeding failed. executionsInWindow=0');
            console.error('FATAL: History seeding failed. executionsInWindow=0');
            // We don't exit process here to allow other tests to run/fail, but this test is doomed.
            return result;
        }

        await printHistoryEvidence(historyService, TENANT_1, windowMs, FIXED_NOW, historyRepo);

        // Execute tick
        const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);

        // Find decision for target schedule
        const decision = tickResult.decisions.find(d => d.scheduleId === SCHEDULE_RATELIMIT_TEST);

        if (decision) printScheduleEvidence(schedule, FIXED_NOW, decision);
        else printScheduleEvidence(schedule, FIXED_NOW, undefined);

        if (!decision) {
            result.errors.push(`Decision not found for schedule ${SCHEDULE_RATELIMIT_TEST}`);
            return result;
        }

        result.details.push(`shouldTrigger: ${decision.shouldTrigger}`);
        result.details.push(`blockedBy: ${decision.blockedBy}`);

        if (decision.shouldTrigger !== false) {
            result.errors.push(`Expected shouldTrigger=false, got ${decision.shouldTrigger}`);
        }
        if (decision.blockedBy !== 'LIMIT') {
            result.errors.push(`Expected blockedBy='LIMIT', got '${decision.blockedBy}'`);
        }
        if (!decision.reason.includes('Maximum executions')) {
            result.errors.push(`Expected reason to include 'Maximum executions', got: ${decision.reason}`);
        }

        if (result.errors.length === 0) {
            result.passed = true;
        }
    } catch (e) {
        result.errors.push(`Exception: ${(e as Error).message}`);
    }

    return result;
}



async function runTestD_TenantIsolation(fixtureProvider: FixtureScheduleProvider): Promise<TestResult> {
    const result: TestResult = {
        name: 'Test D: Tenant Isolation',
        passed: false,
        details: [],
        errors: [],
    };

    try {
        // Setup fresh context
        const { runner, historyRepo, historyService } = createFreshTestContext(fixtureProvider);

        // Load schedule for tenant-1 cooldown test
        const { schedule: schedule1 } = await loadScheduleFromFixture(SCHEDULE_COOLDOWN_TEST, fixtureProvider);
        const cooldownMs = schedule1?.policy?.cooldownPeriodMs ?? 300000;

        // Seed tenant-1: 1 execution (within cooldown)
        await seedExecution(historyRepo, TENANT_1, new Date(FIXED_NOW.getTime() - cooldownMs / 2));

        // Seed tenant-2: many executions (would trigger rate limit if shared)
        for (let i = 0; i < 50; i++) {
            await seedExecution(
                historyRepo,
                TENANT_2,
                new Date(FIXED_NOW.getTime() - i * 60000) // Every minute
            );
        }

        // Get counts for evidence
        const tenant1Count = await historyService.countInWindow(TENANT_1, 3600000, FIXED_NOW);
        const tenant2Count = await historyService.countInWindow(TENANT_2, 3600000, FIXED_NOW);

        console.log(`[EVIDENCE] Tenant-1 Count (Expected 1): ${tenant1Count}`);
        console.log(`[EVIDENCE] Tenant-2 Count (Expected 50): ${tenant2Count}`);

        await printHistoryEvidence(historyService, TENANT_1, 3600000, FIXED_NOW, historyRepo);
        await printHistoryEvidence(historyService, TENANT_2, 3600000, FIXED_NOW, historyRepo);

        // Execute tick

        result.details.push(`Tenant-1 executions in window: ${tenant1Count}`);
        result.details.push(`Tenant-2 executions in window: ${tenant2Count}`);

        // Execute tick for tenant-1 only
        const tickResult = await runner.tickTenant(TENANT_1, FIXED_NOW);

        // Find decision for target schedule
        const decision = tickResult.decisions.find(d => d.scheduleId === SCHEDULE_COOLDOWN_TEST);

        if (decision) printScheduleEvidence(schedule1, FIXED_NOW, decision);
        else printScheduleEvidence(schedule1, FIXED_NOW, undefined);

        if (!decision) {
            result.errors.push(`Decision not found for schedule ${SCHEDULE_COOLDOWN_TEST}`);
            return result;
        }

        result.details.push(`Tenant-1 blockedBy: ${decision.blockedBy}`);

        // Assert: tenant-1 should be blocked by COOLDOWN (from its own history)
        // NOT by LIMIT from tenant-2
        if (decision.blockedBy === 'LIMIT') {
            result.errors.push(`Tenant-1 blocked by LIMIT - tenant-2 history leaked!`);
        }
        if (decision.blockedBy !== 'COOLDOWN') {
            result.errors.push(`Expected blockedBy='COOLDOWN', got '${decision.blockedBy}'`);
        }

        if (result.errors.length === 0) {
            result.passed = true;
        }
    } catch (e) {
        result.errors.push(`Exception: ${(e as Error).message}`);
    }

    return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
    // Bootstrap evidence header
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  Phase 2.4.4.1 — Runtime Validation Harness (PATCHED)            ║');
    console.log('║  SchedulerRunner Determinism & Policy Wiring Validation            ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`Node version: ${process.version}`);
    console.log(`Command: npm run validate:runtime:scheduler`);
    console.log(`BOOTSTRAP_OK: reflect-metadata active`);
    console.log(`Fixed now: ${FIXED_NOW_ISO}`);
    console.log('');

    // Resolve and verify fixture path
    const fixturePath = resolveFixturePath();
    console.log(`Fixture path: ${fixturePath}`);
    verifyFixtureFile(fixturePath, TENANT_1);
    console.log('');

    // Create fixture provider
    const fixtureProvider = new FixtureScheduleProvider(mockLogger, { fixturesDir: fixturePath });

    // Run all tests
    const results: TestResult[] = [];

    console.log('Running Test A: Determinism Repeatability...');
    results.push(await runTestA_Determinism(fixtureProvider));
    console.log('');

    console.log('Running Test B: Cooldown Block...');
    results.push(await runTestB_Cooldown(fixtureProvider));
    console.log('');

    console.log('Running Test C: Rate-Limit Block...');
    results.push(await runTestC_RateLimit(fixtureProvider));
    console.log('');

    console.log('Running Test D: Tenant Isolation...');
    results.push(await runTestD_TenantIsolation(fixtureProvider));
    console.log('');

    // Print results
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║  RESULTS SUMMARY                                                   ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');

    let allPassed = true;
    for (const result of results) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`║  ${status}: ${result.name.padEnd(58)} ║`);

        for (const detail of result.details) {
            console.log(`║      ${detail.substring(0, 62).padEnd(62)} ║`);
        }

        for (const error of result.errors) {
            console.log(`║      ERROR: ${error.substring(0, 55).padEnd(55)} ║`);
        }
    }

    console.log('╠════════════════════════════════════════════════════════════════════╣');

    const finalStatus = allPassed && results.every(r => r.passed) ? 'PASS' : 'FAIL';
    const exitCode = finalStatus === 'PASS' ? 0 : 1;
    console.log(`║  FINAL VERDICT: ${finalStatus === 'PASS' ? '✅ SAFE' : '❌ BLOCKED'}${' '.repeat(45)} ║`);
    console.log(`║  EXIT_CODE=${exitCode}${' '.repeat(60)} ║`);
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');

    process.exit(exitCode);
}

// =============================================================================
// ERROR BOUNDARY (catches unexpected errors and prints clearly)
// =============================================================================
main().catch((e) => {
    console.error('');
    console.error('╔════════════════════════════════════════════════════════════════════╗');
    console.error('║  UNEXPECTED ERROR                                                  ║');
    console.error('╠════════════════════════════════════════════════════════════════════╣');
    console.error(`║  Error name: ${(e as Error).name?.padEnd(56)} ║`);
    console.error(`║  Message: ${(e as Error).message?.substring(0, 58).padEnd(58)} ║`);
    console.error('╠════════════════════════════════════════════════════════════════════╣');
    console.error('║  Stack trace (first 10 lines):                                     ║');
    const stack = (e as Error).stack?.split('\n').slice(0, 10) || ['No stack trace'];
    stack.forEach(line => {
        console.error(`║  ${line.substring(0, 64).padEnd(64)} ║`);
    });
    console.error('╚════════════════════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
});
