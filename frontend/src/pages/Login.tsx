import { useState, useEffect } from 'react';
import { useAuthStore, selectIsLoading, selectError } from '@/stores/auth-store';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, AlertTriangle, ArrowRight, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleCanvas } from '@/components/ui/particle-canvas';
import { Starfield } from '@/components/ui/starfield';
import logo from '@/components/layout/LOGO-RGA-B2.png';
import { apiClient } from '@/services/api-client';

// Inline field error component with smooth animation
function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[11px] text-red-500 mt-1 pl-0.5 flex items-center gap-1"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore(selectIsLoading);
  const storeError = useAuthStore(selectError);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('expired') === 'true') {
      setSessionExpired(true);
      toast.warning('Your session has expired. Please login again.');
    }
  }, [searchString]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Invalid email format';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForgotPassword = (): boolean => {
    const errors: Record<string, string> = {};
    if (!forgotEmail.trim()) {
      errors.forgotEmail = 'Email is required';
    } else if (!emailRegex.test(forgotEmail)) {
      errors.forgotEmail = 'Invalid email format';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!validateForgotPassword()) return;

    setIsSendingReset(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: forgotEmail });
      toast.success('Password reset link sent to your email!');
      setIsForgotPassword(false);
      setForgotEmail('');
    } catch (err: any) {
      // Always show success message for security (don't reveal if email exists)
      toast.success('Password reset link sent to your email!');
      setIsForgotPassword(false);
      setForgotEmail('');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setCanResendVerification(false);
    setSessionExpired(false);
    clearError();

    if (!validateFields()) return;

    try {
      await login(email, password);
      toast.success('Login successful!');
      setLocation('/dashboard');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.error === 'ACCOUNT_LOCKED') {
        const lockoutMinutes = errorData.lockoutMinutes || 15;
        const message = `Account locked. Please try again in ${lockoutMinutes} minutes.`;
        setLocalError(message);
        toast.error(message);
      } else if (errorData?.remainingAttempts !== undefined) {
        const message = `Invalid credentials. ${errorData.remainingAttempts} attempts remaining.`;
        setLocalError(message);
        toast.warning(message);
      } else if (errorData?.error === 'EMAIL_NOT_VERIFIED') {
        const message = errorData?.message || 'Please verify your email before logging in.';
        setLocalError(message);
        setCanResendVerification(true);
        toast.error(message);
      } else {
        const message = errorData?.message || 'Login failed. Please try again.';
        setLocalError(message);
        toast.error(message);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await apiClient.post('/auth/resend-verification', { email });
      toast.success('Verification email sent. Please check your inbox.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to resend verification email.';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  const displayError = localError || storeError;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Full dark background */}
      <div className="absolute inset-0" style={{ backgroundColor: '#1f1f1f' }} />

      {/* Starfield with twinkling + starburst rays */}
      <div className="absolute inset-0 pointer-events-none">
        <Starfield className="absolute inset-0" starCount={120} />
      </div>

      {/* Particle animation — full page */}
      <div className="absolute inset-0 pointer-events-auto">
        <ParticleCanvas
          className="absolute inset-0"
          particleCount={70}
          particleColor="249, 115, 22"
          lineColor="249, 115, 22"
          maxDistance={130}
        />
      </div>

      {/* Subtle animated glow */}
      <motion.div
        className="absolute top-[10%] left-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{ x: '-50%', background: 'radial-gradient(circle, rgba(251,146,60,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] px-6 relative z-10"
      >
        <div className="bg-white/95 rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100/80 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

          <div className="px-8 pt-10 pb-8">

            {/* Logo with gentle float */}
            <motion.div
              className="flex justify-center mb-8"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img src={logo} alt="RGA" className="h-14 w-auto object-contain" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-center mb-7"
            >
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Welcome back</h1>
              <p className="text-[13px] text-slate-400 mt-1">Sign in to your dashboard</p>
            </motion.div>

            {/* Alerts */}
            {sessionExpired && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Alert variant="default" className="mb-5 border-amber-200 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    Session expired. Please sign in again.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            {displayError && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Alert variant="destructive" className="mb-5 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{displayError}</AlertDescription>
                </Alert>

                {canResendVerification && (
                  <div className="mb-5">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-lg"
                      onClick={handleResendVerification}
                      disabled={isResending}
                    >
                      {isResending ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        'Send verification email again'
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Form — noValidate disables browser-native tooltips */}
            <motion.form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[13px] font-medium text-slate-600">
                  Email address
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors(prev => { const c = { ...prev }; delete c.email; return c; }); }}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    disabled={isLoading}
                    autoComplete="email"
                    className={`h-10 rounded-lg bg-slate-50/80 focus-visible:ring-orange-500/20 focus-visible:border-orange-400 placeholder:text-slate-300 transition-all duration-200 ${fieldErrors.email ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-500/20' : 'border-slate-200'}`}
                  />
                  {/* Active indicator dot */}
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
                    initial={false}
                    animate={{ scale: focused === 'email' ? 1 : 0, opacity: focused === 'email' ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <FieldError message={fieldErrors.email} />
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[13px] font-medium text-slate-600">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(prev => { const c = { ...prev }; delete c.password; return c; }); }}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={`h-10 rounded-lg bg-slate-50/80 focus-visible:ring-orange-500/20 focus-visible:border-orange-400 placeholder:text-slate-300 transition-all duration-200 ${fieldErrors.password ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-500/20' : 'border-slate-200'}`}
                  />
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
                    initial={false}
                    animate={{ scale: focused === 'password' ? 1 : 0, opacity: focused === 'password' ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <FieldError message={fieldErrors.password} />
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-11 mt-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl tracking-wide transition-all group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <span className="flex items-center">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            {/* Divider */}
            <div className="relative mt-6 mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
            </div>

            {/* Forgot Password & Register links */}
            <div className="space-y-3">
              <p className="text-center text-[13px] text-slate-400">
                <button
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotEmail(email);
                  }}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Forgot your password?
                </button>
              </p>
              <p className="text-center text-[13px] text-slate-400">
                Don't have an account?{' '}
                <button
                  onClick={() => setLocation('/register')}
                  className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                >
                  Get started
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-xs text-slate-400/60"
        >
          &copy; 2026 RGA Dashboard. All rights reserved.
        </motion.p>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsForgotPassword(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h3>
                <p className="text-slate-600 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="h-11 rounded-lg border-slate-200 focus:border-blue-400 focus:ring-blue-500/20"
                    disabled={isSendingReset}
                  />
                  <FieldError message={fieldErrors.forgotEmail} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsForgotPassword(false)}
                    className="flex-1 h-11 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                    disabled={isSendingReset}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    disabled={isSendingReset}
                  >
                    {isSendingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
