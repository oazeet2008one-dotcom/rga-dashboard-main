# UI Standardization & Layout Consistency Audit

**Generated:** 2026-01-20  
**Auditor:** Senior Frontend Engineer & UI/UX Specialist  
**Status:** Micro-Engineering Process - Step 1 (Audit Complete)

---

## Executive Summary

This audit examines the "Frankenstein UI" issues reported after the Shadcn Sidebar migration. We found **4 different layout wrappers** in use across the application, causing inconsistent layouts, duplicate sidebars, and z-index conflicts.

> [!CAUTION]
> **Critical Issue:** The NEW Shadcn sidebar (`DashboardLayout`) is NOT being used by all pages. Some pages still import OLD layout wrappers with their own internal sidebars, causing **double sidebars** and broken layouts.

---

## 1. Layout Consistency Matrix

### Wrapper Usage by Page

| Page | Import Path | Wrapper Used | Internal Sidebar? | Status |
|------|-------------|--------------|-------------------|--------|
| **Dashboard** | `features/dashboard/.../dashboard-layout` | Feature-local | ✅ YES (OLD fixed) | 🔴 BROKEN |
| **Campaigns** | `components/layout/DashboardLayout` | Global Shadcn | ❌ No | ✅ CORRECT |
| **Data Sources** | `features/dashboard/.../dashboard-layout` | Feature-local | ✅ YES (OLD fixed) | 🔴 BROKEN |
| **Settings** | Unknown (legacy page) | Unknown | TBD | ⚠️ AUDIT |
| **Reports** | Unknown (legacy page) | Unknown | TBD | ⚠️ AUDIT |

### Layout Wrapper Inventory

| # | File | Purpose | Status |
|---|------|---------|--------|
| 1 | [DashboardLayout.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/components/layout/DashboardLayout.tsx) | ✅ **NEW Shadcn** - `SidebarProvider` + `AppSidebar` | **USE THIS** |
| 2 | [dashboard-layout.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/features/dashboard/components/layout/dashboard-layout.tsx) | ❌ **OLD** - Fixed sidebar, `pl-64`, no mobile | **DELETE** |
| 3 | [DashboardShell.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/components/layout/DashboardShell.tsx) | ❌ **LEGACY** - Custom orange theme, Copilot FAB | **DELETE** |
| 4 | `<Sidebar />` in features | ❌ **DEAD** - Deleted in migration | N/A |

---

## 2. 🔴 Visual Bugs List

### Bug #1: Double Sidebar on Dashboard

**Symptom:** Dashboard page shows TWO sidebars - one from NEW `AppSidebar` (via global layout) AND one from OLD feature-local `dashboard-layout.tsx`.

**Root Cause:**
```tsx
// dashboard-page.tsx (Line 9)
import { DashboardLayout } from '../components/layout/dashboard-layout';
// ❌ Uses OLD feature-local layout with internal <Sidebar />
```

**Evidence:** [dashboard-layout.tsx lines 50-88](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/features/dashboard/components/layout/dashboard-layout.tsx#L50-L88):
```tsx
function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r">
      // ❌ OLD fixed sidebar INSIDE the layout
    </aside>
  );
}
```

---

### Bug #2: Data Sources Uses Wrong Layout

**Symptom:** Data Sources page has OLD fixed sidebar style.

**Root Cause:**
```tsx
// data-sources-page.tsx (Line 8)
import { DashboardLayout } from '@/features/dashboard/components/layout/dashboard-layout';
// ❌ Imports from WRONG location (feature-local, not global)
```

**Should Be:**
```tsx
import { DashboardLayout } from '@/components/layout/DashboardLayout';
// ✅ Use global Shadcn layout
```

---

### Bug #3: Content Hidden Behind Sidebar

**Symptom:** Page content gets cut off on left side.

**Root Cause:** OLD layout uses `pl-64` (padding-left: 256px) for fixed sidebar, but NEW `SidebarInset` handles this automatically.

```tsx
// OLD layout (dashboard-layout.tsx line 137)
<div className="pl-64">  // ❌ Hardcoded padding

// NEW layout (DashboardLayout.tsx with SidebarInset)
<SidebarInset>  // ✅ Auto-adjusts for sidebar width
```

---

### Bug #4: Mobile Trigger Overlap

**Symptom:** On mobile, hamburger icon may overlap with page title.

**Analysis:** This is NOT currently broken because:
- NEW `DashboardLayout` has dedicated mobile header at [lines 23-31](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/components/layout/DashboardLayout.tsx#L23-L31)
- Trigger is properly isolated in `<header className="md:hidden">`

**Status:** ✅ NOT A BUG (if pages use correct layout)

---

## 3. Component Standardization (Legacy Inventory)

### UI Components Status

| Component Type | Standard | Current Usage | Status |
|----------------|----------|---------------|--------|
| **Tables** | Shadcn `<Table>` | ✅ [campaigns-table.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/features/campaigns/components/campaigns-table.tsx) uses `<Table>`, `<TableHeader>`, `<TableRow>` | ✅ GOOD |
| **Cards** | Shadcn `<Card>` | ✅ [data-source-card.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/features/data-sources/components/data-source-card.tsx) uses `<Card>`, `<CardHeader>`, `<CardContent>` | ✅ GOOD |
| **Buttons** | Shadcn `<Button>` | ✅ All pages use `<Button>` with variants | ✅ GOOD |
| **Badges** | Shadcn `<Badge>` | ✅ Status badges use `<Badge variant="...">` | ✅ GOOD |
| **Icons** | Lucide | ✅ All icons from `lucide-react` | ✅ GOOD |
| **Dialogs** | Shadcn `<AlertDialog>` | ✅ Delete confirmations use AlertDialog | ✅ GOOD |
| **Skeletons** | Shadcn `<Skeleton>` | ✅ Loading states use Skeleton | ✅ GOOD |

### Spacing Convention

| Standard | Observed | Status |
|----------|----------|--------|
| Page padding `p-6` | ✅ Most pages use `p-6` or via layout | ✅ GOOD |
| Section margin `mb-8` | ✅ Dashboard uses `mb-8` between sections | ✅ GOOD |
| Grid gap `gap-4` or `gap-6` | ✅ Consistent grid spacing | ✅ GOOD |

---

## 4. Z-Index & Overflow Analysis

### Current Z-Index Layers

| Layer | Component | Z-Index | Status |
|-------|-----------|---------|--------|
| Shadcn Sidebar | `SidebarProvider` wrapper | `z-10` (fixed) | ✅ OK |
| Mobile Sheet | Shadcn Sheet | `z-50` (via Radix) | ✅ OK |
| Copilot FAB | `DashboardShell` | `z-40` / `z-50` | ⚠️ CONFLICT |
| Sticky Header | OLD dashboard-layout | `z-30` | ❌ REMOVE |

### Conflict: Copilot FAB

**DashboardShell.tsx** (lines 263-271) has a floating Copilot button at `z-40`/`z-50`:
```tsx
<div className="fixed z-40 flex flex-col items-end gap-2" style={{ bottom: '2rem', right: '2rem' }}>
```

**Impact:** If we DELETE `DashboardShell`, the Copilot FAB is lost. Consider:
1. **Option A:** Extract Copilot FAB into standalone component
2. **Option B:** Remove Copilot feature entirely (not in use)

---

## 5. Refactor Strategy

### Standard Page Template

All pages should follow this structure:

```tsx
// ✅ STANDARD PAGE TEMPLATE
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export function ExamplePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Page Title</h1>
            <p className="text-muted-foreground">Page description.</p>
          </div>
          <Button>Action</Button>
        </div>

        {/* Content */}
        <div>...</div>
      </div>
    </DashboardLayout>
  );
}
```

### Migration Checklist (Step 2)

#### Phase A: Fix Broken Imports

- [ ] **Dashboard Page:** Change import from `../components/layout/dashboard-layout` → `@/components/layout/DashboardLayout`
- [ ] **Data Sources Page:** Change import from `@/features/dashboard/...` → `@/components/layout/DashboardLayout`
- [ ] Remove `title` and `subtitle` props (handled in page content now)

#### Phase B: Delete Legacy Wrappers

- [ ] DELETE `frontend/src/features/dashboard/components/layout/dashboard-layout.tsx`
- [ ] DELETE `frontend/src/components/layout/DashboardShell.tsx` (or extract Copilot FAB)

#### Phase C: Verify Legacy Pages

- [ ] Audit `Settings`, `Reports`, `Users` pages for correct layout usage
- [ ] Update any remaining old imports

---

## 6. Files Summary

| Action | File | Reason |
|--------|------|--------|
| **KEEP** | `components/layout/DashboardLayout.tsx` | Shadcn-based, correct |
| **KEEP** | `components/layout/AppSidebar.tsx` | Shadcn-based, correct |
| **DELETE** | `features/dashboard/components/layout/dashboard-layout.tsx` | OLD, causes double sidebar |
| **DELETE** | `components/layout/DashboardShell.tsx` | Legacy, unused |
| **MODIFY** | `features/dashboard/pages/dashboard-page.tsx` | Fix import path |
| **MODIFY** | `features/data-sources/pages/data-sources-page.tsx` | Fix import path |

---

## 7. Verification Plan

### After Migration

1. **Visual Check (Desktop):**
   - Only ONE sidebar visible
   - Content not cut off on left
   - Page titles visible

2. **Visual Check (Mobile - iPhone SE):**
   - Hamburger icon visible
   - Click hamburger → Sheet slides in
   - No overlapping elements

3. **Navigation Check:**
   - All menu items navigate correctly
   - Sub-routes highlight parent item

---

## Conclusion

**Root Cause:** Multiple layout wrappers exist; pages import wrong ones.

**Fix:** Standardize all pages to use global `@/components/layout/DashboardLayout` and DELETE legacy layout files.

**Risk Level:** 🟡 MEDIUM - Simple import changes, but requires testing across all pages.
