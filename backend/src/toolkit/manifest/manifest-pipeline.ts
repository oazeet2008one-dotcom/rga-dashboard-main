/**
 * =============================================================================
 * Manifest Pipeline — Central Integration Point
 * =============================================================================
 *
 * This module provides the centralized hook that wraps command execution
 * to ensure every run (including blocked-by-safety) emits a manifest.
 *
 * The pipeline follows MANIFEST_LIFECYCLE.md phases:
 *   INIT → SAFETY → PIPELINE → FINALIZE → WRITE
 *
 * Crash handlers (SIGINT, uncaughtException, unhandledRejection) are wired
 * to emergency-finalize the manifest before process exit.
 * =============================================================================
 */

import { ManifestBuilder, ManifestInitConfig, IStepHandle } from './manifest-builder';
import { ManifestWriter } from './manifest-writer';
import { ManifestDocument, ManifestStatus, ExitCode, ManifestSafety, ManifestTenant, ManifestConfirmation, StepName } from './types';
import { maskDatabaseUrl } from './redactor';

// ---------------------------------------------------------------------------
// Global manifest reference (for crash handlers)
// ---------------------------------------------------------------------------

let activeBuilder: ManifestBuilder | null = null;

// ---------------------------------------------------------------------------
// Emergency finalize API — called by CLI crash handlers
// ---------------------------------------------------------------------------

/**
 * Returns the active builder, if any command is currently mid-execution.
 * Used by CLI crash handlers to check if an emergency finalize is needed.
 */
export function getActiveBuilder(): ManifestBuilder | null {
    return activeBuilder;
}

/**
 * Emergency finalize + synchronous write. Called from CLI crash handlers.
 *
 * Best-effort only — never throws, never alters exit codes.
 * Uses synchronous fs APIs (safe in SIGINT / uncaughtException context).
 *
 * @param signal - The signal that triggered the emergency ('SIGINT' | 'uncaughtException' | 'unhandledRejection')
 */
export function emergencyFinalizeAndWrite(signal: string): void {
    if (!activeBuilder || activeBuilder.isFinalized()) return;

    const status: ManifestStatus = signal === 'SIGINT' ? 'CANCELLED' : 'FAILED';
    const exitCode: ExitCode = signal === 'SIGINT' ? 130 : 1;

    activeBuilder.addWarning(`Emergency finalize triggered by ${signal}`);
    const doc = activeBuilder.finalize(status, exitCode);

    // Synchronous write — best effort, can't await in exit handlers
    try {
        const dir = ManifestWriter.resolveDir(doc.invocation.flags.manifestDir);
        const fs = require('fs');
        const path = require('path');

        try {
            fs.mkdirSync(dir, { recursive: true });
        } catch {
            // Can't create dir — abort manifest write
            return;
        }

        const filename = ManifestWriter.generateFilename(
            doc.runId,
            doc.invocation.commandName,
        );
        const finalPath = path.join(dir, filename);
        const serialized = ManifestWriter.serialize(doc);
        if (!serialized.json) {
            process.stderr.write(
                `[manifest] Warning: emergency manifest size ${serialized.sizeBytes} exceeds cap ${serialized.maxBytes}\n`,
            );
            activeBuilder = null;
            return;
        }

        const json = serialized.json;
        fs.writeFileSync(finalPath, json, 'utf-8');
        process.stderr.write(`[manifest] Emergency manifest written: ${finalPath}\n`);
    } catch {
        process.stderr.write(`[manifest] Warning: emergency manifest write failed\n`);
    }

    activeBuilder = null;
}

// ---------------------------------------------------------------------------
// Database URL safety helpers (re-used from spec)
// ---------------------------------------------------------------------------

const BLOCKED_HOSTS: readonly string[] = [
    '.supabase.co',
    '.supabase.com',
    '.rds.amazonaws.com',
    '.gcp.cloud',
    '.azure.com',
    '.neon.tech',
];

const ALLOWED_HOSTS: readonly string[] = [
    'localhost',
    '127.0.0.1',
    '::1',
    'host.docker.internal',
    'db',       // common docker-compose service name
    'postgres', // common docker-compose service name
];

type HostClassification = 'ALLOWED' | 'BLOCKED' | 'UNKNOWN';

function classifyHost(hostname: string, safeHosts?: string[]): { classification: HostClassification; matchedRule: string | null } {
    const lower = hostname.toLowerCase();

    // Check custom safe hosts first.
    // This is an explicit operator override for controlled DEV/STAGING targets.
    if (safeHosts) {
        for (const host of safeHosts) {
            if (lower === host.toLowerCase()) {
                return { classification: 'ALLOWED', matchedRule: `custom:${host}` };
            }
        }
    }

    // Default blocklist applies when no explicit custom allow override exists.
    for (const pattern of BLOCKED_HOSTS) {
        if (lower.endsWith(pattern) || lower === pattern.slice(1)) {
            return { classification: 'BLOCKED', matchedRule: `blocklist:${pattern}` };
        }
    }

    // Check allowlist
    for (const host of ALLOWED_HOSTS) {
        if (lower === host) {
            return { classification: 'ALLOWED', matchedRule: `allowlist:${host}` };
        }
    }

    return { classification: 'UNKNOWN', matchedRule: null };
}

function parseDatabaseHost(url: string): { hostname: string; dbName: string } {
    try {
        const parsed = new URL(url);
        return {
            hostname: parsed.hostname,
            dbName: parsed.pathname.replace(/^\//, ''),
        };
    } catch {
        return { hostname: 'UNPARSEABLE', dbName: 'UNPARSEABLE' };
    }
}

// ---------------------------------------------------------------------------
// Safety gate evaluation → ManifestSafety
// ---------------------------------------------------------------------------

export interface SafetyCheckResult {
    safety: ManifestSafety;
    blocked: boolean;
    blockedGate: string | null;
    blockedReason: string | null;
}

export function evaluateSafetyGates(options?: {
    toolkitEnv?: string;
    databaseUrl?: string;
    safeDbHosts?: string[];
}): SafetyCheckResult {
    const toolkitEnv = options?.toolkitEnv ?? process.env.TOOLKIT_ENV ?? undefined;
    const databaseUrl = options?.databaseUrl ?? process.env.DATABASE_URL ?? '';
    const safeDbHosts = options?.safeDbHosts ?? process.env.TOOLKIT_SAFE_DB_HOSTS?.split(',').map(h => h.trim()).filter(Boolean);

    const WRITABLE_ENVS = new Set(['LOCAL', 'DEV', 'CI']);

    // Gate 1: TOOLKIT_ENV
    const envUpper = toolkitEnv?.toUpperCase() ?? null;
    const envAllowed = envUpper !== null && WRITABLE_ENVS.has(envUpper);

    const envGate = {
        name: 'TOOLKIT_ENV',
        passed: envAllowed,
        reasonCode: envUpper === null ? 'MISSING_ENV' as const
            : envAllowed ? 'ALLOWED' as const
                : 'BLOCKED_ENV' as const,
        reasonMessage: envUpper === null
            ? 'TOOLKIT_ENV is not set. Set to LOCAL, DEV, or CI to allow writes.'
            : envAllowed
                ? `TOOLKIT_ENV=${envUpper} is in the writable allowlist.`
                : `TOOLKIT_ENV=${envUpper} is not in the writable allowlist [LOCAL, DEV, CI].`,
    };

    // Gate 2: DATABASE_URL host
    const { hostname, dbName } = parseDatabaseHost(databaseUrl);
    const hostResult = classifyHost(hostname, safeDbHosts);

    const dbGatePassed = hostResult.classification === 'ALLOWED';
    const dbGate = {
        name: 'DATABASE_URL',
        passed: dbGatePassed,
        reasonCode: hostResult.classification === 'ALLOWED' ? 'ALLOWED' as const
            : hostResult.classification === 'BLOCKED' ? 'BLOCKED_HOST' as const
                : 'UNKNOWN_HOST' as const,
        reasonMessage: dbGatePassed
            ? `Host '${hostname}' is in the safe allowlist.`
            : hostResult.classification === 'BLOCKED'
                ? `Host '${hostname}' matches blocked pattern ${hostResult.matchedRule}. Production databases are not allowed.`
                : `Host '${hostname}' is not in the allowlist. Add to TOOLKIT_SAFE_DB_HOSTS if intentional.`,
    };

    const blocked = !envGate.passed || !dbGate.passed;
    const blockedGate = !envGate.passed ? 'TOOLKIT_ENV' : !dbGate.passed ? 'DATABASE_URL' : null;
    const blockedReason = !envGate.passed ? envGate.reasonMessage : !dbGate.passed ? dbGate.reasonMessage : null;

    const dbClassification = hostResult.classification === 'ALLOWED' ? 'SAFE' as const
        : hostResult.classification === 'BLOCKED' ? 'UNSAFE' as const
            : 'UNKNOWN' as const;

    return {
        safety: {
            policyVersion: '1.0.0',
            gates: [envGate, dbGate],
            envSummary: {
                toolkitEnv: envUpper,
                classification: envUpper === null ? 'MISSING' : envAllowed ? 'ALLOWED' : 'BLOCKED',
            },
            dbSafetySummary: {
                dbHostMasked: hostname,
                dbNameMasked: dbName,
                classification: dbClassification,
                matchedRule: hostResult.matchedRule,
            },
        },
        blocked,
        blockedGate,
        blockedReason,
    };
}

// ---------------------------------------------------------------------------
// Pipeline wrapper
// ---------------------------------------------------------------------------

export interface CommandPipelineOptions {
    /** Command init config */
    config: ManifestInitConfig;
    /**
     * The actual command execution function.
     * Receives the builder so it can add steps, set tenant, etc.
     * Returns the desired status and exit code.
     */
    execute: (builder: ManifestBuilder) => Promise<{ status: ManifestStatus; exitCode: ExitCode }>;
    /** Override safety check options (for testing) */
    safetyOptions?: Parameters<typeof evaluateSafetyGates>[0];
    /** Override manifest output directory */
    manifestDir?: string;
    /** Skip safety check (for read-only commands) */
    skipSafety?: boolean;
}

export interface CommandPipelineResult {
    status: ManifestStatus;
    exitCode: ExitCode;
    manifestPath: string | null;
    manifest: ManifestDocument;
}

/**
 * Execute a command through the manifest pipeline.
 * Guarantees a manifest is emitted for every run (blocked, failed, success, cancelled).
 */
export async function executeWithManifest(
    options: CommandPipelineOptions,
): Promise<CommandPipelineResult> {
    // Note: crash handlers are NOT installed here.
    // CLI entrypoint owns all process-level signal handlers.
    // Use emergencyFinalizeAndWrite() from CLI handlers.

    // Phase 1: INIT
    const builder = new ManifestBuilder(options.config);
    activeBuilder = builder;

    let status: ManifestStatus = 'BLOCKED';
    let exitCode: ExitCode = 78;

    try {
        // Phase 2: SAFETY
        if (!options.skipSafety) {
            const safetyStep = builder.startStep('SAFETY_CHECK');

            const safetyResult = evaluateSafetyGates(options.safetyOptions);
            builder.setSafety(safetyResult.safety);

            if (safetyResult.blocked) {
                safetyStep.close({
                    status: 'FAILED',
                    summary: `Gate ${safetyResult.blockedGate} blocked: ${safetyResult.blockedReason}`,
                    error: {
                        code: 'SAFETY_BLOCK',
                        message: safetyResult.blockedReason || 'Safety gate blocked execution',
                        isRecoverable: false,
                    },
                });

                builder.addError({
                    code: 'SAFETY_BLOCK',
                    message: `Execution blocked by safety gate: ${safetyResult.blockedReason}`,
                    isRecoverable: false,
                });

                status = 'BLOCKED';
                exitCode = 78;
                return buildResult(builder, status, exitCode, options.manifestDir);
            }

            safetyStep.close({ status: 'SUCCESS', summary: 'All safety gates passed' });
        } else {
            // Read-only command — skip safety but still mark it
            const safetyStep = builder.startStep('SAFETY_CHECK');
            safetyStep.close({ status: 'SKIPPED', summary: 'Skipped for read-only command' });
        }

        // Phase 3: PIPELINE (delegated to caller's execute function)
        const result = await options.execute(builder);
        status = result.status;
        exitCode = result.exitCode;

        return buildResult(builder, status, exitCode, options.manifestDir);
    } catch (error) {
        // Unexpected error — finalize as FAILED
        builder.addError(error);
        status = 'FAILED';
        exitCode = 1;
        return buildResult(builder, status, exitCode, options.manifestDir);
    } finally {
        activeBuilder = null;
    }
}

/**
 * Build the final result: finalize manifest + write to disk.
 */
async function buildResult(
    builder: ManifestBuilder,
    status: ManifestStatus,
    exitCode: ExitCode,
    manifestDir?: string,
): Promise<CommandPipelineResult> {
    // Phase 4: FINALIZE
    const manifest = builder.finalize(status, exitCode);

    // Phase 5: WRITE (best-effort)
    const manifestPath = await ManifestWriter.write(manifest, manifestDir);

    if (manifestPath) {
        process.stderr.write(`[manifest] Written: ${manifestPath}\n`);
    }

    return { status, exitCode, manifestPath, manifest };
}
