import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calculator, TrendingUp, Users, DollarSign, Target, ArrowLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MarketingToolsProps {
    onBack?: () => void;
}

function TabNavigation({ tabs, activeTab, onChange }: { tabs: any[], activeTab: string, onChange: (id: string) => void }) {
    return (
        <>
            {/* Mobile Tabs */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="relative z-10 mb-5 grid grid-cols-2 gap-2 md:hidden"
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "flex h-11 items-center gap-2 rounded-xl border px-3 text-left text-sm font-medium transition-colors duration-200",
                                isActive
                                    ? "border-orange-200 bg-orange-50 text-orange-700"
                                    : "border-slate-200 bg-white text-slate-600"
                            )}
                        >
                            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-orange-600" : "text-slate-400")} />
                            <span className="truncate">{tab.mobileLabel}</span>
                        </button>
                    );
                })}
            </motion.div>

            {/* Desktop Tabs */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mb-8 hidden border-b border-slate-200 pb-1 md:flex md:justify-center md:gap-2"
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={cn(
                                "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
                                isActive ? "text-orange-600" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", isActive ? "text-orange-600" : "text-slate-400")} />
                            <span>{tab.label}</span>
                            {isActive && (
                                <motion.span
                                    layoutId="activeTab"
                                    className="absolute bottom-[-5px] left-0 h-[2px] w-full rounded-t-full bg-orange-600"
                                />
                            )}
                        </button>
                    );
                })}
            </motion.div>
        </>
    );
}

export function MarketingTools({ onBack }: MarketingToolsProps) {
    const [activeTab, setActiveTab] = useState('conversion');
    const [showGuide, setShowGuide] = useState(false);

    // State for calculators
    const [conversion, setConversion] = useState({ actions: '', visitors: '', result: 0 });
    const [roi, setRoi] = useState({ revenue: '', cost: '', result: 0 });
    const [cpl, setCpl] = useState({ cost: '', leads: '', result: 0 });
    const [leads, setLeads] = useState({ traffic: '', conversionRate: '', result: 0 });
    const [cpa, setCpa] = useState({ cost: '', customers: '', result: 0 });
    const [profit, setProfit] = useState({ revenue: '', cost: '', result: 0 });

    // Calculation Handlers
    const calculateConversion = (key: string, value: string) => {
        const newData = { ...conversion, [key]: value };
        setConversion(newData);
        const actions = parseFloat(newData.actions) || 0;
        const visitors = parseFloat(newData.visitors) || 0;
        const result = visitors > 0 ? (actions / visitors) * 100 : 0;
        setConversion(prev => ({ ...prev, result: parseFloat(result.toFixed(2)) }));
    };

    const calculateRoi = (key: string, value: string) => {
        const newData = { ...roi, [key]: value };
        setRoi(newData);
        const revenue = parseFloat(newData.revenue) || 0;
        const cost = parseFloat(newData.cost) || 0;
        const result = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
        setRoi(prev => ({ ...prev, result: parseFloat(result.toFixed(2)) }));
    };

    const calculateCpl = (key: string, value: string) => {
        const newData = { ...cpl, [key]: value };
        setCpl(newData);
        const cost = parseFloat(newData.cost) || 0;
        const leadsCount = parseFloat(newData.leads) || 0;
        const result = leadsCount > 0 ? cost / leadsCount : 0;
        setCpl(prev => ({ ...prev, result: parseFloat(result.toFixed(2)) }));
    };

    const calculateLeads = (key: string, value: string) => {
        const newData = { ...leads, [key]: value };
        setLeads(newData);
        const traffic = parseFloat(newData.traffic) || 0;
        const rate = parseFloat(newData.conversionRate) || 0;
        const result = (traffic * rate) / 100;
        setLeads(prev => ({ ...prev, result: Math.round(result) }));
    };

    const calculateCpa = (key: string, value: string) => {
        const newData = { ...cpa, [key]: value };
        setCpa(newData);
        const cost = parseFloat(newData.cost) || 0;
        const customers = parseFloat(newData.customers) || 0;
        const result = customers > 0 ? cost / customers : 0;
        setCpa(prev => ({ ...prev, result: parseFloat(result.toFixed(2)) }));
    };

    const calculateProfit = (key: string, value: string) => {
        const newData = { ...profit, [key]: value };
        setProfit(newData);
        const revenue = parseFloat(newData.revenue) || 0;
        const cost = parseFloat(newData.cost) || 0;
        const result = revenue - cost;
        setProfit(prev => ({ ...prev, result: parseFloat(result.toFixed(2)) }));
    };

    const tabs = [
        { id: 'conversion', label: 'Conversion Rate', mobileLabel: 'Conversion', icon: Target },
        { id: 'lead', label: 'Lead/Traffic', mobileLabel: 'Lead/Traffic', icon: Users },
        { id: 'roi', label: 'ROI', mobileLabel: 'ROI', icon: TrendingUp },
        { id: 'profit', label: 'Profit', mobileLabel: 'Profit', icon: DollarSign },
        { id: 'cpl', label: 'CPL', mobileLabel: 'CPL', icon: DollarSign },
        { id: 'cpa', label: 'CPA', mobileLabel: 'CPA', icon: Calculator },
    ];

    const calculatorGuide: Record<string, { formula: string; purpose: string }> = {
        conversion: {
            formula: "(Number of Actions / Total Visitors) x 100",
            purpose: "Shows what percent of visitors complete your target action."
        },
        lead: {
            formula: "(Monthly Traffic x Expected Conversion Rate) / 100",
            purpose: "Estimates how many leads you can generate from expected traffic and conversion rate."
        },
        roi: {
            formula: "((Revenue - Investment Cost) / Investment Cost) x 100",
            purpose: "Measures whether your investment returns are worth the spend."
        },
        profit: {
            formula: "Total Revenue - Total Cost",
            purpose: "Calculates net profit after all costs are deducted."
        },
        cpl: {
            formula: "Total Spend / Total Leads",
            purpose: "Shows cost per lead for comparing campaign efficiency."
        },
        cpa: {
            formula: "Total Cost Used / Number of Customers",
            purpose: "Shows cost per acquired customer to control acquisition efficiency."
        }
    };

    return (
        <div className="relative flex h-full w-full flex-col items-center gap-6 overflow-y-auto custom-scrollbar pb-6 md:gap-8 md:pb-12">
            {onBack && (
                <div className="sticky top-0 z-20 w-full">
                    <div className="w-full border-b border-slate-100 bg-white backdrop-blur">
                        <div className="flex h-16 w-full items-center px-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onBack}
                                className="group flex items-center gap-3 px-4 py-2.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md backdrop-blur-sm hover:border-indigo-200/60 hover:bg-indigo-50/30 transition-all duration-300"
                            >
                                <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
                                    <ArrowLeft className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="hidden md:inline text-sm font-bold text-slate-600 group-hover:text-indigo-700 transition-colors">Back to AI Assistant</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header + Tabs + Calculator in one container */}
            <div className="mt-1 w-full max-w-4xl px-4 md:mt-0">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-5 flex flex-col items-center space-y-2 pt-8 text-center md:mb-8 md:space-y-3 md:pt-12"
                >
                    <div className="mb-2 rounded-xl bg-orange-50 p-3">
                        <Calculator className="w-6 h-6 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight md:text-3xl">
                        Marketing Calculators
                    </h2>
                    <p className="max-w-lg text-sm text-slate-500 md:text-base">
                        Simple calculators for your digital marketing metrics.
                    </p>
                </motion.div>


                {/* Tabs Navigation */}
                <TabNavigation
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={(id) => {
                        setActiveTab(id);
                        setShowGuide(false);
                    }}
                />

                {/* Tab Content Panels */}
                <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-8">
                    {/* Information Side (Left) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="lg:col-span-4 space-y-4"
                    >
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                            >
                                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    {activeTab === 'conversion' && <Target className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'roi' && <TrendingUp className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'profit' && <DollarSign className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'cpl' && <DollarSign className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'lead' && <Users className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'cpa' && <Calculator className="w-5 h-5 text-orange-600" />}
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                    {activeTab === 'conversion' && "Calculate the percentage of visitors who complete a desired action."}
                                    {activeTab === 'roi' && "Determine the profitability of your investment."}
                                    {activeTab === 'profit' && "Calculate your net profit by subtracting total costs from total revenue."}
                                    {activeTab === 'cpl' && "Find out how much each lead costs you."}
                                    {activeTab === 'lead' && "Estimate potential leads based on traffic and conversion rate."}
                                    {activeTab === 'cpa' && "Calculate the cost to acquire a paying customer."}
                                </p>
                                <div className="pt-4 border-t border-slate-200">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tip</span>
                                    <p className="text-slate-600 text-sm">
                                        {activeTab === 'conversion' && "Consider load time and clear CTAs."}
                                        {activeTab === 'roi' && "Focus on high-value activities."}
                                        {activeTab === 'profit' && "Keep track of all overhead costs."}
                                        {activeTab === 'cpl' && "Target your audience more precisely."}
                                        {activeTab === 'lead' && "Quality traffic converts better."}
                                        {activeTab === 'cpa' && "Retargeting usually lowers CPA."}
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowGuide((prev) => !prev)}
                                        className="flex items-center gap-1 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
                                    >
                                        <motion.span
                                            animate={{ rotate: showGuide ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </motion.span>
                                        {showGuide ? "Hide details" : "Show details"}
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {showGuide && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, y: -6 }}
                                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                                exit={{ opacity: 0, height: 0, y: -6 }}
                                                transition={{ duration: 0.22, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                    <div>
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">How it is calculated</span>
                                                        <p className="mt-1 text-sm text-slate-700">{calculatorGuide[activeTab]?.formula}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Why this metric matters</span>
                                                        <p className="mt-1 text-sm text-slate-700">{calculatorGuide[activeTab]?.purpose}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Calculator Side (Right) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="lg:col-span-8"
                    >
                        <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <CardContent className="p-4 md:p-8 space-y-6">
                                        {/* Conversion Rate Inputs */}
                                        {activeTab === 'conversion' && (
                                            <div className="space-y-6">
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Number of Actions</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={conversion.actions}
                                                            onChange={(e) => calculateConversion('actions', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Total Visitors</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={conversion.visitors}
                                                            onChange={(e) => calculateConversion('visitors', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-slate-700 font-medium">Conversion Rate</span>
                                                    <div className="flex items-baseline gap-1 self-end sm:self-auto">
                                                        <motion.span
                                                            key={conversion.result}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-3xl font-bold text-slate-900"
                                                        >
                                                            {conversion.result}
                                                        </motion.span>
                                                        <span className="text-lg font-medium text-slate-500">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* ROI Inputs */}
                                        {activeTab === 'roi' && (
                                            <div className="space-y-6">
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Revenue (THB)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={roi.revenue}
                                                            onChange={(e) => calculateRoi('revenue', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Investment Cost (THB)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={roi.cost}
                                                            onChange={(e) => calculateRoi('cost', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-slate-700 font-medium">Return on Investment</span>
                                                    <div className="flex items-baseline gap-1 self-end sm:self-auto">
                                                        <motion.span
                                                            key={roi.result}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-3xl font-bold text-slate-900"
                                                        >
                                                            {roi.result}
                                                        </motion.span>
                                                        <span className="text-lg font-medium text-slate-500">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Profit Inputs */}
                                        {activeTab === 'profit' && (
                                            <div className="space-y-6">
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Total Revenue (THB)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={profit.revenue}
                                                            onChange={(e) => calculateProfit('revenue', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Total Cost (THB)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={profit.cost}
                                                            onChange={(e) => calculateProfit('cost', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-slate-700 font-medium">Net Profit</span>
                                                    <div className="flex items-baseline gap-1 self-end sm:self-auto">
                                                        <span className="text-lg font-medium text-slate-500">฿</span>
                                                        <motion.span
                                                            key={profit.result}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={cn(
                                                                "text-3xl font-bold",
                                                                profit.result >= 0 ? "text-slate-900" : "text-red-600"
                                                            )}
                                                        >
                                                            {profit.result.toLocaleString()}
                                                        </motion.span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* CPL Inputs */}
                                        {activeTab === 'cpl' && (
                                            <div className="space-y-6">
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Total Spend (THB)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={cpl.cost}
                                                            onChange={(e) => calculateCpl('cost', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Total Leads</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={cpl.leads}
                                                            onChange={(e) => calculateCpl('leads', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-slate-700 font-medium">Cost Per Lead</span>
                                                    <div className="flex items-baseline gap-1 self-end sm:self-auto">
                                                        <span className="text-lg font-medium text-slate-500">฿</span>
                                                        <motion.span
                                                            key={cpl.result}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-3xl font-bold text-slate-900"
                                                        >
                                                            {cpl.result.toLocaleString()}
                                                        </motion.span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lead Inputs */}
                                        {activeTab === 'lead' && (
                                            <div className="space-y-6">
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Monthly Traffic</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={leads.traffic}
                                                            onChange={(e) => calculateLeads('traffic', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Expected Conversion (%)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={leads.conversionRate}
                                                            onChange={(e) => calculateLeads('conversionRate', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-slate-700 font-medium">Projected Leads</span>
                                                    <div className="flex items-baseline gap-1 self-end sm:self-auto">
                                                        <motion.span
                                                            key={leads.result}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-3xl font-bold text-slate-900"
                                                        >
                                                            {leads.result}
                                                        </motion.span>
                                                        <span className="text-lg font-medium text-slate-500">Leads</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* CPA Inputs */}
                                        {activeTab === 'cpa' && (
                                            <div className="space-y-6">
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Total Cost Used (THB)</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={cpa.cost}
                                                            onChange={(e) => calculateCpa('cost', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-slate-700 font-medium">Number of Customers</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-10 rounded-lg border-slate-300 focus:ring-orange-500 focus:border-orange-500"
                                                            placeholder="0"
                                                            value={cpa.customers}
                                                            onChange={(e) => calculateCpa('customers', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="text-slate-700 font-medium">Cost Per Customer</span>
                                                    <div className="flex items-baseline gap-1 self-end sm:self-auto">
                                                        <span className="text-lg font-medium text-slate-500">฿</span>
                                                        <motion.span
                                                            key={cpa.result}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="text-3xl font-bold text-slate-900"
                                                        >
                                                            {cpa.result.toLocaleString()}
                                                        </motion.span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </motion.div>
                            </AnimatePresence>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
