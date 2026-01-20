# Refactor Plan: Layout Migration (Shadcn Sidebar)

**Phase:** Step 2 (Planning)  
**Status:** Ready for Implementation  
**Created:** 2026-01-20  
**Prerequisite:** [AUDIT_REPORT_LAYOUT.md](../audit/AUDIT_REPORT_LAYOUT.md)

---

## Executive Summary

This plan migrates from the **OLD manual sidebar** (`components/layout/Sidebar.tsx`) to the **NEW Shadcn sidebar** (`components/ui/sidebar.tsx`), fixing:

- ✅ Broken sub-route highlighting
- ✅ Missing mobile menu (Sheet drawer)
- ✅ Keyboard shortcuts (Ctrl+B)
- ✅ Proper `data-active` styling

---

## 1. New Component: `AppSidebar.tsx`

### [NEW] [AppSidebar.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/components/layout/AppSidebar.tsx)

```tsx
// frontend/src/components/layout/AppSidebar.tsx
// =============================================================================
// Application Sidebar - Uses Shadcn Sidebar Components
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
      { label: 'Trend Analysis', href: '/trend-analysis', icon: TrendingUp, comingSoon: true },
      { label: 'SEO & Web', href: '/seo-web-analytics', icon: Search, comingSoon: true },
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
    <Sidebar>
      {/* Header / Logo */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            R
          </div>
          <span className="font-bold text-xl text-sidebar-foreground tracking-tight">
            RGA<span className="text-indigo-600">.Data</span>
          </span>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {getNavGroups().map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  if (item.comingSoon) {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          disabled
                          tooltip={`${item.label} (Coming Soon)`}
                        >
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                          <span className="ml-auto text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            Soon
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        onClick={() => setLocation(item.href)}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer / User Info */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {/* User Info */}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </SidebarMenuItem>

          <SidebarSeparator />

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign Out"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

---

## 2. Updated Component: `DashboardLayout.tsx`

### [MODIFY] [DashboardLayout.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/components/layout/DashboardLayout.tsx)

```tsx
// frontend/src/components/layout/DashboardLayout.tsx
// =============================================================================
// Dashboard Layout - Uses Shadcn SidebarProvider for state management
// =============================================================================

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <SidebarInset>
        {/* Mobile Header with Trigger */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">
              R
            </div>
            <span className="font-semibold text-sm">RGA.Data</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

---

## 3. CSS Variables (Already Present ✅)

The required Shadcn sidebar CSS variables are **already defined** in `index.css`. No changes needed.

**Verification** - [index.css lines 35-42, 73-78](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/index.css#L35-L78):

```css
:root {
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.235 0.015 65);
  --sidebar-primary: var(--color-blue-600);
  --sidebar-primary-foreground: var(--color-blue-50);
  --sidebar-accent: oklch(0.967 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.141 0.005 285.823);
  --sidebar-border: oklch(0.92 0.004 286.32);
  --sidebar-ring: oklch(0.623 0.214 259.815);
}

/* Also has .dark variants */
```

**Status:** ✅ No CSS changes required

---

## 4. Migration Checklist (Step 3 Execution)

### Phase A: Create New Components

- [ ] Create `frontend/src/components/layout/AppSidebar.tsx` with code from Section 1
- [ ] Update `frontend/src/components/layout/DashboardLayout.tsx` with code from Section 2

### Phase B: Verification

- [ ] Run `npm run dev` - verify no TypeScript errors
- [ ] **Desktop Test:** 
  - Navigate to `/campaigns` → Sidebar highlights "Campaigns"
  - Navigate to `/campaigns/abc123` → Sidebar still highlights "Campaigns"
- [ ] **Mobile Test (DevTools → iPhone SE):**
  - Sidebar hidden by default
  - Click hamburger icon → Sheet slides in
  - Click menu item → Navigates and closes sheet
- [ ] **Keyboard Test:** Press `Ctrl+B` → Sidebar toggles

### Phase C: Cleanup

- [ ] DELETE `frontend/src/components/layout/Sidebar.tsx` (old file)
- [ ] Search codebase for any remaining imports of old `Sidebar`

---

## 5. Files Summary

| Action | File | Purpose |
|--------|------|---------|
| **NEW** | `frontend/src/components/layout/AppSidebar.tsx` | Shadcn-based sidebar |
| **MODIFY** | `frontend/src/components/layout/DashboardLayout.tsx` | Add SidebarProvider wrapper |
| **DELETE** | `frontend/src/components/layout/Sidebar.tsx` | Old manual sidebar |
| **NO CHANGE** | `frontend/src/index.css` | CSS already configured |
| **NO CHANGE** | `frontend/src/components/ui/sidebar.tsx` | Shadcn component (pre-installed) |

---

## 6. Visual Test Scenarios

### Desktop (Width > 768px)

```
┌─────────────────────────────────────────────────────────────┐
│  [R] RGA.Data           │                                   │
├─────────────────────────│                                   │
│  ANALYTICS              │                                   │
│  ► Overview             │         Page Content              │
│    Campaigns ← ACTIVE   │                                   │
│    Data Sources         │                                   │
├─────────────────────────│                                   │
│  INTELLIGENCE           │                                   │
│    AI Insights [Soon]   │                                   │
│    ...                  │                                   │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (Width < 768px)

```
┌─────────────────────────┐
│ ☰  [R] RGA.Data         │  ← SidebarTrigger visible
├─────────────────────────┤
│                         │
│     Page Content        │
│                         │
└─────────────────────────┘

[After clicking ☰]:

┌──────────────┬──────────┐
│ Sheet Drawer │  Overlay │
│ ───────────  │          │
│ ANALYTICS    │          │
│ ► Overview   │          │
│   Campaigns  │          │
│ ...          │          │
└──────────────┴──────────┘
```

---

## 7. Risk Assessment

| Risk | Mitigation |
|------|------------|
| TypeScript errors in new component | Test compilation before deleting old file |
| Missing icons | Verified all icons are imported from lucide-react |
| Layout shift | SidebarInset handles content positioning |
| Dark mode broken | CSS variables include `.dark` variants |

---

## Approval Required

Please review this plan and approve before proceeding to Step 3 (Implementation).
