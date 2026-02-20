/**
 * =============================================================================
 * Manifest Builder — In-Memory Accumulator
 * =============================================================================
 *
 * Mutable builder pattern. Only written to disk at FINALIZE via ManifestWriter.
 * Follows MANIFEST_LIFECYCLE.md §1 phases: INIT → SAFETY → PIPELINE → FINALIZE.
 *
 * Key design:
 * - Default status = BLOCKED (fail-closed; upgraded only on success)
 * - Steps are appended sequentially; step handles track timing
 * - finalize() applies redaction + truncation, freezes, and returns document
 * =============================================================================
 */

import { randomUUID } from 'crypto';
import {
    ManifestDocument,
    ManifestInvocation,
    ManifestSafety,
    ManifestTenant,
    ManifestResults,
    ManifestStep,
    ManifestStatus,
    ManifestRuntime,
    ManifestFlags,
    ManifestConfirmation,
    ExitCode,
    ExecutionMode,
    StepName,
    StepStatus,
    StepMetrics,
    SanitizedError,
    MANIFEST_SCHEMA_VERSION,
    CommandClassification,
} from './types';
import {
    truncate,
    limitArray,
    sanitizeError,
    redactArgs,
    TRUNCATION_LIMITS,
} from './redactor';

// ---------------------------------------------------------------------------
// Step Handle
// ---------------------------------------------------------------------------

export interface IStepHandle {
    close(params: {
        status: StepStatus;
        summary: string;
        metrics?: StepMetrics;
        error?: SanitizedError;
    }): void;
}

class StepHandle implements IStepHandle {
    private readonly startTime: number = Date.now();
    private closed = false;

    constructor(
        private readonly stepId: string,
        private readonly name: StepName,
        private readonly onClose: (step: ManifestStep) => void,
    ) { }

    close(params: {
        status: StepStatus;
        summary: string;
        metrics?: StepMetrics;
        error?: SanitizedError;
    }): void {
        if (this.closed) return;
        this.closed = true;

        const finishedAt = new Date();
        const durationMs = Date.now() - this.startTime;

        this.onClose({
            stepId: this.stepId,
            name: this.name,
            startedAt: new Date(this.startTime).toISOString(),
            finishedAt: finishedAt.toISOString(),
            durationMs,
            status: params.status,
            summary: truncate(params.summary, TRUNCATION_LIMITS.STEP_SUMMARY),
            metrics: params.metrics ?? null,
            error: params.error ?? null,
        });
    }
}

// ---------------------------------------------------------------------------
// Init Config
// ---------------------------------------------------------------------------

export interface ManifestInitConfig {
    readonly runId?: string;
    readonly type?: string;
    readonly executionMode: ExecutionMode;
    readonly commandName: string;
    readonly commandClassification: CommandClassification;
    readonly args?: Record<string, unknown>;
    readonly flags?: Partial<ManifestFlags>;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export class ManifestBuilder {
    private runId: string;
    private readonly startedAt: string;
    private readonly startMs: number;
    private executionMode: ExecutionMode;
    private tty: boolean;
    private type?: string;
    private runtime: ManifestRuntime | undefined;
    private status: ManifestStatus = 'BLOCKED'; // fail-closed default
    private exitCode: ExitCode = 78;            // safety block default

    private invocation: ManifestInvocation;
    private safety: ManifestSafety | null = null;
    private tenant: ManifestTenant = {
        tenantId: 'UNRESOLVED',
        tenantSlug: null,
        tenantDisplayName: null,
        tenantResolution: 'NOT_ATTEMPTED',
    };

    private steps: ManifestStep[] = [];
    private stepCounter = 0;

    private results: ManifestResults = {
        writesPlanned: null,
        writesApplied: null,
        externalCalls: null,
        filesystemWrites: null,
        warnings: [],
        errors: [],
    };

    private finalized = false;

    constructor(config: ManifestInitConfig) {
        this.runId = config.runId || randomUUID();
        this.startMs = Date.now();
        this.startedAt = new Date(this.startMs).toISOString();
        this.executionMode = config.executionMode;
        this.type = config.type;
        this.tty = !!(process.stdout && process.stdout.isTTY);
        this.runtime = {
            toolkitVersion: '2.0.0',
            nodeVersion: process.version,
            os: process.platform,
            pid: process.pid,
        };

        const defaultFlags: ManifestFlags = {
            dryRun: true,
            noDryRun: false,
            force: false,
            yes: false,
            verbose: false,
            manifestDir: null,
            seed: null,
            scenario: null,
        };

        const defaultConfirmation: ManifestConfirmation = {
            tierUsed: 'NONE',
            confirmationMethod: 'NONE',
            confirmed: false,
        };

        this.invocation = {
            commandName: config.commandName,
            commandClassification: config.commandClassification,
            args: redactArgs(config.args ?? {}),
            flags: { ...defaultFlags, ...config.flags },
            confirmation: defaultConfirmation,
        };
    }

    getRunId(): string {
        return this.runId;
    }

    // -----------------------------------------------------------------------
    // Setters
    // -----------------------------------------------------------------------

    setSafety(safety: ManifestSafety): void {
        if (this.finalized) return;
        this.safety = safety;
    }

    setTenant(tenant: ManifestTenant): void {
        if (this.finalized) return;
        this.tenant = tenant;
    }

    setConfirmation(confirmation: ManifestConfirmation): void {
        if (this.finalized) return;
        this.invocation = {
            ...this.invocation,
            confirmation,
        };
    }

    setResults(results: Partial<ManifestResults>): void {
        if (this.finalized) return;
        this.results = { ...this.results, ...results };
    }

    addWarning(warning: string): void {
        if (this.finalized) return;
        if (this.results.warnings.length < TRUNCATION_LIMITS.MAX_WARNINGS) {
            this.results = {
                ...this.results,
                warnings: [
                    ...this.results.warnings,
                    truncate(warning, TRUNCATION_LIMITS.ERROR_MESSAGE),
                ],
            };
        }
    }

    addError(error: unknown): void {
        if (this.finalized) return;
        if (this.results.errors.length < TRUNCATION_LIMITS.MAX_ERRORS) {
            this.results = {
                ...this.results,
                errors: [...this.results.errors, sanitizeError(error)],
            };
        }
    }

    // -----------------------------------------------------------------------
    // Step Tracking
    // -----------------------------------------------------------------------

    startStep(name: StepName): IStepHandle {
        this.stepCounter++;
        const stepId = `step-${String(this.stepCounter).padStart(3, '0')}`;
        return new StepHandle(stepId, name, (step) => {
            if (!this.finalized) {
                this.steps.push(step);
            }
        });
    }

    // -----------------------------------------------------------------------
    // Finalize
    // -----------------------------------------------------------------------

    finalize(status: ManifestStatus, exitCode: ExitCode): ManifestDocument {
        if (this.finalized) {
            // Return same doc — idempotent (use stored values, ignore new args)
            return this.buildDocument(this.status, this.exitCode);
        }
        this.finalized = true;
        this.status = status;
        this.exitCode = exitCode;

        return this.buildDocument(status, exitCode);
    }

    /**
     * Emergency finalize — used by crash handlers.
     * Uses the current accumulated state without further mutations.
     */
    emergencyFinalize(): ManifestDocument {
        if (this.finalized) {
            return this.buildDocument(this.status, this.exitCode);
        }
        this.finalized = true;
        // Keep default BLOCKED/78 or whatever was set so far
        return this.buildDocument(this.status, this.exitCode);
    }

    isFinalized(): boolean {
        return this.finalized;
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    private buildDocument(status: ManifestStatus, exitCode: ExitCode): ManifestDocument {
        const finishedAt = new Date();
        const durationMs = finishedAt.getTime() - this.startMs;

        // Apply truncation to arrays
        const warningsResult = limitArray(this.results.warnings, TRUNCATION_LIMITS.MAX_WARNINGS, 'warnings');
        const errorsResult = limitArray(this.results.errors, TRUNCATION_LIMITS.MAX_ERRORS, 'errors');

        const truncatedWarnings = warningsResult.items;
        if (warningsResult.truncatedWarning) {
            truncatedWarnings.push(warningsResult.truncatedWarning);
        }

        const safetySummary: ManifestSafety = this.safety ?? {
            policyVersion: '1.0.0',
            gates: [],
            envSummary: { toolkitEnv: null, classification: 'MISSING' },
            dbSafetySummary: {
                dbHostMasked: 'UNKNOWN',
                dbNameMasked: 'UNKNOWN',
                classification: 'UNKNOWN',
                matchedRule: null,
            },
        };

        const doc: ManifestDocument = {
            schemaVersion: MANIFEST_SCHEMA_VERSION,
            runId: this.runId,
            startedAt: this.startedAt,
            finishedAt: finishedAt.toISOString(),
            durationMs,
            status,
            exitCode,
            executionMode: this.executionMode,
            type: this.type,
            tty: this.tty,
            runtime: this.runtime,

            invocation: this.invocation,
            safety: safetySummary,
            tenant: this.tenant,
            steps: this.steps,
            results: {
                ...this.results,
                warnings: truncatedWarnings,
                errors: errorsResult.items,
            },
        };

        return doc;
    }
}
