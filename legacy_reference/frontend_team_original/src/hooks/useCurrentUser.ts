import { useEffect, useState, useCallback } from 'react';
import { CurrentUser } from '../types/api';
import { mockUserProfile } from '../data/mockDashboard';

interface UseCurrentUserResult {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCurrentUser = (): UseCurrentUserResult => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setUser(mockUserProfile as CurrentUser);
    } catch (err: any) {
      const message = err?.message || 'Unable to load mock user data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refetch: fetchUser };
};
