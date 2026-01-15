import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Facebook, 
  Search, 
  MessageCircle, 
  Music, 
  ShoppingBag,
  Plus,
  Settings,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Clock,
  Activity
} from 'lucide-react';
import { 
  getIntegrations, 
  updateIntegration,
  syncIntegration,
  testIntegration,
  getAllData
} from '../services/api';
import { Integration as IntegrationType } from '../types/api';

interface IntegrationData {
  facebook?: {
    campaigns?: any[];
    insights?: any[];
  };
  googleads?: {
    campaigns?: any[];
    insights?: any[];
  };
  line?: {
    userStats?: {
      total: number;
      active: number;
    };
    messageStats?: any[];
  };
  tiktok?: {
    campaigns?: any[];
    insights?: any[];
  };
  shopee?: {
    orders?: any[];
    products?: any[];
    shopMetrics?: any;
  };
}

const providerIcons = {
  facebook: Facebook,
  googleads: Search,
  line: MessageCircle,
  tiktok: Music,
  shopee: ShoppingBag,
};

const providerColors = {
  facebook: 'bg-blue-500',
  googleads: 'bg-green-500',
  line: 'bg-green-600',
  tiktok: 'bg-black',
  shopee: 'bg-orange-500',
};

const IntegrationManager: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationType[]>([]);
  const [data, setData] = useState<IntegrationData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('integrations');

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setError(null);
      const result = await getIntegrations();
      setIntegrations(result || []);
    } catch (err) {
      setError('Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setError(null);
      const result = await getAllData();
      setData(result || {});
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  const handleSync = async (id: string) => {
    try {
      setError(null);
      await syncIntegration(id);
      await fetchIntegrations();
      await fetchAllData();
    } catch (err) {
      setError('Failed to sync integration');
    }
  };

  const handleTest = async (id: string) => {
    try {
      setError(null);
      await testIntegration(id);
      alert('Integration test successful');
    } catch (err) {
      setError('Failed to test integration');
    }
  };

  const handleToggleActive = async (integration: IntegrationType) => {
    try {
      setError(null);
      await updateIntegration(integration.id, { isActive: !integration.isActive });
      await fetchIntegrations();
    } catch (err) {
      setError('Failed to update integration');
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    if (isActive) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    return <Badge variant="destructive">Inactive</Badge>;
  };

  const renderIntegrationCard = (integration: IntegrationType) => {
    const Icon = providerIcons[integration.provider as keyof typeof providerIcons];
    const color = providerColors[integration.provider as keyof typeof providerColors];

    return (
      <Card key={integration.id} className="mb-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {integration.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {integration.provider}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(integration.isActive)}
            {getStatusIcon(integration.isActive)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              {integration.lastSyncAt 
                ? `Last sync: ${new Date(integration.lastSyncAt).toLocaleString()}`
                : 'Never synced'
              }
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleTest(integration.id)}
              >
                Test
              </Button>
              <Button
                size="sm"
                onClick={() => handleSync(integration.id)}
                disabled={!integration.isActive}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync
              </Button>
              <Button
                size="sm"
                variant={integration.isActive ? 'outline' : 'default'}
                onClick={() => handleToggleActive(integration)}
              >
                {integration.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDataOverview = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([provider, providerData]) => {
          const Icon = providerIcons[provider as keyof typeof providerIcons];
          const color = providerColors[provider as keyof typeof providerColors];

          return (
            <Card key={provider}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium capitalize">
                    {provider}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {provider === 'facebook' && (
                    <>
                      <div className="text-xs">
                        Campaigns: {providerData.campaigns?.length || 0}
                      </div>
                      <div className="text-xs">
                        Insights: {providerData.insights?.length || 0}
                      </div>
                    </>
                  )}
                  {provider === 'googleads' && (
                    <>
                      <div className="text-xs">
                        Campaigns: {providerData.campaigns?.length || 0}
                      </div>
                      <div className="text-xs">
                        Insights: {providerData.insights?.length || 0}
                      </div>
                    </>
                  )}
                  {provider === 'line' && (
                    <>
                      <div className="text-xs">
                        Total Users: {providerData.userStats?.total || 0}
                      </div>
                      <div className="text-xs">
                        Active Users: {providerData.userStats?.active || 0}
                      </div>
                    </>
                  )}
                  {provider === 'tiktok' && (
                    <>
                      <div className="text-xs">
                        Campaigns: {providerData.campaigns?.length || 0}
                      </div>
                      <div className="text-xs">
                        Insights: {providerData.insights?.length || 0}
                      </div>
                    </>
                  )}
                  {provider === 'shopee' && (
                    <>
                      <div className="text-xs">
                        Orders: {providerData.orders?.length || 0}
                      </div>
                      <div className="text-xs">
                        Products: {providerData.products?.length || 0}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <Button variant="outline" onClick={fetchIntegrations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="integrations" className="space-y-4">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-muted-foreground mb-4">
                  No integrations configured
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            integrations.map(renderIntegrationCard)
          )}
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Data Overview</h2>
            <Button onClick={fetchAllData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
          {Object.keys(data).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-muted-foreground mb-4">
                  No data available
                </div>
                <Button onClick={fetchAllData} variant="outline">
                  Fetch Data
                </Button>
              </CardContent>
            </Card>
          ) : (
            renderDataOverview()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationManager;
