import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { initiateGoogleAuth } from '../../services/api';
import { getTenantId } from '../../services/auth/session';

interface GoogleLoginButtonProps {
  tenantId?: string;
  returnUrl?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  onError?: (error: string) => void;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  tenantId,
  returnUrl = '/dashboard',
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get tenant ID from localStorage if not provided
      const currentTenantId = tenantId || getTenantId();
      
      if (!currentTenantId) {
        const errorMsg = 'Tenant ID is required for Google login';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Redirect to Google OAuth
      const authUrl = initiateGoogleAuth(currentTenantId, returnUrl);
      window.location.href = authUrl;

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to initiate Google login';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('Google login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={`w-full flex items-center justify-center space-x-2 ${className}`}
        onClick={handleGoogleLogin}
        disabled={disabled || loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>
          {loading ? 'Connecting…' : 'Sign in with Google'}
        </span>
      </Button>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GoogleLoginButton;
