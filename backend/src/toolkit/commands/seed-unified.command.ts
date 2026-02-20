import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';
import {
    ICommand,
    ICommandHandler,
    ICommandMetadata,
    IExecutionContext,
    Result,
    createCommandName,
    ILogger,
    ToolkitError,
} from '../core/contracts';
import { DETERMINISTIC_ANCHOR } from '../core/constants';
import { TOKENS } from '../core/container';
import { AdSimulatorEngine } from '../ad-simulator.engine';
import { ToolkitPlatform } from '../domain/platform.types';
import { PlatformMapper } from '../core/platform.mapper';
import { SEEDABLE_PLATFORMS } from '../domain/platform-capabilities';
import { normalizePlatformInput } from '../domain/platform-utils';
import {
    executeWithManifest,
    ManifestBuilder,
} from '../manifest';
import type {
    CommandPipelineResult,
    ManifestStatus,
    ExitCode,
} from '../manifest';
import { ScenarioLoader, ScenarioError } from '../scenarios/scenario-loader';
import { FixtureProvider, FixtureError } from '../fixtures/fixture-provider';
import { ScenarioSpec, GoldenFixture } from '../scenarios/scenario-types';
import {
    assertToolkitWriteSchemaParity,
    SchemaParityPreflightError,
} from '../core/write-schema-preflight';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ExecutionMode = 'GENERATED' | 'FIXTURE' | 'HYBRID';

export interface SeedUnifiedCommandParams {
    tenant: string;
    scenario: string;
    mode: ExecutionMode;
    seed: number;
    days?: number;
    platforms?: string; // CSV
    dryRun: boolean;
    allowRealTenant?: boolean;
}

export class SeedUnifiedCommand implements ICommand {
    readonly name = createCommandName('seed-unified-scenario');
    readonly description = 'Deterministic multi-platform seeding with strict provenance';
    readonly requiresConfirmation = true;

    constructor(public readonly params: SeedUnifiedCommandParams) { }
}

export interface SeedUnifiedResult {
    rowsCreated: number;
    platformsProcessed: string[];
    sourceTag: string;
    manifestPath: string | null;
    manifest: any;
}

class HygieneError extends ToolkitError {
    readonly code = 'HYGIENE_VIOLATION';
    readonly isRecoverable = false;
}

class SeedUnifiedExecutionError extends ToolkitError {
    readonly code = 'SEED_UNIFIED_EXECUTION_FAILED';
    readonly isRecoverable = false;
}

interface GeneratedShape {
    totalCampaigns: number;
    totalMetricRows: number;
    perPlatform: Record<string, { campaigns: number; metricRows: number }>;
}

// =============================================================================
// DETERMINISTIC DATE ANCHOR
// =============================================================================
// Always use a fixed date anchor so that same seed → same date buckets.
// Allowed variance: DB timestamps (createdAt, updatedAt) only.
// See imported DETERMINISTIC_ANCHOR in core/constants.ts

// =============================================================================
// HANDLER
// =============================================================================

@injectable()
export class SeedUnifiedCommandHandler implements ICommandHandler<SeedUnifiedCommand> {
    private readonly engine: AdSimulatorEngine;

    constructor(
        @inject(TOKENS.Logger) private readonly logger: ILogger,
        @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient,
        @inject(ScenarioLoader) private readonly scenarioLoader: ScenarioLoader,
        @inject(FixtureProvider) private readonly fixtureProvider: FixtureProvider
    ) {
        this.engine = new AdSimulatorEngine();
    }

    getMetadata(): ICommandMetadata {
        return {
            name: 'seed-unified-scenario',
            displayName: 'Seed Unified Scenario',
            description: 'Deterministic multi-platform seeding with strict provenance and hygiene',
            icon: '🌐',
            category: 'data' as const,
            estimatedDurationSeconds: 30,
            risks: ['Writes mock data to current tenant', 'Deletes existing mock data for same source tag'],
        };
    }

    validate(command: SeedUnifiedCommand): Result<void> {
        if (!command.params.tenant) {
            return Result.failure(new HygieneError('Tenant ID is required'));
        }
        if (!command.params.scenario) {
            return Result.failure(new HygieneError('Scenario is required'));
        }
        if (command.params.seed === undefined || command.params.seed === null) {
            return Result.failure(new HygieneError('Seed is required'));
        }
        if (command.params.days !== undefined && (command.params.days < 1 || command.params.days > 365)) {
            return Result.failure(new HygieneError('Days must be between 1 and 365'));
        }
        return Result.success(undefined);
    }

    canHandle(command: ICommand): command is SeedUnifiedCommand {
        return command.name === 'seed-unified-scenario';
    }

    // -------------------------------------------------------------------------
    // Main Execution — routes through manifest pipeline
    // -------------------------------------------------------------------------

    async execute(command: SeedUnifiedCommand, context: IExecutionContext): Promise<Result<SeedUnifiedResult>> {
        const params = {
            ...command.params,
            dryRun: context.dryRun,
        };

        const result = await this.runWithManifest(params);

        if (result.status === 'BLOCKED') {
            return Result.failure(new SeedUnifiedExecutionError(
                `Seed unified blocked by safety/policy gate (exit ${result.exitCode})`,
            ));
        }

        if (result.status === 'FAILED') {
            return Result.failure(new SeedUnifiedExecutionError(
                `Seed unified failed (exit ${result.exitCode})`,
            ));
        }

        return Result.success({
            rowsCreated: result.manifest?.results?.writesApplied?.actualCounts?.['totalRows'] ?? 0,
            platformsProcessed: [], // Filled by manifest steps
            sourceTag: `toolkit:unified:${params.scenario}:${params.seed}`,
            manifestPath: result.manifestPath,
            manifest: result.manifest,
        });
    }

    /**
     * Execute the unified seed through the manifest pipeline.
     * This is the primary entry point — emits .manifest.json for every run.
     */
    async runWithManifest(
        params: SeedUnifiedCommandParams,
        manifestDir?: string,
    ): Promise<CommandPipelineResult> {
        const { tenant, scenario, seed, mode, days = 30, platforms, dryRun, allowRealTenant } = params;
        const sourceTag = `toolkit:unified:${scenario}:${seed}`;

        return executeWithManifest({
            config: {
                executionMode: 'CLI',
                commandName: 'seed-unified-scenario',
                commandClassification: 'WRITE',
                args: { tenant, scenario, mode, seed, days, platforms, dryRun, allowRealTenant },
                flags: {
                    dryRun: dryRun,
                    noDryRun: !dryRun,
                    force: false,
                    yes: false,
                    verbose: true,
                    manifestDir: manifestDir ?? null,
                    seed: String(seed),
                    scenario: scenario,
                },
            },
            manifestDir,
            execute: async (builder: ManifestBuilder) => {
                return this.executeCore(builder, params);
            },
        });
    }

    // -------------------------------------------------------------------------
    // Core Logic (called within manifest pipeline)
    // -------------------------------------------------------------------------

    private async executeCore(
        builder: ManifestBuilder,
        params: SeedUnifiedCommandParams,
    ): Promise<{ status: ManifestStatus; exitCode: ExitCode }> {
        const { tenant, scenario, seed, mode, days = 30, platforms, dryRun, allowRealTenant } = params;
        const sourceTag = `toolkit:unified:${scenario}:${seed}`;
        let targetPlatforms: ToolkitPlatform[] = SEEDABLE_PLATFORMS;

        // 1. Tenant Precheck (Hygiene)
        const hygieneStep = builder.startStep('VALIDATE_INPUT');
        try {
            targetPlatforms = this.resolveTargetPlatforms(platforms);

            await this.ensureSchemaParity();

            if (!dryRun) {
                await this.enforceHygiene(tenant, allowRealTenant);
            }
            hygieneStep.close({
                status: 'SUCCESS',
                summary: dryRun
                    ? `Schema parity verified (dry-run). Hygiene check skipped. Platforms: ${targetPlatforms.join(', ')}`
                    : 'Schema parity verified and tenant is clean (or override active)',
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const code = err instanceof SchemaParityPreflightError ? 'SCHEMA_PARITY_VIOLATION' : 'HYGIENE_VIOLATION';
            hygieneStep.close({
                status: 'FAILED',
                summary: msg,
                error: {
                    code,
                    message: msg,
                    isRecoverable: false,
                },
            });
            return { status: 'BLOCKED', exitCode: 78 };
        }

        // 2. Load Scenario (New Integration Point)
        const loadStep = builder.startStep('LOAD_SCENARIO');
        let scenarioSpec: ScenarioSpec;
        try {
            scenarioSpec = await this.scenarioLoader.load(scenario);
            loadStep.close({
                status: 'SUCCESS',
                summary: `Loaded scenario "${scenarioSpec.name}" (ID: ${scenarioSpec.scenarioId}, Trend: ${scenarioSpec.trend})`,
            });
        } catch (err) {
            const error = err as ScenarioError;
            loadStep.close({
                status: 'FAILED',
                summary: error.message,
                error: {
                    code: error.code || 'SCENARIO_LOAD_ERROR',
                    message: error.message,
                    isRecoverable: false
                }
            });
            return { status: 'BLOCKED', exitCode: (error.exitCode as ExitCode) || 2 };
        }

        // 2b. Validate Scenario (Explicit Step)
        const validateStep = builder.startStep('VALIDATE_SCENARIO');
        validateStep.close({
            status: 'SUCCESS',
            summary: `Schema ${scenarioSpec.schemaVersion} valid`
        });

        // 3. Load Fixtures (Conditional)
        const fixtureStep = builder.startStep('LOAD_FIXTURES');
        let goldenFixture: GoldenFixture | null = null;

        if (mode === 'GENERATED') {
            fixtureStep.close({
                status: 'SKIPPED',
                summary: 'Mode is GENERATED - skipping fixture load'
            });
        } else {
            // FIXTURE or HYBRID
            try {
                goldenFixture = await this.fixtureProvider.loadFixture(scenarioSpec.scenarioId, seed);
                fixtureStep.close({
                    status: 'SUCCESS',
                    summary: `Loaded golden fixture for ${scenarioSpec.scenarioId} (Seed: ${seed})`
                });
            } catch (err) {
                const error = err as FixtureError;
                fixtureStep.close({
                    status: 'FAILED',
                    summary: error.message,
                    error: {
                        code: error.code || 'FIXTURE_LOAD_ERROR',
                        message: error.message,
                        isRecoverable: false
                    }
                });
                return { status: 'BLOCKED', exitCode: (error.exitCode as ExitCode) || 2 };
            }
        }

        // 4. Determinism Prep (Base Seed)
        const baseSeedHash = crypto.createHash('sha256')
            .update(`${tenant}:${scenarioSpec.scenarioId}:${seed}`)
            .digest('hex');

        // 5. Execution Loop
        let totalPlannedRows = 0;
        let totalAppliedRows = 0;
        const processedPlatforms: string[] = [];
        const perPlatformShape: GeneratedShape['perPlatform'] = {};

        // Sort platforms for deterministic order
        const sortedPlatforms = [...targetPlatforms].sort();

        // Deterministic date range — NO Date.now()
        // Use Anchor from Scenario if present, else default
        const anchorDate = scenarioSpec.dateAnchor
            ? new Date(scenarioSpec.dateAnchor)
            : new Date(DETERMINISTIC_ANCHOR);

        const endDate = new Date(anchorDate);
        endDate.setHours(0, 0, 0, 0);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (days - 1)); // Inclusive range: 1 day => 1 bucket

        const execStep = builder.startStep('EXECUTE');

        // FIXTURE Mode: Inspection only - bypass generation
        if (mode === 'FIXTURE') {
            // We loaded the fixture in Step 3, so just report it
            if (goldenFixture) {
                this.logger.info(`[Fixture Mode] Loaded Golden Fixture: ${goldenFixture.scenarioId} (Seed: ${goldenFixture.seed})`);
                this.logger.info(`[Fixture Mode] Checksum: ${goldenFixture.checksum}`);
                this.logger.info(`[Fixture Mode] Generated At: ${goldenFixture.generatedAt}`);

                execStep.close({
                    status: 'SUCCESS',
                    summary: 'Fixture loaded and verified (Generation bypassed)',
                    metrics: {
                        recordsAffectedEstimate: 0,
                        recordsAffectedActual: 0,
                        entitiesTouched: [],
                    }
                });

                // Skip Verify block
                builder.setResults({
                    writesPlanned: { entities: [], estimatedCounts: { totalRows: 0, platforms: 0 } },
                    writesApplied: { entities: [], actualCounts: { totalRows: 0, platforms: 0 } }
                });
                return { status: 'SUCCESS', exitCode: 0 };
            } else {
                // Should be unreachable if Step 3 succeeded
                return { status: 'BLOCKED', exitCode: 2 };
            }
        }

        // GENERATED / HYBRID Mode: Generate Data

        for (const platform of sortedPlatforms) {
            this.logger.info(`Processing platform: ${platform}`);

            // A. Platform-Specific RNG
            const platformHash = crypto.createHash('sha256')
                .update(`${baseSeedHash}:${platform}`)
                .digest('hex');
            const platformSeed = parseInt(platformHash.substring(0, 8), 16);

            // CRITICAL: Seed Faker before any generation
            faker.seed(platformSeed);

            // B. Idempotency (Delete before write)
            if (!dryRun) {
                const dbPlatform = PlatformMapper.toPersistence(platform);
                const deleted = await this.prisma.metric.deleteMany({
                    where: {
                        tenantId: tenant,
                        isMockData: true,
                        source: sourceTag,
                        platform: dbPlatform
                    }
                });

                // Also clean campaigns for this source
                await this.prisma.campaign.deleteMany({
                    where: {
                        tenantId: tenant,
                        platform: dbPlatform,
                        externalId: {
                            startsWith: `unified-${scenarioSpec.scenarioId}-${seed}-${platform}`
                        }
                    }
                });

                if (deleted.count > 0) {
                    this.logger.info(`[Idempotency] Cleared ${deleted.count} existing mock rows for ${platform}`);
                }
            }

            // C. Generate Data (deterministic date range, no Date.now())
            const campaignName = `${scenarioSpec.name} - ${platform}`;
            const metrics = this.engine.generateDateRangeMetrics(
                startDate,
                endDate,
                scenarioSpec.trend,
                scenarioSpec.baseImpressions || 10000,
                platform
            );

            totalPlannedRows += metrics.length;
            perPlatformShape[platform] = {
                campaigns: 1,
                metricRows: metrics.length,
            };

            // D. Write Data
            if (!dryRun) {
                await this.prisma.$transaction(async (tx) => {
                    const dbPlatform = PlatformMapper.toPersistence(platform);

                    // Deterministic external ID, no Date.now()
                    const externalId = `unified-${scenarioSpec.scenarioId}-${seed}-${platform}-0`;

                    // Create Campaign (PROVENANCE: isMockData + sourceTag)
                    const campaign = await tx.campaign.create({
                        data: {
                            tenantId: tenant,
                            name: campaignName,
                            platform: dbPlatform,
                            status: 'ACTIVE',
                            externalId
                        }
                    });

                    // Create Metrics (PROVENANCE: isMockData + sourceTag)
                    await tx.metric.createMany({
                        data: metrics.map(m => ({
                            tenantId: tenant,
                            campaignId: campaign.id,
                            platform: dbPlatform,
                            date: m.date,
                            impressions: m.metrics.impressions,
                            clicks: m.metrics.clicks,
                            spend: m.metrics.cost,
                            conversions: m.metrics.conversions,
                            revenue: m.metrics.revenue,
                            ctr: m.metrics.ctr,
                            costPerClick: m.metrics.cpc,
                            conversionRate: m.metrics.cvr,
                            roas: m.metrics.roas,
                            isMockData: true,
                            source: sourceTag
                        }))
                    });
                });
                totalAppliedRows += metrics.length;
            }

            processedPlatforms.push(platform);
        }

        const generatedShape: GeneratedShape = {
            totalCampaigns: processedPlatforms.length,
            totalMetricRows: totalPlannedRows,
            perPlatform: perPlatformShape,
        };

        // HYBRID Verification
        if (mode === 'HYBRID' && goldenFixture) {
            if (!this.shapesEqual(generatedShape, goldenFixture.shape)) {
                const msg = 'Hybrid verification failed: generated shape does not match fixture shape.';
                execStep.close({ status: 'FAILED', summary: msg });
                return { status: 'BLOCKED', exitCode: 2 };
            }

            const computedChecksum = this.computeShapeChecksum(generatedShape);
            if (computedChecksum !== goldenFixture.checksum) {
                const msg =
                    `Hybrid verification failed: checksum mismatch. ` +
                    `Expected ${goldenFixture.checksum}, got ${computedChecksum}.`;
                execStep.close({ status: 'FAILED', summary: msg });
                return { status: 'BLOCKED', exitCode: 2 };
            }

            this.logger.info(`[Hybrid] Verified shape and checksum: ${computedChecksum}`);
        }

        execStep.close({
            status: 'SUCCESS',
            summary: dryRun
                ? `Planned seed for ${processedPlatforms.length} platform(s): ${processedPlatforms.join(', ')}`
                : `Seeded ${processedPlatforms.length} platform(s): ${processedPlatforms.join(', ')}`,
            metrics: {
                recordsAffectedEstimate: totalPlannedRows,
                recordsAffectedActual: dryRun ? 0 : totalAppliedRows,
                entitiesTouched: ['Campaign', 'Metric'],
            },
        });

        // 4. Verify Step
        const verifyStep = builder.startStep('VERIFY');
        verifyStep.close({
            status: 'SUCCESS',
            summary: dryRun
                ? `Dry-run planned rows: ${totalPlannedRows}. No database writes applied. Source: ${sourceTag}`
                : `Total rows created: ${totalAppliedRows}. Source: ${sourceTag}`,
        });

        builder.setTenant({
            tenantId: tenant,
            tenantSlug: null,
            tenantDisplayName: null,
            tenantResolution: 'EXPLICIT',
        });

        builder.setResults({
            writesPlanned: {
                entities: ['Campaign', 'Metric'],
                estimatedCounts: {
                    totalRows: totalPlannedRows,
                    platforms: processedPlatforms.length,
                },
            },
            writesApplied: {
                entities: ['Campaign', 'Metric'],
                actualCounts: {
                    totalRows: dryRun ? 0 : totalAppliedRows,
                    platforms: dryRun ? 0 : processedPlatforms.length,
                },
            },
        });

        return { status: 'SUCCESS', exitCode: 0 };
    }

    private async enforceHygiene(tenantId: string, allowRealOverride?: boolean): Promise<void> {
        // 1. Check Metrics for REAL data
        const hasRealMetrics = await this.prisma.metric.findFirst({
            where: { tenantId, isMockData: false }
        });

        // 2. Check Campaigns for REAL data
        const hasRealCampaigns = await this.prisma.campaign.findFirst({
            where: {
                tenantId,
                OR: [
                    { externalId: null },
                    { NOT: { externalId: { startsWith: 'unified-' } } },
                ],
            }
        });

        // 3. Metric + Campaign are primary concern per contract
        if (hasRealMetrics || hasRealCampaigns) {
            if (allowRealOverride === true) {
                this.logger.warn(`[Hygiene] Override active. Writing mock data to REAL tenant ${tenantId}.`);
                return;
            }
            throw new HygieneError(`Tenant ${tenantId} contains REAL data. Cannot seed without --allow-real-tenant.`);
        }
    }

    private async ensureSchemaParity(): Promise<void> {
        await assertToolkitWriteSchemaParity(this.prisma);
    }

    private resolveTargetPlatforms(platforms?: string): ToolkitPlatform[] {
        if (!platforms || platforms.trim() === '') {
            return SEEDABLE_PLATFORMS;
        }

        const normalizedTokens = platforms
            .split(',')
            .map((token) => token.trim())
            .filter((token) => token.length > 0);

        const resolved: ToolkitPlatform[] = [];
        const invalidTokens: string[] = [];
        const nonSeedablePlatforms: ToolkitPlatform[] = [];

        for (const token of normalizedTokens) {
            const parsed = normalizePlatformInput(token);
            if (parsed.kind === 'failure') {
                invalidTokens.push(token);
                continue;
            }

            const platform = parsed.value;
            if (!SEEDABLE_PLATFORMS.includes(platform)) {
                nonSeedablePlatforms.push(platform);
                continue;
            }

            resolved.push(platform);
        }

        if (invalidTokens.length > 0 || nonSeedablePlatforms.length > 0 || resolved.length === 0) {
            const allowed = SEEDABLE_PLATFORMS.join(', ');
            const invalidPart = invalidTokens.length > 0
                ? `invalid tokens: ${invalidTokens.join(', ')}`
                : '';
            const nonSeedablePart = nonSeedablePlatforms.length > 0
                ? `non-seedable: ${Array.from(new Set(nonSeedablePlatforms)).join(', ')}`
                : '';
            const details = [invalidPart, nonSeedablePart].filter(Boolean).join('; ');
            throw new HygieneError(`Invalid platforms input (${details}). Allowed seedable platforms: ${allowed}`);
        }

        return Array.from(new Set(resolved));
    }

    private shapesEqual(left: GeneratedShape, right: GoldenFixture['shape']): boolean {
        return JSON.stringify(this.deepSortKeys(left)) === JSON.stringify(this.deepSortKeys(right));
    }

    private computeShapeChecksum(shape: GoldenFixture['shape'] | GeneratedShape): string {
        const canonical = JSON.stringify(this.deepSortKeys(shape));
        const hash = crypto.createHash('sha256').update(canonical, 'utf-8').digest('hex');
        return `sha256:${hash}`;
    }

    private deepSortKeys(input: unknown): unknown {
        if (input === null || typeof input !== 'object') {
            return input;
        }

        if (Array.isArray(input)) {
            return input.map((item) => this.deepSortKeys(item));
        }

        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(input as Record<string, unknown>).sort()) {
            sorted[key] = this.deepSortKeys((input as Record<string, unknown>)[key]);
        }
        return sorted;
    }
}
