/**
 * =============================================================================
 * Scheduler Runner
 * =============================================================================
 *
 * Core scheduler runner that evaluates schedules using real execution history.
 *
 * Design Principles:
 * - Single-shot evaluation (no timers, no loops)
 * - Deterministic with injected time
 * - Stateless (no instance state between ticks)
 * - No side effects (evaluation only, no execution)
 * - Tenant-isolated
 * - History-aware (cooldown, rate limiting)
 *
 * Responsibility:
 * - Load schedules for a tenant
 * - Query execution history for cooldown/rate-limit checks
 * - Evaluate each schedule using SchedulePolicyService with real history
 * - Produce deterministic decisions
 * - Return trigger candidates
 *
 * Non-Responsibility:
 * - Timers/background execution
 * - Transport logic
 * - Actual execution triggering (delegated to caller)
 * - Persistence
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { ILogger, TOKENS } from '../core';
import { SchedulePolicyService } from '../schedule/schedule-policy.service';
import {
    ScheduleEvaluationContext,
    ExecutionHistorySummary,
    SchedulePolicy,
} from '../schedule/schedule.model';
import { ExecutionHistoryService } from '../history/execution-history.service';
import { IScheduleProvider, ScheduledExecution } from '../schedules/scheduled-execution.model';
import {
    TickOptions,
    TickResult,
    RunnerScheduleDecision,
    TriggerCandidate,
    createTickOptions,
    createTickResult,
    createRunnerScheduleDecision,
    createTriggerCandidate,
} from './scheduler-runner.model';

// =============================================================================
// Runner Dependencies
// =============================================================================

/**
 * Dependencies required by SchedulerRunner.
 */
export interface RunnerDependencies {
    /**
     * Provider for loading schedules
     */
    readonly scheduleProvider: IScheduleProvider;

    /**
     * Service for evaluating schedule policies
     */
    readonly schedulePolicyService: SchedulePolicyService;

    /**
     * Service for querying execution history (cooldown, rate limits)
     */
    readonly executionHistoryService: ExecutionHistoryService;

    /**
     * Logger (optional)
     */
    readonly logger?: ILogger;
}

// =============================================================================
// Scheduler Runner
// =============================================================================

@injectable()
export class SchedulerRunner {
    private readonly logger: ILogger;

    constructor(
        private readonly deps: RunnerDependencies,
        @inject(TOKENS.Logger) logger?: ILogger
    ) {
        this.logger = logger?.child({ source: 'SchedulerRunner' }) ?? console as unknown as ILogger;
    }

    /**
     * Evaluate all schedules for a tenant at a specific time.
     *
     * This is a SINGLE-SHOT evaluation. It does NOT:
     * - Set up timers
     * - Run background loops
     * - Trigger executions
     *
     * It uses real execution history for cooldown and rate-limit decisions.
     *
     * @param tenantId The tenant to evaluate schedules for
     * @param now The current time (injected for determinism)
     * @param options Optional tick options
     * @returns Tick result with decisions and trigger candidates
     */
    async tickTenant(
        tenantId: string,
        now: Date,
        options?: TickOptions
    ): Promise<TickResult> {
        // Step 1: Normalize options
        const opts = createTickOptions(options);

        this.logger.info('Starting scheduler tick', {
            tenantId,
            now: now.toISOString(),
            dryRun: opts.dryRun,
        });

        try {
            // Step 2: Load schedules
            const schedules = await this.loadSchedules(tenantId);

            // Step 3: Evaluate each schedule
            const decisions: RunnerScheduleDecision[] = [];
            const triggerCandidates: TriggerCandidate[] = [];

            for (const scheduledExecution of schedules) {
                const decision = await this.evaluateSchedule(
                    scheduledExecution,
                    tenantId,
                    now,
                    opts.dryRun
                );

                if (opts.includeDecisions) {
                    decisions.push(decision);
                }

                if (decision.shouldTrigger) {
                    // Check max triggers cap
                    if (triggerCandidates.length < opts.maxTriggers) {
                        triggerCandidates.push(
                            createTriggerCandidate({
                                scheduleId: scheduledExecution.id,
                                tenantId,
                                executionParams: scheduledExecution.executionParams,
                            })
                        );
                    } else {
                        this.logger.warn('Max triggers limit reached, skipping additional candidates', {
                            scheduleId: scheduledExecution.id,
                            tenantId,
                            maxTriggers: opts.maxTriggers,
                        });
                    }
                }
            }

            // Step 4: Build and return result
            const result = createTickResult({
                tenantId,
                now,
                dryRun: opts.dryRun,
                evaluatedCount: schedules.length,
                decisions,
                triggerCandidates,
            });

            this.logger.info('Scheduler tick completed', {
                tenantId,
                evaluatedCount: result.evaluatedCount,
                triggeredCount: result.triggeredCount,
            });

            return result;
        } catch (error) {
            // Log error but return empty result rather than throwing
            this.logger.error(
                'Scheduler tick failed',
                error instanceof Error ? error : new Error(String(error)),
                { tenantId }
            );

            return createTickResult({
                tenantId,
                now,
                dryRun: opts.dryRun,
                evaluatedCount: 0,
                decisions: [],
                triggerCandidates: [],
            });
        }
    }

    // =========================================================================
    // Private Implementation
    // =========================================================================

    /**
     * Load enabled schedules for a tenant.
     */
    private async loadSchedules(tenantId: string): Promise<ScheduledExecution[]> {
        const allSchedules = await this.deps.scheduleProvider.getSchedulesForTenant(tenantId);

        // Filter to only enabled schedules
        const enabledSchedules = allSchedules.filter((s) => s.enabled);

        this.logger.debug('Loaded schedules for tenant', {
            tenantId,
            total: allSchedules.length,
            enabled: enabledSchedules.length,
        });

        return enabledSchedules;
    }

    /**
     * Build execution history summary for policy evaluation.
     *
     * Uses injected `now` for all window/cooldown calculations.
     */
    private async buildHistorySummary(
        tenantId: string,
        policy: SchedulePolicy,
        now: Date
    ): Promise<ExecutionHistorySummary> {
        try {
            // Get window for rate limiting (default to 24 hours from policy)
            const windowMs = policy.executionWindowMs ?? 24 * 60 * 60 * 1000;

            // Get execution summary for the window
            const summary = await this.deps.executionHistoryService.getSummary(
                tenantId,
                windowMs,
                now
            );

            // Get most recent execution for cooldown
            const mostRecent = await this.deps.executionHistoryService.getMostRecent(tenantId);

            return {
                executionsInWindow: summary.totalExecutions,
                lastExecutionAt: summary.lastExecutionAt,
                windowStartAt: summary.windowStartAt,
                recentExecutions: summary.lastExecutionAt ? [summary.lastExecutionAt] : [],
            };
        } catch (error) {
            // Log warning and return neutral history
            this.logger.warn('Failed to query execution history, using neutral defaults', {
                tenantId,
                error: (error as Error).message,
            });

            return {
                executionsInWindow: 0,
                recentExecutions: [],
            };
        }
    }

    /**
     * Evaluate a single schedule using real execution history.
     */
    private async evaluateSchedule(
        scheduledExecution: ScheduledExecution,
        tenantId: string,
        now: Date,
        dryRun: boolean
    ): Promise<RunnerScheduleDecision> {
        try {
            // Build execution history summary using injected `now`
            const historySummary = await this.buildHistorySummary(
                tenantId,
                scheduledExecution.policy,
                now
            );

            // Build evaluation context
            const context: ScheduleEvaluationContext = {
                now,
                executionHistory: historySummary,
                dryRun,
            };

            // Evaluate using SchedulePolicyService
            const decision = this.deps.schedulePolicyService.evaluateSchedule(
                scheduledExecution.schedule,
                scheduledExecution.policy,
                context
            );

            return createRunnerScheduleDecision({
                scheduleId: scheduledExecution.id,
                shouldTrigger: decision.shouldTrigger,
                reason: decision.reason,
                blockedBy: decision.blockedBy,
                nextEligibleAt: decision.nextEligibleAt,
            });
        } catch (error) {
            // Log error but return decision indicating failure
            this.logger.error(
                'Failed to evaluate schedule',
                error instanceof Error ? error : new Error(String(error)),
                { scheduleId: scheduledExecution.id, tenantId }
            );

            return createRunnerScheduleDecision({
                scheduleId: scheduledExecution.id,
                shouldTrigger: false,
                reason: `Evaluation failed: ${(error as Error).message}`,
                blockedBy: 'ERROR',
                nextEligibleAt: null,
            });
        }
    }
}
