import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = useMemo(() => new URLSearchParams(search).get('token') || '', [search]);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }

      setStatus('loading');
      try {
        await apiClient.get('/auth/verify-email', { params: { token } });
        if (cancelled) return;
        setStatus('success');
        setMessage('Email verified successfully. You can now login.');
        toast.success('Email verified');
      } catch (err: any) {
        if (cancelled) return;
        const errorData = err?.response?.data;
        const msg = errorData?.message || 'Email verification failed.';
        setStatus('error');
        setMessage(msg);
        toast.error(msg);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-lg font-semibold text-slate-900">Verify Email</h1>
        <p className="text-sm text-slate-500 mt-1">Completing verification…</p>

        <div className="mt-5">
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Verifying…</span>
            </div>
          )}

          {status === 'success' && (
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">{message}</AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="mt-5 flex gap-2">
            <Button onClick={() => setLocation('/login')} className="w-full">
              Go to Login
            </Button>
            <Button variant="outline" onClick={() => setLocation('/register')} className="w-full">
              Back to Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
