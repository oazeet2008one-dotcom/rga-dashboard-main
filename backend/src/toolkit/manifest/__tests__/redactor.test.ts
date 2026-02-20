/**
 * Unit tests: redactor.ts — REDACTION_POLICY enforcement
 * Runner: node:test (no Jest)
 */
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import {
    isForbiddenKey,
    isSafeKey,
    maskDatabaseUrl,
    redactEnvEntry,
    redactArgs,
    redactEnv,
    truncate,
    sanitizeError,
    limitArray,
} from '../redactor';

// ---------------------------------------------------------------------------
// isForbiddenKey
// ---------------------------------------------------------------------------
describe('isForbiddenKey', () => {
    it('blocks SECRET variants', () => {
        assert.ok(isForbiddenKey('JWT_SECRET'));
        assert.ok(isForbiddenKey('MY_SECRET_VAR'));
        assert.ok(isForbiddenKey('secret'));
    });

    it('blocks PASSWORD variants', () => {
        assert.ok(isForbiddenKey('DB_PASSWORD'));
        assert.ok(isForbiddenKey('password'));
    });

    it('blocks TOKEN variants', () => {
        assert.ok(isForbiddenKey('REFRESH_TOKEN'));
        assert.ok(isForbiddenKey('token'));
    });

    it('blocks KEY variants (word-boundary)', () => {
        assert.ok(isForbiddenKey('API_KEY'));
        assert.ok(isForbiddenKey('KEY_ID'));
        assert.ok(isForbiddenKey('PRIVATE_KEY'));
    });

    it('blocks COOKIE / AUTHORIZATION', () => {
        assert.ok(isForbiddenKey('SESSION_COOKIE'));
        assert.ok(isForbiddenKey('AUTHORIZATION'));
    });

    it('allows safe keys', () => {
        assert.ok(!isForbiddenKey('TOOLKIT_ENV'));
        assert.ok(!isForbiddenKey('NODE_ENV'));
        assert.ok(!isForbiddenKey('PATH'));
        assert.ok(!isForbiddenKey('HOME'));
        assert.ok(!isForbiddenKey('MONKEY'));  // contains KEY but not as segment
    });
});

// ---------------------------------------------------------------------------
// isSafeKey
// ---------------------------------------------------------------------------
describe('isSafeKey', () => {
    it('allows TOOLKIT_ prefixed keys', () => {
        assert.ok(isSafeKey('TOOLKIT_ENV'));
        assert.ok(isSafeKey('TOOLKIT_SAFE_DB_HOSTS'));
    });

    it('allows curated keys', () => {
        assert.ok(isSafeKey('NODE_ENV'));
        assert.ok(isSafeKey('LOG_LEVEL'));
    });

    it('rejects DATABASE_URL (it is masked, not safe-listed)', () => {
        assert.ok(!isSafeKey('DATABASE_URL'));
    });

    it('rejects unknown keys', () => {
        assert.ok(!isSafeKey('RANDOM_VAR_12345'));
    });
});

// ---------------------------------------------------------------------------
// maskDatabaseUrl
// ---------------------------------------------------------------------------
describe('maskDatabaseUrl', () => {
    it('strips credentials from postgres URL', () => {
        assert.strictEqual(
            maskDatabaseUrl('postgresql://admin:s3cret@prod-db.acme.com:5432/rga_prod'),
            'postgresql://***:***@prod-db.acme.com/rga_prod',
        );
    });

    it('handles URL without credentials', () => {
        const result = maskDatabaseUrl('postgresql://host/db');
        assert.ok(result.includes('host'));
    });

    it('returns [UNPARSEABLE_URL] for invalid URLs', () => {
        assert.strictEqual(maskDatabaseUrl('not-a-url'), '[UNPARSEABLE_URL]');
    });
});

// ---------------------------------------------------------------------------
// redactEnvEntry
// ---------------------------------------------------------------------------
describe('redactEnvEntry', () => {
    it('returns null for forbidden keys', () => {
        assert.strictEqual(redactEnvEntry('JWT_SECRET', 'abc'), null);
        assert.strictEqual(redactEnvEntry('DB_PASSWORD', 'pass'), null);
    });

    it('passes through safe keys', () => {
        assert.deepStrictEqual(
            redactEnvEntry('TOOLKIT_ENV', 'LOCAL'),
            { key: 'TOOLKIT_ENV', value: 'LOCAL' },
        );
    });

    it('masks DATABASE_URL value', () => {
        const result = redactEnvEntry('DATABASE_URL', 'postgresql://user:pass@host/db');
        assert.ok(result !== null);
        assert.ok(!result!.value.includes('pass'));
    });

    it('redacts unknown keys', () => {
        const result = redactEnvEntry('RANDOM_VAR', 'some-value');
        assert.ok(result !== null);
        assert.strictEqual(result!.value, '[REDACTED]');
    });
});

// ---------------------------------------------------------------------------
// redactArgs
// ---------------------------------------------------------------------------
describe('redactArgs', () => {
    it('redacts keys matching forbidden patterns', () => {
        const result = redactArgs({ API_KEY: 'secret', tenantId: 'visible' });
        assert.strictEqual(result.API_KEY, '[REDACTED]');
        assert.strictEqual(result.tenantId, 'visible');
    });

    it('handles empty args', () => {
        assert.deepStrictEqual(redactArgs({}), {});
    });

    it('handles empty record', () => {
        assert.deepStrictEqual(redactArgs({}), {});
    });
});

// ---------------------------------------------------------------------------
// redactEnv
// ---------------------------------------------------------------------------
describe('redactEnv', () => {
    it('filters out forbidden keys entirely', () => {
        const result = redactEnv({
            TOOLKIT_ENV: 'LOCAL',
            JWT_SECRET: 'top-secret',
            NODE_ENV: 'development',
        });
        assert.ok(result.TOOLKIT_ENV);
        assert.strictEqual(result.JWT_SECRET, undefined);
        assert.ok(result.NODE_ENV);
    });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------
describe('truncate', () => {
    it('returns short strings unchanged', () => {
        assert.strictEqual(truncate('hello', 100), 'hello');
    });

    it('truncates long strings with ellipsis', () => {
        const result = truncate('x'.repeat(300), 200);
        assert.strictEqual(result.length, 200);
        assert.ok(result.endsWith('…'));
    });

    it('handles empty string', () => {
        assert.strictEqual(truncate('', 100), '');
    });
});

// ---------------------------------------------------------------------------
// sanitizeError
// ---------------------------------------------------------------------------
describe('sanitizeError', () => {
    it('wraps Error objects', () => {
        const result = sanitizeError(new Error('test'));
        assert.strictEqual(result.code, 'UNKNOWN_ERROR');
        assert.strictEqual(result.message, 'test');
    });

    it('wraps non-Error values', () => {
        const result = sanitizeError('string-error');
        assert.strictEqual(result.message, 'string-error');
    });

    it('handles null/undefined', () => {
        const result = sanitizeError(null);
        assert.ok(result.message);
    });
});

// ---------------------------------------------------------------------------
// limitArray
// ---------------------------------------------------------------------------
describe('limitArray', () => {
    it('returns arrays within limit unchanged', () => {
        const result = limitArray([1, 2, 3], 5, 'items');
        assert.deepStrictEqual(result.items, [1, 2, 3]);
        assert.strictEqual(result.truncatedWarning, null);
    });

    it('truncates arrays exceeding limit', () => {
        const arr = Array.from({ length: 20 }, (_, i) => i);
        const result = limitArray(arr, 5, 'items');
        assert.strictEqual(result.items.length, 5);
        assert.ok(result.truncatedWarning !== null);
    });
});
