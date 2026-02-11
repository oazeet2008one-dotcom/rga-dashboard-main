// frontend/src/components/layout/AppSidebar.tsx
// =============================================================================
// Application Sidebar - Premium Design
// Features: Glassmorphism, Gradient Active States, Smooth Animations
// =============================================================================

import { useLocation } from 'wouter';
import { useAuthStore, selectUser } from '@/stores/auth-store';
import { UserRole } from '@/types/enums';
import {
    Sidebar,
} from '@/components/ui/sidebar';
import {
    BarChart3,
    Database,
    FileText,
    LogOut,
    Search,
    Settings,
    TrendingUp,
    Users,
    Zap,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import logo from '@/components/layout/LOGO-RGA-B2.png';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// =============================================================================
// Types & Menu Configuration
// =============================================================================

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    comingSoon?: boolean;
    adminOnly?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
    {
        title: 'Analytics',
        items: [
            { label: 'Overview', href: '/dashboard', icon: BarChart3 },
            { label: 'Campaigns', href: '/campaigns', icon: Zap },
            { label: 'Data Sources', href: '/data-sources', icon: Database },
        ],
    },
    {
        title: 'Intelligence',
        items: [
            { label: 'SEO & Web', href: '/seo-web-analytics', icon: Search },
            { label: 'AI Insights & Tools', href: '/ai-insights', icon: Sparkles },
            { label: 'E-commerce Insights', href: '/ecommerce-insights', icon: TrendingUp },

        ],
    },
    {
        title: 'System',
        items: [
            { label: 'Settings', href: '/settings', icon: Settings },
            { label: 'Reports', href: '/reports', icon: FileText },
        ],
    },
];

// =============================================================================
// Component
// =============================================================================

export function AppSidebar() {
    const [location, setLocation] = useLocation();
    const user = useAuthStore(selectUser);
    const logout = useAuthStore((state) => state.logout);

    // ✅ FIX: Sub-route matching (e.g., /campaigns/abc123 highlights /campaigns)
    const isActive = (url: string) =>
        location === url || location.startsWith(`${url}/`);

    const handleLogout = () => {
        logout();
        setLocation('/login');
    };

    // Add admin-only items dynamically
    const getNavGroups = (): NavGroup[] => {
        return NAV_GROUPS.map((group) => {
            if (group.title === 'System' && user?.role === UserRole.ADMIN) {
                return {
                    ...group,
                    items: [
                        ...group.items,
                        { label: 'Users', href: '/users', icon: Users, adminOnly: true },
                    ],
                };
            }
            return group;
        });
    };

    return (
        <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/20 w-[260px] z-50">
            <div className="flex flex-col h-full w-full">

                {/* Header / Logo */}
                <div className="px-6 py-6 pb-2">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <img
                                src={logo}
                                alt="RGA Data Logo"
                                className="h-10 w-auto object-contain relative z-10"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {getNavGroups().map((group, groupIndex) => (
                        <div
                            key={group.title}
                            className="space-y-2"
                        >
                            <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 select-none flex items-center gap-2">
                                {group.title}
                                <div className="h-px flex-1 bg-slate-100/50" />
                            </h3>

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);

                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => !item.comingSoon && setLocation(item.href)}
                                            disabled={item.comingSoon}
                                            className={cn(
                                                "w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                                                active
                                                    ? "text-white shadow-md shadow-orange-500/20"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                                item.comingSoon && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {/* Active Background Gradient */}
                                            {active && (
                                                <motion.div
                                                    layoutId="sidebar-active-bg"
                                                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}

                                            {/* Icon */}
                                            <Icon className={cn(
                                                "w-[18px] h-[18px] relative z-10 transition-transform duration-300 group-hover:scale-110",
                                                active ? "text-white" : "text-orange-500"
                                            )} />

                                            {/* Label */}
                                            <span className={cn(
                                                "text-[13px] font-medium relative z-10 tracking-wide",
                                                active ? "text-white" : "text-slate-900"
                                            )}>
                                                {item.label}
                                            </span>

                                            {/* Coming Soon Badge */}
                                            {item.comingSoon && (
                                                <span className="ml-auto text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200">
                                                    Soon
                                                </span>
                                            )}

                                            {/* Active External Indicator */}
                                            {active && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="ml-auto relative z-10"
                                                >
                                                    <ChevronRight className="w-4 h-4 text-white/80" />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-slate-100/60 bg-slate-50/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 px-2">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm shadow-md shadow-indigo-500/20 ring-2 ring-white">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate font-medium">
                                {user?.role || 'Viewer'}
                            </p>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>
        </Sidebar>
    );
}
