import { Metric, Campaign, CampaignListResponse, DashboardMetricPoint } from '../types/api';
import api from './api/client';

export * from './api/auth';
export * from './api/integrations';
export * from './api/webhooks';

// Data
export const getFacebookData = async (type: string, dateFrom?: string, dateTo?: string): Promise<any> => {
  const params = new URLSearchParams({ type });
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const response = await api.get(`/data/facebook?${params}`);
  return response.data.data;
};

export const getGoogleAdsData = async (type: string, dateFrom?: string, dateTo?: string): Promise<any> => {
  const params = new URLSearchParams({ type });
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const response = await api.get(`/data/googleads?${params}`);
  return response.data.data;
};

export const getLINEData = async (type: string, dateFrom?: string, dateTo?: string, userId?: string): Promise<any> => {
  const params = new URLSearchParams({ type });
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  if (userId) params.append('userId', userId);
  const response = await api.get(`/data/line?${params}`);
  return response.data.data;
};

export const getTikTokData = async (type: string, dateFrom?: string, dateTo?: string): Promise<any> => {
  const params = new URLSearchParams({ type });
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const response = await api.get(`/data/tiktok?${params}`);
  return response.data.data;
};

export const getShopeeData = async (type: string, dateFrom?: string, dateTo?: string): Promise<any> => {
  const params = new URLSearchParams({ type });
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const response = await api.get(`/data/shopee?${params}`);
  return response.data.data;
};

export const getAllData = async (dateFrom?: string, dateTo?: string): Promise<any> => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const response = await api.get(`/data/all?${params}`);
  return response.data.data;
};

// Real metrics/campaign data
export const getDashboardMetrics = async (period: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<DashboardMetricPoint[]> => {
  const response = await api.get('/metrics/dashboard', { params: { period } });
  return response.data.data;
};

export const getCampaigns = async (params?: { platform?: string; status?: string; page?: number; limit?: number }): Promise<CampaignListResponse> => {
  const response = await api.get('/campaigns', { params });
  return response.data;
};

export const getCampaignPerformance = async (campaignId: string) => {
  const response = await api.get(`/campaigns/${campaignId}/performance`);
  return response.data.performance;
};

export const getCampaignMetrics = async (campaignId: string, range?: { startDate?: string; endDate?: string }): Promise<Metric[]> => {
  const response = await api.get(`/campaigns/${campaignId}/metrics`, { params: range });
  return response.data.metrics;
};

export default api;
