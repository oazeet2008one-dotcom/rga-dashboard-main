import { apiClient } from '@/services/api-client';

export interface CrmSummary {
    totalLeads: number;
    leadsTrend: number;
    qualifiedLeads: number;
    qualifiedTrend: number;
    conversionRate: number;
    conversionTrend: number;
    costPerLead: number;
    cplTrend: number;
    pipelineValue: number;
    pipelineTrend: number;
}

export interface PipelineTrend {
    date: string;
    leads: number;
    value: number;
}

export const CrmApi = {
    getSummary: async (period: string = '30d'): Promise<CrmSummary> => {
        const response = await apiClient.get(`/crm/summary?period=${period}`);
        return response.data;
    },
    getTrends: async (days: number = 30): Promise<PipelineTrend[]> => {
        const response = await apiClient.get(`/crm/trends?days=${days}`);
        return response.data;
    },
};
