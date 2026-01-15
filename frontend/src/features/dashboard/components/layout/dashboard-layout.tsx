// src/features/dashboard/components/layout/dashboard-layout.tsx
// =============================================================================
// Dashboard Layout Component
// Structure: Sidebar + Header + Main Content
// =============================================================================

import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    LayoutDashboard,
    Megaphone,
    Settings,
    Calendar,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

// =============================================================================
// Navigation Items
// =============================================================================

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { href: '/settings', label: 'Settings', icon: Settings },
];

// =============================================================================
// Sidebar Component
// =============================================================================

function Sidebar() {
    const [location] = useLocation();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-muted/20">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <LayoutDashboard className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-semibold">RGA Dashboard</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => {
                    const isActive = location === item.href || location.startsWith(`${item.href}/`);
                    return (
                        <Link key={item.href} href={item.href}>
                            <span
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

// =============================================================================
// Header Component
// =============================================================================

interface HeaderProps {
    title: string;
    subtitle?: string;
}

function Header({ title, subtitle }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground">{subtitle}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Last 7 days</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}

// =============================================================================
// Main Layout Export
// =============================================================================

export function DashboardLayout({
    children,
    title = 'Dashboard Overview',
    subtitle,
}: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="pl-64">
                {/* Header */}
                <Header title={title} subtitle={subtitle} />

                {/* Content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}

export default DashboardLayout;
