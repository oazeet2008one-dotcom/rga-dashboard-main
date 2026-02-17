import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleCanvas } from '@/components/ui/particle-canvas';
import { Starfield } from '@/components/ui/starfield';
import logo from '@/components/layout/LOGO-RGA-B2.png';
import { apiClient } from '@/services/api-client';
import { Checkbox } from '@/components/ui/checkbox';

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

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [autoResendEmail, setAutoResendEmail] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordIssues, setPasswordIssues] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const register = useAuthStore((state) => state.register);
  const [, setLocation] = useLocation();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isBusy = isLoading || isResending;

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const normalizeUsername = (value: string) => value.trim().toLowerCase();

  const getPasswordIssues = (password: string) => {
    const issues: string[] = [];
    if (!password || password.length < 8) issues.push('At least 8 characters');
    if (!/[a-z]/.test(password)) issues.push('At least 1 lowercase letter (a-z)');
    if (!/[A-Z]/.test(password)) issues.push('At least 1 uppercase letter (A-Z)');
    if (!/[0-9]/.test(password)) issues.push('At least 1 number (0-9)');
    if (!/[^A-Za-z0-9]/.test(password)) issues.push('At least 1 symbol (e.g. !@#$%)');
    return issues;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'email') {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\s+/g, '') }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear field error on typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    setPasswordIssues([]);

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9._-]{3,30}$/.test(formData.username)) {
      errors.username = 'Username must be 3-30 characters and contain only letters, numbers, dot, underscore, or dash.';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(normalizeEmail(formData.email))) {
      errors.email = 'Invalid email format';
    }
    if (!formData.companyName.trim()) errors.companyName = 'Company Name is required';
    if (!formData.password) {
      errors.password = 'Password is required';
    } else {
      const issues = getPasswordIssues(formData.password);
      if (issues.length > 0) {
        errors.password = 'Password does not meet the security requirements.';
        setPasswordIssues(issues);
      }
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password && formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!termsAccepted) {
      errors.termsAccepted = 'You must accept the Terms & Conditions to continue.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBusy) return;

    setError('');
    setCanResendVerification(false);
    setPasswordIssues([]);

    if (!validateFields()) return;

    setIsLoading(true);

    try {
      await register({
        username: normalizeUsername(formData.username),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: normalizeEmail(formData.email),
        password: formData.password,
        companyName: formData.companyName,
        termsAccepted,
      });
      toast.success('Registration successful! Please verify your email before logging in.');
      setLocation('/login');
    } catch (err: any) {
      const errorData = err.response?.data;
      const message = errorData?.message || 'Registration failed. Please try again.';
      if (errorData?.error === 'EMAIL_EXISTS') {
        setCanResendVerification(true);
        setAutoResendEmail(normalizeEmail(formData.email));
      }
      if (errorData?.error === 'USERNAME_EXISTS') {
        setFieldErrors((prev) => ({
          ...prev,
          username: 'This username is already taken. Please choose another one.',
        }));
      }
      if (errorData?.error === 'TERMS_NOT_ACCEPTED') {
        setFieldErrors((prev) => ({
          ...prev,
          termsAccepted: 'You must accept the Terms & Conditions to continue.',
        }));
      }
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    if (isBusy) return;
    setIsResending(true);
    try {
      await apiClient.post('/auth/resend-verification', { email: normalizeEmail(formData.email) });
      toast.success('Verification email sent. Please check your inbox.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to resend verification email.';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  const lastAutoResentEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (!autoResendEmail) return;
    if (isLoading || isResending) return;
    if (lastAutoResentEmailRef.current === autoResendEmail) return;

    lastAutoResentEmailRef.current = autoResendEmail;

    (async () => {
      try {
        setIsResending(true);
        await apiClient.post('/auth/resend-verification', { email: autoResendEmail });
        toast.success('Verification email sent automatically. Please check your inbox.');
      } catch (err: any) {
        const msg = err?.response?.data?.message || 'Failed to resend verification email.';
        toast.error(msg);
      } finally {
        setIsResending(false);
        setAutoResendEmail(null);
      }
    })();
  }, [autoResendEmail, isLoading, isResending]);

  const inputBase = "h-10 rounded-lg bg-slate-50/80 focus-visible:ring-orange-500/20 focus-visible:border-orange-400 placeholder:text-slate-300 transition-all duration-200";
  const inputOk = `${inputBase} border-slate-200`;
  const inputErr = `${inputBase} border-red-300 focus-visible:border-red-400 focus-visible:ring-red-500/20`;

  // Reusable focus indicator dot
  const FocusDot = ({ field }: { field: string }) => (
    <motion.div
      className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
      initial={false}
      animate={{ scale: focused === field ? 1 : 0, opacity: focused === field ? 1 : 0 }}
      transition={{ duration: 0.2 }}
    />
  );

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
        className="w-full max-w-[520px] px-6 relative z-10"
      >
        <div className="bg-white/95 rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100/80 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

          <div className="px-8 pt-8 pb-7">

            {/* Logo with gentle float */}
            <motion.div
              className="flex justify-center mb-6"
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
              className="text-center mb-6"
            >
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Create Account</h1>
              <p className="text-[13px] text-slate-400 mt-1">Sign up to get started with RGA</p>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Alert variant="destructive" className="mb-5 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
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
                        'Resend verification email'
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
              className="space-y-3.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              {/* Row 1: First + Last (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="block text-[13px] font-medium text-slate-600">First Name</label>
                  <div className="relative">
                    <Input id="firstName" name="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} onFocus={() => setFocused('firstName')} onBlur={() => setFocused(null)} disabled={isBusy} autoComplete="given-name" className={fieldErrors.firstName ? inputErr : inputOk} />
                    <FocusDot field="firstName" />
                  </div>
                  <FieldError message={fieldErrors.firstName} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="block text-[13px] font-medium text-slate-600">Last Name</label>
                  <div className="relative">
                    <Input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} onFocus={() => setFocused('lastName')} onBlur={() => setFocused(null)} disabled={isBusy} autoComplete="family-name" className={fieldErrors.lastName ? inputErr : inputOk} />
                    <FocusDot field="lastName" />
                  </div>
                  <FieldError message={fieldErrors.lastName} />
                </div>
              </div>

              {/* Row 2: Username + Email (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-[13px] font-medium text-slate-600">Username</label>
                  <div className="relative">
                    <Input id="username" name="username" placeholder="john.doe" value={formData.username} onChange={handleChange} onFocus={() => setFocused('username')} onBlur={() => setFocused(null)} disabled={isBusy} autoComplete="username" className={fieldErrors.username ? inputErr : inputOk} />
                    <FocusDot field="username" />
                  </div>
                  <FieldError message={fieldErrors.username} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-medium text-slate-600">Email address</label>
                  <div className="relative">
                    <Input id="email" name="email" type="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} disabled={isBusy} autoComplete="email" className={fieldErrors.email ? inputErr : inputOk} />
                    <FocusDot field="email" />
                  </div>
                  <FieldError message={fieldErrors.email} />
                </div>
              </div>

              {/* Row 3: Company Name (full width) */}
              <div className="space-y-1.5">
                <label htmlFor="companyName" className="block text-[13px] font-medium text-slate-600">Company Name</label>
                <div className="relative">
                  <Input id="companyName" name="companyName" placeholder="Your Company" value={formData.companyName} onChange={handleChange} onFocus={() => setFocused('company')} onBlur={() => setFocused(null)} disabled={isBusy} autoComplete="organization" className={fieldErrors.companyName ? inputErr : inputOk} />
                  <FocusDot field="company" />
                </div>
                <FieldError message={fieldErrors.companyName} />
              </div>

              {/* Row 4: Password + Confirm (side by side) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[13px] font-medium text-slate-600">Password</label>
                  <div className="relative">
                    <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} disabled={isBusy} autoComplete="new-password" className={fieldErrors.password ? inputErr : inputOk} />
                    <FocusDot field="password" />
                  </div>
                  <FieldError message={fieldErrors.password} />
                  {passwordIssues.length > 0 ? (
                    <div className="mt-1 text-[11px] text-slate-500">
                      <p className="font-medium text-slate-600">Please ensure your password includes:</p>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5">
                        {passwordIssues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Use at least 8 characters with uppercase, lowercase, a number, and a symbol.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-[13px] font-medium text-slate-600">Confirm Password</label>
                  <div className="relative">
                    <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} onFocus={() => setFocused('confirm')} onBlur={() => setFocused(null)} disabled={isBusy} autoComplete="new-password" className={fieldErrors.confirmPassword ? inputErr : inputOk} />
                    <FocusDot field="confirm" />
                  </div>
                  <FieldError message={fieldErrors.confirmPassword} />
                </div>
              </div>

              {/* Terms */}
              <div className="pt-1">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                    disabled={isBusy}
                    id="termsAccepted"
                  />
                  <label htmlFor="termsAccepted" className="text-[12px] text-slate-500 leading-4">
                    I agree to the Terms & Conditions and Privacy Policy.
                  </label>
                </div>
                <FieldError message={fieldErrors.termsAccepted} />
              </div>

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full h-11 mt-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl tracking-wide transition-all group"
                  disabled={isBusy}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Account…
                    </>
                  ) : (
                    <span className="flex items-center">
                      Create Account
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.form>

            {/* Divider */}
            <div className="relative mt-5 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
            </div>

            {/* Login link */}
            <p className="text-center text-[13px] text-slate-400">
              Already have an account?{' '}
              <button
                onClick={() => setLocation('/login')}
                className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-xs text-slate-400/60"
        >
          &copy; {new Date().getFullYear()} RGA Marketing Dashboard
        </motion.p>
      </motion.div>
    </div>
  );
}
