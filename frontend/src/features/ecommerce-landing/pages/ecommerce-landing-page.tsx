import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, CheckCircle2, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { HeroSection } from '../components/hero-section';
import { TestimonialsSection } from '../components/testimonials-section';

import { FooterSection } from '../components/footer-section';

// Define Plan Type
type Plan = {
    name: string;
    price: string;
    description: string;
    features: string[];
    highlight?: boolean;
    buttonText: string;
};

const PLANS: Plan[] = [
    {
        name: 'Starter',
        price: '฿490',
        description: 'Perfect for individuals and small businesses just starting out.',
        features: [
            'All-in-one Dashboard',
            'Connect up to 2 Platforms',
            'Basic Performance Metrics',
            'Export PDF Reports',
            'Email Support',
        ],
        buttonText: 'Get Started',
        highlight: false,
    },
    {
        name: 'Pro',
        price: '฿990',
        description: 'For growing teams that need deeper insights and more flexibility.',
        features: [
            'Everything in Starter, plus:',
            'Unlimited Platform Connections',
            'Campaign Management',
            'SEO & Web Analytics',
            'Customizable Alerts',
            'Export CSV/Excel Reports',
        ],
        buttonText: 'Get Pro',
        highlight: true, // Recommended
    },
    {
        name: 'Enterprise',
        price: '฿2,990',
        description: 'Advanced solutions for large organizations and agencies.',
        features: [
            'Everything in Pro, plus:',
            'AI-Powered Insights & Chat',
            'Trend Analysis & Forecasting',
            'Team Roles & Permissions',
            'Priority 24/7 Support',
            'Onboarding Session',
        ],
        buttonText: 'Contact Sales',
        highlight: false,
    },
];

export default function EcommerceLandingPage() {
    const [location] = useLocation();

    useEffect(() => {
        if (!location.includes('#pricing')) return;

        const el = document.getElementById('pricing');
        if (!el) return;

        const getScrollParent = (node: HTMLElement | null) => {
            let current: HTMLElement | null = node;
            while (current) {
                const style = window.getComputedStyle(current);
                const overflowY = style.overflowY;
                if (overflowY === 'auto' || overflowY === 'scroll') {
                    return current;
                }
                current = current.parentElement;
            }
            return null;
        };

        // Defer to ensure layout is painted (and DashboardLayout scroll container exists)
        window.setTimeout(() => {
            const scrollParent = getScrollParent(el.parentElement);

            if (!scrollParent) {
                el.scrollIntoView({ behavior: 'auto', block: 'start' });
                return;
            }

            const jumpToPricing = () => {
                const parentRect = scrollParent.getBoundingClientRect();
                const elRect = el.getBoundingClientRect();
                const top = scrollParent.scrollTop + (elRect.top - parentRect.top) - 16;

                // Instant jump (no smooth scroll)
                scrollParent.scrollTop = top;
            };

            jumpToPricing();
            window.requestAnimationFrame(jumpToPricing);
        }, 0);
    }, [location]);

    return (
        <main className="min-h-screen bg-slate-50/50">
            <HeroSection />

            <section className="w-full py-14 sm:py-16 lg:py-24">
                <div className="container px-4 mx-auto max-w-6xl space-y-16 sm:space-y-24">

                    {/* Intro & Key Features */}
                    <div className="space-y-12 sm:space-y-16">
                        <div className="relative text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
                            <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />
                            <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 shadow-sm backdrop-blur">
                                Powering Growth
                            </div>
                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600">
                                NovaPulse Analytics
                            </h2>
                            <p className="text-base sm:text-xl sm:leading-8 text-slate-600 max-w-2xl mx-auto">
                                Real-time analytics dashboard that helps you make faster, smarter decisions on ad spend and inventory.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                'All-in-one dashboard overview',
                                'Campaign performance summaries',
                                'Customizable anomaly alerts',
                                'Exportable CSV/PDF reports',
                                'Multi-level user access',
                                'Cross-platform data syncing',
                            ].map((item) => (
                                <div key={item} className="group relative flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white/60 border border-slate-100 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-white hover:border-indigo-100">
                                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                    <div className="relative mt-0.5 p-1.5 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm group-hover:shadow-indigo-200">
                                        <CheckCircle2 className="w-[18px] h-[18px]" />
                                    </div>
                                    <div className="relative text-sm sm:text-base font-medium text-slate-700 pt-0.5 group-hover:text-slate-900 transition-colors">{item}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div id="pricing" className="space-y-10 relative">
                        {/* Decorative background blur */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-100/50 blur-[100px] -z-10 rounded-full mix-blend-multiply opacity-70" />

                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 shadow-sm backdrop-blur">
                                Plans & Pricing
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Simple, Transparent Pricing</h3>
                            <p className="text-base sm:text-lg text-slate-600">No hidden fees. Choose the plan that fits your business needs.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3 lg:gap-8 items-start">
                            {PLANS.map((plan) => (
                                <PricingCard key={plan.name} plan={plan} />
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            <TestimonialsSection />

            <FooterSection />
        </main>
    );
}

function PricingCard({ plan }: { plan: Plan }) {
    return (
        <Card className={cn(
            "flex flex-col h-full relative transition-all duration-300 rounded-2xl border-0 overflow-visible group",
            plan.highlight
                ? "shadow-2xl shadow-indigo-200/40 scale-105 z-10 bg-white/90 backdrop-blur ring-1 ring-indigo-100"
                : "shadow-lg shadow-slate-200/60 hover:shadow-xl hover:-translate-y-2 bg-white/70 backdrop-blur"
        )}>
            <div aria-hidden="true" className={cn(
                "pointer-events-none absolute inset-0 -z-20 rounded-2xl opacity-100",
                plan.highlight
                    ? "bg-gradient-to-b from-indigo-500/90 to-purple-600/90"
                    : "bg-gradient-to-b from-slate-200/80 to-slate-100/50"
            )} style={{ margin: '-1px' }} />

            <div aria-hidden="true" className={cn(
                "pointer-events-none absolute inset-0 rounded-2xl -z-10",
                plan.highlight
                    ? "bg-gradient-to-br from-indigo-50/80 via-white to-white"
                    : "bg-gradient-to-br from-white via-white/80 to-slate-50/70"
            )} />

            {/* Gradient Border for Highlighted Card */}
            {plan.highlight && (
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-indigo-500 to-purple-600 p-[2px] opacity-100" style={{ margin: '-2px' }} />
            )}
            {/* Inner White Background for Gradient Border */}
            <div className={cn(
                "absolute inset-0 rounded-2xl bg-white h-full w-full -z-10",
                plan.highlight && "m-[1px]" // match border width
            )} />

            {plan.highlight && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Popular Choice
                    </span>
                </div>
            )}

            <CardHeader className="space-y-2 pb-5 pt-7">
                <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                <div className="text-sm text-slate-500 h-10 leading-snug">{plan.description}</div>
            </CardHeader>

            <CardContent className="flex-1 space-y-7">
                <div className="flex items-baseline gap-1">
                    <span
                        className={cn(
                            "text-5xl font-extrabold tracking-tight",
                            plan.highlight
                                ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-purple-700 to-fuchsia-700"
                                : "text-indigo-700"
                        )}
                    >
                        {plan.price}
                    </span>
                    <span className="text-base font-medium text-slate-500">/mo</span>
                </div>

                <ul className="space-y-3">
                    {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                            <div className={cn(
                                "mt-0.5 p-0.5 rounded-full shrink-0",
                                plan.highlight ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-600"
                            )}>
                                <Check className="h-3 w-3" />
                            </div>
                            <span className="font-medium">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="pb-7 pt-4">
                <Button
                    size="lg"
                    className={cn(
                        "w-full h-12 rounded-xl text-base font-semibold transition-all duration-300 shadow-md hover:shadow-lg border",
                        plan.highlight
                            ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 hover:from-indigo-700 hover:via-purple-700 hover:to-fuchsia-700 text-white border-white/10 shadow-indigo-300/40"
                            : "bg-slate-900 hover:bg-slate-800 text-white border-slate-900/10 shadow-slate-300/40"
                    )}
                >
                    {plan.buttonText}
                </Button>
            </CardFooter>
        </Card>
    )
}
