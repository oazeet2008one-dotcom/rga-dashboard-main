/**
 * =============================================================================
 * Schedule Policy Service
 * =============================================================================
 *
 * Pure logic for evaluating scheduling policies.
 *
 * Design Principles:
 * - Pure functions
 * - Deterministic
 * - Side-effect free
 * - Infrastructure-agnostic
 *
 * Responsibility:
 * - Evaluate if a schedule should trigger
 * - Check time windows
 * - Check cooldowns
 * - Check execution limits
 * - Calculate next eligible time
 *
 * Non-Responsibility:
 * - No timers
 * - No execution
 * - No persistence
 * - No async operations
 * =============================================================================
 */

import { injectable } from 'tsyringe';
import {
    ScheduleDefinition,
    SchedulePolicy,
    ScheduleEvaluationContext,
    ScheduleDecision,
    ScheduleType,
    IntervalConfig,
    CalendarConfig,
    TimeWindow,
    BlockReason,
    createTriggerDecision,
    createBlockDecision,
    toTimezone,
    getStartOfDay,
    parseTime,
    isExcludedDate,
} from './schedule.model';

// =============================================================================
// Service Implementation
// =============================================================================

@injectable()
export class SchedulePolicyService {
    /**
     * Evaluate a schedule definition against a policy and context.
     *
     * This is the PRIMARY ENTRY POINT for schedule evaluation.
     *
     * Returns a ScheduleDecision that indicates:
     * - shouldTrigger: whether to trigger now
     * - reason: human-readable explanation
     * - nextEligibleAt: when to check again
     * - blockedBy: why it didn't trigger (if applicable)
     */
    evaluateSchedule(
        definition: ScheduleDefinition,
        policy: SchedulePolicy,
        context: ScheduleEvaluationContext
    ): ScheduleDecision {
        // Step 1: Check if schedule is enabled
        if (!definition.enabled) {
            return createBlockDecision(
                context,
                'Schedule is disabled',
                'DISABLED',
                null
            );
        }

        // Step 2: Check excluded dates
        if (policy.excludedDates && policy.excludedDates.length > 0) {
            if (isExcludedDate(context.now, policy.excludedDates)) {
                return createBlockDecision(
                    context,
                    `Date ${context.now.toISOString().split('T')[0]} is excluded`,
                    'EXCLUDED_DATE',
                    this.calculateNextEligible(definition, policy, context)
                );
            }
        }

        // Step 3: Check excluded days of week
        if (policy.excludedDaysOfWeek && policy.excludedDaysOfWeek.length > 0) {
            const dayOfWeek = context.now.getDay();
            if (policy.excludedDaysOfWeek.includes(dayOfWeek)) {
                return createBlockDecision(
                    context,
                    `Day ${dayOfWeek} is excluded`,
                    'EXCLUDED_DAY',
                    this.calculateNextEligible(definition, policy, context)
                );
            }
        }

        // Step 4: Check allowed time windows
        if (policy.allowedTimeWindows && policy.allowedTimeWindows.length > 0) {
            const windowCheck = this.checkTimeWindows(
                context.now,
                policy.allowedTimeWindows,
                definition.timezone
            );
            if (!windowCheck.inWindow) {
                return createBlockDecision(
                    context,
                    'Outside allowed time windows',
                    'WINDOW',
                    this.calculateNextEligible(definition, policy, context),
                    { currentWindow: windowCheck.nextWindow }
                );
            }
        }

        // Step 5: Check cooldown period
        if (
            policy.cooldownPeriodMs &&
            policy.cooldownPeriodMs > 0 &&
            context.executionHistory.lastExecutionAt
        ) {
            const elapsed =
                context.now.getTime() -
                context.executionHistory.lastExecutionAt.getTime();
            if (elapsed < policy.cooldownPeriodMs) {
                const remaining = policy.cooldownPeriodMs - elapsed;
                const nextEligible = new Date(
                    context.executionHistory.lastExecutionAt.getTime() +
                    policy.cooldownPeriodMs
                );
                return createBlockDecision(
                    context,
                    `Cooldown period active (${Math.ceil(remaining / 1000)}s remaining)`,
                    'COOLDOWN',
                    nextEligible,
                    { cooldownRemainingMs: remaining }
                );
            }
        }

        // Step 6: Check max executions per window
        if (
            policy.maxExecutionsPerWindow &&
            policy.maxExecutionsPerWindow > 0
        ) {
            const limit = policy.maxExecutionsPerWindow;
            const current = context.executionHistory.executionsInWindow;
            if (current >= limit) {
                return createBlockDecision(
                    context,
                    `Maximum executions (${limit}) reached for current window`,
                    'LIMIT',
                    this.calculateNextEligible(definition, policy, context),
                    {
                        executionsInWindow: current,
                        maxExecutions: limit,
                    }
                );
            }
        }

        // Step 7: Check schedule-specific rules
        const scheduleCheck = this.checkScheduleType(
            definition,
            context,
            policy.skipMissed ?? true
        );

        if (!scheduleCheck.shouldTrigger) {
            return createBlockDecision(
                context,
                scheduleCheck.reason,
                scheduleCheck.blockedBy ?? 'NOT_YET',
                scheduleCheck.nextEligibleAt
            );
        }

        // All checks passed - should trigger
        return createTriggerDecision(
            context,
            'All policy checks passed',
            this.calculateNextEligible(definition, policy, context)
        );
    }

    /**
     * Calculate when the schedule will next be eligible to trigger.
     */
    calculateNextEligible(
        definition: ScheduleDefinition,
        policy: SchedulePolicy,
        context: ScheduleEvaluationContext
    ): Date | null {
        switch (definition.type) {
            case 'ONCE':
                return this.calculateNextForOnce(
                    definition,
                    context
                );
            case 'INTERVAL':
                return this.calculateNextForInterval(
                    definition,
                    policy,
                    context
                );
            case 'CALENDAR':
                return this.calculateNextForCalendar(
                    definition,
                    policy,
                    context
                );
            default:
                return null;
        }
    }

    // =========================================================================
    // Private Implementation
    // =========================================================================

    /**
     * Check if current time falls within allowed windows
     */
    private checkTimeWindows(
        now: Date,
        windows: TimeWindow[],
        timezone: string
    ): { inWindow: boolean; nextWindow?: TimeWindow } {
        const tzNow = toTimezone(now, timezone);
        const currentMinutes = tzNow.getHours() * 60 + tzNow.getMinutes();
        const currentDay = tzNow.getDay();

        for (const window of windows) {
            // Check if window applies to current day
            if (
                window.daysOfWeek &&
                window.daysOfWeek.length > 0 &&
                !window.daysOfWeek.includes(currentDay)
            ) {
                continue;
            }

            const startMinutes = parseTime(window.startTime);
            const endMinutes = parseTime(window.endTime);

            if (
                currentMinutes >= startMinutes &&
                currentMinutes <= endMinutes
            ) {
                return { inWindow: true };
            }
        }

        // Not in any window - return the next applicable window
        return { inWindow: false, nextWindow: this.findNextWindow(windows, tzNow) };
    }

    /**
     * Find the next time window
     */
    private findNextWindow(windows: TimeWindow[], now: Date): TimeWindow | undefined {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const currentDay = now.getDay();

        // Sort windows by start time
        const sortedWindows = [...windows].sort(
            (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
        );

        // Find next window today or in future days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const checkDay = (currentDay + dayOffset) % 7;

            for (const window of sortedWindows) {
                if (
                    window.daysOfWeek &&
                    window.daysOfWeek.length > 0 &&
                    !window.daysOfWeek.includes(checkDay)
                ) {
                    continue;
                }

                const startMinutes = parseTime(window.startTime);

                if (dayOffset === 0 && startMinutes <= currentMinutes) {
                    continue; // Window already passed today
                }

                return window;
            }
        }

        return undefined;
    }

    /**
     * Check schedule type-specific rules
     */
    private checkScheduleType(
        definition: ScheduleDefinition,
        context: ScheduleEvaluationContext,
        skipMissed: boolean
    ): {
        shouldTrigger: boolean;
        reason: string;
        blockedBy?: BlockReason;
        nextEligibleAt: Date | null;
    } {
        switch (definition.type) {
            case 'ONCE':
                return this.checkOnceSchedule(definition, context);
            case 'INTERVAL':
                return this.checkIntervalSchedule(definition, context, skipMissed);
            case 'CALENDAR':
                return this.checkCalendarSchedule(definition, context, skipMissed);
            default:
                return {
                    shouldTrigger: false,
                    reason: 'Unknown schedule type',
                    nextEligibleAt: null,
                };
        }
    }

    /**
     * Check ONCE schedule
     */
    private checkOnceSchedule(
        definition: ScheduleDefinition,
        context: ScheduleEvaluationContext
    ): {
        shouldTrigger: boolean;
        reason: string;
        blockedBy?: BlockReason;
        nextEligibleAt: Date | null;
    } {
        const config = definition.config as { targetDate: string };
        const targetDate = new Date(config.targetDate);

        // Check if already executed
        if (context.executionHistory.lastExecutionAt) {
            return {
                shouldTrigger: false,
                reason: 'ONCE schedule already executed',
                blockedBy: 'ALREADY_RAN',
                nextEligibleAt: null,
            };
        }

        // Check if target time reached
        if (context.now < targetDate) {
            return {
                shouldTrigger: false,
                reason: 'Target time not yet reached',
                blockedBy: 'NOT_YET',
                nextEligibleAt: targetDate,
            };
        }

        return {
            shouldTrigger: true,
            reason: 'Target time reached and not yet executed',
            nextEligibleAt: null,
        };
    }

    /**
     * Check INTERVAL schedule
     */
    private checkIntervalSchedule(
        definition: ScheduleDefinition,
        context: ScheduleEvaluationContext,
        skipMissed: boolean
    ): {
        shouldTrigger: boolean;
        reason: string;
        nextEligibleAt: Date | null;
    } {
        const config = definition.config as IntervalConfig;
        const intervalMs = this.intervalToMs(config);

        if (!context.executionHistory.lastExecutionAt) {
            // First execution - trigger immediately
            return {
                shouldTrigger: true,
                reason: 'First interval execution',
                nextEligibleAt: new Date(context.now.getTime() + intervalMs),
            };
        }

        const elapsed =
            context.now.getTime() - context.executionHistory.lastExecutionAt.getTime();

        if (elapsed >= intervalMs) {
            if (skipMissed) {
                // Calculate the next aligned time
                const nextTime = new Date(
                    context.executionHistory.lastExecutionAt.getTime() +
                    Math.ceil(elapsed / intervalMs) * intervalMs
                );
                return {
                    shouldTrigger: true,
                    reason: 'Interval elapsed (skipping to next aligned time)',
                    nextEligibleAt: new Date(nextTime.getTime() + intervalMs),
                };
            } else {
                return {
                    shouldTrigger: true,
                    reason: 'Interval elapsed',
                    nextEligibleAt: new Date(context.now.getTime() + intervalMs),
                };
            }
        }

        const remaining = intervalMs - elapsed;
        return {
            shouldTrigger: false,
            reason: `Interval not yet elapsed (${Math.ceil(remaining / 1000)}s remaining)`,
            nextEligibleAt: new Date(context.now.getTime() + remaining),
        };
    }

    /**
     * Check CALENDAR schedule
     */
    private checkCalendarSchedule(
        definition: ScheduleDefinition,
        context: ScheduleEvaluationContext,
        skipMissed: boolean
    ): {
        shouldTrigger: boolean;
        reason: string;
        nextEligibleAt: Date | null;
    } {
        const config = definition.config as CalendarConfig;
        const tzNow = toTimezone(context.now, definition.timezone);

        // Check day of week constraint
        if (
            config.dayOfWeek !== undefined &&
            tzNow.getDay() !== config.dayOfWeek
        ) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled day of week',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }

        // Check day of month constraint
        if (
            config.dayOfMonth !== undefined &&
            tzNow.getDate() !== config.dayOfMonth
        ) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled day of month',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }

        // Check hour constraint
        if (config.hour !== undefined && tzNow.getHours() !== config.hour) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled hour',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }

        // Check minute constraint
        const targetMinute = config.minute ?? 0;
        if (tzNow.getMinutes() !== targetMinute) {
            return {
                shouldTrigger: false,
                reason: 'Not the scheduled minute',
                nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
            };
        }

        // Time matches - check if already triggered this cycle
        if (context.executionHistory.lastExecutionAt) {
            const lastExecution = toTimezone(
                context.executionHistory.lastExecutionAt,
                definition.timezone
            );
            const sameHour = lastExecution.getHours() === tzNow.getHours();
            const sameDay = lastExecution.getDate() === tzNow.getDate();
            const sameMonth = lastExecution.getMonth() === tzNow.getMonth();
            const sameYear = lastExecution.getFullYear() === tzNow.getFullYear();

            if (sameHour && sameDay && sameMonth && sameYear) {
                return {
                    shouldTrigger: false,
                    reason: 'Already triggered at this scheduled time',
                    nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
                };
            }
        }

        return {
            shouldTrigger: true,
            reason: 'Calendar schedule time reached',
            nextEligibleAt: this.findNextCalendarTime(config, tzNow, definition.timezone),
        };
    }

    /**
     * Find next calendar trigger time
     */
    private findNextCalendarTime(
        config: CalendarConfig,
        from: Date,
        timezone: string
    ): Date {
        const next = new Date(from.getTime());
        next.setMinutes((config.minute ?? 0) + 1);

        // Simple forward search (max 1 year)
        for (let i = 0; i < 366 * 24 * 60; i++) {
            next.setMinutes(next.getMinutes() + 1);
            const tzNext = toTimezone(next, timezone);

            if (config.dayOfWeek !== undefined && tzNext.getDay() !== config.dayOfWeek) {
                continue;
            }
            if (config.dayOfMonth !== undefined && tzNext.getDate() !== config.dayOfMonth) {
                continue;
            }
            if (config.hour !== undefined && tzNext.getHours() !== config.hour) {
                continue;
            }
            if (tzNext.getMinutes() !== (config.minute ?? 0)) {
                continue;
            }

            return next;
        }

        return new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year fallback
    }

    /**
     * Convert interval config to milliseconds
     */
    private intervalToMs(config: IntervalConfig): number {
        if (config.minutes) {
            return config.minutes * 60 * 1000;
        }
        if (config.hours) {
            return config.hours * 60 * 60 * 1000;
        }
        if (config.days) {
            return config.days * 24 * 60 * 60 * 1000;
        }
        return 0;
    }

    /**
     * Calculate next eligible time for ONCE schedule
     */
    private calculateNextForOnce(
        definition: ScheduleDefinition,
        context: ScheduleEvaluationContext
    ): Date | null {
        const config = definition.config as { targetDate: string };
        const targetDate = new Date(config.targetDate);

        // If already executed or past target, no next time
        if (context.executionHistory.lastExecutionAt || context.now >= targetDate) {
            return null;
        }

        return targetDate;
    }

    /**
     * Calculate next eligible time for INTERVAL schedule
     */
    private calculateNextForInterval(
        definition: ScheduleDefinition,
        policy: SchedulePolicy,
        context: ScheduleEvaluationContext
    ): Date | null {
        const config = definition.config as IntervalConfig;
        const intervalMs = this.intervalToMs(config);

        if (intervalMs === 0) {
            return null;
        }

        let baseTime: Date;
        if (context.executionHistory.lastExecutionAt) {
            baseTime = context.executionHistory.lastExecutionAt;
        } else {
            baseTime = context.now;
        }

        // Add interval
        let nextTime = new Date(baseTime.getTime() + intervalMs);

        // If in the past, advance to future
        while (nextTime <= context.now) {
            nextTime = new Date(nextTime.getTime() + intervalMs);
        }

        return nextTime;
    }

    /**
     * Calculate next eligible time for CALENDAR schedule
     */
    private calculateNextForCalendar(
        definition: ScheduleDefinition,
        _policy: SchedulePolicy,
        context: ScheduleEvaluationContext
    ): Date | null {
        const config = definition.config as CalendarConfig;
        const tzNow = toTimezone(context.now, definition.timezone);
        return this.findNextCalendarTime(config, tzNow, definition.timezone);
    }
}
