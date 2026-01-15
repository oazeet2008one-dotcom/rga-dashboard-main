import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  RefreshCw, 
  Trash2, 
  Play, 
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  getWebhookEvents, 
  replayWebhookEvent, 
  deleteWebhookEvent 
} from '../services/api';
import { WebhookEvent } from '../types/api';
import { getPlatformBadgeClassName, getPlatformLabel, PLATFORM_OPTIONS } from '../constants/platform';

const WebhookEvents: React.FC = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    platform: '',
    type: '',
    limit: 50,
    offset: 0
  });

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWebhookEvents(filters);
      setEvents(response.events);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load webhook events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const handleReplay = async (eventId: string) => {
    try {
      await replayWebhookEvent(eventId);
      loadEvents(); // Reload to show updated status
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to replay event');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this webhook event?')) {
      try {
        await deleteWebhookEvent(eventId);
        setEvents(events.filter(e => e.id !== eventId));
      } catch (error: any) {
        setError(error.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  const getStatusIcon = (platform: string) => {
    // This could be expanded to show actual processing status
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading webhook events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Webhook Events</h2>
        <Button onClick={loadEvents} variant="outline">
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
            
            <input
              type="text"
              placeholder="Event type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
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

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No webhook events found</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(event.platform)}
                      <Badge className={getPlatformBadgeClassName(event.platform)}>
                        {getPlatformLabel(event.platform)}
                      </Badge>
                      <Badge variant="outline">{event.type}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(event.receivedAt)}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <h4 className="font-medium mb-1">Event Data:</h4>
                      <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-32">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                    
                    {event.signature && (
                      <div className="mt-2">
                        <h4 className="font-medium mb-1">Signature:</h4>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {event.signature}
                        </code>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReplay(event.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Replay
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default WebhookEvents;
