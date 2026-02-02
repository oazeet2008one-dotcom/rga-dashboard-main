import { apiClient } from './api-client';
import { DateRangeOption } from '@/types/dateRange';
import { Campaign, DashboardMetricPoint } from '@/types/api';

// Proper type for Platform Performance data
export interface PlatformPerformance {
    platform: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
}

export interface TimeSeriesPoint {
    date: string;
    value: number;
}

export interface TimeSeriesResponse {
    metric: string;
    startDate: string;
    endDate: string;
    data: TimeSeriesPoint[];
}

export const dashboardService = {
    getSummary: () => apiClient.get<any>('/dashboard/summary'),
    getTrends: (days?: number) => apiClient.get<DashboardMetricPoint[]>('/dashboard/trends', { params: { days } }),
    getOverview: (startDate?: string, endDate?: string) =>
        apiClient.get<any>('/dashboard/overview', { params: { startDate, endDate } }),
    getTopCampaigns: (limit?: number, sortBy?: string, days?: number) =>
        apiClient.get<Campaign[]>('/dashboard/top-campaigns', { params: { limit, sortBy, days } }),
    // Fixed: Use proper PlatformPerformance[] type instead of any
    getPerformanceByPlatform: (startDate?: string, endDate?: string) =>
        apiClient.get<PlatformPerformance[]>('/dashboard/performance-by-platform', { params: { startDate, endDate } }),
    getTimeSeries: (metric: string, startDate?: string, endDate?: string) =>
        apiClient.get<TimeSeriesResponse>('/dashboard/time-series', { params: { metric, startDate, endDate } }),

    // Metrics Trends
    getMetricsTrends: (period: DateRangeOption = '7d', compare: 'previous_period' = 'previous_period') =>
        apiClient.get<any>('/dashboard/metrics/trends', { params: { period, compare } }),
    getDailyMetrics: (period: DateRangeOption = '7d') =>
        apiClient.get<any>('/dashboard/metrics/daily', { params: { period } }),

    // Summary by Platform (Multi-channel)
    getSummaryByPlatform: (days: number = 30, platform: string = 'ALL') =>
        apiClient.get<any>('/dashboard/summary-by-platform', { params: { days, platform } }),

    // Exports
    exportCampaignsCSV: (platform?: string, status?: string) =>
        apiClient.get('/dashboard/export/campaigns/csv', {
            params: { platform, status },
            responseType: 'blob'
        }),
    exportMetricsPDF: (period: string) =>
        apiClient.get(`/dashboard/export/metrics/pdf?period=${period}`, { responseType: 'blob' }),

    // Onboarding
    getOnboardingStatus: () => apiClient.get<{ googleAds: boolean; googleAnalytics: boolean; kpiTargets: boolean; teamMembers: boolean }>('/dashboard/onboarding-status'),

    // Dev Tools (Mock Data)
    seedMockData: () => apiClient.post('/dev/seed-all'),
    seedCampaigns: () => apiClient.post('/dev/seed-campaigns'),
    seedMetrics: (days = 30) => apiClient.post('/dev/seed-metrics', { days }),
    seedAlerts: () => apiClient.post('/dev/seed-alerts'),
    seedSyncLogs: () => apiClient.post('/dev/seed-sync-logs'),
    seedPlatform: (platform: string) => apiClient.post(`/dev/seed-platform/${platform}`),
    clearMockData: () => apiClient.delete('/dev/clear-mock'),
    clearCampaigns: () => apiClient.delete('/dev/clear-campaigns'),
};
