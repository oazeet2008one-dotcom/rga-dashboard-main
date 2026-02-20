/**
 * Unit tests: manifest-builder.ts — Builder lifecycle
 * Runner: node:test (no Jest)
 */
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { ManifestBuilder } from '../manifest-builder';
import { MANIFEST_SCHEMA_VERSION } from '../types';

function createBuilder(overrides?: Partial<ConstructorParameters<typeof ManifestBuilder>[0]>) {
    return new ManifestBuilder({
        executionMode: 'CLI',
        commandName: 'test-cmd',
        commandClassification: 'WRITE',
        ...overrides,
    });
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
describe('ManifestBuilder init', () => {
    it('generates a v4 UUID runId', () => {
        const b = createBuilder();
        assert.match(b.getRunId(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('defaults to BLOCKED status', () => {
        const doc = createBuilder().emergencyFinalize();
        assert.strictEqual(doc.status, 'BLOCKED');
        assert.strictEqual(doc.exitCode, 78);
    });

    it('sets schema version', () => {
        const doc = createBuilder().finalize('SUCCESS', 0);
        assert.strictEqual(doc.schemaVersion, MANIFEST_SCHEMA_VERSION);
    });
});

// ---------------------------------------------------------------------------
// Step tracking
// ---------------------------------------------------------------------------
describe('ManifestBuilder steps', () => {
    it('tracks step start and close', () => {
        const b = createBuilder();
        const step = b.startStep('SAFETY_CHECK');
        step.close({ status: 'SUCCESS', summary: 'All gates passed' });

        const doc = b.finalize('SUCCESS', 0);
        assert.strictEqual(doc.steps.length, 1);
        assert.strictEqual(doc.steps[0].name, 'SAFETY_CHECK');
        assert.strictEqual(doc.steps[0].status, 'SUCCESS');
        assert.ok(doc.steps[0].durationMs >= 0);
    });

    it('handles multiple steps', () => {
        const b = createBuilder();
        const s1 = b.startStep('SAFETY_CHECK');
        s1.close({ status: 'SUCCESS', summary: 'ok' });
        const s2 = b.startStep('EXECUTE');
        s2.close({ status: 'SUCCESS', summary: 'done' });

        const doc = b.finalize('SUCCESS', 0);
        assert.strictEqual(doc.steps.length, 2);
    });

    it('step errors are captured', () => {
        const b = createBuilder();
        const step = b.startStep('SAFETY_CHECK');
        step.close({
            status: 'FAILED',
            summary: 'gate blocked',
            error: { code: 'SAFETY_BLOCK', message: 'env missing', isRecoverable: false },
        });

        const doc = b.finalize('BLOCKED', 78);
        assert.strictEqual(doc.steps[0].error?.code, 'SAFETY_BLOCK');
    });
});

// ---------------------------------------------------------------------------
// Setters
// ---------------------------------------------------------------------------
describe('ManifestBuilder setters', () => {
    it('sets tenant info', () => {
        const b = createBuilder();
        b.setTenant({
            tenantId: 'tenant-123',
            tenantSlug: 'acme',
            tenantDisplayName: 'ACME Corp',
            tenantResolution: 'EXPLICIT',
        });
        const doc = b.finalize('SUCCESS', 0);
        assert.strictEqual(doc.tenant.tenantId, 'tenant-123');
        assert.strictEqual(doc.tenant.tenantResolution, 'EXPLICIT');
    });

    it('sets safety info', () => {
        const b = createBuilder();
        b.setSafety({
            policyVersion: '1.0.0',
            gates: [],
            envSummary: { toolkitEnv: 'LOCAL', classification: 'ALLOWED' },
            dbSafetySummary: { dbHostMasked: 'localhost', dbNameMasked: 'test_db', classification: 'SAFE', matchedRule: 'allowlist:localhost' },
        });
        const doc = b.finalize('SUCCESS', 0);
        assert.strictEqual(doc.safety.policyVersion, '1.0.0');
    });

    it('records warnings', () => {
        const b = createBuilder();
        b.addWarning('test warning');
        const doc = b.finalize('SUCCESS', 0);
        assert.ok(doc.results.warnings.includes('test warning'));
    });

    it('records errors', () => {
        const b = createBuilder();
        b.addError(new Error('test error'));
        const doc = b.finalize('FAILED', 1);
        assert.ok(doc.results.errors.length > 0);
    });
});

// ---------------------------------------------------------------------------
// Idempotent finalize
// ---------------------------------------------------------------------------
describe('ManifestBuilder finalize idempotency', () => {
    it('second finalize returns same status (ignores new args)', () => {
        const b = createBuilder();
        const doc1 = b.finalize('SUCCESS', 0);
        const doc2 = b.finalize('FAILED', 1);
        assert.strictEqual(doc2.status, 'SUCCESS');
        assert.strictEqual(doc2.exitCode, 0);
    });

    it('isFinalized returns true after first call', () => {
        const b = createBuilder();
        assert.ok(!b.isFinalized());
        b.finalize('SUCCESS', 0);
        assert.ok(b.isFinalized());
    });
});

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------
describe('ManifestBuilder duration', () => {
    it('records non-negative duration', () => {
        const b = createBuilder();
        const doc = b.finalize('SUCCESS', 0);
        assert.ok(doc.durationMs >= 0);
    });
});
