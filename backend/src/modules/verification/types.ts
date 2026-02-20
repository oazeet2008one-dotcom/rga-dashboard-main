export interface VerificationOptions {
    scenarioId: string;
    tenantId: string;
    runId?: string;
    dryRun?: boolean;
}

export type CheckStatus = 'PASS' | 'FAIL' | 'WARN' | 'INFO';

export interface VerificationCheck {
    ruleId: string;
    name: string;
    status: CheckStatus;
    severity: 'FAIL' | 'WARN' | 'INFO';
    message: string;
    details?: Record<string, any>;
}

export interface VerificationSummary {
    status: 'PASS' | 'FAIL' | 'WARN';
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    durationMs: number;
}

export interface VerificationResult {
    meta: {
        version: string;
        generator: string;
        createdAt: string; // ISO
        runId: string;
        scenarioId: string;
        tenantId: string;
    };
    summary: VerificationSummary;
    results: VerificationCheck[];
    provenance: {
        isMockData: boolean;
        sourcePrefix: string;
    };
}
