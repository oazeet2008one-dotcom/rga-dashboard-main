import { ShieldCheck, Lock, FileCheck, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import type { ReactNode } from 'react';

export function FooterSection() {
    return (
        <footer className="bg-slate-50 text-slate-900 pt-10 sm:pt-12 pb-6 border-t border-slate-400">
            <div className="container px-4 mx-auto max-w-6xl">

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">

                    {/* Brand & Description */}
                    <div className="space-y-4 lg:border-r lg:border-slate-400 lg:pr-12">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">N</div>
                            <span className="text-lg font-bold tracking-tight text-slate-900">NovaPulse</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Comprehensive marketing analytics platform to help your business grow with precise and fast data.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon icon={<Facebook className="w-4 h-4" />} />
                            <SocialIcon icon={<Twitter className="w-4 h-4" />} />
                            <SocialIcon icon={<Instagram className="w-4 h-4" />} />
                            <SocialIcon icon={<Linkedin className="w-4 h-4" />} />
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div className="lg:border-r lg:border-slate-400 lg:pl-12 lg:pr-12">
                        <h3 className="font-semibold text-base mb-3 text-slate-900">Product</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <FooterLink>Features</FooterLink>
                            <FooterLink>Pricing</FooterLink>
                            <FooterLink>Integrations</FooterLink>
                            <FooterLink>Security</FooterLink>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div className="lg:border-r lg:border-slate-400 lg:pl-12 lg:pr-12">
                        <h3 className="font-semibold text-base mb-3 text-slate-900">Company</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <FooterLink>About Us</FooterLink>
                            <FooterLink>Careers</FooterLink>
                            <FooterLink>Blog</FooterLink>
                            <FooterLink>Contact</FooterLink>
                        </ul>
                    </div>

                    {/* Security Badge Section */}
                    <div className="lg:pl-12">
                        <h3 className="font-semibold text-base mb-3 text-slate-900">Enterprise-Grade Security</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>SSL Secured Connection</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Lock className="w-4 h-4 text-indigo-500" />
                                <span>End-to-End Encryption</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <FileCheck className="w-4 h-4 text-blue-500" />
                                <span>GDPR Compliant</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider Line */}
                <div className="h-px bg-slate-400 mt-10" />

            </div>
        </footer>
    );
}

function SocialIcon({ icon }: { icon: ReactNode }) {
    return (
        <a href="#" className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-indigo-600 transition-all">
            {icon}
        </a>
    )
}

function FooterLink({ children }: { children: ReactNode }) {
    return (
        <li>
            <a href="#" className="hover:text-indigo-600 transition-colors">{children}</a>
        </li>
    )
}
