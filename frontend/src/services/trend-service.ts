import { apiClient } from '@/services/api-client';

export interface TrendDataPoint {
    date: string;
    cost: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    sessions: number;
}

export const trendService = {
    getTrends: (period: string = '30d') => 
        apiClient.get<TrendDataPoint[]>(`/trends?period=${period}`),
};
