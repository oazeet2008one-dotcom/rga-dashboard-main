import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { aiHistoryService } from '../services/ai-history-service';

export function useCreateUserBehavior() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { action: string; data?: any }) => aiHistoryService.createUserBehavior(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'behavior'] });
    },
  });
}

export function useUserBehaviorList(params?: { limit?: number; action?: string }) {
  const limit = params?.limit ?? 50;

  return useInfiniteQuery({
    queryKey: ['ai', 'behavior', params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      aiHistoryService.listUserBehavior({
        limit,
        cursor: pageParam,
        action: params?.action,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useCreateAiRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      type: string;
      title: string;
      description: string;
      priority?: string;
      confidence?: number;
      status?: string;
      payload?: any;
    }) => aiHistoryService.createAiRecommendation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'recommendations'] });
    },
  });
}

export function useAiRecommendationsList(params?: { limit?: number; status?: string; type?: string }) {
  const limit = params?.limit ?? 50;

  return useInfiniteQuery({
    queryKey: ['ai', 'recommendations', params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      aiHistoryService.listAiRecommendations({
        limit,
        cursor: pageParam,
        status: params?.status,
        type: params?.type,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
