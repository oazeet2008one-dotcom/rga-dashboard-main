import { useQuery } from '@tanstack/react-query';
import { CrmApi } from '../api';

export const CRM_KEYS = {
    all: ['crm'] as const,
    summary: (period: string) => [...CRM_KEYS.all, 'summary', period] as const,
    trends: (days: number) => [...CRM_KEYS.all, 'trends', days] as const,
};

export function useCrmSummary(period: string = '30d') {
    return useQuery({
        queryKey: CRM_KEYS.summary(period),
        queryFn: () => CrmApi.getSummary(period),
    });
}

export function useCrmTrends(days: number = 30) {
    return useQuery({
        queryKey: CRM_KEYS.trends(days),
        queryFn: () => CrmApi.getTrends(days),
    });
}
