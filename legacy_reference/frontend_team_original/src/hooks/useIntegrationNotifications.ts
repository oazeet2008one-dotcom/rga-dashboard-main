import { useCallback, useEffect, useState } from 'react';
import { IntegrationNotification } from '../types/api';
import { getIntegrationNotifications } from '../services/api';

export const useIntegrationNotifications = (status: 'open' | 'resolved' = 'open') => {
  const [notifications, setNotifications] = useState<IntegrationNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getIntegrationNotifications(status);
      setNotifications(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load integration notifications');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, error, refetch: fetchNotifications };
};
