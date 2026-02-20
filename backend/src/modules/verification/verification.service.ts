import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VerificationRepository } from './verification.repository';
import { ScenarioLoader } from '../../toolkit/scenarios/scenario-loader';
import { VerificationOptions, VerificationResult, VerificationCheck, CheckStatus } from './types';
import { AlertRuleEvaluator } from './rules/alert-rule.evaluator';
import { BIZ_RULES, ANOMALY_RULES } from './rules/rule-catalog';
import * as path from 'path';
import { DETERMINISTIC_ANCHOR } from '../../toolkit/core/constants';

@Injectable()
export class VerificationService {
    private readonly logger = new Logger(VerificationService.name);

    constructor(
        private readonly repository: VerificationRepository,
        private readonly scenarioLoader: ScenarioLoader,
        private readonly ruleEvaluator: AlertRuleEvaluator,
    ) { }

    async verifyScenario(options: VerificationOptions): Promise<VerificationResult> {
        const startTime = Date.now();
        this.logger.log(`Starting verification for scenario: ${options.scenarioId}, tenant: ${options.tenantId}`);

        // 1. Load Scenario Spec
        let spec;
        try {
            spec = await this.scenarioLoader.load(options.scenarioId);
        } catch (e: any) {
            this.logger.error(`Failed to load scenario: ${e.message}`);
            throw new NotFoundException(`Scenario ${options.scenarioId} not found or invalid: ${e.message}`);
        }

        // 2. Determine Date Window (Logic P0)
        const days = spec.days || 30;
        const anchor = spec.dateAnchor ? new Date(spec.dateAnchor) : new Date(DETERMINISTIC_ANCHOR);
        const windowStart = new Date(anchor);
        windowStart.setDate(windowStart.getDate() - days);
        const windowEnd = anchor;

        this.logger.log(`Date Window: ${windowStart.toISOString()} - ${windowEnd.toISOString()}`);

        const checks: VerificationCheck[] = [];

        // 3. INT-003: Date Window Match / Drift Check
        const driftCount = await this.repository.countDriftMetrics(options.tenantId, windowStart, windowEnd);
        if (driftCount > 0) {
            checks.push({
                ruleId: 'INT-003',
                name: 'DATE_WINDOW_MATCH',
                status: 'FAIL',
                severity: 'FAIL',
                message: `Found ${driftCount} metrics outside window`,
                details: { driftCount, windowStart, windowEnd }
            });
        } else {
            checks.push({
                ruleId: 'INT-003',
                name: 'DATE_WINDOW_MATCH',
                status: 'PASS',
                severity: 'FAIL',
                message: 'All data within window',
            });
        }

        // 4. INT-004: Mock Flag Consistency
        const consistencyErrors = await this.repository.checkMockFlagConsistency(options.tenantId);
        if (consistencyErrors > 0) {
            checks.push({
                ruleId: 'INT-004',
                name: 'MOCK_FLAG_CONSISTENCY',
                status: 'FAIL',
                severity: 'FAIL',
                message: `Found ${consistencyErrors} records with toolkit source but isMockData=false`,
                details: { count: consistencyErrors }
            });
        } else {
            checks.push({
                ruleId: 'INT-004',
                name: 'MOCK_FLAG_CONSISTENCY',
                status: 'PASS',
                severity: 'FAIL',
                message: 'All toolkit records have isMockData=true',
            });
        }

        // 5. INT-001: Row Count Match (Approximation for now: > 0)
        const count = await this.repository.countMetrics(options.tenantId, windowStart, windowEnd);
        if (count === 0) {
            checks.push({
                ruleId: 'INT-001',
                name: 'ROW_COUNT_MATCH',
                status: 'FAIL',
                severity: 'FAIL',
                message: 'No metrics found for scenario',
                details: { count, expected: '>0' }
            });
        } else {
            checks.push({
                ruleId: 'INT-001',
                name: 'ROW_COUNT_MATCH',
                status: 'PASS',
                severity: 'FAIL',
                message: `Found ${count} metrics`,
                details: { count }
            });
        }

        // 6. Alert & Anomaly Rules (Pure Evaluation)
        try {
            const aggregates = await this.repository.getAggregates(options.tenantId, windowStart, windowEnd);

            // Evaluate per campaign/aggregate
            for (const agg of aggregates) {
                // Context for rules: the aggregate object
                // Run BIZ Rules
                const bizChecks = this.ruleEvaluator.evaluate(agg, BIZ_RULES);
                checks.push(...bizChecks);

                // Run ANOMALY Rules
                const anomalyChecks = this.ruleEvaluator.evaluate(agg, ANOMALY_RULES);
                checks.push(...anomalyChecks);
            }

            if (aggregates.length === 0 && count > 0) {
                this.logger.warn('Metrics found but aggregates returned empty?');
            }
        } catch (e: any) {
            this.logger.error(`Rule Evaluation Failed: ${e.message}`, e.stack);
            checks.push({
                ruleId: 'SYS-ERR',
                name: 'RULE_EVAL_ERROR',
                status: 'FAIL',
                severity: 'FAIL',
                message: `Rule evaluation crashed: ${e.message}`
            });
        }

        // Summary calculation
        const passed = checks.filter(c => c.status === 'PASS').length;
        const failed = checks.filter(c => c.status === 'FAIL').length;
        const warnings = checks.filter(c => c.status === 'WARN').length;

        const status: 'PASS' | 'FAIL' | 'WARN' = failed > 0 ? 'FAIL' : (warnings > 0 ? 'WARN' : 'PASS');

        const durationMs = Date.now() - startTime;

        return {
            meta: {
                version: '1.0.0',
                generator: 'rga-toolkit-verify',
                createdAt: new Date().toISOString(),
                runId: options.runId || 'unknown',
                scenarioId: options.scenarioId,
                tenantId: options.tenantId,
            },
            summary: {
                status,
                totalChecks: checks.length,
                passed,
                failed,
                warnings,
                durationMs,
            },
            results: checks,
            provenance: {
                isMockData: true,
                sourcePrefix: 'toolkit:'
            }
        };
    }
}
