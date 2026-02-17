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
    },
    getTopKeywords: async (): Promise<{ keyword: string, position: number, volume: number, cpc: number, trafficPercent: number }[]> => {
        const response = await apiClient.get('/seo/top-keywords');
        return response.data;
    },
    getOffpageSnapshots: async (): Promise<{ date: string, backlinks: number, referringDomains: number, ur: number, dr: number, organicTrafficValue: number }[]> => {
        const response = await apiClient.get('/seo/offpage-snapshots');
        return response.data;
    },
    getAnchorTexts: async (): Promise<{ text: string, referringDomains: number, totalBacklinks: number, dofollowBacklinks: number, traffic: number, trafficPercentage: number }[]> => {
        const response = await apiClient.get('/seo/anchor-texts');
        return response.data;
    },
    getAiInsights: async (): Promise<{ id: string, type: string, source: string, title: string, message: string, payload: any, status: string, occurredAt: string, createdAt: string, updatedAt: string }[]> => {
        const response = await apiClient.get('/seo/ai-insights');
        return response.data;
    }
};

