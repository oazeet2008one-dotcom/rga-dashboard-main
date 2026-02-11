import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calculator, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MarketingTools() {
    const [activeTab, setActiveTab] = useState('conversion');

    // State for calculators
    const [conversion, setConversion] = useState({ actions: '', visitors: '', result: 0 });
    const [roi, setRoi] = useState({ revenue: '', cost: '', result: 0 });
    const [cpl, setCpl] = useState({ cost: '', leads: '', result: 0 });
    const [leads, setLeads] = useState({ traffic: '', conversionRate: '', result: 0 });
    const [cpa, setCpa] = useState({ cost: '', customers: '', result: 0 });

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

    const tabs = [
        { id: 'conversion', label: 'Conversion Rate', icon: Target },
        { id: 'lead', label: 'Lead/Traffic', icon: Users },
        { id: 'roi', label: 'ROI', icon: TrendingUp },
        { id: 'cpl', label: 'CPL', icon: DollarSign },
        { id: 'cpa', label: 'CPA', icon: Calculator },
    ];

    return (
        <div className="flex flex-col items-center w-full py-12 space-y-8">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center text-center space-y-3 max-w-2xl px-4"
            >
                <div className="p-3 bg-orange-50 rounded-xl mb-2">
                    <Calculator className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Campaign Tools
                </h2>
                <p className="text-slate-500 text-base max-w-lg">
                    Simple calculators for your digital marketing metrics.
                </p>
            </motion.div>

            {/* Tabs Navigation */}
            <div className="w-full max-w-4xl px-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-wrap justify-center gap-2 mb-8 border-b border-slate-200 pb-1"
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-200 relative",
                                    isActive
                                        ? "text-orange-600"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-orange-600" : "text-slate-400")} />
                                <span>{tab.label}</span>
                                {isActive && (
                                    <motion.span
                                        layoutId="activeTab"
                                        className="absolute bottom-[-5px] left-0 w-full h-[2px] bg-orange-600 rounded-t-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </motion.div>

                {/* Tab Content Panels */}
                <div className="grid gap-8 lg:grid-cols-12 items-start">
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
                                className="bg-slate-50 rounded-xl p-6 border border-slate-100"
                            >
                                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    {activeTab === 'conversion' && <Target className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'roi' && <TrendingUp className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'cpl' && <DollarSign className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'lead' && <Users className="w-5 h-5 text-orange-600" />}
                                    {activeTab === 'cpa' && <Calculator className="w-5 h-5 text-orange-600" />}
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h3>
                                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                    {activeTab === 'conversion' && "Calculate the percentage of visitors who complete a desired action."}
                                    {activeTab === 'roi' && "Determine the profitability of your investment."}
                                    {activeTab === 'cpl' && "Find out how much each lead costs you."}
                                    {activeTab === 'lead' && "Estimate potential leads based on traffic and conversion rate."}
                                    {activeTab === 'cpa' && "Calculate the cost to acquire a paying customer."}
                                </p>
                                <div className="pt-4 border-t border-slate-200">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Tip</span>
                                    <p className="text-slate-600 text-sm">
                                        {activeTab === 'conversion' && "Consider load time and clear CTAs."}
                                        {activeTab === 'roi' && "Focus on high-value activities."}
                                        {activeTab === 'cpl' && "Target your audience more precisely."}
                                        {activeTab === 'lead' && "Quality traffic converts better."}
                                        {activeTab === 'cpa' && "Retargeting usually lowers CPA."}
                                    </p>
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
                        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
                            <AnimatePresence mode='wait'>
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <CardContent className="p-6 md:p-8 space-y-6">
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
                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                                    <span className="text-slate-700 font-medium">Conversion Rate</span>
                                                    <div className="flex items-baseline gap-1">
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
                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                                    <span className="text-slate-700 font-medium">Return on Investment</span>
                                                    <div className="flex items-baseline gap-1">
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
                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                                    <span className="text-slate-700 font-medium">Cost Per Lead</span>
                                                    <div className="flex items-baseline gap-1">
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
                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                                    <span className="text-slate-700 font-medium">Projected Leads</span>
                                                    <div className="flex items-baseline gap-1">
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
                                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                                                    <span className="text-slate-700 font-medium">Cost Per Customer</span>
                                                    <div className="flex items-baseline gap-1">
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
