/**
 * =============================================================================
 * Manifest Module — Barrel Export
 * =============================================================================
 */

// Types
export type {
    ManifestDocument,
    ManifestStatus,
    ExitCode,
    ExecutionMode,
    CommandClassification,
    ConfirmationTier,
    ConfirmationMethod,
    GateReasonCode,
    EnvClassification,
    DbClassification,
    TenantResolution,
    StepName,
    StepStatus,
    StepMetrics,
    SanitizedError,
    ManifestRuntime,
    ManifestFlags,
    ManifestConfirmation,
    ManifestInvocation,
    ManifestGate,
    ManifestEnvSummary,
    ManifestDbSafetySummary,
    ManifestSafety,
    ManifestTenant,
    ManifestResults,
    ManifestWritesCounts,
    ManifestExternalCalls,
    ManifestFilesystemWrites,
} from './types';

export { MANIFEST_SCHEMA_VERSION } from './types';

// Builder
export { ManifestBuilder, IStepHandle } from './manifest-builder';
export type { ManifestInitConfig } from './manifest-builder';

// Writer
export { ManifestWriter } from './manifest-writer';

// Redactor
export {
    isForbiddenKey,
    isSafeKey,
    maskDatabaseUrl,
    redactEnvEntry,
    redactArgs,
    redactEnv,
    truncate,
    sanitizeError,
    limitArray,
    TRUNCATION_LIMITS,
} from './redactor';

// Pipeline
export {
    executeWithManifest,
    evaluateSafetyGates,
    emergencyFinalizeAndWrite,
    getActiveBuilder,
} from './manifest-pipeline';
export type {
    CommandPipelineOptions,
    CommandPipelineResult,
    SafetyCheckResult,
} from './manifest-pipeline';
