# CODEBASE HEALTH REPORT
## Frontend Architecture Audit

**Audit Date:** January 16, 2026  
**Scope:** `frontend/src/` (Vite + React + TypeScript + Shadcn/UI)  
**Architecture Standard:** Feature-based Architecture  
**Auditor Mode:** Deep Analysis (Report Only)

---

## 🚨 Verdict: **FAIL**

The codebase exhibits significant architectural violations indicating mixed "Legacy Code" and "New Code" patterns. The feature-based architecture exists but is **not wired** into the application.

---

## 1. Critical Violations

> [!CAUTION]
> These issues prevent the new architecture from functioning.

### 1.1 Routing Bypass (CRITICAL)

**File:** [App.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/App.tsx)

| Line | Current (Wrong) | Expected (Correct) |
|------|-----------------|-------------------|
| 11 | `import Dashboard from "./pages/Dashboard"` | `import { DashboardPage } from "@/features/dashboard"` |

**Impact:** The entire `src/features/dashboard/` module is **zombie code** - it exists but is never used.

```diff
- import Dashboard from "./pages/Dashboard";
+ import { DashboardPage as Dashboard } from "@/features/dashboard";
```

### 1.2 Duplicate Dashboard Pages

| File | Lines | Status |
|------|-------|--------|
| [src/pages/Dashboard.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/pages/Dashboard.tsx) | 101 | ✅ **ACTIVE** (legacy) |
| [src/features/dashboard/pages/dashboard-page.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/features/dashboard/pages/dashboard-page.tsx) | 71 | ❌ **ZOMBIE** (never imported) |

### 1.3 Duplicate Hook Files

**Location:** `src/features/dashboard/hooks/`

| File | Purpose | Status |
|------|---------|--------|
| `useDashboard.ts` | Legacy hook (camelCase) | Used by `pages/Dashboard.tsx` |
| `use-dashboard.ts` | New hook (kebab-case) | Exported in `index.ts` but unused |

---

## 2. Architectural Debt

### 2.1 Folder Pollution: `src/components/ui/`

> [!WARNING]
> The `ui/` folder should contain **ONLY** Shadcn primitives. Found **8 non-UI components**:

| File | Should Be In | Violation Type |
|------|--------------|----------------|
| `EmptyState.tsx` | `src/components/common/` | Composite component |
| `FormDialog.tsx` | `src/components/common/` | Composite component |
| `LoadingSpinner.tsx` | `src/components/common/` | Composite component |
| `SearchInput.tsx` | `src/components/common/` | Composite component |
| `StatusBadge.tsx` | `src/components/common/` | Domain-specific |
| `skeleton-wrapper.tsx` | `src/components/common/` | Utility wrapper |
| `spinner.tsx` | `src/components/common/` | Duplicate of LoadingSpinner |
| `empty.tsx` | `src/components/common/` | Duplicate of EmptyState |

### 2.2 Dashboard Component Sprawl

Components are **scattered** instead of **isolated** in features:

| Location | Files | Issue |
|----------|-------|-------|
| `src/components/dashboard/` | 8 files | ❌ Legacy location |
| `src/features/dashboard/components/` | 8 files | ✅ Correct location |

**Duplicate/Overlapping Components:**
- `DashboardHeader.tsx` in `components/dashboard/`
- `dashboard-layout` in `features/dashboard/components/layout/`

### 2.3 Root `src/components/` Pollution

These files at `src/components/` root violate feature isolation:

| File | Should Be |
|------|-----------|
| `Charts.tsx` | `features/*/components/` |
| `OverviewChart.tsx` | `features/dashboard/components/` |
| `IntegrationChecklist.tsx` | `features/integrations/components/` |
| `Map.tsx` | `features/*/components/` |
| `Pagination.tsx` | `components/common/` |
| `ManusDialog.tsx` | Domain-specific, move to feature |

---

## 3. Code Quality Issues

### 3.1 Type Safety Violations

> [!IMPORTANT]
> Found **40+ instances** of `any` type usage.

**Top Offenders:**

| File | Count | Severity |
|------|-------|----------|
| `useCrudOperations.ts` | 12 | 🔴 High |
| `TikTokAdsCard.tsx` | 5 | 🟠 Medium |
| `OverviewChart.tsx` | 3 | 🟠 Medium |
| `DashboardKPIs.tsx` | 1 | 🟡 Low |
| `DashboardAISummary.tsx` | 1 | 🟡 Low |

**@ts-ignore:** ✅ None found

### 3.2 Hardcoded Values

| File | Line | Value | Risk |
|------|------|-------|------|
| `api-client.ts` | 21 | `http://localhost:3000/api/v1` | 🟡 Fallback only |

### 3.3 Inconsistent Naming

| Pattern | Example | Standard |
|---------|---------|----------|
| Mixed case | `useDashboard.ts` vs `use-dashboard.ts` | Should be `kebab-case` |
| Component case | `DashboardKPIs.tsx` vs `dashboard-metrics.tsx` | Should be `PascalCase` for components |

---

## 4. Zombie Code Inventory

### 4.1 Files Exported but Never Imported

| File | Exported In | Imported Anywhere |
|------|-------------|-------------------|
| `features/dashboard/pages/dashboard-page.tsx` | `index.ts` | ❌ No |
| `features/dashboard/components/dashboard-metrics.tsx` | `index.ts` | ❌ No |
| `features/dashboard/components/ui/summary-card.tsx` | `index.ts` | ❌ No |
| `features/dashboard/components/layout/dashboard-layout.tsx` | `index.ts` | ❌ No |
| `features/dashboard/hooks/use-dashboard.ts` | `index.ts` | ❌ No |

### 4.2 Potentially Unused Legacy Files

| File | Last Modified | Reason |
|------|---------------|--------|
| `pages/Home.tsx` | Unknown | Not in router |

---

## 5. Refactoring Roadmap

### Phase 1: Wire New Architecture (Priority: CRITICAL)

| Step | Action | Files |
|------|--------|-------|
| 1.1 | Update `App.tsx` imports to use `@/features/dashboard` | `App.tsx` |
| 1.2 | Delete `src/pages/Dashboard.tsx` after migration | `pages/Dashboard.tsx` |
| 1.3 | Delete duplicate hook `useDashboard.ts` | `features/dashboard/hooks/useDashboard.ts` |

### Phase 2: Component Relocation (Priority: HIGH)

| Step | Action | From → To |
|------|--------|-----------|
| 2.1 | Move dashboard widgets | `components/dashboard/*` → `features/dashboard/components/widgets/` |
| 2.2 | Move charts | `components/Charts.tsx`, `OverviewChart.tsx` → `features/dashboard/components/` |
| 2.3 | Clean `components/ui/` | `EmptyState.tsx`, `FormDialog.tsx`, etc. → `components/common/` |

### Phase 3: Type Safety (Priority: MEDIUM)

| Step | Action | Target |
|------|--------|--------|
| 3.1 | Fix `useCrudOperations.ts` | Replace 12 `any` types with generics |
| 3.2 | Fix integration cards | Add proper TypeScript interfaces |
| 3.3 | Fix chart components | Use Recharts types |

### Phase 4: Cleanup (Priority: LOW)

| Step | Action |
|------|--------|
| 4.1 | Delete `pages/Home.tsx` (zombie) |
| 4.2 | Normalize file naming to `kebab-case` |
| 4.3 | Remove duplicate components (`spinner.tsx` vs `LoadingSpinner.tsx`) |

---

## 6. Summary Statistics

| Metric | Value | Status |
|--------|-------|--------|
| Feature Architecture Wired | ❌ No | 🔴 |
| Non-UI in `components/ui/` | 8 files | 🔴 |
| `any` Type Usage | 40+ instances | 🟠 |
| `@ts-ignore` Usage | 0 | 🟢 |
| Zombie Files | 5+ | 🟠 |
| Duplicate Components | 3+ pairs | 🟠 |

---

## Appendix: File Structure Analysis

```
src/
├── App.tsx                    # ❌ Uses legacy pages/
├── pages/                     # ❌ LEGACY - Contains 15 page files
│   └── Dashboard.tsx          # ❌ ACTIVE but should be deleted
├── features/
│   └── dashboard/             # ✅ NEW architecture (UNUSED)
│       ├── index.ts           # ✅ Barrel exports configured
│       ├── pages/             # ❌ ZOMBIE
│       ├── components/        # ❌ ZOMBIE  
│       └── hooks/             # ⚠️ Has duplicate files
├── components/
│   ├── ui/                    # ⚠️ 8 non-UI files polluting
│   ├── dashboard/             # ❌ Should be in features/
│   └── [root files]           # ❌ 9 files at root level
└── hooks/                     # ⚠️ Global hooks, some duplicated
```

---

**Report Generated By:** Codebase Health Auditor  
**Next Action:** Review and approve refactoring roadmap before implementation
