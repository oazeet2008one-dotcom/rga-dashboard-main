import { useQuery } from '@tanstack/react-query';
import { useAuthStore, selectUser } from '@/stores/auth-store';
import { getTrendAnalysisData } from '../services/trend-analysis.service';
import type { PeriodEnum, TrendAnalysisData } from '../schemas';

interface UseTrendAnalysisOptions {
    period?: PeriodEnum;
    startDate?: string;
    endDate?: string;
    tenantId?: string;
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
}

export const trendAnalysisKeys = {
    all: ['trend-analysis'] as const,
    dataByPeriod: (period: PeriodEnum, tenantId?: string) =>
        [...trendAnalysisKeys.all, 'data', period, tenantId] as const,
};

export function useTrendAnalysis(options: UseTrendAnalysisOptions = {}) {
    const user = useAuthStore(selectUser);
    const authTenantId = user?.tenantId ?? user?.tenant?.id;

    const {
        period = '7d',
        startDate,
        endDate,
        tenantId,
        enabled = true,
        refetchInterval = 0,
        staleTime = 5 * 60 * 1000,
    } = options;

    const tenantIdForCacheKey = tenantId ?? authTenantId;

    return useQuery<TrendAnalysisData, Error>({
        queryKey: trendAnalysisKeys.dataByPeriod(period, tenantIdForCacheKey),
        queryFn: () => getTrendAnalysisData({ period, startDate, endDate, tenantId }),
        enabled,
        staleTime,
        refetchInterval: refetchInterval > 0 ? refetchInterval : undefined,
        refetchOnWindowFocus: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        keepPreviousData: false,
    });
}

export function useTrendData(options: UseTrendAnalysisOptions = {}) {
    const query = useTrendAnalysis(options);

    return {
        ...query,
        data: query.data?.trends ?? [],
    };
}
