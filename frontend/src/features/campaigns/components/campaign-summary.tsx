import {
    CreditCard,
    MousePointer,
    Eye,
    BarChart,
    Percent,
    TrendingUp,
    DollarSign,
    Activity,
    Target,
    Wallet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignSummaryMetrics } from '../api/campaign-service';

interface CampaignSummaryProps {
    summary?: CampaignSummaryMetrics;
    isLoading?: boolean;
}

const SummaryCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel = "vs last period",
    colorClass = "text-muted-foreground",
    bgClass = "bg-muted/20"
}: {
    title: string;
    value: string;
    icon: any;
    trend?: string;
    trendLabel?: string;
    colorClass?: string;
    bgClass?: string;
}) => (
    <Card className="shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground line-clamp-1" title={title}>
                {title}
            </CardTitle>
            <div className={`p-2 rounded-full ${bgClass}`}>
                <Icon className={`h-4 w-4 ${colorClass}`} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
                <p className="text-xs text-muted-foreground mt-1">
                    <span className={trend.startsWith('+') ? "text-emerald-500" : "text-red-500"}>
                        {trend}
                    </span> {trendLabel}
                </p>
            )}
        </CardContent>
    </Card>
);

export function CampaignSummary({ summary, isLoading = false }: CampaignSummaryProps) {
    if (isLoading || !summary) {
        return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-md" />
            ))}
        </div>;
    }

    // Formatters
    const currency = (val: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
    const number = (val: number) => new Intl.NumberFormat('th-TH').format(val);
    const percent = (val: number) => `${val.toFixed(2)}%`;

    const safe = (val: number | undefined) => {
        if (val === undefined || val === null || isNaN(val)) return 0;
        return val;
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* 1. Total Budget */}
            <SummaryCard
                title="Total Budget"
                value={currency(summary.budget)}
                icon={Wallet}
                colorClass="text-indigo-600"
                bgClass="bg-indigo-100"
            />

            {/* 2. Total Spend */}
            <SummaryCard
                title="Total Spend"
                value={currency(summary.spend)}
                icon={CreditCard}
                colorClass="text-blue-600"
                bgClass="bg-blue-100"
            />

            {/* 3. Total Revenue */}
            <SummaryCard
                title="Total Revenue"
                value={currency(summary.revenue)}
                icon={DollarSign}
                colorClass="text-emerald-600"
                bgClass="bg-emerald-100"
            />

            {/* 4. ROI */}
            <SummaryCard
                title="ROI (Return on Investment)"
                value={`${summary.roi}%`}
                icon={Percent}
                colorClass={summary.roi >= 0 ? "text-emerald-600" : "text-red-600"}
                bgClass={summary.roi >= 0 ? "bg-emerald-100" : "bg-red-100"}
            />

            {/* 5. Total Impressions */}
            <SummaryCard
                title="Total Impressions"
                value={number(summary.impressions)}
                icon={Eye}
                colorClass="text-purple-600"
                bgClass="bg-purple-100"
            />

            {/* 6. Total Clicks */}
            <SummaryCard
                title="Total Clicks"
                value={number(summary.clicks)}
                icon={MousePointer}
                colorClass="text-orange-600"
                bgClass="bg-orange-100"
            />

            {/* 7. CTR */}
            <SummaryCard
                title="CTR (Click-Through Rate)"
                value={percent(summary.ctr)}
                icon={Activity}
                colorClass="text-cyan-600"
                bgClass="bg-cyan-100"
            />

            {/* 8. ROAS */}
            <SummaryCard
                title="ROAS (Return on Ad Spend)"
                value={`${safe(summary.roas).toFixed(2)}`}
                icon={TrendingUp}
                colorClass="text-green-600"
                bgClass="bg-green-100"
            />

            {/* 9. CPC */}
            <SummaryCard
                title="CPC (Cost Per Click)"
                value={currency(summary.cpc)}
                icon={BarChart}
                colorClass="text-pink-600"
                bgClass="bg-pink-100"
            />

            {/* 10. CPM */}
            <SummaryCard
                title="CPM (Cost Per Mille)"
                value={currency(summary.cpm)}
                icon={BarChart}
                colorClass="text-yellow-600"
                bgClass="bg-yellow-100"
            />
        </div>
    );
}
