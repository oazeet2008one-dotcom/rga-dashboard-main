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

export const crmService = {
    getSummary: (period: string = '30d') => 
        apiClient.get<CrmSummary>(`/crm/summary?period=${period}`),
    
    getTrends: (days: number = 30) => 
        apiClient.get<PipelineTrend[]>(`/crm/trends?days=${days}`),
};
