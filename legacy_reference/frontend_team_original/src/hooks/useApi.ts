import { useState, useEffect } from 'react';
import { DashboardMetricPoint, Campaign } from '../types/api';
import { mockDashboardMetrics, mockCampaigns } from '../data/mockDashboard';

export const useMetrics = (filters?: {
  startDate?: string;
  endDate?: string;
  platform?: string;
}) => {
  const [metrics, setMetrics] = useState<DashboardMetricPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(mockDashboardMetrics);
    } catch (err: any) {
      setError(err?.message || 'Failed to load mock metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [JSON.stringify(filters)]);

  return { metrics, loading, error, refetch: fetchMetrics };
};

export const useCampaigns = (platform?: string) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = () => {
    setLoading(true);
    setError(null);
    try {
      const filtered = platform ? mockCampaigns.filter((c) => c.platform.toLowerCase() === platform.toLowerCase()) : mockCampaigns;
      setCampaigns(filtered);
    } catch (err: any) {
      setError(err?.message || 'Failed to load mock campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [platform]);

  return { campaigns, loading, error, refetch: fetchCampaigns };
};
