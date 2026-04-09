import { useState, useEffect } from "react";
import { TrendingUp, Lightbulb, ArrowLeft, ChevronDown, BarChart3, Zap, Loader } from "lucide-react";
import chatbotImage from "../../chat/chatbot.webp";
import { motion, AnimatePresence } from "framer-motion";
import { useAiSummary } from "../hooks/use-ai-summary";

export interface AiDetailSummaryCard {
    label: string;
    value: string;
    delta: string;
    trend: 'up' | 'down' | 'flat';
    color: string;
    bg?: string;
}

export interface AiDetailInsight {
    title: string;
    message: string;
    recommendation: string;
}

export interface AiDetailSection {
    title: string;
    iconColor: string;
    headerBg: string;
    color: string;
    hoverBg: string;
    events: string[];
    trend: string;
    prediction: string;
}

export interface AiDetailSummaryData {
    summaryCards: AiDetailSummaryCard[];
    insight: AiDetailInsight;
    sections: AiDetailSection[];
}

interface AiDetailSummaryProps {
    onBack: () => void;
    data?: AiDetailSummaryData;
}

export function AiDetailSummary({ onBack, data: propData }: AiDetailSummaryProps) {
    const [expandedSections, setExpandedSections] = useState<number[]>([]);
    const { data: webhookData, isLoading, error } = useAiSummary();
    const [data, setData] = useState<AiDetailSummaryData | null>(propData || null);

    // Use webhook data if available, otherwise use prop data
    useEffect(() => {
        if (webhookData) {
            setData(webhookData);
        } else if (propData) {
            setData(propData);
        }
    }, [webhookData, propData]);

    const hasSummaryData = data && (data.summaryCards.length > 0 || data.sections.length > 0);

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Show loading state
    if (isLoading && !data) {
        return (
            <div className="flex-1 flex flex-col h-full bg-white relative animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="group flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200"
                        >
                            <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                <ArrowLeft className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="hidden md:inline text-sm font-bold text-slate-700 group-hover:text-slate-900">Back to AI Assistant</span>
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">Loading summary data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !data) {
        return (
            <div className="flex-1 flex flex-col h-full bg-white relative animate-in fade-in zoom-in-95 duration-300">
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="group flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200"
                        >
                            <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                <ArrowLeft className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="hidden md:inline text-sm font-bold text-slate-700 group-hover:text-slate-900">Back to AI Assistant</span>
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-md text-center">
                        <p className="text-rose-600 font-medium mb-2">Failed to Load Data</p>
                        <p className="text-slate-600 text-sm">{error?.message || 'Could not fetch summary data from the server.'}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative animate-in fade-in zoom-in-95 duration-300">
            {/* Summary Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-200"
                    >
                        <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="hidden md:inline text-sm font-bold text-slate-700 group-hover:text-slate-900">Back to AI Assistant</span>
                    </button>
                </div>
            </div>

            {/* Summary Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/50">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Hero Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl"
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            animate={{
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{ backgroundSize: "200% 200%" }}
                        />
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <img src={chatbotImage} alt="AI" className="w-5 h-5 object-contain" />
                                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">AI-Generated Report</span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold mb-1">Daily Strategic Summary</h2>
                            <p className="text-indigo-200 text-sm">{today} — Auto-generated from all connected data sources</p>
                        </div>
                    </motion.div>

                    {!hasSummaryData ? (
                        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                            <p className="text-base font-semibold text-slate-800">No Summary Data Available</p>
                            <p className="mt-2 text-sm text-slate-500">Ask the AI assistant to generate a summary report first, then come back to view it here.</p>
                        </div>
                    ) : (
                        <>
                            {/* AI Summaries Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {data!.summaryCards.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-300 group cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <p className={`text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors ${item.bg ?? ''}`}>
                                                {item.label}
                                            </p>
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${item.trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                {item.delta}
                                            </span>
                                        </div>
                                        <p className="text-2xl font-bold tracking-tight text-slate-800 mb-1">{item.value}</p>
                                        <p className="text-[11px] text-slate-400">From last period</p>
                                    </motion.div>
                                ))}
                            </div>



                            {/* Key Insight Card */}
                        </>
                    )}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 shadow-sm flex items-start gap-4"
                    >
                        <div className="p-3 bg-amber-100 rounded-full shrink-0">
                            <Lightbulb className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{data!.insight.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                {data!.insight.message}
                                <strong className="text-amber-700 block mt-1">{data!.insight.recommendation}</strong>
                            </p>
                        </div>
                    </motion.div>

                    {/* Report Sections (Collapsible Accordion in Grid) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {data!.sections.map((section, idx) => {
                            const isExpanded = expandedSections.includes(idx);
                            const toggleSection = () => {
                                setExpandedSections(prev =>
                                    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
                                );
                            };

                            const SectionIcon = section.title.toLowerCase().includes('campaign') ? Zap : BarChart3;

                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                                    className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden col-span-1 h-fit`}
                                >
                                    {/* Premium Header - Compact */}
                                    <button
                                        onClick={toggleSection}
                                        className="w-full px-4 py-3 flex items-start gap-3 text-left group"
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${section.headerBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}>
                                            <SectionIcon className={`w-5 h-5 ${section.iconColor}`} />
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
                                                                AI Forecast
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
                </div>
            </div>
        </div>
    );
}
