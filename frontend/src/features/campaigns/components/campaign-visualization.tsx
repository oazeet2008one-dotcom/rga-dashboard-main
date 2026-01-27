// src/features/campaigns/components/campaign-visualization.tsx
// =============================================================================
// Campaign Visualization - Charts and Key Metrics Snapshot
// =============================================================================


import { Button } from '@/components/ui/button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { Download, Wallet, TrendingUp, Trophy, Activity } from 'lucide-react';
import type { Campaign } from '../types';
import type { CampaignSummaryMetrics } from '../api/campaign-service';

interface CampaignVisualizationProps {
    campaigns: Campaign[];
    summary?: CampaignSummaryMetrics;
    onDownload?: () => void;
}

// Format currency for chart
const formatMoney = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
};

const formatCurrencyFull = (val: number) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(val);

export function CampaignVisualization({ campaigns, summary, onDownload }: CampaignVisualizationProps) {
    if (!summary || campaigns.length === 0) return null;

    // 1. Prepare Chart Data (Top 5 Campaigns by Spend)
    const chartData = [...campaigns]
        .sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0))
        .slice(0, 5) // Top 5
        .map(c => ({
            name: c.name,
            Budget: c.budget,
            Spend: c.spent ?? 0,
            Revenue: c.revenue ?? 0,
        }));

    // 2. Calculate Snapshot Metrics
    const activeCount = campaigns.filter(c => c.status === 'active').length;

    // Find BestROI Campaign
    const bestRoiCampaign = [...campaigns].sort((a, b) => (b.roi ?? 0) - (a.roi ?? 0))[0];
    const bestRoiValue = bestRoiCampaign?.roi ?? 0;
    const bestRoiName = bestRoiCampaign?.name ?? '-';

    return (
        <div className="space-y-4 pt-6 mt-6 border-t border-border/60">
            {/* Header */}
            <div>
                <p className="font-semibold text-gray-900 text-xl">Performance Summary</p>
                <p className="text-gray-500 text-sm">Track budget distribution and ROI performance at a glance</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* 1. Budget vs Spend vs Revenue Chart */}
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-inner space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Performance (Budget vs Spend vs Revenue)</p>
                            <p className="text-xs text-gray-500">Top 5 campaigns by spend</p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase font-medium">Live Data</span>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                barSize={24}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11, fill: '#6B7280' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#9CA3AF' }}
                                    tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                                />
                                <YAxis
                                    tickFormatter={formatMoney}
                                    tick={{ fontSize: 11, fill: '#6B7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', borderColor: '#E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px' }}
                                />
                                <Bar
                                    dataKey="Budget"
                                    fill="#F97316"
                                    radius={[4, 4, 0, 0]}
                                    name="Budget"
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                                <Bar
                                    dataKey="Spend"
                                    fill="#3B82F6"
                                    radius={[4, 4, 0, 0]}
                                    name="Spend"
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                                <Bar
                                    dataKey="Revenue"
                                    fill="#10B981"
                                    radius={[4, 4, 0, 0]}
                                    name="Revenue"
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Campaign Snapshot */}
                <div className="rounded-3xl border border-gray-100 bg-white p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">Performance Highlights</p>
                        <p className="text-xs text-gray-500 mt-1">Quick view of spend and best-performing campaign</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Total Spend */}
                        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all duration-300">
                            <div className="absolute top-4 right-4 p-2 bg-violet-50 rounded-full group-hover:bg-violet-100 transition-colors">
                                <Wallet className="w-4 h-4 text-violet-500" />
                            </div>
                            <p className="text-xs uppercase text-gray-500 font-medium">Total Spend</p>
                            <p className="mt-2 text-lg font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{formatMoney(summary.spend)}</p>
                            <p className="text-[10px] text-gray-400 mt-1 cursor-help" title="Exact amount">{formatCurrencyFull(summary.spend)}</p>
                        </div>

                        {/* Top ROI */}
                        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                            <div className="absolute top-4 right-4 p-2 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-xs uppercase text-gray-500 font-medium">Top ROI</p>
                            <p className="mt-2 text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{bestRoiValue.toFixed(0)}%</p>
                            <p className="text-[10px] text-gray-500 mt-1 truncate w-[85%]" title={bestRoiName}>
                                {bestRoiName}
                            </p>
                        </div>

                        {/* Best Campaign */}
                        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-300">
                            <div className="absolute top-4 right-4 p-2 bg-amber-50 rounded-full group-hover:bg-amber-100 transition-colors">
                                <Trophy className="w-4 h-4 text-amber-500" />
                            </div>
                            <p className="text-xs uppercase text-gray-500 font-medium">Best Campaign</p>
                            <p className="mt-2 text-sm font-semibold text-gray-900 truncate w-[85%] group-hover:text-amber-600 transition-colors" title={bestRoiName}>
                                {bestRoiName}
                            </p>
                            <p className="text-xs text-emerald-600 font-medium mt-1">ROI {bestRoiValue.toFixed(0)}%</p>
                        </div>

                        {/* Active Campaigns */}
                        <div className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                            <div className="absolute top-4 right-4 p-2 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                <Activity className="w-4 h-4 text-blue-500" />
                            </div>
                            <p className="text-xs uppercase text-gray-500 font-medium">Active Campaigns</p>
                            <p className="mt-2 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{activeCount}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] text-gray-400">Running now</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
