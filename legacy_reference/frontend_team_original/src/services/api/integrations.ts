import {
  Integration,
  IntegrationNotification,
  OAuthStatus,
  SyncHistory,
} from '../../types/api';
import api, { API_BASE } from './client';

export const getIntegrations = async (): Promise<Integration[]> => {
  const response = await api.get('/integrations');
  return response.data.integrations;
};

export const getIntegrationNotifications = async (
  status?: 'open' | 'resolved'
): Promise<IntegrationNotification[]> => {
  const response = await api.get('/integrations/notifications', {
    params: status ? { status } : undefined,
  });
  return response.data.notifications;
};

export const getIntegration = async (id: string): Promise<Integration> => {
  const response = await api.get(`/integrations/${id}`);
  return response.data.integration;
};

export const createIntegration = async (integration: Partial<Integration>): Promise<Integration> => {
  const response = await api.post('/integrations', integration);
  return response.data.integration;
};

export const updateIntegration = async (id: string, integration: Partial<Integration>): Promise<Integration> => {
  const response = await api.put(`/integrations/${id}`, integration);
  return response.data.integration;
};

export const deleteIntegration = async (id: string): Promise<void> => {
  await api.delete(`/integrations/${id}`);
};

export const syncIntegration = async (id: string): Promise<any> => {
  const response = await api.post(`/integrations/${id}/sync`);
  return response.data;
};

export const testIntegration = async (id: string): Promise<any> => {
  const response = await api.post(`/integrations/${id}/test`);
  return response.data;
};

export const startOAuth = async (id: string, redirectUri: string): Promise<any> => {
  const response = await api.post(`/integrations/${id}/oauth/start`, { redirectUri });
  return response.data;
};

export const handleOAuthCallback = async (id: string, code: string, state: string): Promise<any> => {
  const response = await api.get(`/integrations/${id}/oauth/callback?code=${code}&state=${state}`);
  return response.data;
};

export const refreshOAuthToken = async (id: string): Promise<any> => {
  const response = await api.post(`/integrations/${id}/oauth/refresh`);
  return response.data;
};

export const getOAuthStatus = async (id: string): Promise<OAuthStatus> => {
  const response = await api.get(`/integrations/${id}/oauth/status`);
  return response.data;
};

export const revokeOAuthAccess = async (id: string): Promise<any> => {
  const response = await api.post(`/integrations/${id}/oauth/revoke`);
  return response.data;
};

export const getSyncHistory = async (filters?: {
  platform?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ histories: SyncHistory[]; total: number }> => {
  const response = await api.get('/integrations/sync-history', { params: filters });
  return response.data;
};

export const getPlatformOAuthUrl = (platform: string, integrationId: string): string => {
  const baseUrl = window.location.origin;
  const redirectUri = `${baseUrl}/oauth/callback`;
  return `${API_BASE}/integrations/${integrationId}/oauth/start?redirectUri=${encodeURIComponent(redirectUri)}`;
};
