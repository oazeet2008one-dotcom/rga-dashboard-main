/**
 * =============================================================================
 * Alert Scenario Command Handler
 * =============================================================================
 *
 * Handles the execution of AlertScenarioCommand.
 * Orchestrates between the service layer and presentation layer.
 *
 * Design Principles:
 * - Single Responsibility: Only handles command execution flow
 * - Dependency Inversion: Depends on AlertScenarioService abstraction
 * - Separation of Concerns: Service does business logic, handler does orchestration
 *
 * MVP Scope (Locked):
 * - 3-step workflow: seed → inject anomaly → trigger check
 * - Progress reporting via IProgressReporter
 * - No HTTP calls, no direct DB access
 * =============================================================================
 */

import { injectable, inject } from 'tsyringe';
import cliProgress from 'cli-progress';
import { ICommandHandler, IExecutionContext, Result, ILogger } from '../core/contracts';
import { BaseCommandHandler, IBaseCommandHandlerDeps } from './base-command';
import {
    AlertScenarioCommand,
    ALERT_SCENARIO_COMMAND,
} from './definitions/alert-scenario.command';
import {
    AlertScenarioService,
    AlertScenarioResult,
} from '../services/alert-scenario.service';
import { IProgressReporter } from '../services/google-ads-seeder.service';
import { TOKENS } from '../core/container';
// Imports removed

// ============================================================================
// Progress Reporter for CLI
// ============================================================================

class CliProgressReporter implements IProgressReporter {
    private bar: cliProgress.SingleBar;

    constructor() {
        this.bar = new cliProgress.SingleBar(
            {
                format: 'Step {step} |{bar}| {percentage}% | {message}',
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
        this.bar.start(total, 0, { step: '1/3', message: '' });
    }

    update(current: number, message?: string): void {
        this.bar.update(current, { message: message || '' });
    }

    stop(): void {
        this.bar.stop();
        console.log(''); // Newline after progress bar
    }
}

// ============================================================================
// Handler Implementation
// ============================================================================

@injectable()
export class AlertScenarioCommandHandler
    extends BaseCommandHandler<AlertScenarioCommand, AlertScenarioResult>
    implements ICommandHandler<AlertScenarioCommand, AlertScenarioResult> {
    readonly commandName = ALERT_SCENARIO_COMMAND;

    private readonly scenarioService: AlertScenarioService;

    constructor(
        @inject(TOKENS.Logger) logger: ILogger,
        @inject(AlertScenarioService) scenarioService: AlertScenarioService
    ) {
        super({ logger });
        this.scenarioService = scenarioService;
    }

    canHandle(command: unknown): command is AlertScenarioCommand {
        return (
            typeof command === 'object' &&
            command !== null &&
            'name' in command &&
            command.name === ALERT_SCENARIO_COMMAND
        );
    }

    getMetadata() {
        return {
            name: ALERT_SCENARIO_COMMAND,
            displayName: 'Run Alert Scenario',
            description: 'Seed baseline data, inject anomalies, and trigger alert evaluation',
            icon: '🚨',
            category: 'testing' as const,
            estimatedDurationSeconds: 45,
            risks: [
                'Creates mock data in database',
                'May trigger alert notifications',
                'Modifies campaign metrics',
            ],
        };
    }

    validate(command: AlertScenarioCommand): Result<void> {
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
        command: AlertScenarioCommand,
        context: IExecutionContext
    ): Promise<Result<AlertScenarioResult>> {
        this.logger.info('Starting alert scenario', {
            tenantId: command.tenantId,
            seedBaseline: command.seedBaseline,
            injectAnomaly: command.injectAnomaly,
            days: command.days,
            dryRun: context.dryRun,
        });

        await this.scenarioService.assertSchemaParity();

        if (context.dryRun) {
            this.logger.info('Dry run mode - skipping actual execution');
            return {
                kind: 'success',
                value: {
                    success: true,
                    status: 'completed',
                    message: 'Dry run completed - no data was modified',
                    data: {
                        tenantId: command.tenantId,
                        seedResult: {
                            seededCount: 0,
                            campaignCount: 0,
                            dateRange: { start: '', end: '' },
                        },
                        anomalyInjected: false,
                        alertCheck: {
                            success: true,
                            triggeredAlerts: [],
                            evaluatedAt: new Date(),
                            metadata: {
                                snapshotsEvaluated: 0,
                                totalRulesEvaluated: 0,
                                totalRulesTriggered: 0,
                                durationMs: 0,
                            },
                        },
                    },
                },
            };
        }

        const progressReporter = new CliProgressReporter();

        const result = await this.scenarioService.execute(
            {
                tenantId: command.tenantId,
                days: command.days,
                injectAnomaly: command.injectAnomaly,
                autoCreateCampaigns: false, // MVP: no auto-create
            },
            progressReporter
        );

        if (result.success) {
            this.logger.info('Alert scenario completed', {
                status: result.status,
                seedCount: result.data?.seedResult.seededCount ?? 0,
                anomalyInjected: result.data?.anomalyInjected ?? false,
                alertsTriggered: result.data?.alertCheck.triggeredAlerts.length ?? 0,
            });

            return { kind: 'success', value: result };
        } else {
            const error = new Error(result.message);
            this.logger.error('Alert scenario failed', error, {
                status: result.status,
                detail: result.error,
            });
            return {
                kind: 'failure',
                error: {
                    name: 'AlertScenarioError',
                    code: result.status === 'no_campaigns' ? 'NO_CAMPAIGNS' : 'SCENARIO_FAILED',
                    message: result.message,
                    isRecoverable: result.status === 'no_campaigns',
                },
            };
        }
    }
} 
