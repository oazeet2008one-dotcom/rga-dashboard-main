# Frontend Stack Decision Document

> **Document Type:** Architecture Decision Record (ADR)  
> **Created:** 2026-01-15  
> **Status:** Approved  
> **Topic:** 4.1 - Frontend Foundation & Library Selection

---

## Executive Summary

This document establishes the **Production-Grade Tech Stack** for the `frontend/` host project. After auditing the legacy `frontend_team_original/` project, we have performed a "Brutal Truth" comparison to ensure the new stack adheres to our **Core Principles: Robustness, Scalability, and Maintainability**.

> [!IMPORTANT]
> The host project (`frontend/`) is already well-configured with modern 2025/2026 libraries. This document validates those choices and recommends minor additions to complete the stack.

---

## 1. Dependency Audit Table: "The Brutal Truth"

### 1.1 Build System & Bundler

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| `react-scripts@5.0.1` (CRA) | `vite@7.1.7` | ✅ **KEEP** | CRA is deprecated, Vite offers 10-100x faster HMR, native ESM, and superior DX |
| Webpack (implicit) | Rollup/ESBuild (via Vite) | ✅ **KEEP** | ESBuild is orders of magnitude faster for dev builds |

### 1.2 State Management

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| None (Prop Drilling / Context) | `zustand@5.0.10` | ✅ **KEEP** | Zero boilerplate, tiny bundle (1.1kB), immutable by default, works outside React |
| N/A | `@tanstack/react-query@4.41.0` | ✅ **KEEP** | Server state vs client state separation, automatic caching, background refetch |

> [!TIP]
> **Why Not Redux?** Redux requires ~40% more boilerplate code for the same functionality. Zustand + TanStack Query achieves the same with better maintainability and smaller bundle size.

### 1.3 Routing

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| `react-router-dom@6.8.1` | `wouter@3.3.5` | ✅ **KEEP** | Wouter is 1.4kB vs React Router's 12kB. Sufficient for dashboard SPA. |

### 1.4 HTTP Client & Data Fetching

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| `axios@1.6.7` | `axios@1.12.0` | ✅ **KEEP** (Updated) | Well-maintained, interceptor support, consistent API |
| N/A | `zod@4.1.12` | ✅ **KEEP** | Runtime schema validation for API responses - critical for robustness |

### 1.5 Date/Time Utilities

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| `date-fns@3.3.1` | None installed | ⚠️ **ADD** | Already used in legacy. Tree-shakeable, immutable, TypeScript-first |

> [!NOTE]
> `date-fns` is superior to Moment.js (327kB → 9kB tree-shaken) and Day.js lacks some advanced features.

### 1.6 UI Framework & Component Library

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| `@headlessui/react@1.7.18` | Radix UI Primitives (22+ packages) | ✅ **KEEP** | Full shadcn/ui ecosystem, better a11y, more components |
| `@heroicons/react@2.1.1` | `lucide-react@0.453.0` | ✅ **KEEP** | Similar quality, better React integration, consistent API |
| `tailwindcss@3.4.1` | `tailwindcss@4.1.14` | ✅ **KEEP** (Upgraded) | v4 has native CSS @layer, faster builds, smaller output |
| `clsx` + `tailwind-merge` | `clsx@2.1.1` + `tailwind-merge@3.3.1` | ✅ **KEEP** | Industry standard for conditional classes |
| `class-variance-authority` | `class-variance-authority@0.7.1` | ✅ **KEEP** | Type-safe variant management for component props |

### 1.7 Forms & Validation

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| None (Uncontrolled forms) | `react-hook-form@7.64.0` | ✅ **KEEP** | Best performance, minimal re-renders, native validation |
| `ajv@8.17.1` (JSON Schema) | `zod@4.1.12` | ✅ **KEEP** | TypeScript-first, better DX, integrates with react-hook-form |

### 1.8 Charts & Data Visualization

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| `recharts@2.12.5` | `recharts@2.15.2` | ✅ **KEEP** (Updated) | Declarative, composable, shadcn/ui has chart components |

### 1.9 Animation

| Legacy (Reference) | New (Host) | Verdict | Reason |
|---|---|---|---|
| None | `framer-motion@12.23.22` | ✅ **KEEP** | Industry standard for React animations, physics-based |

### 1.10 Additional Production Libraries

| Library | Version | Purpose |
|---|---|---|
| `@sentry/react` | `10.32.1` | Error monitoring & performance tracking |
| `sonner` | `2.0.7` | Toast notifications (beautiful, accessible) |
| `next-themes` | `0.4.6` | Dark mode management |
| `react-day-picker` | `9.11.1` | Date picker (shadcn/ui calendar) |
| `cmdk` | `1.1.1` | Command palette (Cmd+K) |
| `embla-carousel-react` | `8.6.0` | Performant carousel |
| `vaul` | `1.1.2` | Mobile-friendly drawer |
| `react-resizable-panels` | `3.0.6` | Resizable layout panels |

---

## 2. High Standard Stack (2025/2026 Edition)

### 2.1 Core Architecture Decision

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────┤
│  Build Tool:        Vite 7.x (ESBuild + Rollup)                  │
│  Language:          TypeScript 5.6 (Strict Mode)                 │
│  Framework:         React 18.3                                   │
├──────────────────────────────────────────────────────────────────┤
│  Client State:      Zustand 5.x                                  │
│  Server State:      TanStack Query 4.x (soon 5.x)                │
│  Routing:           Wouter 3.x                                   │
├──────────────────────────────────────────────────────────────────┤
│  Styling:           Tailwind CSS 4.x                             │
│  Components:        shadcn/ui (Radix + CVA)                      │
│  Icons:             Lucide React                                 │
├──────────────────────────────────────────────────────────────────┤
│  Forms:             React Hook Form 7.x                          │
│  Validation:        Zod 4.x                                      │
│  HTTP:              Axios 1.x                                    │
├──────────────────────────────────────────────────────────────────┤
│  Testing:           Vitest + Playwright                          │
│  Monitoring:        Sentry                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Justification by Software Engineering Principles

#### **Robustness (Type Safety & Error Handling)**

| Choice | How It Helps |
|---|---|
| TypeScript Strict Mode | Catches type errors at compile time |
| Zod | Runtime validation for API responses - catches backend contract violations |
| Sentry | Captures errors in production with full stack traces |
| TanStack Query | Automatic retry, error boundaries, consistent error states |

#### **Scalability (Performance & Architecture)**

| Choice | How It Helps |
|---|---|
| Vite | Instant HMR regardless of codebase size |
| Zustand | O(1) subscription updates, no provider nesting |
| TanStack Query | Request deduplication, infinite scroll, prefetching |
| Tailwind CSS v4 | Native CSS cascade layers, smaller bundle |
| Code Splitting | Wouter supports lazy loading via `React.lazy()` |

#### **Maintainability (Clean Code & DRY)**

| Choice | How It Helps |
|---|---|
| Feature-Based Folder Structure | Co-located code by domain, not by file type |
| shadcn/ui | Copy-paste components you own (not locked to library updates) |
| CVA (class-variance-authority) | Type-safe, documented component variants |
| React Hook Form | Declarative validation, minimal boilerplate |

---

## 3. Installation Commands

### 3.1 Minor Dependencies to Add

The host project is mostly complete. Add these missing utilities:

```bash
# Navigate to frontend directory
cd frontend

# Add date utilities (from legacy project)
pnpm add date-fns

# Add form validation bridge (react-hook-form + zod integration)
pnpm add @hookform/resolvers

# Optional: Upgrade TanStack Query to v5 (when ready)
# pnpm add @tanstack/react-query@latest
```

### 3.2 Full Stack Reference (Already Installed)

For completeness, here's the complete modern stack that's already in `package.json`:

```bash
# Core Framework
pnpm add react react-dom

# Build & Dev
pnpm add -D vite @vitejs/plugin-react typescript

# State Management
pnpm add zustand @tanstack/react-query

# Routing
pnpm add wouter

# HTTP & Validation
pnpm add axios zod

# Styling
pnpm add -D tailwindcss postcss autoprefixer
pnpm add clsx tailwind-merge class-variance-authority

# UI Components (shadcn/ui primitives)
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
pnpm add @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-popover
# ... (22+ Radix packages already installed)

# Forms
pnpm add react-hook-form @hookform/resolvers

# Icons & Animation
pnpm add lucide-react framer-motion

# Charts
pnpm add recharts

# Utilities
pnpm add sonner next-themes react-day-picker cmdk

# Monitoring
pnpm add @sentry/react

# Testing
pnpm add -D vitest @playwright/test
```

### 3.3 Axios Configuration Setup

Create or verify `src/services/api-client.ts` configuration:

```typescript
import axios from 'axios';
import { tokenManager } from '@/lib/token-manager';

// Base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - unwrap data, handle errors
api.interceptors.response.use(
  (response) => {
    // Unwrap { success: true, data: ... } structure
    if (response.data && 'data' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      tokenManager.clearTokens();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 4. Folder Structure Proposal

### 4.1 Recommended: Feature-Based Architecture

```
frontend/
├── src/
│   ├── app/                    # Application shell
│   │   ├── App.tsx             # Root component
│   │   ├── main.tsx            # Entry point
│   │   └── providers.tsx       # Global providers wrapper
│   │
│   ├── components/             # Shared/Reusable components
│   │   ├── ui/                 # shadcn/ui primitives (Button, Card, etc.)
│   │   ├── layout/             # Layout components (Sidebar, Header, etc.)
│   │   └── common/             # Shared domain components
│   │
│   ├── features/               # Feature modules (Domain-driven)
│   │   ├── auth/
│   │   │   ├── components/     # Feature-specific components
│   │   │   ├── hooks/          # Feature-specific hooks
│   │   │   ├── services/       # Feature-specific API calls
│   │   │   └── types.ts        # Feature-specific types
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── campaigns/
│   │   ├── integrations/
│   │   ├── analytics/
│   │   └── settings/
│   │
│   ├── hooks/                  # Global custom hooks
│   │   ├── use-debounce.ts
│   │   ├── use-media-query.ts
│   │   └── use-local-storage.ts
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── utils.ts            # clsx + tailwind-merge helper
│   │   ├── token-manager.ts    # JWT token management
│   │   ├── formatters.ts       # Date, currency formatters
│   │   └── validators/         # Zod schemas (shared)
│   │
│   ├── services/               # Global API services
│   │   ├── api-client.ts       # Axios instance
│   │   └── query-client.ts     # TanStack Query client
│   │
│   ├── stores/                 # Zustand stores (Client State)
│   │   ├── auth-store.ts
│   │   ├── ui-store.ts
│   │   └── notification-store.ts
│   │
│   ├── types/                  # Global TypeScript types
│   │   ├── api.ts              # API response types
│   │   ├── models.ts           # Domain models
│   │   └── enums.ts            # Shared enums
│   │
│   ├── pages/                  # Route components (thin wrappers)
│   │   ├── dashboard.tsx       # imports from features/dashboard
│   │   ├── login.tsx
│   │   └── settings.tsx
│   │
│   └── index.css               # Tailwind entry + CSS variables
│
├── public/                     # Static assets
├── tests/                      # E2E tests (Playwright)
└── package.json
```

### 4.2 Architecture Principles

| Principle | Implementation |
|---|---|
| **Colocation** | Keep related code together (components + hooks + services within feature) |
| **Single Responsibility** | Each feature module owns its domain completely |
| **DRY** | Shared code in `components/ui/`, `hooks/`, `lib/` |
| **Loose Coupling** | Features communicate via stores, not direct imports |
| **Testability** | Services layer is easily mockable |

### 4.3 Current vs Recommended

| Current Location | Recommended | Notes |
|---|---|---|
| `src/pages/*.tsx` | `src/pages/*.tsx` → `src/features/*/` | Pages should be thin route wrappers |
| `src/components/dashboard/` | `src/features/dashboard/components/` | Move to feature module |
| `src/components/integrations/` | `src/features/integrations/components/` | Move to feature module |
| `src/services/*.ts` | Split per feature OR keep global | Depends on service scope |
| `src/contexts/` | Remove | Already migrated to Zustand |

---

## 5. Summary & Next Steps

### ✅ Already Complete (No Action Needed)
- Vite + React + TypeScript foundation
- Zustand for client state
- TanStack Query for server state
- Tailwind CSS v4 + shadcn/ui
- Zod for validation
- React Hook Form for forms
- Sentry for monitoring

### 🔧 Minor Additions Recommended
```bash
pnpm add date-fns @hookform/resolvers
```

### 📂 Folder Restructuring (Optional but Recommended)
- Migrate `components/dashboard/` → `features/dashboard/components/`
- Migrate `components/integrations/` → `features/integrations/components/`
- Delete empty `src/contexts/` folder

---

> [!NOTE]
> This stack is production-ready and follows industry best practices for React applications in 2025/2026. The combination of Zustand + TanStack Query provides a clean separation between client state and server state, while shadcn/ui ensures accessible, customizable UI components.
