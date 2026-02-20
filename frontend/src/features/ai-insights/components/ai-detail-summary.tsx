import { useState, useRef, useEffect } from "react";
import { TrendingUp, Lightbulb, ArrowLeft, ChevronDown, BarChart3, Zap, User, RotateCcw, Plus } from "lucide-react";
import chatbotImage from "../../chat/chatbot.webp";
import { motion, AnimatePresence, Variants } from "framer-motion";
import type { GrowthMetrics, SummaryMetrics } from "../../dashboard/schemas";
import { formatCurrencyTHBDecimal } from "@/lib/formatters";
import { Message } from "./ai-assistant";
import { DAILY_STRATEGIC_SUMMARY_TITLE } from "../constants";
import { cn } from "@/lib/utils";


interface AiDetailSummaryProps {
    onBack: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
    summary?: SummaryMetrics;
    growth?: GrowthMetrics;
    // Chat Props
    query: string;
    setQuery: (query: string) => void;
    onSearch: () => void;
    isThinking: boolean;
    isListening: boolean;
    onVoiceInput: () => void;
    onNewChat: () => void;
    messages: Message[];
    isStreaming?: boolean;
}

function formatDelta(value: number | null | undefined) {
    if (value == null) return undefined;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
}

// ...
function deltaBadgeClassName(value: number | null | undefined) {
    if (value == null) return 'bg-slate-500/10 text-slate-500';
    return value >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
}

import { AiChatInput } from "./ai-chat-input";

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 50, damping: 15 }
    }
};

export function AiDetailSummary({
    onBack,
    onToggleSidebar,
    isSidebarOpen,
    summary,
    growth,
    query,
    setQuery,
    onSearch,
    isThinking,
    isListening,
    onVoiceInput,
    onNewChat,
    messages,
    isStreaming // <--- Added this
}: AiDetailSummaryProps) {
    const [expandedSections, setExpandedSections] = useState<number[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const scrollBottomRef = useRef<HTMLDivElement>(null); // Ref for auto-scroll

    // Auto-scroll when messages change
    useEffect(() => {
        scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const summaryItems = [
        {
            label: 'CPM',
            value: summary ? formatCurrencyTHBDecimal(summary.averageCpm) : formatCurrencyTHBDecimal(0),
            delta: growth?.cpmGrowth,
            trend: (growth?.cpmGrowth || 0) >= 0 ? 'up' : 'down',
            bg: 'group-hover:text-blue-500',
            color: 'text-blue-500'
        },
        {
            label: 'CTR',
            value: summary ? `${summary.averageCtr.toFixed(1)}%` : '0.0%',
            delta: growth?.ctrGrowth,
            trend: (growth?.ctrGrowth || 0) >= 0 ? 'up' : 'down',
            bg: 'group-hover:text-emerald-500',
            color: 'text-emerald-500'
        },
        {
            label: 'ROAS',
            value: summary ? `${summary.averageRoas.toFixed(1)}` : '0.0',
            delta: growth?.roasGrowth,
            trend: (growth?.roasGrowth || 0) >= 0 ? 'up' : 'down',
            bg: 'group-hover:text-purple-500',
            color: 'text-purple-500'
        },
        {
            label: 'ROI',
            value: summary ? `${summary.averageRoi.toFixed(0)}%` : '0%',
            delta: growth?.roiGrowth,
            trend: (growth?.roiGrowth || 0) >= 0 ? 'up' : 'down',
            bg: 'group-hover:text-orange-500',
            color: 'text-orange-500'
        },
    ];


    // Animation Variants (Subtle)
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    return (
        <motion.div
            className="flex-1 flex flex-col h-full bg-slate-50 relative"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >

            {/* Summary Header */}
            <div className="h-16 border-b border-slate-100/80 flex items-center justify-between px-6 bg-transparent backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                        {!isSidebarOpen && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onToggleSidebar}
                                className="p-2.5 mr-2 bg-white/80 hover:bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 block text-slate-500 hover:text-indigo-600"
                                title="View Chat History"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <motion.button
                        id="tutorial-ai-summary-history"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onNewChat}
                        className="group flex items-center gap-3 px-4 py-2.5 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md backdrop-blur-sm hover:border-indigo-200/60 hover:bg-indigo-50/30 transition-all duration-300"
                    >
                        <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-all duration-300">
                            <ArrowLeft className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="hidden md:inline text-sm font-bold text-slate-600 group-hover:text-indigo-700 transition-colors">Back to AI Assistant</span>
                    </motion.button>
                </div>
            </div>

            {/* Summary Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/50">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Hero Banner (Subtle Entry) */}
                    <motion.div
                        id="tutorial-ai-summary-hero"
                        variants={itemVariants}
                        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl group"
                        whileHover={{ scale: 1.005 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            style={{ backgroundSize: "200% 200%" }}
                        />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <img src={chatbotImage} alt="AI" className="w-5 h-5 object-contain" />
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">AI Analysis Report</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold mb-1">{DAILY_STRATEGIC_SUMMARY_TITLE}</h2>
                            <p className="text-indigo-200 text-sm">{today} — Automatically generated from all data sources</p>
                        </div>
                    </motion.div>

                    {/* AI Summaries Cards */}
                    <div id="tutorial-ai-summary-metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {summaryItems.map((item, i) => (
                            <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-indigo-100 hover:shadow-lg transition-all duration-300 group cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className={`text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors ${item.bg}`}>
                                        {item.label}
                                    </p>
                                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${deltaBadgeClassName(item.delta)}`}>
                                        {formatDelta(item.delta) ?? '—'}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold tracking-tight text-slate-800 mb-1">{item.value}</p>
                                <p className="text-[11px] text-slate-400">vs previous period</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Key Insight Card */}
                    <motion.div
                        id="tutorial-ai-summary-insight"
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow duration-300"
                    >
                        <div className="p-3 bg-amber-100 rounded-full shrink-0">
                            <Lightbulb className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Ads Performance Focus</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Google Ads CPA decreased by 12% while maintaining volume levels.
                                <strong className="text-amber-700 block mt-1">Recommendation: Increase 'Summer Sale' campaign budget by 20% to maximize ROI.</strong>
                            </p>
                        </div>
                    </motion.div>

                    {/* Report Sections (Collapsible Accordion in Grid) */}
                    <div id="tutorial-ai-summary-reports" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[
                            {
                                icon: BarChart3,
                                iconColor: 'text-orange-500',
                                title: 'Overview',
                                color: 'border-l-orange-500',
                                headerBg: 'bg-orange-50',
                                hoverBg: 'hover:bg-orange-100/60',
                                events: [
                                    'Total traffic increased by 8.3% compared to yesterday, driven primarily by Organic Search.',
                                    'Bounce Rate decreased from 42% to 38%, indicating better content engagement.',
                                    'Average Session Duration increased to 3m 24s (+15s vs previous day).',
                                ],
                                trend: 'Engagement trend is up over the last 7 days. Users are spending more time on conversion pages.',
                                prediction: 'If current trends continue, monthly traffic is projected to reach 380k sessions by end of February — a 12% increase from January.',
                            },
                            {
                                icon: Zap,
                                iconColor: 'text-blue-500',
                                title: 'Campaigns',
                                color: 'border-l-blue-500',
                                headerBg: 'bg-blue-50',
                                hoverBg: 'hover:bg-blue-100/60',
                                events: [
                                    'Google Ads CPC dropped by 4.2% while click volume remained stable — budget efficiency is improving.',
                                    'Facebook Lead Gen campaign generated 48 new leads at a CPL of ฿312 (below target of ฿350).',
                                    'TikTok Awareness campaign reached 125,000 impressions with a 3.2% engagement rate.',
                                ],
                                trend: 'Paid channel CPA has been trending down for 3 consecutive weeks. Best performing channel: Google Search.',
                                prediction: 'Recommend increasing Google Ads budget by 15% next week to capitalize on lower CPC trends. Expected to capture 60+ additional conversions.',
                            },
                        ].map((section, idx) => {
                            const isExpanded = expandedSections.includes(idx);
                            const toggleSection = () => {
                                setExpandedSections(prev =>
                                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                                );
                            };
                            return (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    whileHover={{ y: -2 }}
                                    className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 overflow-hidden col-span-1 h-fit`}
                                >
                                    {/* Premium Header - Compact */}
                                    <button
                                        onClick={toggleSection}
                                        className="w-full px-4 py-3 flex items-start gap-3 text-left group"
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${section.headerBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                                            <section.icon className={`w-5 h-5 ${section.iconColor}`} />
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-base font-bold text-slate-800">{section.title}</h3>
                                                <div className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${isExpanded ? 'bg-slate-100' : ''}`}>
                                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                            {!isExpanded && (
                                                <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                                                    {section.events[0]}
                                                </p>
                                            )}
                                        </div>
                                    </button>

                                    {/* Collapsible Content - Compact */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pt-0 space-y-4">
                                                    {/* Divider */}
                                                    <div className="h-px w-full bg-slate-50" />

                                                    {/* What Happened */}
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                                                            KEY EVENTS
                                                        </h4>
                                                        <ul className="space-y-3">
                                                            {section.events.map((event, i) => (
                                                                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed group/item">
                                                                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${section.iconColor}`} />
                                                                    <span className="font-medium group-hover/item:text-slate-950 transition-colors">{event}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Insights Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {/* Trend */}
                                                        <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/50">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1 flex items-center gap-1.5">
                                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                                Trend
                                                            </h4>
                                                            <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">{section.trend}</p>
                                                        </div>

                                                        {/* Prediction */}
                                                        <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100/50">
                                                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1.5">
                                                                <Lightbulb className="w-3 h-3 text-indigo-500" />
                                                                Smart Prediction
                                                            </h4>
                                                            <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">{section.prediction}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Dummy div for auto-scrolling */}
                    <div ref={scrollBottomRef} className="h-4" />

                </div>

                {/* Chat Interface Section (Mimicking AI Assistant) */}
                <div id="tutorial-ai-summary-chat" className="mt-0 max-w-4xl mx-auto pb-8">
                    <div className="flex flex-col bg-white/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden relative">
                        {/* Chat Header */}
                        <div
                            className="w-full px-4 py-3 flex items-start gap-3 text-left group border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-10 shrink-0 cursor-pointer hover:bg-white/90 transition-colors"
                            onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 p-1.5 overflow-hidden">
                                <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 pt-0.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-slate-800">AI Assistant</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold tracking-wide uppercase border border-orange-200">
                                            BETA
                                        </span>
                                    </div>
                                    <div className={`p-1 rounded-full hover:bg-slate-100 transition-colors ${isChatOpen ? '' : 'rotate-180'}`}>
                                        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-300" />
                                    </div>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                                    Ask questions about your data, generate reports, or get optimization suggestions.
                                </p>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        <AnimatePresence>
                            {isChatOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    {/* Chat Messages */}
                                    <div className="p-4 bg-slate-50/50 min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar">
                                        {messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-2 py-10">
                                                <img src={chatbotImage} alt="AI" className="w-12 h-12 opacity-50 grayscale mb-2" />
                                                <p>Ask anything about your data...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col space-y-6">
                                                <AnimatePresence initial={false}>
                                                    {messages.map((msg, index) => {
                                                        return (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                                                className={cn(
                                                                    "flex w-full items-start gap-4",
                                                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                                                )}
                                                            >
                                                                {msg.role === 'assistant' && (
                                                                    <div className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-1 shadow-sm p-1.5 overflow-hidden">
                                                                        <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                                                                    </div>
                                                                )}

                                                                <div className={cn(
                                                                    "max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                                                                    msg.role === 'user'
                                                                        ? "bg-orange-500 text-white rounded-tr-md"
                                                                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-md"
                                                                )}>
                                                                    <div className="whitespace-pre-wrap font-normal">
                                                                        {msg.content}
                                                                    </div>
                                                                </div>

                                                                {msg.role === 'user' && (
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                                                        <User className="w-4 h-4 text-slate-50" />
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        );
                                                    })}
                                                    {isThinking && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            className="flex w-full items-start gap-4 justify-start"
                                                        >
                                                            <div className="w-9 h-9 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 mt-1 shadow-sm p-1.5 overflow-hidden">
                                                                <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                                                                <div className="flex gap-1.5">
                                                                    <motion.div
                                                                        animate={{ y: [0, -5, 0] }}
                                                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                                                    />
                                                                    <motion.div
                                                                        animate={{ y: [0, -5, 0] }}
                                                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                                                    />
                                                                    <motion.div
                                                                        animate={{ y: [0, -5, 0] }}
                                                                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                                                        className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <div ref={scrollBottomRef} className="h-4" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Chat Input (Integrated) */}
                                    <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100">
                                        <AiChatInput
                                            query={query}
                                            setQuery={setQuery}
                                            onSearch={onSearch}
                                            isThinking={isThinking}
                                            isListening={isListening}
                                            onVoiceInput={onVoiceInput}
                                            onNewChat={onNewChat}
                                            placeholder="Ask me anything..."
                                            isStreaming={isStreaming}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>);
}
