/**
 * =============================================================================
 * Seed Google Ads Command Handler
 * =============================================================================
 * 
 * Handles the execution of SeedGoogleAdsCommand.
 * Orchestrates between the service layer and presentation layer.
 * 
 * Design Principles:
 * - Single Responsibility: Only handles command execution flow
 * - Dependency Inversion: Depends on IGoogleAdsSeederService, not concrete class
 * - Separation of Concerns: Service does business logic, handler does orchestration
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import cliProgress from 'cli-progress';
import { ICommandHandler, IExecutionContext, Result, ILogger } from '../core/contracts';
import { BaseCommandHandler, IBaseCommandHandlerDeps } from './base-command';
import {
    SeedGoogleAdsCommand,
    SEED_GOOGLE_ADS_COMMAND,
} from './definitions/seed-google-ads.command';
import {
    GoogleAdsSeederService,
    SeederConfig,
    IProgressReporter,
    SeederResult,
} from '../services/google-ads-seeder.service';
import { ToolkitPlatform } from '../domain/platform.types';
import { TOKENS } from '../core/container';

// ============================================================================
// Progress Reporter for CLI (Implementation of IProgressReporter)
// ============================================================================

class CliProgressReporter implements IProgressReporter {
    private bar: cliProgress.SingleBar;

    constructor() {
        this.bar = new cliProgress.SingleBar(
            {
                format: 'Seeding |{bar}| {percentage}% | {campaign}',
                barCompleteChar: '█',
                barIncompleteChar: '░',
                hideCursor: true,
                clearOnComplete: false,
                stopOnComplete: true,
            },
            cliProgress.Presets.shades_classic
        );
    }

    start(total: number): void {
        this.bar.start(total, 0, { campaign: '' });
    }

    update(current: number, message?: string): void {
        this.bar.update(current, { campaign: message || '' });
    }

    stop(): void {
        this.bar.stop();
        console.log(''); // Newline after progress bar
    }
}

// ============================================================================
// Handler Implementation
// ============================================================================

export interface ISeedGoogleAdsHandlerDeps extends IBaseCommandHandlerDeps {
    readonly seederService: GoogleAdsSeederService;
}

@injectable()
export class SeedGoogleAdsCommandHandler
    extends BaseCommandHandler<SeedGoogleAdsCommand, SeederResult>
    implements ICommandHandler<SeedGoogleAdsCommand, SeederResult> {
    readonly commandName = SEED_GOOGLE_ADS_COMMAND;

    private readonly seederService: GoogleAdsSeederService;

    constructor(
        @inject(TOKENS.Logger) logger: ILogger,
        @inject(GoogleAdsSeederService) seederService: GoogleAdsSeederService
    ) {
        super({ logger });
        this.seederService = seederService;
    }

    canHandle(command: unknown): command is SeedGoogleAdsCommand {
        return (
            typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === SEED_GOOGLE_ADS_COMMAND
        );
    }

    getMetadata() {
        return {
            name: SEED_GOOGLE_ADS_COMMAND,
            displayName: 'Seed Google Ads (Legacy)',
            description: 'Seed 30 days of historical Google Ads data',
            icon: '📊',
            category: 'data' as const,
            estimatedDurationSeconds: 30,
            risks: ['Creates mock data in database'],
        };
    }

    validate(command: SeedGoogleAdsCommand): Result<void> {
        if (!command.tenantId || typeof command.tenantId !== 'string') {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'tenantId is required and must be a string',
                    isRecoverable: true,
                },
            };
        }

        if (typeof command.days !== 'number' || command.days < 1 || command.days > 365) {
            return {
                kind: 'failure',
                error: {
                    name: 'ValidationError',
                    code: 'VALIDATION_ERROR',
                    message: 'days must be a number between 1 and 365',
                    isRecoverable: true,
                },
            };
        }

        return { kind: 'success', value: undefined };
    }

    protected async executeCore(
        command: SeedGoogleAdsCommand,
        context: IExecutionContext
    ): Promise<Result<SeederResult>> {
        this.logger.info('Starting Google Ads seed', {
            tenantId: command.tenantId,
            days: command.days,
            dryRun: context.dryRun,
        });

        const config: SeederConfig = {
            days: command.days,
            platform: ToolkitPlatform.GoogleAds,
            seedSource: 'seed_google_ads_history',
        };

        await this.seederService.assertSchemaParity();

        // Use progress reporter only in interactive mode (not dry run)
        const progressReporter = context.dryRun
            ? { start: () => { }, update: () => { }, stop: () => { } }
            : new CliProgressReporter();

        if (context.dryRun) {
            this.logger.info('Dry run mode - skipping actual seeding');
            return {
                kind: 'success',
                value: {
                    success: true,
                    status: 'completed',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        tenantName: 'DRY_RUN',
                        seededCount: 0,
                        campaignCount: 0,
                        dateRange: { start: '', end: '' },
                        campaigns: [],
                    },
                },
            };
        }

        const result = await this.seederService.seed(
            command.tenantId,
            config,
            progressReporter
        );

        if (result.success) {
            this.logger.info('Google Ads seed completed', {
                status: result.status,
                seededCount: result.data?.seededCount ?? 0,
                campaignCount: result.data?.campaignCount ?? 0,
            });
            return { kind: 'success', value: result };
        } else {
            const error = new Error(result.message);
            this.logger.error('Google Ads seed failed', error, {
                status: result.status,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'SeedError',
                    code: result.status === 'no_campaigns' ? 'NO_CAMPAIGNS' : 'SEED_FAILED',
                    message: result.message,
                    isRecoverable: result.status === 'no_campaigns',
                },
            };
        }
    }
}
