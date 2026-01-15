import { WebhookEvent } from '../../types/api';
import api from './client';

export const getWebhookEvents = async (filters?: {
  platform?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: WebhookEvent[]; total: number }> => {
  const response = await api.get('/webhooks/events', { params: filters });
  return response.data;
};

export const replayWebhookEvent = async (id: string): Promise<any> => {
  const response = await api.post(`/webhooks/events/${id}/replay`);
  return response.data;
};

export const deleteWebhookEvent = async (id: string): Promise<void> => {
  await api.delete(`/webhooks/events/${id}`);
};

export const validateWebhookSignature = async (
  platform: string,
  payload: any,
  signature: string
): Promise<{ isValid: boolean }> => {
  const response = await api.post('/webhooks/validate', { platform, payload, signature });
  return response.data;
};
