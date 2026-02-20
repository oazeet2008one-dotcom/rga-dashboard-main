/**
 * =============================================================================
 * Alert Execution Service
 * =============================================================================
 *
 * Orchestrates the complete alert evaluation execution flow.
 * Defines the canonical path through which AlertEngine is executed.
 *
 * Design Principles:
 * - Single Responsibility: Execution orchestration only
 * - Stateless: No instance state between executions
 * - Deterministic: Same context + rules = same result
 * - No Side Effects: Pure orchestration, evaluation delegated to AlertEngine
 *
 * Phase 2.2.1 Scope:
 * - Define AlertExecutionRun (single evaluation boundary)
 * - Define ExecutionContext (inputs)
 * - Define ExecutionResult (outputs)
 * - Step-by-step execution flow
 * - Result aggregation
 * - Event emission (domain events only, no transport)
 *
 * Responsibilities:
 * 1. Receive execution request with context
 * 2. Resolve which alert rules to evaluate (via abstraction)
 * 3. Invoke AlertEngine with prepared inputs
 * 4. Collect and aggregate evaluation results
 * 5. Emit execution completed event
 * 6. Return ExecutionResult
 *
 * Non-Responsibilities:
 * - WHEN execution happens (no scheduling)
 * - HOW inputs are prepared (no persistence logic)
 * - Transport (no HTTP/CLI/WS logic)
 * - Rule CRUD (rules are provided via abstraction)
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import {
    AlertEngine,
    AlertRule,
    MetricSnapshot,
    BaselineSnapshot,
    AlertEvaluationResult,
    EvaluationContext as AlertEngineContext,
} from './alert-engine.service';
// WebSocket imports removed

// =============================================================================
// Domain Types
// =============================================================================

/**
 * Execution mode for an alert run
 */
export type ExecutionMode = 'MANUAL' | 'SCHEDULED' | 'TEST';

/**
 * Context for a single alert execution run
 * Defines the boundary and parameters of execution
 */
export interface ExecutionContext {
    /**
     * Tenant identifier - scope for rule resolution and evaluation
     */
    readonly tenantId: string;

    /**
     * Execution timestamp - when this run was initiated
     */
    readonly executionTime: Date;

    /**
     * Dry run flag - if true, no side effects should occur
     */
    readonly dryRun: boolean;

    /**
     * Execution mode - how this execution was triggered
     */
    readonly executionMode: ExecutionMode;

    /**
     * Optional correlation ID for tracing across systems
     */
    readonly correlationId?: string;

    /**
     * Optional user identifier for manual executions
     */
    readonly triggeredBy?: string;
}

/**
 * Represents a single alert execution run
 * Encapsulates the complete lifecycle of one evaluation
 */
export interface AlertExecutionRun {
    /**
     * Unique identifier for this execution run
     */
    readonly runId: string;

    /**
     * Execution context (inputs)
     */
    readonly context: ExecutionContext;

    /**
     * Start time of execution
     */
    readonly startedAt: Date;

    /**
     * End time of execution (null if not completed)
     */
    readonly completedAt: Date | null;

    /**
     * Status of execution
     */
    readonly status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

/**
 * Input provider abstraction
 * Decouples execution from rule/source resolution
 * Allows testing without real rule repositories
 */
export interface IRuleProvider {
    /**
     * Resolve alert rules for a tenant
     * Returns rules that should be evaluated in this execution
     */
    resolveRules(tenantId: string): Promise<AlertRule[]>;
}

/**
 * Metric provider abstraction
 * Decouples execution from metric data sources
 */
export interface IMetricProvider {
    /**
     * Fetch current metric snapshots for evaluation
     */
    fetchSnapshots(
        tenantId: string,
        dateRange: { start: Date; end: Date }
    ): Promise<MetricSnapshot[]>;

    /**
     * Fetch baseline snapshots for comparison (optional)
     */
    fetchBaselines?(
        tenantId: string,
        campaignIds: string[],
        baselineDateRange: { start: Date; end: Date }
    ): Promise<Map<string, BaselineSnapshot>>;
}

/**
 * Result of a single rule evaluation
 * Enriched with execution context
 */
export interface RuleEvaluation {
    /**
     * The rule that was evaluated
     */
    readonly rule: AlertRule;

    /**
     * Whether the rule was triggered
     */
    readonly triggered: boolean;

    /**
     * Human-readable reason
     */
    readonly reason: string;

    /**
     * Supporting values for debugging
     */
    readonly values: {
        readonly current?: number;
        readonly baseline?: number;
        readonly threshold?: number;
        readonly dropPercent?: number;
    };

    /**
     * Timestamp of evaluation
     */
    readonly evaluatedAt: Date;
}

/**
 * Complete result of an alert execution run
 */
export interface ExecutionResult {
    /**
     * Execution run identifier
     */
    readonly runId: string;

    /**
     * Original execution context
     */
    readonly context: ExecutionContext;

    /**
     * Execution timing
     */
    readonly timing: {
        readonly startedAt: Date;
        readonly completedAt: Date;
        readonly durationMs: number;
    };

    /**
     * Summary statistics
     */
    readonly summary: {
        readonly totalRules: number;
        readonly enabledRules: number;
        readonly triggeredCount: number;
        readonly notTriggeredCount: number;
        readonly snapshotsEvaluated: number;
    };

    /**
     * Triggered alerts (if any)
     */
    readonly triggeredAlerts: RuleEvaluation[];

    /**
     * Non-triggered rules (optional, for audit)
     */
    readonly notTriggeredRules?: RuleEvaluation[];

    /**
     * Execution status
     */
    readonly status: 'COMPLETED' | 'FAILED';

    /**
     * Error details (if failed)
     */
    readonly error?: {
        readonly message: string;
        readonly code: string;
    };
}

// =============================================================================
// Service Implementation
// =============================================================================

@injectable()
export class AlertExecutionService {
    constructor(
        @inject(AlertEngine) private readonly alertEngine: AlertEngine
    ) { }

    /**
     * Execute a complete alert evaluation run
     *
     * STEP-BY-STEP EXECUTION FLOW:
     *
     * Step 1: Initialize execution run
     *   - Generate runId
     *   - Record start time
     *   - Validate context
     *
     * Step 2: Resolve alert rules
     *   - Call ruleProvider.resolveRules(tenantId)
     *   - Filter to enabled rules
     *
     * Step 3: Fetch metric snapshots
     *   - Call metricProvider.fetchSnapshots()
     *   - Handle empty result (early return)
     *
     * Step 4: Fetch baselines (optional)
     *   - If metricProvider supports baselines
     *   - Call metricProvider.fetchBaselines()
     *
     * Step 5: Invoke AlertEngine
     *   - Build AlertEngineContext
     *   - Call alertEngine.evaluateCheck()
     *   - Receive AlertEvaluationResult
     *
     * Step 6: Aggregate results
     *   - Map AlertTriggerResult to RuleEvaluation
     *   - Separate triggered vs not-triggered
     *   - Calculate summary statistics
     *
     * Step 7: Emit domain events
     *   - Emit AlertExecutionCompletedEvent
     *   - Emit AlertTriggeredEvent (if alerts triggered)
     *   - Events represent completed execution only
     *
     * Step 8: Return ExecutionResult
     *   - Build complete result object
     *   - Include timing, summary, alerts
     */
    async execute(
        context: ExecutionContext,
        ruleProvider: IRuleProvider,
        metricProvider: IMetricProvider
    ): Promise<ExecutionResult> {
        const runId = this.generateRunId();
        const startedAt = new Date();

        try {
            // =====================================================================
            // Step 1: Validate context
            // =====================================================================
            this.validateContext(context);

            // =====================================================================
            // Step 2: Resolve alert rules
            // =====================================================================
            const allRules = await ruleProvider.resolveRules(context.tenantId);
            const enabledRules = allRules.filter((rule) => rule.enabled);

            // Early return if no enabled rules
            if (enabledRules.length === 0) {
                return this.buildEmptyResult(runId, context, startedAt, 'No enabled rules');
            }

            // =====================================================================
            // Step 3: Fetch metric snapshots
            // =====================================================================
            const dateRange = this.calculateDateRange(context.executionTime);
            const snapshots = await metricProvider.fetchSnapshots(
                context.tenantId,
                dateRange
            );

            // Early return if no metrics
            if (snapshots.length === 0) {
                return this.buildEmptyResult(runId, context, startedAt, 'No metrics available');
            }

            // =====================================================================
            // Step 4: Fetch baselines (optional)
            // =====================================================================
            let baselines: Map<string, BaselineSnapshot> | undefined;
            if (metricProvider.fetchBaselines) {
                const campaignIds = [...new Set(snapshots.map((s) => s.campaignId))];
                const baselineDateRange = this.calculateBaselineDateRange(dateRange);
                baselines = await metricProvider.fetchBaselines(
                    context.tenantId,
                    campaignIds,
                    baselineDateRange
                );
            }

            // =====================================================================
            // Step 5: Invoke AlertEngine
            // =====================================================================
            const alertEngineContext: AlertEngineContext = {
                tenantId: context.tenantId,
                dateRange,
                dryRun: context.dryRun,
            };

            const evaluationResult = this.alertEngine.evaluateCheck(
                snapshots,
                enabledRules,
                alertEngineContext,
                baselines
            );

            // =====================================================================
            // Step 6: Aggregate results
            // =====================================================================
            const triggeredAlerts = evaluationResult.triggeredAlerts.map((result) =>
                this.mapToRuleEvaluation(result)
            );

            // =====================================================================
            // Step 7: Emit domain events
            // =====================================================================
            const completedAt = new Date();
            // Event emission removed (websocket deprecated)


            // =====================================================================
            // Step 8: Return ExecutionResult
            // =====================================================================
            return {
                runId,
                context,
                timing: {
                    startedAt,
                    completedAt,
                    durationMs: completedAt.getTime() - startedAt.getTime(),
                },
                summary: {
                    totalRules: allRules.length,
                    enabledRules: enabledRules.length,
                    triggeredCount: triggeredAlerts.length,
                    notTriggeredCount: enabledRules.length - triggeredAlerts.length,
                    snapshotsEvaluated: snapshots.length,
                },
                triggeredAlerts,
                status: 'COMPLETED',
            };
        } catch (error) {
            // Handle execution failure
            const completedAt = new Date();
            const errorMessage = error instanceof Error ? error.message : String(error);

            return {
                runId,
                context,
                timing: {
                    startedAt,
                    completedAt,
                    durationMs: completedAt.getTime() - startedAt.getTime(),
                },
                summary: {
                    totalRules: 0,
                    enabledRules: 0,
                    triggeredCount: 0,
                    notTriggeredCount: 0,
                    snapshotsEvaluated: 0,
                },
                triggeredAlerts: [],
                status: 'FAILED',
                error: {
                    message: errorMessage,
                    code: 'EXECUTION_FAILED',
                },
            };
        }
    }

    // =========================================================================
    // Private Helper Methods
    // =========================================================================

    /**
     * Generate unique run identifier
     */
    private generateRunId(): string {
        return `exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Validate execution context
     */
    private validateContext(context: ExecutionContext): void {
        if (!context.tenantId) {
            throw new Error('ExecutionContext.tenantId is required');
        }
        if (!context.executionTime) {
            throw new Error('ExecutionContext.executionTime is required');
        }
        if (!context.executionMode) {
            throw new Error('ExecutionContext.executionMode is required');
        }
    }

    /**
     * Calculate date range for evaluation
     * Default: Yesterday (for daily evaluation)
     */
    private calculateDateRange(executionTime: Date): { start: Date; end: Date } {
        const end = new Date(executionTime);
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() - 1); // Yesterday

        const start = new Date(end);
        start.setHours(0, 0, 0, 0);

        return { start, end };
    }

    /**
     * Calculate baseline date range (previous period)
     */
    private calculateBaselineDateRange(
        currentRange: { start: Date; end: Date }
    ): { start: Date; end: Date } {
        const duration = currentRange.end.getTime() - currentRange.start.getTime();

        const end = new Date(currentRange.start);
        end.setMilliseconds(end.getMilliseconds() - 1);

        const start = new Date(end);
        start.setTime(start.getTime() - duration);

        return { start, end };
    }

    /**
     * Build empty result for early returns
     */
    private buildEmptyResult(
        runId: string,
        context: ExecutionContext,
        startedAt: Date,
        reason: string
    ): ExecutionResult {
        const completedAt = new Date();

        return {
            runId,
            context,
            timing: {
                startedAt,
                completedAt,
                durationMs: completedAt.getTime() - startedAt.getTime(),
            },
            summary: {
                totalRules: 0,
                enabledRules: 0,
                triggeredCount: 0,
                notTriggeredCount: 0,
                snapshotsEvaluated: 0,
            },
            triggeredAlerts: [],
            status: 'COMPLETED',
        };
    }

    /**
     * Map AlertEngine result to RuleEvaluation
     */
    private mapToRuleEvaluation(
        result: import('./alert-engine.service').AlertTriggerResult
    ): RuleEvaluation {
        return {
            rule: {
                id: result.ruleId,
                name: result.ruleName,
                condition: result.condition,
                severity: result.severity,
                enabled: true, // Was evaluated, so was enabled
            },
            triggered: result.triggered,
            reason: result.reason,
            values: result.values,
            evaluatedAt: result.evaluatedAt,
        };
    }

}


