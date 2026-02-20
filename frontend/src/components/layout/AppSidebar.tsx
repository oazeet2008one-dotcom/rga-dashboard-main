// frontend/src/components/layout/AppSidebar.tsx
// =============================================================================
// Application Sidebar - Uses Shadcn Sidebar Components
// Features: Sub-route highlighting, mobile Sheet drawer, keyboard shortcuts
// =============================================================================

import { useLocation } from 'wouter';
import { useAuthStore, selectUser } from '@/stores/auth-store';
import { UserRole } from '@/types/enums';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
            { label: 'AI Insights', href: '/ai-insights', icon: Zap, comingSoon: true },
            { label: 'NovaPulse Overview', href: '/ecommerce-insights', icon: TrendingUp },
            { label: 'SEO & Web', href: '/seo-web-analytics', icon: Search },
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
        <Sidebar className="border-r border-slate-100 bg-white shadow-sm animate-in slide-in-from-left duration-500 fade-in">
            <div className="flex flex-col h-full w-full">

                {/* Header / Logo */}
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold shadow-orange-200 shadow-lg transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                            R
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xl text-slate-900 tracking-tight leading-none transition-colors group-hover:text-orange-600">
                                RGA<span className="text-orange-500">.Data</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5 group-hover:text-amber-500 transition-colors">Analytics Platform</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {getNavGroups().map((group, groupIndex) => (
                        <div key={group.title} className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-500" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 select-none">
                                {group.title}
                            </p>

                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);

                                return (
                                    <button
                                        key={item.href}
                                        onClick={() => !item.comingSoon && setLocation(item.href)}
                                        disabled={item.comingSoon}
                                        className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 ease-out text-sm font-medium relative overflow-hidden
                                            ${active
                                                ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100/50 translate-x-1'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1 hover:shadow-sm'
                                            } ${item.comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                                    >
                                        <div className="flex items-center gap-3 z-10">
                                            <Icon
                                                className={`h-[18px] w-[18px] transition-transform duration-300 ${active ? 'text-orange-600 scale-110' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110'
                                                    }`}
                                                strokeWidth={2}
                                            />
                                            <span>{item.label}</span>
                                        </div>

                                        {item.comingSoon && (
                                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-semibold border border-slate-200 z-10">SOON</span>
                                        )}
                                        {!item.comingSoon && active && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm transition-transform duration-300 animate-pulse" />
                                        )}

                                        {/* Subtle hover splash effect (optional, css only) */}
                                        {!active && !item.comingSoon && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Profile Widget & Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 transition-all hover:bg-orange-50/30">
                    <div className="bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                        <div className="flex items-center gap-3 p-2 rounded-xl cursor-pointer group">
                            <div className="relative h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-100 overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-sm">
                                <span className="font-bold text-slate-600 text-sm group-hover:text-orange-600 transition-colors">
                                    {user?.name?.charAt(0) || 'A'}
                                </span>
                            </div>
                            <div className="flex-1 overflow-hidden transition-all duration-300 group-hover:pl-1">
                                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-orange-700 transition-colors">{user?.name || 'Admin'}</p>
                                <p className="text-xs text-slate-500 truncate font-medium">{user?.email || 'admin@rga.local'}</p>
                            </div>
                            <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 hover:rotate-90">
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Sidebar>
    );
}
