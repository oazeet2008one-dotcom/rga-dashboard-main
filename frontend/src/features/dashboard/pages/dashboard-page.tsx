// src/features/dashboard/pages/dashboard-page.tsx
// =============================================================================
// Dashboard Page - Main Entry Point
// =============================================================================

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '../components/layout/dashboard-layout';
import { DashboardMetrics } from '../components/dashboard-metrics';
import { TrendChart } from '../components/charts/trend-chart';
import { RecentActivity } from '../components/widgets/recent-activity';
import { useDashboardOverview } from '../hooks/use-dashboard';

// =============================================================================
// Error State Component
// =============================================================================

interface ErrorStateProps {
    error: Error;
    onRetry?: () => void;
}

function ErrorState({ error }: ErrorStateProps) {
    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to load dashboard data</AlertTitle>
            <AlertDescription>
                {error.message || 'An unexpected error occurred. Please try again.'}
            </AlertDescription>
        </Alert>
    );
}

// =============================================================================
// Main Page Component
// =============================================================================

export function DashboardPage() {
    const { data, isLoading, error, refetch } = useDashboardOverview({
        period: '7d',
    });

    return (
        <DashboardLayout title="Dashboard Overview" subtitle="Monitor your advertising performance">
            {/* Error State */}
            {error && <ErrorState error={error} onRetry={refetch} />}

            {/* Metrics Grid */}
            <section className="mb-8">
                <h2 className="sr-only">Key Performance Metrics</h2>
                <DashboardMetrics
                    summary={data?.summary}
                    growth={data?.growth}
                    loading={isLoading}
                />
            </section>

            {/* Charts & Activity Grid - Responsive Layout */}
            <section className="mb-8">
                <h2 className="sr-only">Performance Trends & Recent Activity</h2>
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                    {/* Trend Chart - 4/7 on desktop */}
                    <div className="col-span-1 lg:col-span-4">
                        {isLoading ? (
                            <Skeleton className="h-[400px] w-full rounded-lg" />
                        ) : (
                            <TrendChart data={data?.trends ?? []} />
                        )}
                    </div>

                    {/* Recent Activity - 3/7 on desktop */}
                    <div className="col-span-1 lg:col-span-3">
                        {isLoading ? (
                            <Skeleton className="h-[400px] w-full rounded-lg" />
                        ) : (
                            <RecentActivity data={(data as any)?.recentActivity ?? []} />
                        )}
                    </div>
                </div>
            </section>

            {/* Future: Recent Campaigns Section */}
            {/* <section>
        <RecentCampaignsTable campaigns={data?.recentCampaigns} loading={isLoading} />
      </section> */}
        </DashboardLayout>
    );
}

export default DashboardPage;
