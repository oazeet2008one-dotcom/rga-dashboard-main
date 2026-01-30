import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService, Alert, AlertCount } from '@/services/alert-service';
import { useAuthStore, selectUser } from '@/stores/auth-store';

export function useAlerts(options?: { status?: string; severity?: string; limit?: number }) {
    const user = useAuthStore(selectUser);
    const tenantId = user?.tenantId;

    return useQuery({
        queryKey: ['alerts', tenantId, options],
        queryFn: async (): Promise<Alert[]> => {
            const response = await alertService.getAlerts(options);
            return response.data;
        },
        placeholderData: (previousData: any) => previousData,
    });
}

export function useOpenAlertsCount() {
    const user = useAuthStore(selectUser);
    const tenantId = user?.tenantId;

    return useQuery<AlertCount>({
        queryKey: ['alerts', tenantId, 'count'],
        queryFn: async () => {
            const response = await alertService.getOpenAlertsCount();
            return response.data;
        },
        refetchInterval: 60000, // Refetch every minute
    });
}

export function useCheckAlerts() {
    const queryClient = useQueryClient();
    const user = useAuthStore(selectUser);
    const tenantId = user?.tenantId;

    return useMutation({
        mutationFn: async () => {
            const response = await alertService.checkAlerts();
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts', tenantId] });
        },
    });
}

export function useAcknowledgeAlert() {
    const queryClient = useQueryClient();
    const user = useAuthStore(selectUser);
    const tenantId = user?.tenantId;

    return useMutation({
        mutationFn: async (alertId: string) => {
            const response = await alertService.acknowledgeAlert(alertId);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts', tenantId] });
        },
    });
}

export function useResolveAlert() {
    const queryClient = useQueryClient();
    const user = useAuthStore(selectUser);
    const tenantId = user?.tenantId;

    return useMutation({
        mutationFn: async (alertId: string) => {
            const response = await alertService.resolveAlert(alertId);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts', tenantId] });
        },
    });
}

export function useResolveAllAlerts() {
    const queryClient = useQueryClient();
    const user = useAuthStore(selectUser);
    const tenantId = user?.tenantId;

    return useMutation({
        mutationFn: async () => {
            const response = await alertService.resolveAllAlerts();
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts', tenantId] });
        },
    });
}
