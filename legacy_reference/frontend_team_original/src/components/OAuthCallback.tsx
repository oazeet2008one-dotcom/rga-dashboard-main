import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { handleOAuthCallback } from '../services/api';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const integrationId = searchParams.get('integration_id') || '';

        if (!code || !state) {
          setStatus('error');
          setMessage('Missing required parameters');
          return;
        }

        setStatus('loading');
        setMessage('Processing OAuth callback...');

        const result = await handleOAuthCallback(integrationId, code, state);
        
        setStatus('success');
        setMessage('Authentication successful! Your account has been connected.');
        
        // Redirect to integrations page after 3 seconds
        setTimeout(() => {
          navigate('/integrations');
        }, 3000);
        
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Authentication failed. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we process your authentication.'}
            {status === 'success' && 'You will be redirected to the integrations page.'}
            {status === 'error' && 'There was an issue with your authentication.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
          
          {status === 'error' && (
            <Button 
              onClick={() => navigate('/integrations')}
              className="w-full"
              variant="outline"
            >
              Back to Integrations
            </Button>
          )}
          
          {status === 'success' && (
            <Button 
              onClick={() => navigate('/integrations')}
              className="w-full"
            >
              Go to Integrations
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
