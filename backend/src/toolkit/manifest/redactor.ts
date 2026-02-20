/**
 * =============================================================================
 * Manifest Redactor — REDACTION_POLICY enforcement
 * =============================================================================
 *
 * Pure functions. No side effects. No DI needed.
 * Prevents secret/PII leakage into manifests and logs.
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Allowlist: keys that may appear unmasked in manifests
// ---------------------------------------------------------------------------

const SAFE_ENV_KEYS: ReadonlySet<string> = new Set([
    'TOOLKIT_ENV',
    'NODE_ENV',
    'LOG_LEVEL',
    'LOG_FORMAT',
    'ENABLE_DRY_RUN',
    'CONFIRM_DESTRUCTIVE',
    'TOOLKIT_SAFE_DB_HOSTS',
]);

// Keys that are partially masked (host+db only)
const MASKED_KEYS: ReadonlySet<string> = new Set([
    'DATABASE_URL',
]);

// Keys whose full value is safe to include
const TRANSPARENT_KEYS: ReadonlySet<string> = new Set([
    'API_BASE_URL',
]);

// ---------------------------------------------------------------------------
// Forbidden patterns — any match → value fully redacted
// ---------------------------------------------------------------------------

const FORBIDDEN_PATTERNS: readonly RegExp[] = [
    /SECRET/i,
    /PASSWORD/i,
    /TOKEN/i,
    /(?:^|_)KEY(?:$|_)/i,
    /COOKIE/i,
    /^AUTHORIZATION$/i,
];

const REDACTED_PLACEHOLDER = '[REDACTED]';

// ---------------------------------------------------------------------------
// Truncation limits (from REDACTION_POLICY §5)
// ---------------------------------------------------------------------------

export const TRUNCATION_LIMITS = {
    STEP_SUMMARY: 200,
    ERROR_MESSAGE: 500,
    ARG_VALUE: 1000,
    MAX_WARNINGS: 50,
    MAX_ERRORS: 10,
    MAX_MANIFEST_BYTES: 256 * 1024,
} as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if the key matches any forbidden pattern.
 */
export function isForbiddenKey(key: string): boolean {
    return FORBIDDEN_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Returns true if the key is in the safe allowlist.
 */
export function isSafeKey(key: string): boolean {
    return SAFE_ENV_KEYS.has(key);
}

/**
 * Mask a DATABASE_URL: keep only host + db name, strip creds/port/query.
 * On parse failure, returns '[UNPARSEABLE_URL]' — never leaks raw value.
 */
export function maskDatabaseUrl(url: string): string {
    try {
        const parsed = new URL(url);
        const dbName = parsed.pathname.replace(/^\//, '');
        return `postgresql://***:***@${parsed.hostname}/${dbName}`;
    } catch {
        return '[UNPARSEABLE_URL]';
    }
}

/**
 * Redact a single env key-value pair.
 * Returns null if the key is forbidden (should be excluded entirely).
 * Returns the redacted entry otherwise.
 */
export function redactEnvEntry(
    key: string,
    value: string,
): { key: string; value: string } | null {
    if (isForbiddenKey(key)) {
        return null; // exclude entirely
    }

    if (SAFE_ENV_KEYS.has(key)) {
        return { key, value };
    }

    if (MASKED_KEYS.has(key)) {
        return { key, value: maskDatabaseUrl(value) };
    }

    if (TRANSPARENT_KEYS.has(key)) {
        return { key, value };
    }

    // Unknown key → redact by default (deny-by-default)
    return { key, value: REDACTED_PLACEHOLDER };
}

/**
 * Redact an args object: replace sensitive values, truncate long ones.
 */
export function redactArgs(args: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
        if (isForbiddenKey(key)) {
            result[key] = REDACTED_PLACEHOLDER;
        } else if (typeof value === 'string') {
            result[key] = truncate(value, TRUNCATION_LIMITS.ARG_VALUE);
        } else {
            result[key] = value;
        }
    }
    return result;
}

/**
 * Truncate a string to maxLength, appending '…' if truncated.
 */
export function truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
        return value;
    }
    return value.slice(0, maxLength - 1) + '…';
}

/**
 * Scrub secrets from a string (e.g., error message).
 * Currently targets Database URLs.
 */
export function scrubMessage(value: string): string {
    // Replace postgres://user:pass@ with postgres://***:***@
    return value.replace(/postgres:\/\/([^:@\s]+):([^@\s]+)@/g, 'postgres://***:***@');
}

/**
 * Sanitize an error for manifest inclusion.
 * Strips stack traces, applies message truncation, and scrubs secrets.
 */
export function sanitizeError(error: unknown): { code: string; message: string; isRecoverable: boolean } {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        const err = error as { code: string; message: string; isRecoverable?: boolean };
        return {
            code: String(err.code),
            message: truncate(scrubMessage(String(err.message)), TRUNCATION_LIMITS.ERROR_MESSAGE),
            isRecoverable: typeof err.isRecoverable === 'boolean' ? err.isRecoverable : false,
        };
    }

    if (error instanceof Error) {
        return {
            code: 'UNKNOWN_ERROR',
            message: truncate(scrubMessage(error.message), TRUNCATION_LIMITS.ERROR_MESSAGE),
            isRecoverable: false,
        };
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: truncate(scrubMessage(String(error)), TRUNCATION_LIMITS.ERROR_MESSAGE),
        isRecoverable: false,
    };
}

/**
 * Redact an entire env object: returns only allowed/masked entries.
 */
export function redactEnv(env: Record<string, string | undefined>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(env)) {
        if (value === undefined) continue;
        const entry = redactEnvEntry(key, value);
        if (entry) {
            result[entry.key] = entry.value;
        }
    }
    return result;
}

/**
 * Limit array length and add truncation warning.
 */
export function limitArray<T>(arr: T[], max: number, warningPrefix: string): { items: T[]; truncatedWarning: string | null } {
    if (arr.length <= max) {
        return { items: arr, truncatedWarning: null };
    }
    const remaining = arr.length - max;
    return {
        items: arr.slice(0, max),
        truncatedWarning: `+${remaining} more ${warningPrefix} truncated`,
    };
}
