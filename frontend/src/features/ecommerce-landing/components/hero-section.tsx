import { Button } from '@/components/ui/button';
import { BarChart3, ShoppingBag, Store } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="w-full bg-white text-slate-900">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                                What is RGA.Data?
                            </h1>
                            <p className="text-base/7 text-slate-600 sm:text-lg">
                                Comprehensive solutions for your e-commerce business.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                size="lg"
                                className="bg-indigo-600 text-white hover:bg-indigo-600/90"
                                asChild
                            >
                                <a href="mailto:sales@yourcompany.com">Contact Us</a>
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                                asChild
                            >
                                <a href="mailto:sales@yourcompany.com?subject=Free Consultation Request">Free Consultation</a>
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-2 text-slate-700">
                            <div className="flex items-center gap-2 text-sm">
                                <Store className="h-4 w-4" />
                                <span>Store Management</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <ShoppingBag className="h-4 w-4" />
                                <span>Boost Sales</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <BarChart3 className="h-4 w-4" />
                                <span>Trackable Growth</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-6 rounded-3xl bg-slate-100 blur-2xl" />
                        <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">Orders</div>
                                    <div className="mt-1 text-2xl font-semibold">+24%</div>
                                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                                        <div className="h-2 w-2/3 rounded-full bg-indigo-500" />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">Revenue</div>
                                    <div className="mt-1 text-2xl font-semibold">฿ 128k</div>
                                    <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                                        <div className="h-2 w-1/2 rounded-full bg-emerald-500" />
                                    </div>
                                </div>
                                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">E-commerce Illustration</div>
                                    <div className="mt-4 flex items-center justify-center">
                                        <svg
                                            width="340"
                                            height="160"
                                            viewBox="0 0 340 160"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-full max-w-md"
                                        >
                                            <rect x="14" y="16" width="312" height="128" rx="18" fill="rgba(15,23,42,0.06)" />
                                            <rect x="34" y="38" width="116" height="18" rx="9" fill="rgba(15,23,42,0.14)" />
                                            <rect x="34" y="66" width="200" height="10" rx="5" fill="rgba(15,23,42,0.10)" />
                                            <rect x="34" y="84" width="176" height="10" rx="5" fill="rgba(15,23,42,0.10)" />
                                            <rect x="34" y="104" width="72" height="28" rx="10" fill="rgba(15,23,42,0.08)" />
                                            <path
                                                d="M238 114c0-16 13-29 29-29h16v58h-16c-16 0-29-13-29-29Z"
                                                fill="rgba(15,23,42,0.08)"
                                            />
                                            <path
                                                d="M266 78h39v64h-39c-17 0-31-14-31-31V109c0-17 14-31 31-31Z"
                                                fill="rgba(58, 198, 16, 0.12)"
                                            />
                                            <circle cx="279" cy="106" r="8" fill="rgba(15,23,42,0.14)" />
                                            <circle cx="306" cy="106" r="8" fill="rgba(15,23,42,0.14)" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
