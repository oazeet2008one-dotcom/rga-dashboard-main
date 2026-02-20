import { Injectable } from '@nestjs/common';
import { VerificationCheck } from '../types';

export interface EvaluatorInput {
    ruleId: string; // e.g., BIZ-001
    name: string;
    logic: (metrics: any) => boolean; // Returns true if VIOLATION/TRIGGER matches
    severity: 'FAIL' | 'WARN' | 'INFO';
    message: (metrics: any) => string;
}

@Injectable()
export class AlertRuleEvaluator {

    /**
     * Evaluates a set of metrics against a catalog of rules.
     * Pure function behavior: inputs -> check result.
     */
    evaluate(
        metrics: Record<string, any>, // e.g. { spend: 100, budget: 50, roas: 2.0 }
        rules: EvaluatorInput[]
    ): VerificationCheck[] {
        const checks: VerificationCheck[] = [];

        for (const rule of rules) {
            try {
                const triggered = rule.logic(metrics);
                if (triggered) {
                    checks.push({
                        ruleId: rule.ruleId,
                        name: rule.name,
                        status: rule.severity === 'FAIL' ? 'FAIL' : 'WARN', // or PASS? 
                        // Logic: If rule checks for "BAD THING", then triggered means "WARN/FAIL".
                        // If rule checks for "GOOD THING", triggered means "PASS".
                        // Context: "Checks derived from AlertService... to ensure scenarios trigger expected alerts."
                        // Actually, BIZ rules are checks. 
                        // Example: "LOW_ROAS" (WARN). If triggered, it's a WARN.
                        // Catalog says: "Severity: WARN".
                        // So if logic returns true, we output a Check with WARN status.
                        // If not triggered, do we output PASS?
                        // "Verification PASSES (Exit Code 0)" even if WARN is present.
                        // Usually we only report what happened.
                        // But for REPORT schema, we want to see "BIZ-001: PASS" if ROAS is good?
                        // Or we only report "BIZ-001: WARN" if ROAS is bad?
                        // Report Schema shows "BIZ-001 ... Status: WARN".
                        // If low roas is NOT detected, maybe "BIZ-001 ... Status: PASS".

                        severity: rule.severity,
                        message: rule.message(metrics),
                        details: { ...metrics }
                    });
                } else {
                    // Rule NOT triggered. Does that mean PASS?
                    // "Checks ensuring proper alerts are fired".
                    // If the scenario EXPECTS an alert, then NOT firing is a failure?
                    // BUT here we are just scanning for potential issues.
                    // "Scan Mode": triggers warnings if thresholds met.
                    // If not met, it's a PASS (no warning).
                    checks.push({
                        ruleId: rule.ruleId,
                        name: rule.name,
                        status: 'PASS',
                        severity: rule.severity,
                        message: `Rule ${rule.name} not triggered`,
                        details: { ...metrics }
                    });
                }
            } catch (e: any) {
                checks.push({
                    ruleId: rule.ruleId,
                    name: rule.name,
                    status: 'FAIL',
                    severity: 'FAIL',
                    message: `Evaluation Error: ${e.message}`
                });
            }
        }
        return checks;
    }
}
