// src/features/campaigns/components/campaign-analytics.tsx
// =============================================================================
// Campaign Analytics - Conversion Rate & Platform Insights
// =============================================================================

import { useState, useMemo, useEffect } from 'react';
import { Lightbulb, Target, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Campaign } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

interface CampaignAnalyticsProps {
    campaigns: Campaign[];
}

export function CampaignAnalytics({ campaigns }: CampaignAnalyticsProps) {
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    // Initial Selection Effect
    if (!selectedCampaignId && campaigns.length > 0) {
        setSelectedCampaignId(campaigns[0].id);
    }

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0];

    // Helper: Calculate Conversion Rate
    const getConversionRate = (c: Campaign) => {
        if (!c.clicks || c.clicks === 0) return 0;
        return ((c.conversions || 0) / c.clicks) * 100;
    };

    // Calculate Insights (Conversion Rate)
    const insights = useMemo(() => {
        if (!campaigns.length || !selectedCampaign) return null;

        const currentRate = getConversionRate(selectedCampaign);
        const allRates = campaigns.map(getConversionRate);

        // Stats
        const maxRate = Math.max(...allRates);
        const minRate = Math.min(...allRates);
        const avgRate = allRates.reduce((a, b) => a + b, 0) / allRates.length;

        // Find Benchmark Campaigns
        const bestCampaign = campaigns.find(c => getConversionRate(c) === maxRate);
        const worstCampaign = campaigns.find(c => getConversionRate(c) === minRate);

        // Insight Logic
        const diffFromAvg = currentRate - avgRate;

        // Define Thresholds for Tiers (e.g., within 10% of average is "Medium")
        const threshold = avgRate * 0.1;

        let performanceTier: 'high' | 'medium' | 'low';
        if (diffFromAvg > threshold) {
            performanceTier = 'high';
        } else if (diffFromAvg < -threshold) {
            performanceTier = 'low';
        } else {
            performanceTier = 'medium';
        }

        const isAboveAvg = diffFromAvg > 0;

        return {
            currentRate,
            avgRate,
            maxRate,
            minRate,
            bestCampaign,
            worstCampaign,
            diffFromAvg,
            isAboveAvg,
            performanceTier
        };

    }, [campaigns, selectedCampaign]);

    // Calculate Platform Metrics
    const platformMetrics = useMemo(() => {
        const platforms = ['facebook', 'google', 'tiktok', 'line'] as const;
        const metrics = platforms.map(platform => {
            const platformCampaigns = campaigns.filter(c => c.platform.toLowerCase().includes(platform));
            const totalSpend = platformCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
            const totalConversions = platformCampaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
            const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;

            return {
                name: platform.charAt(0).toUpperCase() + platform.slice(1),
                spend: totalSpend,
                conversions: totalConversions,
                cpa
            };
        }).sort((a, b) => b.spend - a.spend); // Sort by spend descending

        const totalSpendAll = metrics.reduce((sum, m) => sum + m.spend, 0);
        const bestCpaPlatform = [...metrics].sort((a, b) => (a.cpa || Infinity) - (b.cpa || Infinity)).find(m => m.cpa > 0);

        return { data: metrics, totalSpendAll, bestCpaPlatform };
    }, [campaigns]);

    // Generate Optimization Tips
    const tips = useMemo(() => {
        const generatedTips: { platform: string; type: 'opportunity' | 'warning' | 'info'; message: React.ReactNode }[] = [];

        const getPlatformColor = (name: string) => {
            const n = name.toLowerCase();
            if (n.includes('facebook')) return 'text-blue-700';
            if (n.includes('google')) return 'text-red-700';
            if (n.includes('line')) return 'text-emerald-700';
            if (n.includes('tiktok')) return 'text-gray-900';
            return 'text-gray-900';
        };

        const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0);
        const avgCpa = totalConversions > 0 ? platformMetrics.totalSpendAll / totalConversions : 0;

        // Generate a tip for EVERY active platform
        platformMetrics.data.forEach(p => {
            if (p.spend === 0) return; // Skip inactive platforms

            const colorClass = getPlatformColor(p.name);
            const pCpa = p.cpa;

            // 1. Zero Conversions (Burning Budget)
            if (p.conversions === 0 && p.spend > 0) {
                generatedTips.push({
                    platform: p.name,
                    type: 'warning',
                    message: (
                        <>
                            <span className={cn("font-bold", colorClass)}>{p.name}</span> is spending without results. Is tracking working?
                            Consider pausing to review ad setup or audience targeting immediately.
                        </>
                    )
                });
                return;
            }

            // 2. High Efficiency (CPA is significantly lower than average)
            if (pCpa < avgCpa * 0.8) {
                generatedTips.push({
                    platform: p.name,
                    type: 'opportunity',
                    message: (
                        <>
                            <span className={cn("font-bold", colorClass)}>{p.name}</span> is highly efficient (CPA {(pCpa).toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })}).
                            Increase daily budget by 15-20% to scale up these cheap conversions.
                        </>
                    )
                });
                return;
            }

            // 3. High CPA (Inefficient)
            if (pCpa > avgCpa * 1.2) {
                generatedTips.push({
                    platform: p.name,
                    type: 'warning',
                    message: (
                        <>
                            <span className={cn("font-bold", colorClass)}>{p.name}</span> is expensive (CPA {(pCpa).toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })}).
                            Refine targeting or refresh creatives to bring costs down closer to the average.
                        </>
                    )
                });
                return;
            }

            // 4. Low Spend but Converting (Potential)
            if (p.spend < platformMetrics.totalSpendAll * 0.15) {
                generatedTips.push({
                    platform: p.name,
                    type: 'info',
                    message: (
                        <>
                            <span className={cn("font-bold", colorClass)}>{p.name}</span> has potential.
                            It's contributing conversions with low spend. Consider giving it more budget to test volume.
                        </>
                    )
                });
                return;
            }

            // 5. Stable / Sustaining
            generatedTips.push({
                platform: p.name,
                type: 'info',
                message: (
                    <>
                        <span className={cn("font-bold", colorClass)}>{p.name}</span> is performing steadily.
                        Maintain current strategy but monitor frequency to avoid ad fatigue.
                    </>
                )
            });
        });

        // Use Fallback if mostly empty or to ensure at least one tip
        if (generatedTips.length === 0) {
            generatedTips.push({
                platform: 'General',
                type: 'info',
                message: "Launch campaigns across multiple platforms to see AI-driven comparative insights here."
            });
        }

        return generatedTips;
    }, [platformMetrics, campaigns]);

    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // Reset tip index when tips change to avoid out-of-bounds (e.g. 2/1)
    useEffect(() => {
        setCurrentTipIndex(0);
    }, [tips]);

    const nextTip = () => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    };

    const prevTip = () => {
        setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
    };


    if (!campaigns.length || !selectedCampaign || !insights) return null;

    return (

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 mt-6">
            {/* LEFT COLUMN: Conversion Rate Insights (2/3 width) */}
            <div className="lg:col-span-1 xl:col-span-2 rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 space-y-4 shadow-sm h-full flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-2xl font-bold tracking-tight">Conversion Rate</p>
                        <p className="text-sm text-muted-foreground">Channel-by-channel AI insights</p>
                    </div>
                </div>

                <div className="space-y-6 flex-1 flex flex-col">
                    {/* Campaign Selector Carousel */}
                    <div className="flex flex-wrap gap-2 pb-2">
                        {campaigns.slice(0, 10).map(campaign => (
                            <button
                                key={campaign.id}
                                onClick={() => setSelectedCampaignId(campaign.id)}
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 border",
                                    selectedCampaignId === campaign.id
                                        ? "bg-gray-900 text-white border-gray-900 shadow-md transform scale-105"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                )}
                            >
                                {campaign.name}
                            </button>
                        ))}
                    </div>

                    {/* Active Stats Panel */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedCampaign.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-3xl border border-gray-100 p-6 space-y-6 shadow-inner bg-gray-50/30"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase text-gray-500 font-medium tracking-wider">Active Channel</p>
                                    <p className="text-lg font-semibold text-gray-900 mt-1">{selectedCampaign.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase text-gray-500 font-medium tracking-wider">Conversion Rate</p>
                                    <div className="flex items-center justify-end gap-2 mt-1">
                                        {insights.performanceTier === 'high' ? (
                                            <span className="text-emerald-500 text-2xl">↗</span>
                                        ) : insights.performanceTier === 'low' ? (
                                            <span className="text-rose-500 text-2xl">↘</span>
                                        ) : (
                                            <span className="text-blue-500 text-2xl">→</span>
                                        )}
                                        <motion.p
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                            className="text-4xl font-bold text-gray-900 tracking-tight"
                                        >
                                            {insights.currentRate.toFixed(2)}%
                                        </motion.p>
                                    </div>
                                </div>
                            </div>

                            {/* Insights Grid - Stack on mobile */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                {/* Insight Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05, duration: 0.25 }}
                                    className={cn(
                                        "rounded-2xl p-5 border hover:shadow-sm transition-shadow",
                                        insights.performanceTier === 'high' ? "bg-emerald-50/50 border-emerald-200/60" :
                                            insights.performanceTier === 'medium' ? "bg-blue-50/50 border-blue-200/60" :
                                                "bg-orange-50/50 border-orange-200/60"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb className={cn("h-4 w-4",
                                            insights.performanceTier === 'high' ? "text-emerald-500" :
                                                insights.performanceTier === 'medium' ? "text-blue-500" :
                                                    "text-orange-500"
                                        )} />
                                        <p className={cn("text-xs uppercase font-bold tracking-wide",
                                            insights.performanceTier === 'high' ? "text-emerald-600" :
                                                insights.performanceTier === 'medium' ? "text-blue-600" :
                                                    "text-orange-600"
                                        )}>Insight</p>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {selectedCampaign.name} is performing
                                        <span className="font-semibold text-gray-900"> {insights.performanceTier === 'medium' ? 'steadily' : (Math.abs(insights.diffFromAvg).toFixed(2) + '% ' + (insights.isAboveAvg ? 'higher' : 'lower'))}</span>
                                        {insights.performanceTier === 'medium' ? ' around the average.' : ' than average.'}
                                        {insights.performanceTier === 'high'
                                            ? ' This campaign is performing exceptionally well driven by optimized targeting.'
                                            : insights.performanceTier === 'medium'
                                                ? ' Performance is stable. Look for opportunities to optimize incrementally.'
                                                : ' Consider reviewing ad creatives or landing page relevance to improve performance.'}
                                    </p>
                                </motion.div>

                                {/* Benchmark Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1, duration: 0.25 }}
                                    className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-4 w-4 text-gray-500" />
                                        <p className="text-xs uppercase text-gray-500 font-bold tracking-wide">Benchmark</p>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Top:</span>
                                            <span className="font-medium text-gray-900 truncate max-w-[100px]" title={insights.bestCampaign?.name}>{insights.bestCampaign?.name}</span>
                                            <span className="font-bold text-emerald-600">({insights.maxRate.toFixed(1)}%)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Lowest:</span>
                                            <span className="font-medium text-gray-900 truncate max-w-[100px]" title={insights.worstCampaign?.name}>{insights.worstCampaign?.name}</span>
                                            <span className="font-bold text-rose-500">({insights.minRate.toFixed(1)}%)</span>
                                        </div>
                                        <div className="pt-1 border-t border-gray-100 text-xs text-gray-500 mt-2">
                                            Keep {selectedCampaign.name} above {(insights.avgRate).toFixed(2)}% to stay competitive.
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Action Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, duration: 0.25 }}
                                    className={cn(
                                        "rounded-2xl p-5 border hover:shadow-sm transition-shadow",
                                        insights.performanceTier === 'high' ? "bg-emerald-50/50 border-emerald-200/60" :
                                            insights.performanceTier === 'medium' ? "bg-blue-50/50 border-blue-200/60" :
                                                "bg-rose-50/50 border-rose-200/60"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className={cn("h-4 w-4",
                                            insights.performanceTier === 'high' ? "text-emerald-600" :
                                                insights.performanceTier === 'medium' ? "text-blue-600" :
                                                    "text-rose-600"
                                        )} />
                                        <p className={cn("text-xs uppercase font-bold tracking-wide",
                                            insights.performanceTier === 'high' ? "text-emerald-600" :
                                                insights.performanceTier === 'medium' ? "text-blue-600" :
                                                    "text-rose-600"
                                        )}>Action</p>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {insights.performanceTier === 'high'
                                            ? `Double down on creatives performing in ${selectedCampaign.name}. Scale budget by 10-15% to maximize ROI while maintaining efficiency.`
                                            : insights.performanceTier === 'medium'
                                                ? `Maintain current settings for ${selectedCampaign.name} while testing small variations in ad copy to boost conversion rate slightly.`
                                                : `Test new offer variants to close the gap with ${insights.bestCampaign?.name}. Analyze audience segmentation for potential mismatches.`}
                                    </p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* RIGHT COLUMN: Platform Breakdown (1/3 width) */}
            <div className="lg:col-span-1 xl:col-span-1 rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm flex flex-col h-full">
                <div>
                    <p className="text-2xl font-bold tracking-tight">Platform Breakdown</p>
                    <p className="text-sm text-muted-foreground">Key metrics and budget utilization</p>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                    {/* Platform Leaderboard */}
                    <div className="space-y-6">
                        {platformMetrics.data
                            .filter(platform => platform.spend > 0)
                            .map((platform) => {
                                const percentage = (platform.spend / platformMetrics.totalSpendAll) * 100 || 0;
                                return (
                                    <motion.div
                                        key={platform.name}
                                        className="space-y-3 cursor-pointer"
                                        initial="initial"
                                        animate="visible"
                                        whileHover="hover"
                                    >
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-700">{platform.name}</span>
                                                {platform.name === platformMetrics.bestCpaPlatform?.name && (
                                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 h-5">Best Value</Badge>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(platform.spend)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn("h-3 rounded-full overflow-hidden",
                                            platform.name === 'Facebook' ? "bg-blue-100" :
                                                platform.name === 'Google' ? "bg-red-100" :
                                                    platform.name === 'Line' ? "bg-emerald-100" :
                                                        "bg-gray-100"
                                        )}>
                                            <motion.div
                                                variants={{
                                                    initial: { width: 0 },
                                                    visible: {
                                                        width: `${percentage}%`,
                                                        transition: { duration: 1, ease: "easeOut", delay: 0.2 }
                                                    },
                                                    hover: {
                                                        scaleX: 1.02,
                                                        transition: { duration: 0.2, ease: "easeOut" }
                                                    }
                                                }}
                                                className={cn("h-full rounded-full origin-left",
                                                    platform.name === 'Facebook' ? "bg-blue-600" :
                                                        platform.name === 'Google' ? "bg-red-500" :
                                                            platform.name === 'Line' ? "bg-emerald-500" :
                                                                "bg-gray-900"
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 px-1">
                                            <span>Share: {percentage.toFixed(1)}%</span>
                                            <span>CPA: {(platform.cpa).toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                    </div>

                    {/* AI Suggestion Box */}
                    {/* Interactive AI Suggestion Carousel */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Lightbulb className={cn("h-4 w-4",
                                    tips[currentTipIndex]?.type === 'warning' ? "text-red-600" :
                                        tips[currentTipIndex]?.type === 'opportunity' ? "text-violet-600" :
                                            "text-blue-600"
                                )} />
                                <p className={cn("text-xs uppercase font-bold tracking-wide",
                                    tips[currentTipIndex]?.type === 'warning' ? "text-red-600" :
                                        tips[currentTipIndex]?.type === 'opportunity' ? "text-violet-600" :
                                            "text-blue-600"
                                )}>
                                    {tips[currentTipIndex]?.type === 'warning' ? 'Efficiency Warning' :
                                        tips[currentTipIndex]?.type === 'opportunity' ? 'Optimization Opportunity' :
                                            'Growth Tip'} ({currentTipIndex + 1}/{tips.length})
                                </p>
                            </div>

                            {/* Navigation Arrows */}
                            {tips.length > 1 && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={prevTip}
                                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    </button>
                                    <button
                                        onClick={nextTip}
                                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="min-h-[60px] flex items-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentTipIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-sm text-gray-600 leading-relaxed"
                                >
                                    {tips[currentTipIndex]?.message}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}

export default CampaignAnalytics;
