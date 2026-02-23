import { useQuery } from '@tanstack/react-query';
import { EcommerceApi } from '../api';

export const ECOMMERCE_KEYS = {
    all: ['ecommerce'] as const,
    summary: (period: string) => [...ECOMMERCE_KEYS.all, 'summary', period] as const,
    trends: (days: number) => [...ECOMMERCE_KEYS.all, 'trends', days] as const,
};

export function useEcommerceSummary(period: string = '30d') {
    return useQuery({
        queryKey: ECOMMERCE_KEYS.summary(period),
        queryFn: () => EcommerceApi.getSummary(period),
    });
}

export function useEcommerceTrends(days: number = 30) {
    return useQuery({
        queryKey: ECOMMERCE_KEYS.trends(days),
        queryFn: () => EcommerceApi.getTrends(days),
    });
}
