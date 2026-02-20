/**
 * =============================================================================
 * Google Ads Seeder Service
 * =============================================================================
 * 
 * Business logic for seeding Google Ads historical data.
 * Separated from presentation layer for testability and reusability.
 * 
 * Design Principles:
 * - Single Responsibility: Handles only seeding logic
 * - Dependency Inversion: Depends on abstractions (IProgressReporter)
 * - Pure Functions: Date calculation is deterministic and testable
 * - Idempotency: Deletes existing seed data before inserting
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { PrismaClient, Prisma, AdPlatform, Campaign } from '@prisma/client';
import { PROVENANCE } from '../../common/provenance.constants';
import {
    AdSimulatorEngine,
    DailyMetrics,
} from '../ad-simulator.engine';
import { safeFloat } from '../../utils/math-safety.util';
import { TOKENS } from '../core/container';
import { ILogger } from '../core/contracts';
import { ToolkitPlatform } from '../domain/platform.types';
import { PlatformMapper } from '../core/platform.mapper';
import { assertToolkitWriteSchemaParity } from '../core/write-schema-preflight';

// ============================================================================
// Domain Types
// ============================================================================

export interface SeederConfig {
    readonly days: number;
    readonly platform: ToolkitPlatform;
    readonly seedSource: string;
}

export interface SeederResult {
    readonly success: boolean;
    readonly status: 'completed' | 'no_campaigns' | 'error';
    readonly message: string;
    readonly data?: {
        readonly tenantId: string;
        readonly tenantName: string;
        readonly seededCount: number;
        readonly campaignCount: number;
        readonly dateRange: {
            readonly start: string;
            readonly end: string;
        };
        readonly campaigns: ReadonlyArray<{
            readonly id: string;
            readonly name: string;
            readonly rowsCreated: number;
            readonly trendProfile: string;
        }>;
    };
    readonly error?: string;
}

export interface IProgressReporter {
    start(total: number, initialMessage?: string): void;
    update(current: number, message?: string): void;
    stop(): void;
}

// ============================================================================
// No-op Reporter (for testing/non-interactive mode)
// ============================================================================

export class NoOpProgressReporter implements IProgressReporter {
    start(): void { }
    update(): void { }
    stop(): void { }
}

// ============================================================================
// Service Implementation
// ============================================================================

@injectable()
export class GoogleAdsSeederService {
    private readonly engine: AdSimulatorEngine;

    constructor(
        @inject(TOKENS.Logger) private readonly logger: ILogger,
        @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
    ) {
        this.engine = new AdSimulatorEngine();
    }

    /**
     * Seeds historical Google Ads data for a tenant
     * 
     * Process:
     * 1. Find all campaigns for the given platform
     * 2. Calculate date range
     * 3. For each campaign, generate metrics using AdSimulatorEngine
     * 4. Batch insert metrics with idempotency (delete existing first)
     */
    async seed(
        tenantId: string,
        config: SeederConfig,
        progressReporter: IProgressReporter = new NoOpProgressReporter()
    ): Promise<SeederResult> {
        try {
            await this.assertSchemaParity();

            // Map ToolkitPlatform -> AdPlatform for DB Query
            const dbPlatform = PlatformMapper.toPersistence(config.platform);

            // Step 0: Validate Tenant
            const tenant = await this.validateTenant(tenantId);
            if (!tenant) {
                return {
                    success: false,
                    status: 'error',
                    message: `Tenant ${tenantId} not found`,
                };
            }

            // Step 1: Calculate date range
            const dateRange = this.calculateDateRange(config.days);

            // Step 2: Find campaigns
            const campaigns = await this.findCampaigns(tenantId, dbPlatform);

            if (campaigns.length === 0) {
                return {
                    success: true,
                    status: 'no_campaigns',
                    message: `No campaigns found for platform ${config.platform}`,
                    data: {
                        tenantId: tenant.id,
                        tenantName: tenant.name,
                        seededCount: 0,
                        campaignCount: 0,
                        dateRange: {
                            start: dateRange.start.toISOString().slice(0, 10),
                            end: dateRange.end.toISOString().slice(0, 10),
                        },
                        campaigns: [],
                    },
                };
            }

            // Step 4: Seed metrics
            const seedResult = await this.seedMetrics(
                campaigns,
                dateRange,
                config,
                progressReporter
            );

            return {
                success: true,
                status: 'completed',
                message: `Successfully seeded ${seedResult.totalSeeded} rows for ${campaigns.length} campaigns.`,
                data: {
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    seededCount: seedResult.totalSeeded,
                    campaignCount: campaigns.length,
                    dateRange: {
                        start: dateRange.start.toISOString().slice(0, 10),
                        end: dateRange.end.toISOString().slice(0, 10),
                    },
                    campaigns: seedResult.campaigns,
                },
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                status: 'error',
                message: 'Seeding failed',
                error: errorMessage,
            };
        }
    }

    async assertSchemaParity(): Promise<void> {
        await assertToolkitWriteSchemaParity(this.prisma);
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    private async validateTenant(tenantId: string): Promise<{ id: string; name: string } | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true },
        });
        return tenant;
    }

    private calculateDateRange(days: number): { start: Date; end: Date } {
        const now = new Date();
        const todayUtc = this.toUtcDateOnly(now);
        const endDate = this.addUtcDays(todayUtc, -1); // Yesterday
        const startDate = this.addUtcDays(todayUtc, -days);

        return { start: startDate, end: endDate };
    }

    private async findCampaigns(tenantId: string, platform: AdPlatform): Promise<Array<{ id: string; tenantId: string; name: string }>> {
        return this.prisma.campaign.findMany({
            where: {
                tenantId,
                platform,
            },
            select: {
                id: true,
                tenantId: true,
                name: true,
            },
        });
    }

    private async seedMetrics(
        campaigns: Array<{ id: string; tenantId: string; name: string }>,
        dateRange: { start: Date; end: Date },
        config: SeederConfig,
        progressReporter: IProgressReporter
    ): Promise<{ totalSeeded: number; campaigns: Array<{ id: string; name: string; rowsCreated: number; trendProfile: string }> }> {
        const totalDays = this.calculateDaysBetween(dateRange.start, dateRange.end);
        const totalWork = campaigns.length * totalDays;

        progressReporter.start(totalWork);

        const seededCampaigns: Array<{ id: string; name: string; rowsCreated: number; trendProfile: string }> = [];
        let totalSeededCount = 0;
        let progressCount = 0;

        for (const campaign of campaigns) {
            // Idempotency: Delete existing seed data
            await this.prisma.metric.deleteMany({
                where: {
                    campaignId: campaign.id,
                    platform: config.platform,
                    source: config.seedSource,
                    date: { gte: dateRange.start, lte: dateRange.end },
                },
            });

            // Generate metrics
            const trendProfile = this.getRandomTrendProfile();
            const baseImpressions = this.randomBaseImpressions();

            const simulatedData = this.engine.generateDateRangeMetrics(
                dateRange.start,
                dateRange.end,
                trendProfile,
                baseImpressions,
                config.platform
            );

            // Build rows
            const rows: Prisma.MetricCreateManyInput[] = simulatedData.map(({ date, metrics }) => {
                progressCount++;
                progressReporter.update(progressCount, campaign.name.slice(0, 20));

                return this.buildMetricRow(campaign, date, metrics, config);
            });

            // Batch insert
            const createResult = await this.prisma.metric.createMany({ data: rows });

            seededCampaigns.push({
                id: campaign.id,
                name: campaign.name,
                rowsCreated: createResult.count,
                trendProfile,
            });

            totalSeededCount += createResult.count;
        }

        progressReporter.stop();

        return { totalSeeded: totalSeededCount, campaigns: seededCampaigns };
    }

    private buildMetricRow(
        campaign: { id: string; tenantId: string; name: string },
        date: Date,
        metrics: DailyMetrics,
        config: SeederConfig
    ): Prisma.MetricCreateManyInput {
        return {
            tenantId: campaign.tenantId,
            campaignId: campaign.id,
            date,
            platform: config.platform,
            source: PROVENANCE.SOURCE_TOOLKIT_GADS,
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            conversions: metrics.conversions,
            orders: metrics.conversions,
            spend: new Prisma.Decimal(safeFloat(metrics.cost).toFixed(2)),
            revenue: new Prisma.Decimal(safeFloat(metrics.revenue).toFixed(2)),
            averageOrderValue: new Prisma.Decimal(safeFloat(metrics.aov).toFixed(2)),
            ctr: new Prisma.Decimal(safeFloat(metrics.ctr).toFixed(4)),
            costPerClick: new Prisma.Decimal(safeFloat(metrics.cpc).toFixed(4)),
            conversionRate: new Prisma.Decimal(safeFloat(metrics.cvr).toFixed(4)),
            roas: new Prisma.Decimal(safeFloat(metrics.roas).toFixed(4)),
            costPerMille: new Prisma.Decimal(
                safeFloat(
                    metrics.impressions > 0 ? (metrics.cost / metrics.impressions) * 1000 : 0
                ).toFixed(4)
            ),
            costPerAction: new Prisma.Decimal(
                safeFloat(
                    metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0
                ).toFixed(4)
            ),
            isMockData: true,
        };
    }

    // ========================================================================
    // Utility Methods (Pure Functions)
    // ========================================================================

    private toUtcDateOnly(date: Date): Date {
        return new Date(
            Date.UTC(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                date.getUTCDate(),
                0, 0, 0, 0
            )
        );
    }

    private addUtcDays(date: Date, days: number): Date {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() + days);
        return d;
    }

    private calculateDaysBetween(start: Date, end: Date): number {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
    }

    private getRandomTrendProfile(): 'GROWTH' | 'DECLINE' | 'STABLE' {
        const roll = Math.random();
        if (roll < 0.4) return 'GROWTH';
        if (roll < 0.7) return 'DECLINE';
        return 'STABLE';
    }

    private randomBaseImpressions(): number {
        return Math.floor(Math.random() * 1400) + 800; // 800-2200
    }
}
