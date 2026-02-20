import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SeoPremiumCards } from '../components/seo-premium-cards';
import { SeoSummaryCards } from '../components/seo-summary-cards';
import { TrafficByLocation } from '../components/traffic-by-location';
import { SeoPerformanceChart } from '../components/seo-performance-chart';
import { useSeoSummary } from '../hooks';
import { SeoMetricSummary } from '../types';
import { OrganicKeywordsByIntent } from '../components/organic-keywords-by-intent';


import { SeoAnchorText } from '../components/seo-anchor-text';
import { TopOrganicKeywords } from '../components/top-organic-keywords';
import { SeoOffPageMetrics } from '../components/seo-offpage-metrics';

export function SeoPage() {
    const { data, isLoading } = useSeoSummary();

    // Default fallback data if API fails or is loading (to prevent crash)
    const displayData: SeoMetricSummary = data || {
        organicSessions: 0,
        organicSessionsTrend: 0,
        goalCompletions: null,
        avgPosition: null,
        avgTimeOnPage: 0,
        avgTimeOnPageTrend: 0,
        bounceRate: 0,
        ur: null,
        dr: null,
        backlinks: null,
        referringDomains: null,
        keywords: null,
        trafficCost: null
    };


    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div id="tutorial-seo-header" className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">SEO & Web Analytics</h1>
                        <p className="text-muted-foreground mt-1">
                            Track your organic search performance and website engagement.
                        </p>
                    </div>
                </div>

                {/* Standard Summary Cards */}
                <div id="tutorial-seo-overview">
                    <SeoSummaryCards data={displayData} isLoading={isLoading} />
                </div>

                {/* Premium SEO Metrics (Ahrefs Style) */}
                <div id="tutorial-seo-premium">
                    <SeoPremiumCards data={displayData} isLoading={isLoading} />
                </div>


                {/* Charts Area */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 items-start">
                    <div className="col-span-5 space-y-6">
                        <div id="tutorial-seo-chart">
                            <SeoPerformanceChart />
                        </div>
                        <div id="tutorial-seo-keywords">
                            <TopOrganicKeywords />
                        </div>
                    </div>
                    <div className="col-span-2 space-y-6">
                        <div id="tutorial-seo-location">
                            <TrafficByLocation isLoading={isLoading} />
                        </div>
                        <div id="tutorial-seo-intent">
                            <OrganicKeywordsByIntent isLoading={isLoading} />
                        </div>
                        <div id="tutorial-seo-anchor">
                            <SeoAnchorText />
                        </div>
                    </div>
                </div>

                {/* Off-page Metrics */}
                <div id="tutorial-seo-offpage">
                    <SeoOffPageMetrics />
                </div>
            </div>
        </DashboardLayout>
    );
}
