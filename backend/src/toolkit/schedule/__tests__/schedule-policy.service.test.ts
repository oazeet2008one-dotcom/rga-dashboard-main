/**
 * =============================================================================
 * SchedulePolicyService — Unit Tests (Phase 5A.1)
 * =============================================================================
 *
 * Runner: node:test (no Jest)
 *
 * Coverage:
 *   1. Disabled schedule → DISABLED block
 *   2. Excluded dates → EXCLUDED_DATE block
 *   3. Excluded days of week → EXCLUDED_DAY block
 *   4. Time window → WINDOW block / pass
 *   5. Cooldown period → COOLDOWN block / pass
 *   6. Max executions per window → LIMIT block / pass
 *   7. ONCE schedule → NOT_YET / ALREADY_RAN / trigger
 *   8. INTERVAL schedule → first run / elapsed / not elapsed / skip missed
 *   9. CALENDAR schedule → matching time / wrong hour / wrong day-of-week /
 *      already triggered this cycle
 *  10. Determinism — same inputs → same output
 * =============================================================================
 */

// Force UTC so toTimezone + getHours() are deterministic regardless of system locale
process.env.TZ = 'UTC';

import 'reflect-metadata';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import { SchedulePolicyService } from '../schedule-policy.service';
import {
    createScheduleDefinition,
    createSchedulePolicy,
    createEvaluationContext,
    ScheduleDefinition,
    SchedulePolicy,
    ScheduleEvaluationContext,
    ExecutionHistorySummary,
} from '../schedule.model';

// =============================================================================
// Constants
// =============================================================================

/** Fixed reference time — Monday 2024-01-15 09:00:00 UTC */
const NOW = new Date('2024-01-15T09:00:00.000Z');

// =============================================================================
// Factory Helpers
// =============================================================================

function emptyHistory(): ExecutionHistorySummary {
    return {
        executionsInWindow: 0,
        recentExecutions: [],
    };
}

function historyWith(
    lastAt: Date,
    windowCount = 0,
    recentDates: Date[] = [],
): ExecutionHistorySummary {
    return {
        lastExecutionAt: lastAt,
        executionsInWindow: windowCount,
        recentExecutions: recentDates,
    };
}

function ctx(
    overrides: {
        now?: Date;
        history?: ExecutionHistorySummary;
        dryRun?: boolean;
        correlationId?: string;
    } = {},
): ScheduleEvaluationContext {
    return createEvaluationContext({
        now: overrides.now ?? NOW,
        executionHistory: overrides.history ?? emptyHistory(),
        dryRun: overrides.dryRun ?? false,
        correlationId: overrides.correlationId,
    });
}

function calendarDef(
    hour: number,
    minute: number,
    opts: Partial<ScheduleDefinition> = {},
): ScheduleDefinition {
    return createScheduleDefinition({
        tenantId: opts.tenantId ?? 'tenant-test',
        name: opts.name ?? 'Calendar Schedule',
        type: 'CALENDAR',
        config: { hour, minute },
        timezone: opts.timezone ?? 'UTC',
        enabled: opts.enabled ?? true,
    });
}

function intervalDef(
    minutes: number,
    opts: Partial<ScheduleDefinition> = {},
): ScheduleDefinition {
    return createScheduleDefinition({
        tenantId: opts.tenantId ?? 'tenant-test',
        name: opts.name ?? 'Interval Schedule',
        type: 'INTERVAL',
        config: { minutes },
        timezone: opts.timezone ?? 'UTC',
        enabled: opts.enabled ?? true,
    });
}

function onceDef(
    targetDate: string,
    opts: Partial<ScheduleDefinition> = {},
): ScheduleDefinition {
    return createScheduleDefinition({
        tenantId: opts.tenantId ?? 'tenant-test',
        name: opts.name ?? 'Once Schedule',
        type: 'ONCE',
        config: { targetDate },
        timezone: opts.timezone ?? 'UTC',
        enabled: opts.enabled ?? true,
    });
}

function defaultPolicy(overrides: Partial<SchedulePolicy> = {}): SchedulePolicy {
    return createSchedulePolicy(overrides);
}

// =============================================================================
// Service instance (re-created in every describe for safety)
// =============================================================================

const service = new SchedulePolicyService();

// =============================================================================
// 1. DISABLED SCHEDULE
// =============================================================================
describe('SchedulePolicyService — disabled schedule', () => {
    it('blocks with DISABLED and null nextEligible', () => {
        const def = calendarDef(9, 0, { enabled: false });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'DISABLED');
        assert.ok(decision.reason.includes('disabled'));
        assert.strictEqual(decision.nextEligibleAt, null);
    });
});

// =============================================================================
// 2. EXCLUDED DATES
// =============================================================================
describe('SchedulePolicyService — excluded dates', () => {
    it('blocks on excluded date with EXCLUDED_DATE', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDates: ['2024-01-15'] });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'EXCLUDED_DATE');
        assert.ok(decision.reason.includes('2024-01-15'));
    });

    it('allows on non-excluded date', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDates: ['2024-01-16'] });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, true);
    });
});

// =============================================================================
// 3. EXCLUDED DAYS OF WEEK
// =============================================================================
describe('SchedulePolicyService — excluded days of week', () => {
    it('blocks on excluded day (Monday=1)', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDaysOfWeek: [1] });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'EXCLUDED_DAY');
    });

    it('allows on non-excluded day', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ excludedDaysOfWeek: [0, 6] });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, true);
    });
});

// =============================================================================
// 4. TIME WINDOWS
// =============================================================================
describe('SchedulePolicyService — time windows', () => {
    it('allows within time window', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{ startTime: '08:00', endTime: '17:00' }],
        });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, true);
    });

    it('blocks outside time window with WINDOW', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{ startTime: '10:00', endTime: '17:00' }],
        });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'WINDOW');
    });

    it('respects day-of-week on time windows', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{
                startTime: '08:00',
                endTime: '17:00',
                daysOfWeek: [0, 6], // weekends only
            }],
        });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'WINDOW');
    });
});

// =============================================================================
// 5. COOLDOWN PERIOD
// =============================================================================
describe('SchedulePolicyService — cooldown period', () => {
    it('blocks when still in cooldown', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ cooldownPeriodMs: 300_000 });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:58:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, policy, context);

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'COOLDOWN');
        assert.ok(decision.details?.cooldownRemainingMs! > 0);
        assert.deepStrictEqual(
            decision.nextEligibleAt,
            new Date('2024-01-15T09:03:00.000Z'),
        );
    });

    it('allows when cooldown has elapsed', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ cooldownPeriodMs: 300_000 });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:50:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, policy, context);

        assert.strictEqual(decision.shouldTrigger, true);
    });

    it('allows when no previous execution', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ cooldownPeriodMs: 300_000 });
        const decision = service.evaluateSchedule(def, policy, ctx());

        assert.strictEqual(decision.shouldTrigger, true);
    });
});

// =============================================================================
// 6. MAX EXECUTIONS PER WINDOW
// =============================================================================
describe('SchedulePolicyService — rate limit', () => {
    it('blocks at limit with LIMIT', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ maxExecutionsPerWindow: 3 });
        const context = ctx({
            history: { executionsInWindow: 3, recentExecutions: [] },
        });
        const decision = service.evaluateSchedule(def, policy, context);

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'LIMIT');
        assert.strictEqual(decision.details?.executionsInWindow, 3);
        assert.strictEqual(decision.details?.maxExecutions, 3);
    });

    it('allows under limit', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ maxExecutionsPerWindow: 5 });
        const context = ctx({
            history: { executionsInWindow: 2, recentExecutions: [] },
        });
        const decision = service.evaluateSchedule(def, policy, context);

        assert.strictEqual(decision.shouldTrigger, true);
    });

    it('treats maxExecutionsPerWindow=0 as unlimited', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({ maxExecutionsPerWindow: 0 });
        const context = ctx({
            history: { executionsInWindow: 100, recentExecutions: [] },
        });
        const decision = service.evaluateSchedule(def, policy, context);

        assert.strictEqual(decision.shouldTrigger, true);
    });
});

// =============================================================================
// 7. ONCE SCHEDULE
// =============================================================================
describe('SchedulePolicyService — ONCE schedule', () => {
    it('blocks with NOT_YET when target is in the future', () => {
        const def = onceDef('2024-01-16T09:00:00.000Z');
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'NOT_YET');
        assert.deepStrictEqual(
            decision.nextEligibleAt,
            new Date('2024-01-16T09:00:00.000Z'),
        );
    });

    it('triggers when target is exactly now', () => {
        const def = onceDef('2024-01-15T09:00:00.000Z');
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, true);
    });

    it('triggers when target is in the past', () => {
        const def = onceDef('2024-01-15T08:00:00.000Z');
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, true);
    });

    it('blocks with ALREADY_RAN when already executed', () => {
        const def = onceDef('2024-01-15T08:00:00.000Z');
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:01:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'ALREADY_RAN');
        assert.strictEqual(decision.nextEligibleAt, null);
    });
});

// =============================================================================
// 8. INTERVAL SCHEDULE
// =============================================================================
describe('SchedulePolicyService — INTERVAL schedule', () => {
    it('triggers on first run (no history)', () => {
        const def = intervalDef(15);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, true);
        assert.ok(decision.reason.includes('All policy checks passed'));
    });

    it('triggers when interval has elapsed', () => {
        const def = intervalDef(15);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:40:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);

        assert.strictEqual(decision.shouldTrigger, true);
    });

    it('blocks when interval has NOT elapsed', () => {
        const def = intervalDef(15);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:55:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);

        assert.strictEqual(decision.shouldTrigger, false);
        assert.deepStrictEqual(
            decision.nextEligibleAt,
            new Date('2024-01-15T09:10:00.000Z'),
        );
    });

    it('calculates next eligible for hours-based config', () => {
        const def = createScheduleDefinition({
            tenantId: 'tenant-test',
            name: 'Hourly',
            type: 'INTERVAL',
            config: { hours: 2 },
            timezone: 'UTC',
            enabled: true,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:00:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);

        assert.strictEqual(decision.shouldTrigger, false);
        assert.deepStrictEqual(
            decision.nextEligibleAt,
            new Date('2024-01-15T10:00:00.000Z'),
        );
    });

    it('handles skip-missed mode', () => {
        const def = intervalDef(15);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:15:00.000Z')),
        });
        const decision = service.evaluateSchedule(
            def,
            defaultPolicy({ skipMissed: true }),
            context,
        );

        assert.strictEqual(decision.shouldTrigger, true);
        assert.ok(decision.reason.includes('All policy checks passed'));
    });
});

// =============================================================================
// 9. CALENDAR SCHEDULE
// =============================================================================
describe('SchedulePolicyService — CALENDAR schedule', () => {
    it('triggers when hour and minute match', () => {
        const def = calendarDef(9, 0);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, true);
        assert.ok(decision.reason.includes('All policy checks passed'));
    });

    it('blocks when hour does not match', () => {
        const def = calendarDef(10, 0);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.ok(decision.reason.includes('hour'));
    });

    it('blocks when minute does not match', () => {
        const def = calendarDef(9, 30);
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.ok(decision.reason.includes('minute'));
    });

    it('blocks when day-of-week does not match', () => {
        const def = createScheduleDefinition({
            tenantId: 'tenant-test',
            name: 'Wednesday Only',
            type: 'CALENDAR',
            config: { dayOfWeek: 3 as const, hour: 9, minute: 0 },
            timezone: 'UTC',
            enabled: true,
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.ok(decision.reason.includes('day of week'));
    });

    it('blocks when already triggered this cycle', () => {
        const def = calendarDef(9, 0);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T09:00:30.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);

        assert.strictEqual(decision.shouldTrigger, false);
        assert.ok(decision.reason.includes('Already triggered'));
    });

    it('triggers if last execution was on a different day', () => {
        const def = calendarDef(9, 0);
        const context = ctx({
            history: historyWith(new Date('2024-01-14T09:00:00.000Z')),
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), context);

        assert.strictEqual(decision.shouldTrigger, true);
    });

    it('blocks on wrong day-of-month', () => {
        const def = createScheduleDefinition({
            tenantId: 'tenant-test',
            name: 'Monthly 20th',
            type: 'CALENDAR',
            config: { dayOfMonth: 20, hour: 9, minute: 0 },
            timezone: 'UTC',
            enabled: true,
        });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.shouldTrigger, false);
        assert.ok(decision.reason.includes('day of month'));
    });
});

// =============================================================================
// 10. EVALUATION ORDER
// =============================================================================
describe('SchedulePolicyService — evaluation order', () => {
    it('disabled fires BEFORE schedule type logic', () => {
        const def = calendarDef(10, 0, { enabled: false });
        const decision = service.evaluateSchedule(def, defaultPolicy(), ctx());

        assert.strictEqual(decision.blockedBy, 'DISABLED');
    });

    it('excluded date fires BEFORE cooldown', () => {
        const policy = defaultPolicy({
            excludedDates: ['2024-01-15'],
            cooldownPeriodMs: 300_000,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:58:00.000Z')),
        });
        const decision = service.evaluateSchedule(calendarDef(9, 0), policy, context);

        assert.strictEqual(decision.blockedBy, 'EXCLUDED_DATE');
    });

    it('cooldown fires BEFORE limit', () => {
        const policy = defaultPolicy({
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 1,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:59:00.000Z'), 5),
        });
        const decision = service.evaluateSchedule(calendarDef(9, 0), policy, context);

        assert.strictEqual(decision.blockedBy, 'COOLDOWN');
    });
});

// =============================================================================
// 11. calculateNextEligible
// =============================================================================
describe('SchedulePolicyService — calculateNextEligible', () => {
    it('returns target date for ONCE in the future', () => {
        const def = onceDef('2024-01-20T12:00:00.000Z');
        const result = service.calculateNextEligible(def, defaultPolicy(), ctx());

        assert.deepStrictEqual(result, new Date('2024-01-20T12:00:00.000Z'));
    });

    it('returns null for ONCE already executed', () => {
        const def = onceDef('2024-01-10T12:00:00.000Z');
        const context = ctx({
            history: historyWith(new Date('2024-01-10T12:00:00.000Z')),
        });
        const result = service.calculateNextEligible(def, defaultPolicy(), context);

        assert.strictEqual(result, null);
    });

    it('returns future Date for INTERVAL', () => {
        const def = intervalDef(30);
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:45:00.000Z')),
        });
        const result = service.calculateNextEligible(def, defaultPolicy(), context);

        assert.deepStrictEqual(result, new Date('2024-01-15T09:15:00.000Z'));
    });

    it('returns null for interval with zero config', () => {
        const def = createScheduleDefinition({
            tenantId: 'tenant-test',
            name: 'Zero',
            type: 'INTERVAL',
            config: {},
            timezone: 'UTC',
            enabled: true,
        });
        const result = service.calculateNextEligible(def, defaultPolicy(), ctx());

        assert.strictEqual(result, null);
    });
});

// =============================================================================
// 12. DETERMINISM
// =============================================================================
describe('SchedulePolicyService — determinism', () => {
    it('produces identical output across 5 runs with same input', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 5,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:50:00.000Z'), 2),
        });

        const results = [];
        for (let i = 0; i < 5; i++) {
            results.push(service.evaluateSchedule(def, policy, context));
        }

        for (let i = 1; i < results.length; i++) {
            assert.strictEqual(results[i]!.shouldTrigger, results[0]!.shouldTrigger);
            assert.strictEqual(results[i]!.blockedBy, results[0]!.blockedBy);
            assert.strictEqual(results[i]!.reason, results[0]!.reason);
            assert.deepStrictEqual(results[i]!.evaluatedAt, results[0]!.evaluatedAt);
        }
    });
});

// =============================================================================
// 13. COMBINED REALISTIC SCENARIO
// =============================================================================
describe('SchedulePolicyService — combined realistic scenario', () => {
    it('triggers: window ok, cooldown ok, under limit, calendar match', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{
                startTime: '08:00',
                endTime: '18:00',
                daysOfWeek: [1, 2, 3, 4, 5],
            }],
            excludedDates: ['2024-01-01'],
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 10,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:30:00.000Z'), 3),
        });
        const decision = service.evaluateSchedule(def, policy, context);

        assert.strictEqual(decision.shouldTrigger, true);
        assert.ok(decision.reason.includes('All policy checks passed'));
    });

    it('blocks: window ok, IN cooldown, under limit, calendar match', () => {
        const def = calendarDef(9, 0);
        const policy = defaultPolicy({
            allowedTimeWindows: [{ startTime: '08:00', endTime: '18:00' }],
            cooldownPeriodMs: 300_000,
            maxExecutionsPerWindow: 10,
        });
        const context = ctx({
            history: historyWith(new Date('2024-01-15T08:58:00.000Z'), 3),
        });
        const decision = service.evaluateSchedule(def, policy, context);

        assert.strictEqual(decision.shouldTrigger, false);
        assert.strictEqual(decision.blockedBy, 'COOLDOWN');
    });
});
