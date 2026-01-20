// src/features/dashboard/index.ts
// =============================================================================
// Dashboard Feature Barrel Export
// =============================================================================

// Schemas & Types
export * from './schemas';

// Services
export { getDashboardOverview, dashboardOverviewService } from './services/dashboard.service';

// Hooks
export {
    useDashboardOverview,
    useDashboardSummary,
    useDashboardTrends,
    useRecentCampaigns,
    dashboardKeys,
} from './hooks/use-dashboard';

// Components
export { DashboardLayout } from '@/components/layout/DashboardLayout';
export { SummaryCard } from './components/ui/summary-card';
export { DashboardMetrics } from './components/dashboard-metrics';

// Pages
export { DashboardPage } from './pages/dashboard-page';
