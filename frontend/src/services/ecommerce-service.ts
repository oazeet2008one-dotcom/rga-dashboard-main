import { apiClient } from '@/services/api-client';

export interface EcommerceSummary {
    totalRevenue: number;
    revenueTrend: number;
    totalOrders: number;
    ordersTrend: number;
    averageOrderValue: number;
    aovTrend: number;
    conversionRate: number;
    crTrend: number;
    cartAbandonmentRate: number;
    abandonmentTrend: number;
}

export interface SalesTrend {
    date: string;
    revenue: number;
    orders: number;
}

export const ecommerceService = {
    getSummary: (period: string = '30d') =>
        apiClient.get<EcommerceSummary>(`/ecommerce/summary?period=${period}`).then(res => res.data),

    getTrends: (days: number = 30) =>
        apiClient.get<SalesTrend[]>(`/ecommerce/trends?days=${days}`).then(res => res.data),

    backfill: (days: number = 30) =>
        apiClient.post(`/ecommerce/backfill?days=${days}`).then(res => res.data),
};
