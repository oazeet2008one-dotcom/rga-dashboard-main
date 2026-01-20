// src/features/dashboard/pages/dashboard-page.tsx
// =============================================================================
// Dashboard Page - Main Entry Point
// Uses standardized DashboardLayout with Shadcn Sidebar
// =============================================================================

import { AlertTriangle, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
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

function ErrorState({ error, onRetry }: ErrorStateProps) {
    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to load dashboard data</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                <span>{error.message || 'An unexpected error occurred. Please try again.'}</span>
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        Retry
                    </Button>
                )}
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
        <DashboardLayout>
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                        <p className="text-muted-foreground">
                            Monitor your advertising performance across all platforms.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">Last 7 days</span>
                        </Button>
                    </div>
                </div>

                {/* Error State */}
                {error && <ErrorState error={error} onRetry={refetch} />}

                {/* Metrics Grid */}
                <section>
                    <h3 className="sr-only">Key Performance Metrics</h3>
                    <DashboardMetrics
                        summary={data?.summary}
                        growth={data?.growth}
                        loading={isLoading}
                    />
                </section>

                {/* Charts & Activity Grid - Responsive Layout */}
                <section>
                    <h3 className="sr-only">Performance Trends & Recent Activity</h3>
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
            </div>
        </DashboardLayout>
    );
}

export default DashboardPage;
