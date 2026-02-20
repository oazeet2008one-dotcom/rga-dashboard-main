import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import {
    ICommand,
    ICommandHandler,
    ICommandMetadata,
    IExecutionContext,
    Result,
    createCommandName,
    ILogger,
    ToolkitError
} from '../core/contracts';
import { TOKENS } from '../core/container';
import {
    executeWithManifest,
    ManifestBuilder,
    CommandPipelineResult,
    ManifestStatus,
    ExitCode,
} from '../manifest';
import { ScenarioLoader } from '../scenarios/scenario-loader';
import { VerificationService } from '../../modules/verification/verification.service';
import { ReportWriter } from '../../modules/verification/report-writer';
import { VerificationSummary } from '../../modules/verification/types';
import { getDefaultOutputRoot } from '../core/output-path-policy';

// =============================================================================
// COMMAND DTO
// =============================================================================

export interface VerifyScenarioParams {
    scenarioId: string;
    tenantId: string;
    runId?: string; // Optional override
    outputDir?: string; // Optional (default: cwd or artifacts)
    dryRun?: boolean;
}

export class VerifyScenarioCommand implements ICommand {
    readonly name = createCommandName('verify-scenario');
    readonly description = 'Verify scenario data integrity and business rules';
    readonly requiresConfirmation = false; // Read-only mostly

    constructor(public readonly params: VerifyScenarioParams) { }
}

export interface VerifyScenarioResult {
    reportPath: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    summary: VerifyScenarioSummary | null;
}

export interface VerifyScenarioSummary {
    status: VerificationSummary['status'];
    passed: number;
    failed: number;
    warnings: number;
}

class VerifyError extends ToolkitError {
    constructor(message: string, public readonly code = 'VERIFY_ERROR', public readonly isRecoverable = false) {
        super(message);
    }
}

// =============================================================================
// HANDLER
// =============================================================================

@injectable()
export class VerifyScenarioCommandHandler implements ICommandHandler<VerifyScenarioCommand> {
    constructor(
        @inject(TOKENS.Logger) private readonly logger: ILogger,
        @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient,
        @inject(ScenarioLoader) private readonly scenarioLoader: ScenarioLoader,
        @inject(TOKENS.VerificationService)
        private readonly verificationService: VerificationService,
        @inject(TOKENS.ReportWriter)
        private readonly reportWriter: ReportWriter,
    ) {}

    getMetadata(): ICommandMetadata {
        return {
            name: 'verify-scenario',
            displayName: 'Verify Scenario',
            description: 'Verifies data integrity and business rules for a seeded scenario',
            icon: '[V]',
            category: 'diagnostics',
            estimatedDurationSeconds: 5,
            risks: ['Read-only analysis', 'Writes report file to disk'],
        };
    }

    validate(command: VerifyScenarioCommand): Result<void> {
        if (!command.params.scenarioId) return Result.failure(new VerifyError('Scenario ID is required'));
        if (!command.params.tenantId) return Result.failure(new VerifyError('Tenant ID is required'));
        return Result.success(undefined);
    }

    canHandle(command: ICommand): command is VerifyScenarioCommand {
        return command.name === 'verify-scenario';
    }

    async execute(command: VerifyScenarioCommand, context: IExecutionContext): Promise<Result<VerifyScenarioResult>> {
        const params = {
            ...command.params,
            dryRun: context.dryRun,
        };

        const result = await this.runWithManifest(params);

        if (result.status === 'BLOCKED') {
            return Result.failure(new VerifyError(`Verification Failed with status ${result.status}`, 'VERIFY_BLOCKED'));
        }

        if (result.status === 'FAILED' && result.exitCode !== 10) {
            return Result.failure(new VerifyError(`Verification Command Failed with exit code ${result.exitCode}`, 'VERIFY_ERROR'));
        }

        const fsWrites = result.manifest?.results?.filesystemWrites?.pathsMasked || [];
        const reportPath = fsWrites[0] || 'unknown';

        const verifySummary = result.manifest?.steps?.find((step) => step.name === 'VERIFY')?.summary;
        const parsedSummary = this.parseVerifySummary(verifySummary);
        let verifyStatus: 'PASS' | 'FAIL' | 'WARN' = 'PASS';
        if (parsedSummary) {
            verifyStatus = parsedSummary.status;
        } else if (result.exitCode === 10) {
            verifyStatus = 'FAIL';
        } else if (result.manifest?.status === 'SUCCESS') {
            verifyStatus = 'PASS';
        }

        return Result.success({
            reportPath,
            status: verifyStatus,
            summary: parsedSummary,
        });
    }

    // -------------------------------------------------------------------------
    // Manifest Orchestration
    // -------------------------------------------------------------------------

    async runWithManifest(
        params: VerifyScenarioParams,
        manifestDir?: string,
    ): Promise<CommandPipelineResult> {
        return executeWithManifest({
            config: {
                executionMode: 'CLI',
                type: 'VERIFY',
                commandName: 'verify-scenario',
                commandClassification: 'READ',
                args: { ...params },
                flags: {
                    dryRun: Boolean(params.dryRun),
                    noDryRun: !params.dryRun,
                    force: false,
                    yes: false,
                    verbose: true,
                    manifestDir: manifestDir ?? null,
                    seed: null,
                    scenario: params.scenarioId,
                },
            },
            manifestDir,
            execute: async (builder: ManifestBuilder) => {
                return this.executeCore(builder, params);
            },
        });
    }

    private async executeCore(
        builder: ManifestBuilder,
        params: VerifyScenarioParams,
    ): Promise<{ status: ManifestStatus; exitCode: ExitCode }> {
        const { scenarioId, tenantId, outputDir, dryRun } = params;
        const manifestTenant = await this.resolveTenantForManifest(tenantId);
        builder.setTenant(manifestTenant);
        if (manifestTenant.tenantResolution === 'FAILED') {
            builder.addWarning(`Tenant metadata lookup failed for tenantId=${tenantId}.`);
        }

        // 1. Load Scenario
        const loadStep = builder.startStep('LOAD_SCENARIO');
        try {
            await this.scenarioLoader.load(scenarioId);
            loadStep.close({ status: 'SUCCESS', summary: `Loaded scenario ${scenarioId}` });
        } catch (e: any) {
            loadStep.close({ status: 'FAILED', summary: e.message, error: { code: 'LOAD_FAIL', message: e.message, isRecoverable: false } });
            return { status: 'BLOCKED', exitCode: 2 };
        }

        // 2. Execute Verification
        const verifyStep = builder.startStep('VERIFY');

        let reportFile = '';
        let verifyResult;

        try {
            verifyResult = await this.verificationService.verifyScenario({
                scenarioId,
                tenantId,
                runId: builder.getRunId(),
            });

            if (verifyResult.summary.status === 'WARN') {
                builder.addWarning(
                    `Verification returned WARN (${verifyResult.summary.warnings} warning checks, 0 failures).`,
                );
            }

            verifyStep.close({
                status: verifyResult.summary.status === 'FAIL' ? 'FAILED' : 'SUCCESS',
                summary: `Verification ${verifyResult.summary.status}: ${verifyResult.summary.passed} passed, ${verifyResult.summary.failed} failed, ${verifyResult.summary.warnings} warnings.`,
                metrics: {
                    recordsAffectedActual: 0,
                    recordsAffectedEstimate: 0,
                    entitiesTouched: [],
                }
            });

        } catch (e: any) {
            verifyStep.close({ status: 'FAILED', summary: e.message, error: { code: 'sys-err', message: e.message, isRecoverable: false } });
            return { status: 'FAILED', exitCode: 1 };
        }

        // 3. Write Report
        const reportStep = builder.startStep('EXECUTE');
        try {
            if (!dryRun) {
                const out = outputDir || getDefaultOutputRoot('report');
                reportFile = await this.reportWriter.writeReport(verifyResult, out);
                reportStep.close({
                    status: 'SUCCESS',
                    summary: `Written report to ${reportFile}`
                });

                builder.setResults({
                    filesystemWrites: { count: 1, pathsMasked: [reportFile] }
                });
            } else {
                reportStep.close({ status: 'SKIPPED', summary: 'Dry run - report write skipped' });
            }

        } catch (e: any) {
            reportStep.close({ status: 'FAILED', summary: e.message });
            return { status: 'FAILED', exitCode: 1 };
        }

        const finalStatus = verifyResult.summary.status === 'FAIL' ? 'FAILED' : 'SUCCESS';
        const finalExitCode = verifyResult.summary.status === 'FAIL' ? 10 : 0;

        return { status: finalStatus, exitCode: finalExitCode as ExitCode };
    }

    private async resolveTenantForManifest(tenantId: string): Promise<{
        tenantId: string;
        tenantSlug: string | null;
        tenantDisplayName: string | null;
        tenantResolution: 'EXPLICIT' | 'FAILED';
    }> {
        try {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true, slug: true, name: true },
            });

            if (!tenant) {
                return {
                    tenantId,
                    tenantSlug: null,
                    tenantDisplayName: null,
                    tenantResolution: 'FAILED',
                };
            }

            return {
                tenantId: tenant.id,
                tenantSlug: tenant.slug ?? null,
                tenantDisplayName: tenant.name ?? null,
                tenantResolution: 'EXPLICIT',
            };
        } catch {
            return {
                tenantId,
                tenantSlug: null,
                tenantDisplayName: null,
                tenantResolution: 'FAILED',
            };
        }
    }

    private parseVerifySummary(summaryText: string | undefined): VerifyScenarioSummary | null {
        if (!summaryText) {
            return null;
        }

        const match = summaryText.match(
            /^Verification (PASS|FAIL|WARN):\s*(\d+)\s+passed,\s*(\d+)\s+failed,\s*(\d+)\s+warnings\.?$/i,
        );
        if (!match) {
            return null;
        }

        return {
            status: match[1].toUpperCase() as VerifyScenarioSummary['status'],
            passed: Number.parseInt(match[2], 10),
            failed: Number.parseInt(match[3], 10),
            warnings: Number.parseInt(match[4], 10),
        };
    }
}
