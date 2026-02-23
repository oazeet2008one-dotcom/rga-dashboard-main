import { CrmKPIs } from '../components/crm-kpis';
import { PipelineChart } from '../components/pipeline-chart';
import { useCrmSummary, useCrmTrends } from '../hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export function CrmPage() {
    const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useCrmSummary();
    const { data: trends, isLoading: isTrendsLoading, refetch: refetchTrends } = useCrmTrends();

    const handleRefresh = async () => {
        try {
            await Promise.all([refetchSummary(), refetchTrends()]);
            toast.success('CRM data refreshed');
        } catch (error) {
            toast.error('Failed to refresh CRM data');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">CRM & Leads Insights</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your leads, pipeline value, and conversion performance.
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
                <CrmKPIs summary={summary} />
            ) : (
                <div className="text-center py-10 text-muted-foreground border rounded-xl">
                    No CRM summary data available.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-5">
                    {isTrendsLoading ? (
                        <Skeleton className="h-[450px] w-full rounded-xl" />
                    ) : trends ? (
                        <PipelineChart data={trends} />
                    ) : (
                        <div className="h-[450px] flex items-center justify-center border rounded-xl bg-card text-muted-foreground">
                            No pipeline trend data available.
                        </div>
                    )}
                </div>

                <div className="col-span-2 space-y-6">
                    <div className="p-6 border rounded-xl bg-card">
                        <h3 className="font-semibold mb-4">Lead Distribution</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Hot Leads</span>
                                    <span className="font-medium">40%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[40%]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Warm Leads</span>
                                    <span className="font-medium">35%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[35%]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Cold Leads</span>
                                    <span className="font-medium">25%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-400 w-[25%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
