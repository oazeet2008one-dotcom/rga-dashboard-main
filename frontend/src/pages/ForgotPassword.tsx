import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleCanvas } from '@/components/ui/particle-canvas';
import { Starfield } from '@/components/ui/starfield';
import logo from '@/components/layout/LOGO-RGA-B2.png';
import { toast } from 'sonner';

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

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [focused, setFocused] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [, setLocation] = useLocation();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validateFields = (): boolean => {
        const errors: Record<string, string> = {};
        if (!email.trim()) {
            errors.email = 'Email is required';
        } else if (!emailRegex.test(email)) {
            errors.email = 'Invalid email format';
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!validateFields()) {
            setIsLoading(false);
            return;
        }

        try {
            // Mock API call for now (replace with actual API later)
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSubmitted(true);
            toast.success('Reset link sent successfully!');
        } catch (err) {
            setError('Something went wrong. Please try again.');
            toast.error('Failed to send reset link');
        } finally {
            setIsLoading(false);
        }
    };

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
                className="w-full max-w-[440px] px-6 relative z-10"
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
                            className="text-center mb-8"
                        >
                            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                                {isSubmitted ? 'Check your email' : 'Forgot Password?'}
                            </h1>
                            <p className="text-[13px] text-slate-400 mt-2 px-4 leading-relaxed">
                                {isSubmitted
                                    ? <span>We have sent a password reset link to <br /><strong className="text-slate-700">{email}</strong></span>
                                    : 'Enter your email address and we\'ll send you a link to reset your password.'}
                            </p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {isSubmitted ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="space-y-6"
                                >
                                    <div className="flex justify-center">
                                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                            <Mail className="w-8 h-8 text-green-500" />
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setLocation('/login')}
                                            className="text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to login
                                        </Button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {error && (
                                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 300 }}>
                                            <Alert variant="destructive" className="mb-5 rounded-lg border-red-200 bg-red-50 text-red-800">
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                                <AlertDescription className="text-sm">{error}</AlertDescription>
                                            </Alert>
                                        </motion.div>
                                    )}

                                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        if (fieldErrors.email) setFieldErrors(prev => { const c = { ...prev }; delete c.email; return c; });
                                                    }}
                                                    onFocus={() => setFocused('email')}
                                                    onBlur={() => setFocused(null)}
                                                    disabled={isLoading}
                                                    autoComplete="email"
                                                    className={`h-10 rounded-lg bg-slate-50/80 focus-visible:ring-orange-500/20 focus-visible:border-orange-400 placeholder:text-slate-300 transition-all duration-200 ${fieldErrors.email ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-500/20' : 'border-slate-200'}`}
                                                />
                                                <FocusDot field="email" />
                                            </div>
                                            <FieldError message={fieldErrors.email} />
                                        </div>

                                        <div className="pt-1">
                                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    type="submit"
                                                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl tracking-wide transition-all group"
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            Sending link...
                                                        </>
                                                    ) : (
                                                        <span className="flex items-center">
                                                            Send Reset Link
                                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                        </span>
                                                    )}
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </form>

                                    {/* Back to login link */}
                                    <div className="mt-6 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setLocation('/login')}
                                            className="text-[13px] text-slate-400 hover:text-orange-600 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                            Back to login
                                        </button>
                                    </div>
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
                    &copy; {new Date().getFullYear()} RGA Marketing Dashboard
                </motion.p>
            </motion.div>
        </div>
    );
}
