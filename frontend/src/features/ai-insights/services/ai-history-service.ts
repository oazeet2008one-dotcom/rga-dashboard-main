import { apiClient } from '@/services/api-client';

export interface UserBehaviorEvent {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  data?: any;
  timestamp: string;
}

export interface AiRecommendation {
  id: string;
  tenantId: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  confidence: string;
  status: string;
  payload?: any;
  executedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CursorPaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
};

export const aiHistoryService = {
  createUserBehavior: async (payload: { action: string; data?: any }) => {
    const response = await apiClient.post<UserBehaviorEvent>('/ai/behavior', payload);
    return response.data;
  },

  listUserBehavior: async (params?: { limit?: number; cursor?: string; action?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.action) searchParams.set('action', params.action);

    const qs = searchParams.toString();
    const url = qs ? `/ai/behavior?${qs}` : '/ai/behavior';

    const response = await apiClient.get<CursorPaginatedResponse<UserBehaviorEvent>>(url);
    return response.data;
  },

  createAiRecommendation: async (payload: {
    type: string;
    title: string;
    description: string;
    priority?: string;
    confidence?: number;
    status?: string;
    payload?: any;
  }) => {
    const response = await apiClient.post<AiRecommendation>('/ai/recommendations', payload);
    return response.data;
  },

  listAiRecommendations: async (params?: {
    limit?: number;
    cursor?: string;
    status?: string;
    type?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.type) searchParams.set('type', params.type);

    const qs = searchParams.toString();
    const url = qs ? `/ai/recommendations?${qs}` : '/ai/recommendations';

    const response = await apiClient.get<CursorPaginatedResponse<AiRecommendation>>(url);
    return response.data;
  },
};
