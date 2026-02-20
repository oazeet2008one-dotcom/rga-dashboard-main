/**
 * =============================================================================
 * Seed Data Command
 * =============================================================================
 * 
 * Example implementation of a command using the new architecture.
 * Demonstrates: validation, dry-run support, progress reporting
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import { PrismaClient, AdPlatform } from '@prisma/client';
import { PROVENANCE } from '../../common/provenance.constants';
import {
    IExecutionContext,
    Result,
    ValidationError,
    TenantId,
    CommandName,
    createCommandName,
    ILogger,
    ICommand,
    ICommandHandler
} from '../core/contracts';
import { TOKENS } from '../core/container';
import { BaseCommand, BaseCommandHandler, IBaseCommandHandlerDeps } from './base-command';
import { AdSimulatorEngine } from '../ad-simulator.engine';
import { ToolkitPlatform } from '../domain/platform.types';
import { PlatformMapper } from '../core/platform.mapper';
import { GoogleAdsSeederService, SeederConfig } from '../services';
import { SEEDABLE_PLATFORMS } from '../domain/platform-capabilities';
import { ToolkitError } from '../core/contracts';
import { assertToolkitWriteSchemaParity } from '../core/write-schema-preflight';

class SeederError extends ToolkitError {
    readonly code = 'SEEDER_ERROR';
    readonly isRecoverable = true;
}

/**
 * Command parameters
 */
export interface SeedDataCommandParams {
    platform: ToolkitPlatform;
    days: number;
    trend: 'GROWTH' | 'DECLINE' | 'STABLE';
    injectAnomaly: boolean;
}

/**
 * Command instance
 */
export class SeedDataCommand implements ICommand {
    readonly name = createCommandName('seed-data');
    readonly description = 'Seed mock metric data for a specific platform';
    readonly requiresConfirmation = true;

    constructor(public readonly params: SeedDataCommandParams) { }
}

/**
 * Result of seeding operation
 */
export interface SeedDataResult {
    platform: ToolkitPlatform;
    campaignId: string;
    recordsCreated: number;
    dateRange: { start: Date; end: Date };
    anomalyInjected: boolean;
}

/**
 * Handler implementation
 */
@injectable()
export class SeedDataCommandHandler implements ICommandHandler<SeedDataCommand> {
    private readonly engine: AdSimulatorEngine;

    constructor(
        @inject(TOKENS.Logger) private readonly logger: ILogger,
        @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient,
        @inject(GoogleAdsSeederService) private readonly seeder: GoogleAdsSeederService
    ) {
        this.engine = new AdSimulatorEngine();
    }

    canHandle(command: ICommand): command is SeedDataCommand {
        return command.name === 'seed-data';
    }

    async execute(command: SeedDataCommand, context: IExecutionContext): Promise<Result<SeedDataResult>> {
        const { platform, days, trend, injectAnomaly } = command.params;

        this.logger.info(`Starting data seeding for ${platform}...`);
        await assertToolkitWriteSchemaParity(this.prisma);

        // Map params to SeederConfig
        const config: SeederConfig = {
            days,
            platform, // Now passed as ToolkitPlatform
            seedSource: 'cli-manual'
        };
        // Respect dry-run for all platform paths.
        if (context.dryRun) {
            this.logger.info('Dry run mode - skipping writes', {
                platform,
                days,
                trend,
                injectAnomaly,
            });
            return Result.success({
                platform,
                campaignId: 'DRY_RUN',
                recordsCreated: 0,
                dateRange: { start: new Date(), end: new Date() },
                anomalyInjected: false,
            });
        }
        // ...

        // Placeholder for actual seeding logic using the seeder service
        // This part would be implemented based on the new seeder service architecture
        // For now, we'll just log and return success.
        if (command.params.platform === ToolkitPlatform.GoogleAds) {
            const seedResult = await this.seeder.seed(context.tenantId, config);
            if (!seedResult.success) {
                return Result.failure(new SeederError(seedResult.error || seedResult.message));
            }
            // For Google Ads, the seeder service handles it. We return a summary.
            return Result.success({
                platform: command.params.platform,
                campaignId: 'multiple', // Seeder might create multiple
                recordsCreated: seedResult.data?.seededCount || 0,
                dateRange: seedResult.data?.dateRange ? {
                    start: new Date(seedResult.data.dateRange.start),
                    end: new Date(seedResult.data.dateRange.end)
                } : { start: new Date(), end: new Date() },
                anomalyInjected: false
            });
        }

        // For other platforms (simulate manually for now as fallback, or throw unsupported)
        // This part would be expanded as we add more seeders.
        return this.manualSeed(command, context);
    }

    getMetadata() {
        return {
            name: 'seed-data',
            displayName: 'Seed Single Platform (Mock)',
            description: 'Generate synthetic metric history for one selected platform',
            icon: '🌱',
            category: 'data' as const,
            estimatedDurationSeconds: 15,
            risks: ['Writes to Current Tenant DB', 'May duplicate data if run multiple times']
        };
    }

    validate(command: SeedDataCommand): Result<void> {
        const errors: { field: string; message: string }[] = [];

        if (!command.params.platform) {
            errors.push({ field: 'platform', message: 'Platform is required' });
        } else if (!SEEDABLE_PLATFORMS.includes(command.params.platform)) {
            errors.push({ field: 'platform', message: `Unsupported platform: ${command.params.platform}` });
        }

        if (command.params.days < 1 || command.params.days > 365) {
            errors.push({ field: 'days', message: 'Days must be between 1 and 365' });
        }

        if (errors.length > 0) {
            return Result.failure(new ValidationError(
                'Seed data validation failed',
                errors,
            ));
        }

        return Result.success(undefined);
    }


    private async findOrCreateCampaign(tenantId: TenantId, platform: AdPlatform) {
        const existing = await this.prisma.campaign.findFirst({
            where: {
                tenantId,
                platform,
                externalId: `toolkit-seed-${platform.toLowerCase()}`,
            },
        });

        if (existing) return existing;

        return this.prisma.campaign.create({
            data: {
                tenantId,
                name: `Toolkit Seed - ${platform}`,
                platform,
                status: 'ACTIVE',
                externalId: `toolkit-seed-${platform.toLowerCase()}`,
                budget: 100000,
                budgetType: 'DAILY',
                currency: 'THB',
            },
        });
    }

    private async injectAnomaly(
        tenantId: TenantId,
        campaignId: string,
        date: Date,
        platform: AdPlatform
    ) {
        await this.prisma.metric.create({
            data: {
                tenantId,
                campaignId,
                date,
                platform,
                source: PROVENANCE.SOURCE_TOOLKIT_SEED,
                isMockData: true,
                impressions: 100000,
                clicks: 5000,
                spend: 50000,
                conversions: 0,
                revenue: 0,
                ctr: 0.05,
                costPerClick: 10,
                conversionRate: 0,
                roas: 0,
            },
        });
    }
    private async manualSeed(command: SeedDataCommand, context: IExecutionContext): Promise<Result<SeedDataResult>> {
        const { platform, days, trend, injectAnomaly } = command.params;

        // Calculate dates
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 1); // Yesterday
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (days - 1));

        // Find or create campaign
        const dbPlatform = PlatformMapper.toPersistence(platform);
        const campaign = await this.findOrCreateCampaign(
            context.tenantId,
            dbPlatform
        );

        // Generate metrics
        const metrics = this.engine.generateDateRangeMetrics(
            startDate,
            endDate,
            trend,
            10000,
            platform // AdSimulatorEngine now accepts ToolkitPlatform
        );

        // Insert into database
        let recordsCreated = 0;
        for (const { date, metrics: m } of metrics) {
            await this.prisma.metric.create({
                data: {
                    tenantId: context.tenantId,
                    campaignId: campaign.id,
                    date,
                    platform: dbPlatform,
                    source: PROVENANCE.SOURCE_TOOLKIT_SEED,
                    impressions: m.impressions,
                    clicks: m.clicks,
                    spend: m.cost,
                    conversions: m.conversions,
                    revenue: m.revenue,
                    ctr: m.ctr,
                    costPerClick: m.cpc,
                    conversionRate: m.cvr,
                    roas: m.roas,
                    isMockData: true,
                },
            });
            recordsCreated++;
        }

        // Inject anomaly if requested
        let anomalyInjected = false;
        if (injectAnomaly) {
            await this.injectAnomaly(context.tenantId, campaign.id, endDate, dbPlatform);
            anomalyInjected = true;
            recordsCreated++;
        }

        return Result.success({
            platform,
            campaignId: campaign.id,
            recordsCreated,
            dateRange: { start: startDate, end: endDate },
            anomalyInjected,
        });
    }
}
