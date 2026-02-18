import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Check, CheckCircle2, Sparkles } from 'lucide-react';
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
    return (
        <main className="min-h-screen bg-slate-50/50">
            <HeroSection />

            <section className="w-full py-20 lg:py-24">
                <div className="container px-4 mx-auto max-w-6xl space-y-24">

                    {/* Intro & Key Features */}
                    <div className="space-y-16">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                NovaPulse Analytics
                            </h2>
                            <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Powering Growth</div>
                            <p className="text-xl leading-8 text-slate-600 max-w-2xl mx-auto">
                                Real-time analytics dashboard that helps you make faster, smarter decisions on ad spend and inventory.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                'All-in-one dashboard overview',
                                'Campaign performance summaries',
                                'Customizable anomaly alerts',
                                'Exportable CSV/PDF reports',
                                'Multi-level user access',
                                'Cross-platform data syncing',
                            ].map((item) => (
                                <div key={item} className="group flex items-start gap-4 p-6 rounded-2xl bg-white/50 border border-slate-100 shadow-sm hover:shadow-md hover:bg-white hover:border-indigo-100 transition-all duration-300">
                                    <div className="mt-1 p-2 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm group-hover:shadow-indigo-200">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="text-base font-medium text-slate-700 pt-1 group-hover:text-slate-900 transition-colors">{item}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div id="pricing" className="space-y-12 relative">
                        {/* Decorative background blur */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-100/50 blur-[100px] -z-10 rounded-full mix-blend-multiply opacity-70" />

                        <div className="text-center space-y-4">
                            <h3 className="text-3xl font-bold tracking-tight text-slate-900">Simple, Transparent Pricing</h3>
                            <p className="text-lg text-slate-600">No hidden fees. Choose the plan that fits your business needs.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 items-start">
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
                ? "shadow-2xl shadow-indigo-200/50 scale-105 z-10 bg-white ring-1 ring-indigo-50"
                : "shadow-lg hover:shadow-xl hover:-translate-y-2 bg-white/80 backdrop-blur-sm"
        )}>
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

            <CardHeader className="space-y-2 pb-6 pt-8">
                <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>
                <div className="text-sm text-slate-500 h-10 leading-snug">{plan.description}</div>
            </CardHeader>

            <CardContent className="flex-1 space-y-8">
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-base font-medium text-slate-500">/mo</span>
                </div>

                <ul className="space-y-4">
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

            <CardFooter className="pb-8 pt-4">
                <Button
                    size="lg"
                    className={cn(
                        "w-full h-12 rounded-xl text-base font-semibold transition-all duration-300 shadow-md hover:shadow-lg",
                        plan.highlight
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
                            : "bg-slate-900 hover:bg-slate-800 text-white border-0"
                    )}
                >
                    {plan.buttonText}
                </Button>
            </CardFooter>
        </Card>
    )
}
