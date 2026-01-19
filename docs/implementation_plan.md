# TrendChart Component Implementation

Production-grade chart component with tabbed metric switching, empty state handling, and dynamic styling.

## Pre-requisites (Already Satisfied ✅)

| Dependency | Status | Version |
|------------|--------|---------|
| `recharts` | ✅ Installed | v2.15.2 |
| `@radix-ui/react-tabs` | ✅ Installed | v1.1.13 |
| `date-fns` | ✅ Installed | v4.1.0 |
| [tabs.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/components/ui/tabs.tsx) | ✅ Exists | Shadcn UI |

> [!NOTE]
> No installation commands needed - all dependencies are already present.

---

## Proposed Changes

### Dashboard Charts Component

#### [NEW] [trend-chart.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/features/dashboard/components/charts/trend-chart.tsx)

New TrendChart component with:
- **Card container** with `h-[400px] flex flex-col`
- **Header** with title "Performance Trends" and Tabs switcher
- **Tabs** for Cost (Emerald), Impressions (Blue), Clicks (Amber), Conversions (Violet)
- **Empty state** when data is empty/undefined - centered gray icon + message
- **AreaChart** with gradient fills using `ResponsiveContainer`
- **Dynamic props** based on active tab: `dataKey`, `stroke`, `fill`
- **XAxis formatting** with `date-fns` format `dd MMM`
- **Custom Tooltip** with currency formatting for cost, number formatting for others

```tsx
// Color system
const METRIC_CONFIG = {
  cost: { label: 'Cost', color: '#10b981', dataKey: 'cost' },
  impressions: { label: 'Impressions', color: '#3b82f6', dataKey: 'impressions' },
  clicks: { label: 'Clicks', color: '#f59e0b', dataKey: 'clicks' },
  conversions: { label: 'Conversions', color: '#8b5cf6', dataKey: 'conversions' },
};
```

---

### Dashboard Page Integration

#### [MODIFY] [dashboard-page.tsx](file:///c:/Users/User/Desktop/rga-dashboard-main/frontend/src/features/dashboard/pages/dashboard-page.tsx)

- Import `TrendChart` from `../components/charts/trend-chart`
- Add TrendChart section after metrics with `data={data?.trends || []}`
- Show `Skeleton` of same height (`h-[400px]`) during loading

---

## Verification Plan

### Dev Server Test

1. Start the frontend dev server:
   ```bash
   cd c:\Users\User\Desktop\rga-dashboard-main\frontend
   npm run dev
   ```

2. Navigate to dashboard page and verify:
   - [ ] TrendChart renders inside a Card with correct height
   - [ ] All 4 tabs display (Cost, Impressions, Clicks, Conversions)
   - [ ] Tab switching changes the chart color and data
   - [ ] XAxis shows formatted dates (e.g., "15 Jan")
   - [ ] Tooltip shows correct formatting (currency for cost, numbers for others)
   - [ ] Skeleton shows during loading state

### Edge Case Verification

- [ ] Empty data array shows "No data available for the selected period" message
- [ ] Chart renders correctly with minimal data (1-2 data points)

### User Manual Verification

> After implementation, please test on the running dev server:
> 1. Login and navigate to Dashboard
> 2. Switch between all 4 tabs and confirm color changes
> 3. Hover over chart to verify tooltip formatting
