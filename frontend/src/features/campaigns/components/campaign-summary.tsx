import { Campaign } from '../types';

interface CampaignSummaryProps {
    campaigns: Campaign[];
}

export function CampaignSummary({ campaigns }: CampaignSummaryProps) {
    // Calculate total metrics
    const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);

    // Calculate derived metrics
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
    const cpm = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;

    // ROAS = Revenue / Ad Spend
    const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    // ROI = (Revenue - Ad Spend) / Ad Spend * 100
    const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('th-TH', {
            style: 'currency',
            currency: 'THB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Helper to format numbers with commas
    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num);
    };

    return (
        <div className="rounded-3xl border p-6 space-y-5 bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <p className="text-[20px] font-bold">Campaign Summary</p>
                    <p className="text-sm text-muted-foreground">
                        Summary based on {campaigns.filter(c => c.status === 'active').length} active campaigns
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Spent */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">Spent</p>
                    <p className="mt-1 text-[18px] font-bold">{formatCurrency(totalSpent)}</p>
                </div>

                {/* Impressions */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">Impressions</p>
                    <p className="mt-1 text-[18px] font-bold">{formatNumber(totalImpressions)}</p>
                </div>

                {/* Clicks */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">Clicks</p>
                    <p className="mt-1 text-[18px] font-bold">{formatNumber(totalClicks)}</p>
                </div>

                {/* CTR */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">CTR</p>
                    <p className="mt-1 text-[18px] font-bold">{ctr.toFixed(2)}%</p>
                </div>

                {/* ROI */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">ROI</p>
                    <p className={`mt-1 text-[18px] font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {roi.toFixed(1)}%
                    </p>
                </div>

                {/* ROAS */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">ROAS</p>
                    <p className={`mt-1 text-[18px] font-bold ${roas >= 1 ? 'text-emerald-600' : 'text-yellow-600'}`}>
                        {roas.toFixed(2)}x
                    </p>
                </div>

                {/* CPC */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">CPC</p>
                    <p className="mt-1 text-[18px] font-bold">{formatCurrency(cpc)}</p>
                </div>

                {/* CPM */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">CPM</p>
                    <p className="mt-1 text-[18px] font-bold">{formatCurrency(cpm)}</p>
                </div>
            </div>
        </div>
    );
}
