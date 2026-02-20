import { EvaluatorInput } from './alert-rule.evaluator';

export const BIZ_RULES: EvaluatorInput[] = [
    {
        ruleId: 'BIZ-001',
        name: 'LOW_ROAS',
        severity: 'WARN',
        logic: (m: any) => {
            const roas = m.spend > 0 ? m.revenue / m.spend : 0;
            return m.spend > 0 && roas < 1.0;
        },
        message: (m: any) => `ROAS ${(m.revenue / m.spend).toFixed(2)} < 1.0 (Loss)`
    },
    {
        ruleId: 'BIZ-002',
        name: 'CRITICAL_ROAS',
        severity: 'WARN',
        logic: (m: any) => {
            const roas = m.spend > 0 ? m.revenue / m.spend : 0;
            return m.spend > 0 && roas < 0.5;
        },
        message: (m: any) => `ROAS ${(m.revenue / m.spend).toFixed(2)} < 0.5 (Critical Loss)`
    },
    // BIZ-003: Overspend (requires budget awareness)
    // Assuming simple verification: Daily Spend > Daily Budget? 
    // Aggregate is total window spend. Budget is usually Daily.
    // If window is 30 days, Total Spend > Budget * 30?
    // We'll skip complex budget logic for now or assume Budget is "Total Period Budget" if type matches?
    // Let's implement NO_CONVERSIONS.
    {
        ruleId: 'BIZ-004',
        name: 'NO_CONVERSIONS',
        severity: 'WARN',
        logic: (m: any) => m.spend > 0 && m.conversions === 0,
        message: (m: any) => `Spent ${m.spend.toFixed(2)} but got 0 conversions`
    },
];

export const ANOMALY_RULES: EvaluatorInput[] = [
    {
        ruleId: 'SANE-001',
        name: 'CLICKS_LE_IMPRESSIONS',
        severity: 'FAIL',
        logic: (m: any) => m.clicks > m.impressions,
        message: (m: any) => `Clicks (${m.clicks}) > Impressions (${m.impressions})`
    },
    {
        ruleId: 'SANE-003',
        name: 'SPEND_NON_NEGATIVE',
        severity: 'FAIL',
        logic: (m: any) => m.spend < 0,
        message: (m: any) => `Spend is negative (${m.spend})`
    }
];
