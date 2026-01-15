import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  RefreshCw, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { getSyncHistory } from '../services/api';
import { SyncHistory as SyncHistoryType } from '../types/api';
import { getPlatformBadgeClassName, getPlatformLabel, PLATFORM_OPTIONS } from '../constants/platform';

const SyncHistory: React.FC = () => {
  const [histories, setHistories] = useState<SyncHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    platform: '',
    status: '',
    limit: 50,
    offset: 0
  });

  const loadHistories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSyncHistory(filters);
      setHistories(response.histories);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load sync history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistories();
  }, [filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (syncedAt: string) => {
    const now = new Date();
    const syncTime = new Date(syncedAt);
    const diffMs = now.getTime() - syncTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading sync history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sync History</h2>
        <Button onClick={loadHistories} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.platform}
              onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Platforms</option>
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>
            
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
            
            <Button onClick={() => setFilters({ ...filters, offset: 0 })}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {histories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No sync history found</p>
            </CardContent>
          </Card>
        ) : (
          histories.map((history) => (
            <Card key={history.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(history.status)}
                      <Badge className={getPlatformBadgeClassName(history.platform)}>
                        {getPlatformLabel(history.platform)}
                      </Badge>
                      <Badge className={getStatusColor(history.status)}>
                        {history.status}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(history.syncedAt)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Sync Time:</strong> {formatDate(history.syncedAt)}
                    </div>
                    
                    {history.error && (
                      <div className="mt-2">
                        <h4 className="font-medium mb-1 text-red-600">Error:</h4>
                        <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                          <p className="text-sm text-red-800">{history.error}</p>
                        </div>
                      </div>
                    )}
                    
                    {history.data && (
                      <div className="mt-2">
                        <h4 className="font-medium mb-1">Sync Data:</h4>
                        <details className="cursor-pointer">
                          <summary className="text-sm text-blue-600 hover:text-blue-800">
                            View data summary
                          </summary>
                          <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-32 mt-2">
                            {JSON.stringify(history.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SyncHistory;
