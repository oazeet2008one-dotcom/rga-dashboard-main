// SEO API Service exports
import { apiClient } from '@/services/api-client';

import { SeoMetricSummary } from '../types';

export const SeoService = {
    getSummary: async (): Promise<SeoMetricSummary> => {
        const response = await apiClient.get('/seo/summary');
        return response.data;
    },
    getHistory: async (days: number = 30): Promise<any[]> => {
        const response = await apiClient.get(`/seo/history?days=${days}`);
        return response.data;
    },
    getKeywordIntent: async (): Promise<{ type: string, keywords: number, traffic: number }[]> => {
        const response = await apiClient.get('/seo/keyword-intent');
        return response.data;
    },
    getTrafficByLocation: async (): Promise<{ country: string, city: string, traffic: number, keywords: number, countryCode: string }[]> => {
        const response = await apiClient.get('/seo/traffic-by-location');
        return response.data;
    }
};

