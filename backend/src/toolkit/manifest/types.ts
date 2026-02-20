/**
 * =============================================================================
 * Run Manifest Types — Domain Model
 * =============================================================================
 *
 * Matches RUN_MANIFEST_SCHEMA.json v1.0.0.
 * All fields are typed — no `any` allowed.
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MANIFEST_SCHEMA_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Enums (string unions for JSON compatibility)
// ---------------------------------------------------------------------------

export type ManifestStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'CANCELLED';
export type ExitCode = 0 | 1 | 2 | 10 | 78 | 126 | 130;
export type ExecutionMode = 'CLI' | 'INTERNAL_API';
export type CommandClassification = 'READ' | 'WRITE' | 'DESTRUCTIVE';
export type ConfirmationTier = 'NONE' | 'STANDARD' | 'DESTRUCTIVE' | 'HARD_RESET';
export type ConfirmationMethod =
    | 'NONE'
    | 'PROMPT_YN'
    | 'TYPE_RESET'
    | 'TYPE_TENANT_SLUG'
    | 'AUTO_YES'
    | 'AUTO_FORCE'
    | 'DENIED_NON_TTY'
    | 'DENIED_USER';
export type GateReasonCode = 'ALLOWED' | 'BLOCKED_ENV' | 'BLOCKED_HOST' | 'UNKNOWN_HOST' | 'MISSING_ENV';
export type EnvClassification = 'ALLOWED' | 'BLOCKED' | 'MISSING';
export type DbClassification = 'SAFE' | 'UNSAFE' | 'UNKNOWN';
export type TenantResolution = 'EXPLICIT' | 'DEFAULT' | 'FAILED' | 'NOT_ATTEMPTED';
export type StepName = 'SAFETY_CHECK' | 'LOAD_SCENARIO' | 'VALIDATE_SCENARIO' | 'LOAD_FIXTURES' | 'VALIDATE_INPUT' | 'CONFIRMATION' | 'PLAN' | 'EXECUTE' | 'VERIFY' | 'VERIFY_LITE';
export type StepStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED';

// ---------------------------------------------------------------------------
// Sub-objects
// ---------------------------------------------------------------------------

export interface ManifestRuntime {
    readonly toolkitVersion: string;
    readonly nodeVersion: string;
    readonly os: string;
    readonly pid: number;
}

export interface ManifestFlags {
    readonly dryRun: boolean;
    readonly noDryRun: boolean;
    readonly force: boolean;
    readonly yes: boolean;
    readonly verbose: boolean;
    readonly manifestDir: string | null;
    readonly seed: string | null;
    readonly scenario: string | null;
}

export interface ManifestConfirmation {
    readonly tierUsed: ConfirmationTier;
    readonly confirmationMethod: ConfirmationMethod;
    readonly confirmed: boolean;
}

export interface ManifestInvocation {
    readonly commandName: string;
    readonly commandClassification: CommandClassification;
    readonly args: Record<string, unknown>;
    readonly flags: ManifestFlags;
    readonly confirmation: ManifestConfirmation;
}

export interface ManifestGate {
    readonly name: string;
    readonly passed: boolean;
    readonly reasonCode: GateReasonCode;
    readonly reasonMessage: string;
}

export interface ManifestEnvSummary {
    readonly toolkitEnv: string | null;
    readonly classification: EnvClassification;
}

export interface ManifestDbSafetySummary {
    readonly dbHostMasked: string;
    readonly dbNameMasked: string;
    readonly classification: DbClassification;
    readonly matchedRule: string | null;
}

export interface ManifestSafety {
    readonly policyVersion: string;
    readonly gates: ManifestGate[];
    readonly envSummary: ManifestEnvSummary;
    readonly dbSafetySummary: ManifestDbSafetySummary;
}

export interface ManifestTenant {
    readonly tenantId: string;
    readonly tenantSlug: string | null;
    readonly tenantDisplayName: string | null;
    readonly tenantResolution: TenantResolution;
}

export interface StepMetrics {
    readonly recordsAffectedEstimate: number | null;
    readonly recordsAffectedActual: number | null;
    readonly entitiesTouched: string[];
}

export interface SanitizedError {
    readonly code: string;
    readonly message: string;
    readonly isRecoverable: boolean;
}

export interface ManifestStep {
    readonly stepId: string;
    readonly name: StepName;
    readonly startedAt: string;
    readonly finishedAt: string;
    readonly durationMs: number;
    readonly status: StepStatus;
    readonly summary: string;
    readonly metrics: StepMetrics | null;
    readonly error: SanitizedError | null;
}

export interface ManifestWritesCounts {
    readonly entities: string[];
    readonly estimatedCounts?: Record<string, number>;
    readonly actualCounts?: Record<string, number>;
}

export interface ManifestExternalCalls {
    readonly count: number;
    readonly endpointsMasked: string[];
}

export interface ManifestFilesystemWrites {
    readonly count: number;
    readonly pathsMasked: string[];
}

export interface ManifestResults {
    readonly writesPlanned: ManifestWritesCounts | null;
    readonly writesApplied: ManifestWritesCounts | null;
    readonly externalCalls: ManifestExternalCalls | null;
    readonly filesystemWrites: ManifestFilesystemWrites | null;
    readonly warnings: string[];
    readonly errors: SanitizedError[];
}

// ---------------------------------------------------------------------------
// Top-Level Document
// ---------------------------------------------------------------------------

export interface ManifestDocument {
    readonly schemaVersion: string;
    readonly runId: string;
    readonly startedAt: string;
    readonly finishedAt: string;
    readonly durationMs: number;
    readonly status: ManifestStatus;
    readonly exitCode: ExitCode;
    readonly executionMode: ExecutionMode;
    readonly tty: boolean;
    readonly type?: string; // e.g. 'VERIFY', 'SEED'
    readonly runtime?: ManifestRuntime;

    readonly invocation: ManifestInvocation;
    readonly safety: ManifestSafety;
    readonly tenant: ManifestTenant;
    readonly steps: ManifestStep[];
    readonly results: ManifestResults;
}
