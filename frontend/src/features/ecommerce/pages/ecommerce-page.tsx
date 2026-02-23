import { EcommerceKPIs } from '../components/ecommerce-kpis';
import { SalesChart } from '../components/sales-chart';
import { useEcommerceSummary, useEcommerceTrends } from '../hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export function EcommercePage() {
    const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useEcommerceSummary();
    const { data: trends, isLoading: isTrendsLoading, refetch: refetchTrends } = useEcommerceTrends();

    const handleRefresh = async () => {
        try {
            await Promise.all([refetchSummary(), refetchTrends()]);
            toast.success('Data refreshed successfully');
        } catch (error) {
            toast.error('Failed to refresh data');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ecommerce Insights</h1>
                    <p className="text-muted-foreground mt-1">
                        Comprehensive overview of your store's performance.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {isSummaryLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : summary ? (
                <EcommerceKPIs summary={summary} />
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    No summary data available for this period.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-5">
                    {isTrendsLoading ? (
                        <Skeleton className="h-[450px] w-full rounded-xl" />
                    ) : trends ? (
                        <SalesChart data={trends} />
                    ) : (
                        <div className="h-[450px] flex items-center justify-center border rounded-xl bg-card text-muted-foreground">
                            No sales trend data available.
                        </div>
                    )}
                </div>

                <div className="col-span-2 space-y-6">
                    {/* Placeholder for future sidebar components like Top Products, etc. */}
                    <div className="p-6 border rounded-xl bg-card">
                        <h3 className="font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full justify-start text-sm">Download Report</Button>
                            <Button variant="outline" className="w-full justify-start text-sm">Configure Alerts</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
