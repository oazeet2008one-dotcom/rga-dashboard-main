import { useState, useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Lock, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleCanvas } from '@/components/ui/particle-canvas';
import { Starfield } from '@/components/ui/starfield';
import logo from '@/components/layout/LOGO-RGA-B2.png';

// Inline field error component
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

export default function ResetPassword() {
    const [, setLocation] = useLocation();
    const search = useSearch();
    const token = useMemo(() => new URLSearchParams(search).get('token') || '', [search]);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');
    const [focused, setFocused] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const validateFields = (): boolean => {
        const errors: Record<string, string> = {};

        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }

        if (!validateFields()) return;

        setIsLoading(true);

        try {
            await apiClient.post('/auth/reset-password', {
                token,
                newPassword: password
            });
            setIsSuccess(true);
            toast.success('Password has been reset successfully!');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to reset password. The link may have expired.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // Focus indicator dot
    const FocusDot = ({ field }: { field: string }) => (
        <motion.div
            className="absolute right-10 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
            initial={false}
            animate={{ scale: focused === field ? 1 : 0, opacity: focused === field ? 1 : 0 }}
            transition={{ duration: 0.2 }}
        />
    );

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background - matching Login.tsx */}
            <div className="absolute inset-0" style={{ backgroundColor: '#1f1f1f' }} />
            <div className="absolute inset-0 pointer-events-none">
                <Starfield className="absolute inset-0" starCount={120} />
            </div>
            <div className="absolute inset-0 pointer-events-auto">
                <ParticleCanvas
                    className="absolute inset-0"
                    particleCount={70}
                    particleColor="249, 115, 22"
                    lineColor="249, 115, 22"
                    maxDistance={130}
                />
            </div>

            {/* Glow */}
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
                className="w-full max-w-[440px] px-6 relative z-10"
            >
                <div className="bg-white/95 rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100/80 overflow-hidden">

                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

                    <div className="px-8 pt-10 pb-8">

                        {/* Logo */}
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
                            className="text-center mb-6"
                        >
                            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                                {isSuccess ? 'Password Reset Complete' : 'Reset Password'}
                            </h1>
                            <p className="text-[13px] text-slate-400 mt-2">
                                {isSuccess
                                    ? 'Your password has been successfully updated.'
                                    : 'Enter your new password below.'}
                            </p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-center">
                                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setLocation('/login')}
                                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl"
                                    >
                                        Back to Login
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="mb-5"
                                        >
                                            <Alert variant="destructive" className="rounded-lg border-red-200 bg-red-50 text-red-800">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <AlertDescription className="text-sm">{error}</AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleSubmit} noValidate className="space-y-4">

                                        {/* New Password */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[13px] font-medium text-slate-600">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => {
                                                        setPassword(e.target.value);
                                                        if (fieldErrors.password) setFieldErrors(prev => { const c = { ...prev }; delete c.password; return c; });
                                                    }}
                                                    onFocus={() => setFocused('password')}
                                                    onBlur={() => setFocused(null)}
                                                    className={`h-10 pr-10 rounded-lg bg-slate-50/80 transition-all duration-200 ${fieldErrors.password ? 'border-red-300 focus-visible:ring-red-500/20' : 'border-slate-200 focus-visible:ring-orange-500/20 focus-visible:border-orange-400'}`}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                                <FocusDot field="password" />
                                            </div>
                                            <FieldError message={fieldErrors.password} />
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[13px] font-medium text-slate-600">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmPassword}
                                                    onChange={(e) => {
                                                        setConfirmPassword(e.target.value);
                                                        if (fieldErrors.confirmPassword) setFieldErrors(prev => { const c = { ...prev }; delete c.confirmPassword; return c; });
                                                    }}
                                                    onFocus={() => setFocused('confirmPassword')}
                                                    onBlur={() => setFocused(null)}
                                                    className={`h-10 pr-10 rounded-lg bg-slate-50/80 transition-all duration-200 ${fieldErrors.confirmPassword ? 'border-red-300 focus-visible:ring-red-500/20' : 'border-slate-200 focus-visible:ring-orange-500/20 focus-visible:border-orange-400'}`}
                                                    placeholder="••••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                                <FocusDot field="confirmPassword" />
                                            </div>
                                            <FieldError message={fieldErrors.confirmPassword} />
                                        </div>

                                        <div className="pt-2">
                                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    type="submit"
                                                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl tracking-wide transition-all group"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Resetting...
                                                        </>
                                                    ) : (
                                                        <span className="flex items-center">
                                                            Reset Password
                                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                        </span>
                                                    )}
                                                </Button>
                                            </motion.div>
                                        </div>

                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center text-xs text-slate-400/60"
                >
                    &copy; {new Date().getFullYear()} RGA Dashboard. All rights reserved.
                </motion.p>
            </motion.div>
        </div>
    );
}
