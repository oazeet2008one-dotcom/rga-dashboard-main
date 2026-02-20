/**
 * =============================================================================
 * Alert Scenario Service
 * =============================================================================
 *
 * Orchestrates the alert testing workflow:
 * 1. Seed baseline historical data
 * 2. Inject anomaly data
 * 3. Trigger alert evaluation
 *
 * Design Principles:
 * - Orchestration Layer: Coordinates between services, no business logic
 * - Dependency Inversion: Depends on service interfaces, not concrete implementations
 * - Explicit Flow: Clear 3-step process with validation between steps
 *
 * MVP Scope (Locked):
 * - Uses GoogleAdsSeederService (existing)
 * - Uses AlertEngine (new)
 * - No HTTP calls, no JWT handling
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ToolkitPlatform } from '../domain/platform.types';
import { GoogleAdsSeederService, SeederConfig } from './google-ads-seeder.service';
import { AlertEngine, AlertCheckResult, MetricSnapshot } from './alert-engine.service';
import { IProgressReporter, NoOpProgressReporter } from './google-ads-seeder.service';
import { TOKENS } from '../core/container';
import { safeConversionRate, safeCpc, safeCtr, safeRoas } from '../../utils/math-safety.util';

// =============================================================================
// Domain Types
// =============================================================================

export interface AlertScenarioConfig {
    readonly tenantId: string;
    readonly days: number;
    readonly injectAnomaly: boolean;
    readonly autoCreateCampaigns: boolean;
}

export interface AnomalyConfig {
    readonly metric: 'spend' | 'conversions' | 'ctr' | 'roas';
    readonly type: 'SPIKE' | 'DROP' | 'ZERO';
    readonly magnitude: number; // Multiplier or absolute value
}

export interface AlertScenarioResult {
    readonly success: boolean;
    readonly status: 'completed' | 'no_campaigns' | 'error';
    readonly message: string;
    readonly data?: {
        readonly tenantId: string;
        readonly seedResult: {
            readonly seededCount: number;
            readonly campaignCount: number;
            readonly dateRange: { readonly start: string; readonly end: string };
        };
        readonly anomalyInjected: boolean;
        readonly alertCheck: AlertCheckResult;
    };
    readonly error?: string;
}

// =============================================================================
// Service Implementation
// =============================================================================

@injectable()
export class AlertScenarioService {
    constructor(
        @inject(GoogleAdsSeederService) private readonly seederService: GoogleAdsSeederService,
        @inject(AlertEngine) private readonly alertEngine: AlertEngine,
        @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient,
    ) { }

    /**
     * Execute complete alert scenario workflow
     *
     * Step 1: Seed baseline historical data
     * Step 2: Inject anomaly data (if requested)
     * Step 3: Trigger alert evaluation
     */
    async execute(
        config: AlertScenarioConfig,
        progressReporter: IProgressReporter = new NoOpProgressReporter()
    ): Promise<AlertScenarioResult> {
        try {
            // =====================================================================
            // Step 1: Seed Baseline Historical Data
            // =====================================================================
            const seedConfig: SeederConfig = {
                days: config.days,
                platform: ToolkitPlatform.GoogleAds,
                seedSource: 'alert_scenario_baseline',
            };

            const seedResult = await this.seederService.seed(
                config.tenantId,
                seedConfig,
                progressReporter
            );

            if (!seedResult.success) {
                return {
                    success: false,
                    status: 'error',
                    message: `Step 1 failed: ${seedResult.message}`,
                    error: seedResult.error,
                };
            }

            if (seedResult.status === 'no_campaigns') {
                if (!config.autoCreateCampaigns) {
                    return {
                        success: true,
                        status: 'no_campaigns',
                        message: 'No campaigns found. Enable autoCreateCampaigns to create dummy campaigns.',
                    };
                }
                // Auto-create would happen here in full implementation
                // For MVP, return no_campaigns status
                return {
                    success: true,
                    status: 'no_campaigns',
                    message: 'No campaigns found (auto-create not implemented in MVP).',
                };
            }

            // =====================================================================
            // Step 2: Inject Anomaly (if requested)
            // =====================================================================
            const dateRange = {
                start: new Date(seedResult.data?.dateRange.start || ''),
                end: new Date(seedResult.data?.dateRange.end || ''),
            };
            let anomalyInjected = false;
            if (config.injectAnomaly && seedResult.data) {
                anomalyInjected = await this.injectAnomaly(
                    config.tenantId,
                    dateRange.start,
                    dateRange.end,
                    seedConfig.seedSource,
                );
            }

            // =====================================================================
            // Step 3: Trigger Alert Evaluation
            // =====================================================================
            // Build evaluation context
            const evaluationContext: import('./alert-engine.service').EvaluationContext = {
                tenantId: config.tenantId,
                dateRange,
                dryRun: false,
            };

            // Build metric snapshots from real seeded data
            const snapshots = await this.loadLatestSnapshots(
                config.tenantId,
                dateRange.start,
                dateRange.end,
                seedConfig.seedSource,
            );
            const baselines = await this.loadBaselines(
                config.tenantId,
                dateRange.start,
                dateRange.end,
                seedConfig.seedSource,
            );
            const rules = await this.loadAlertRules(config.tenantId);
            const activeRules = rules.length > 0
                ? rules
                : [
                    this.createSampleRule('zero_conversions'),
                    this.createSampleRule('high_spend'),
                ];

            // Evaluate alerts
            const evaluationResult = this.alertEngine.evaluateCheck(
                snapshots,
                activeRules,
                evaluationContext,
                baselines,
            );

            // Map to legacy AlertCheckResult format for backward compatibility
            const alertCheck: import('./alert-engine.service').AlertCheckResult = {
                success: true,
                triggeredAlerts: evaluationResult.triggeredAlerts,
                evaluatedAt: evaluationResult.evaluatedAt,
                metadata: {
                    snapshotsEvaluated: snapshots.length,
                    totalRulesEvaluated: evaluationResult.metadata.enabledRules,
                    totalRulesTriggered: evaluationResult.metadata.triggeredCount,
                    durationMs: evaluationResult.metadata.durationMs,
                },
            };

            return {
                success: true,
                status: 'completed',
                message: 'Alert scenario completed successfully',
                data: {
                    tenantId: config.tenantId,
                    seedResult: {
                        seededCount: seedResult.data?.seededCount ?? 0,
                        campaignCount: seedResult.data?.campaignCount ?? 0,
                        dateRange: seedResult.data?.dateRange ?? { start: '', end: '' },
                    },
                    anomalyInjected,
                    alertCheck,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                status: 'error',
                message: 'Alert scenario failed',
                error: errorMessage,
            };
        }
    }

    async assertSchemaParity(): Promise<void> {
        await this.seederService.assertSchemaParity();
    }

    private async injectAnomaly(
        tenantId: string,
        start: Date,
        end: Date,
        source: string,
    ): Promise<boolean> {
        const latestMetric = await this.prisma.metric.findFirst({
            where: {
                tenantId,
                isMockData: true,
                source,
                date: { gte: start, lte: end },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        });

        if (!latestMetric) {
            return false;
        }

        const spend = Number(latestMetric.spend);
        const bumpedSpend = Math.max(spend * 1.6, spend + 100);
        const clicks = latestMetric.clicks;
        const impressions = latestMetric.impressions;
        const conversions = 0;
        const revenue = 0;

        await this.prisma.metric.update({
            where: { id: latestMetric.id },
            data: {
                spend: bumpedSpend,
                conversions,
                revenue,
                orders: 0,
                ctr: safeCtr(clicks, impressions),
                costPerClick: safeCpc(bumpedSpend, clicks),
                conversionRate: safeConversionRate(conversions, clicks),
                roas: safeRoas(revenue, bumpedSpend),
                source: `${source}:anomaly`,
            },
        });

        return true;
    }

    private async loadLatestSnapshots(
        tenantId: string,
        start: Date,
        end: Date,
        source: string,
    ): Promise<MetricSnapshot[]> {
        const rows = await this.prisma.metric.findMany({
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: source },
                date: { gte: start, lte: end },
            },
            orderBy: [{ campaignId: 'asc' }, { date: 'desc' }, { createdAt: 'desc' }],
            take: 5000,
        });

        const latestByCampaign = new Map<string, typeof rows[number]>();
        for (const row of rows) {
            if (!latestByCampaign.has(row.campaignId)) {
                latestByCampaign.set(row.campaignId, row);
            }
        }

        return Array.from(latestByCampaign.values()).map((row) => ({
            tenantId: row.tenantId,
            campaignId: row.campaignId,
            date: row.date,
            platform: row.platform,
            metrics: {
                impressions: row.impressions,
                clicks: row.clicks,
                conversions: row.conversions,
                spend: Number(row.spend),
                revenue: Number(row.revenue),
                ctr: Number(row.ctr),
                cpc: Number(row.costPerClick),
                cvr: Number(row.conversionRate),
                roas: Number(row.roas),
            },
        }));
    }

    private async loadBaselines(
        tenantId: string,
        start: Date,
        end: Date,
        source: string,
    ): Promise<Map<string, import('./alert-engine.service').BaselineSnapshot>> {
        const rows = await this.prisma.metric.findMany({
            where: {
                tenantId,
                isMockData: true,
                source: { startsWith: source },
                date: { gte: start, lte: end },
            },
            orderBy: [{ campaignId: 'asc' }, { date: 'asc' }, { createdAt: 'asc' }],
            take: 5000,
        });

        const earliestByCampaign = new Map<string, typeof rows[number]>();
        for (const row of rows) {
            if (!earliestByCampaign.has(row.campaignId)) {
                earliestByCampaign.set(row.campaignId, row);
            }
        }

        const baselines = new Map<string, import('./alert-engine.service').BaselineSnapshot>();
        for (const [campaignId, row] of earliestByCampaign.entries()) {
            baselines.set(campaignId, {
                metrics: {
                    impressions: row.impressions,
                    clicks: row.clicks,
                    conversions: row.conversions,
                    spend: Number(row.spend),
                    revenue: Number(row.revenue),
                    ctr: Number(row.ctr),
                    cpc: Number(row.costPerClick),
                    cvr: Number(row.conversionRate),
                    roas: Number(row.roas),
                },
                dateRange: { start, end },
            });
        }

        return baselines;
    }

    private async loadAlertRules(
        tenantId: string,
    ): Promise<import('./alert-engine.service').AlertRule[]> {
        const rows = await this.prisma.alertRule.findMany({
            where: {
                tenantId,
                isActive: true,
            },
            orderBy: [{ createdAt: 'asc' }],
            take: 1000,
        });

        const output: import('./alert-engine.service').AlertRule[] = [];
        for (const row of rows) {
            const metric = this.mapMetricKey(row.metric);
            if (!metric) {
                continue;
            }

            const condition = row.alertType === 'ANOMALY'
                ? {
                    type: 'DROP_PERCENT' as const,
                    metric,
                    thresholdPercent: Number(row.threshold),
                }
                : {
                    type: 'THRESHOLD' as const,
                    metric,
                    operator: this.mapOperator(row.operator),
                    value: Number(row.threshold),
                };

            output.push({
                id: row.id,
                name: row.name,
                enabled: row.isActive,
                condition,
                severity: this.mapSeverity(row.severity),
            });
        }

        return output;
    }

    private mapMetricKey(
        metric: string,
    ): keyof MetricSnapshot['metrics'] | null {
        const normalized = metric.trim().toLowerCase();
        const directMap: Record<string, keyof MetricSnapshot['metrics']> = {
            impressions: 'impressions',
            clicks: 'clicks',
            conversions: 'conversions',
            spend: 'spend',
            revenue: 'revenue',
            ctr: 'ctr',
            cpc: 'cpc',
            cost_per_click: 'cpc',
            conversion_rate: 'cvr',
            cvr: 'cvr',
            roas: 'roas',
        };
        return directMap[normalized] ?? null;
    }

    private mapOperator(
        operator: string,
    ): 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ' {
        const normalized = operator.trim().toUpperCase();
        const mapping: Record<string, 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ'> = {
            '>': 'GT',
            'GT': 'GT',
            '>=': 'GTE',
            'GTE': 'GTE',
            '<': 'LT',
            'LT': 'LT',
            '<=': 'LTE',
            'LTE': 'LTE',
            '=': 'EQ',
            '==': 'EQ',
            'EQ': 'EQ',
        };
        return mapping[normalized] ?? 'GT';
    }

    private mapSeverity(
        severity: string,
    ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
        const normalized = severity.trim().toUpperCase();
        if (normalized === 'INFO') return 'LOW';
        if (normalized === 'WARNING') return 'MEDIUM';
        if (normalized === 'CRITICAL') return 'CRITICAL';
        return 'HIGH';
    }

    /**
     * Create a sample alert rule for testing
     * Helper method for setting up test scenarios
     */
    createSampleRule(
        type: 'high_spend' | 'zero_conversions' | 'low_roas'
    ): import('./alert-engine.service').AlertRule {
        const baseRule = {
            id: `sample-${type}`,
            name: `Sample ${type.replace('_', ' ')}`,
            enabled: true,
        };

        switch (type) {
            case 'high_spend':
                return {
                    ...baseRule,
                    severity: 'HIGH',
                    condition: {
                        type: 'THRESHOLD',
                        metric: 'spend',
                        operator: 'GT',
                        value: 10000,
                    },
                };
            case 'zero_conversions':
                return {
                    ...baseRule,
                    severity: 'CRITICAL',
                    condition: {
                        type: 'ZERO_CONVERSIONS',
                        minSpend: 5000,
                    },
                };
            case 'low_roas':
                return {
                    ...baseRule,
                    severity: 'MEDIUM',
                    condition: {
                        type: 'THRESHOLD',
                        metric: 'roas',
                        operator: 'LT',
                        value: 1.0,
                    },
                };
            default:
                throw new Error(`Unknown rule type: ${type}`);
        }
    }
}
