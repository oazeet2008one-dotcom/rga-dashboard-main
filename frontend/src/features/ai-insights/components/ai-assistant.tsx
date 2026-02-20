import { useState, useRef, useEffect } from "react";
import { Send, FileText, Sparkles, Plus, Mic, PenTool, TrendingUp, Lightbulb, User, MessageSquare, Trash2, PanelLeftClose, PanelLeft, StopCircle, Pencil, X, PanelRight, Zap, ChevronRight, Calculator, RotateCcw } from "lucide-react";
import chatbotImage from "../../chat/chatbot.webp";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AiDetailSummary } from "./ai-detail-summary";
import { AiChatInput } from "./ai-chat-input";
import { MarketingTools } from "./marketing-tools";
import { AiSidebar } from "./ai-sidebar";
import { chatService, ChatSession, ChatMessage } from "../services/chat-service";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboardOverview } from "../../dashboard/hooks/use-dashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DAILY_STRATEGIC_SUMMARY_TITLE } from "../constants";

// Add Speech Recognition Type Definition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

export type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

export type Session = {
    id: string;
    title: string;
    date: Date;
    messages: Message[];
};

export function AiAssistant() {
    const [query, setQuery] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false); // Voice Input State
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false); // Fix: Prevent useEffect from overwriting streaming text

    // Controlled locally to avoid flash, but synced with React Query
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'chat' | 'summary' | 'tools'>('chat');


    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null); // Ref to store recognition instance
    const isProcessingRef = useRef(false); // Sync guard against duplicate sends
    const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Rename State
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");

    const { user, isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();

    // Fetch dashboard data for AI summary
    const { data: dashboardData } = useDashboardOverview({ period: '30d' });

    // 1. React Query: Fetch Sessions
    const { data: apiSessions = [] } = useQuery({
        queryKey: ['chat-sessions', user?.id],
        queryFn: () => chatService.getSessions(user?.id!),
        enabled: !!isAuthenticated && !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const sessions: Session[] = apiSessions.map((s: any) => ({
        id: s.id,
        title: s.title,
        date: new Date(s.updatedAt),
        messages: []
    }));

    // 2. React Query: Fetch Messages for Active Session
    const { data: sessionData, isLoading: isLoadingMessages } = useQuery({
        queryKey: ['chat-session', activeSessionId],
        queryFn: () => chatService.getSession(activeSessionId!),
        enabled: !!activeSessionId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Sync Messages from Query State -> Local State (only when not streaming/thinking to avoid conflicts)
    useEffect(() => {
        if (sessionData && sessionData.messages && !isThinking && !isStreaming) {
            const mappedMessages: Message[] = sessionData.messages.map((m: any) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(m.createdAt)
            }));
            setMessages(mappedMessages);
        } else if (!activeSessionId) {
            setMessages([]);
        }
    }, [sessionData, activeSessionId, isThinking, isStreaming]);

    // 3. Mutations
    const createSessionMutation = useMutation({
        mutationFn: (title: string) => chatService.createSession(title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
        }
    });

    const sendMessageMutation = useMutation({
        mutationFn: ({ sessionId, role, content }: { sessionId: string, role: 'user' | 'assistant', content: string }) =>
            chatService.sendMessage(sessionId, role, content),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-session', activeSessionId] });
            // Also invalidate sessions if title could change (usually handled by backend, but safe to refresh list)
            queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
        }
    });

    const deleteSessionMutation = useMutation({
        mutationFn: (id: string) => chatService.deleteSession(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
            toast.success("Chat deleted");
        },
        onError: () => toast.error("Failed to delete chat")
    });

    const updateSessionMutation = useMutation({
        mutationFn: ({ id, title }: { id: string, title: string }) => chatService.updateSession(id, title),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
            toast.success("Chat renamed");
        },
        onError: () => toast.error("Failed to rename chat")
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isThinking, isLoadingMessages]);

    // Cleanup interval
    useEffect(() => {
        return () => {
            if (streamIntervalRef.current) {
                clearInterval(streamIntervalRef.current);
                streamIntervalRef.current = null;
            }
        };
    }, []);

    const handleSearch = async (q: string = query) => {
        if (!q.trim()) return;

        // 1. 🔒 Sync guard: block duplicate calls instantly
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        setIsThinking(true); // Disable UI immediately

        // Clear any lingering stream interval
        if (streamIntervalRef.current) {
            clearInterval(streamIntervalRef.current);
            streamIntervalRef.current = null;
        }

        // Save the query text before clearing (for recovery on error)
        const savedQuery = q;
        const tempUserMsgId = Date.now().toString();

        try {
            // 2. Ensure Session Exists
            let currentSessionId = activeSessionId;
            if (!currentSessionId) {
                // Determine Session Title
                let sessionTitle = savedQuery.slice(0, 50);
                if (viewMode === 'summary') {
                    const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-');
                    sessionTitle = `${dateStr} ${DAILY_STRATEGIC_SUMMARY_TITLE}`;
                }

                const newSession = await createSessionMutation.mutateAsync(sessionTitle);
                currentSessionId = newSession.id;
                setActiveSessionId(currentSessionId);
            }

            // 3. Optimistic User Message
            const userMsg: Message = {
                id: tempUserMsgId,
                role: 'user',
                content: savedQuery,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, userMsg]);
            setQuery(""); // Clear input AFTER adding message

            // ... (rest of the function remains the same until catch block) ... 
            // NOTE: Since I cannot see the rest of the function in the context window correctly without scrolling, 
            // I will replace the relevant parts carefully.
            // Wait, I am replacing a huge chunk. Let me be precise. 
            // I need to replace lines 160-185 mainly.

            // 4. Send User Message to API
            await sendMessageMutation.mutateAsync({
                sessionId: currentSessionId!,
                role: 'user',
                content: savedQuery
            });

            // 5. Determine Response Logic (Mock AI + API storage)
            const lowerQ = savedQuery.toLowerCase();
            let responseText = "";

            if (lowerQ.includes('caption')) {
                responseText = "Here are a few caption options:\n\n1. 🚀 **Boost your ROI** with AI! #Marketing\n2. Stop guessing, start scaling. 📈\n3. Connect better with smart targeting. 🎯";
            } else if (lowerQ.includes('performance')) {
                responseText = "Recent data:\n\n- 🟢 **CTR +15%**\n- 🔴 **CPC $1.35**\n- 💡 **Suggestion:** Pause 'Mobile_Feed_B'.";
            } else if (lowerQ.includes('trend')) {
                responseText = "🔥 **Trending:**\n\n1. *Short-form video* (2x engagement)\n2. *Sustainability messaging*\n3. *Interactive polls*";
            } else if (lowerQ.includes('lead') || lowerQ.includes('summarize') || lowerQ.includes('summary')) {
                responseText = "📊 **AI Summary Report:**\n\n- **Overall Performance:** Strong growth in Q3.\n- **Key Driver:** Organic traffic increased by 22%.\n- **Risk:** CPA is trending up in paid channels.\n- **Recommendation:** Reallocate budget to high-performing ad sets.";
            } else {
                responseText = `Analyzed "${savedQuery}".Metrics stable.\nRecommendation: Improve ad relevance to lower CPA.`;
            }

            // 6. Simulate AI Thinking (reduced delay 400ms)
            await new Promise(resolve => setTimeout(resolve, 400));

            setIsStreaming(true); // Lock useEffect
            setIsThinking(false);

            // 7. Optimistic AI Message & Streaming Effect
            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: Message = {
                id: aiMsgId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);

            // Streaming Visuals
            let charIndex = 0;
            const chunkSize = 3; // characters per tick
            streamIntervalRef.current = setInterval(() => {
                charIndex += chunkSize;
                const currentContent = responseText.slice(0, Math.min(charIndex, responseText.length));
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId
                        ? { ...msg, content: currentContent }
                        : msg
                ));

                if (charIndex >= responseText.length) {
                    if (streamIntervalRef.current) {
                        clearInterval(streamIntervalRef.current);
                        streamIntervalRef.current = null;
                    }

                    // 8. Save AI message THEN unlock
                    sendMessageMutation.mutateAsync({
                        sessionId: currentSessionId!,
                        role: 'assistant',
                        content: responseText
                    }).then(async () => {
                        // Critical: Wait for refetch to complete so we don't flash stale data
                        await queryClient.invalidateQueries({ queryKey: ['chat-session', currentSessionId] });

                        // Small buffer to ensure React renders the new data
                        setTimeout(() => {
                            setIsStreaming(false);
                            isProcessingRef.current = false;
                        }, 100);
                    }).catch(err => {
                        console.error("Failed to save AI message:", err);
                        setIsStreaming(false);
                        isProcessingRef.current = false;
                    });
                }
            }, 30);

        } catch (err: any) {
            console.error("Chat error:", err);
            setIsThinking(false);
            isProcessingRef.current = false;
            // Restore query so user can retry
            setQuery(savedQuery);
            // Remove the optimistic user message that failed
            setMessages(prev => prev.filter(m => m.id !== tempUserMsgId));

            // Show more specific error
            const errorMessage = err?.response?.data?.message || err?.message || "AI connection failed";
            toast.error(`AI Error: ${errorMessage} `);
        }
    };

    // Voice Input Handler
    const handleVoiceInput = () => {
        if (isListening) {
            // Stop listening
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        // Start listening
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = false; // Stop automatically after one sentence
        recognition.interimResults = false;
        recognition.lang = 'th-TH'; // Default to Thai, can be dynamic

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(prev => (prev ? prev + " " + transcript : transcript));
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        setQuery("");
        setIsThinking(false);
        if (!isSidebarOpen) setIsSidebarOpen(true);
        setViewMode('chat');
    };

    const restoreSession = (session: Session) => {
        setActiveSessionId(session.id);

        // Check if session is a Daily Summary
        if (session.title.includes(DAILY_STRATEGIC_SUMMARY_TITLE)) {
            setViewMode('summary');
        } else {
            setViewMode('chat');
        }

        // Messages synced via React Query useEffect
    };

    const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteSessionMutation.mutateAsync(id);
            if (activeSessionId === id) {
                setActiveSessionId(null);
                setMessages([]);
            }
        } catch (err) {
            // Error handled in mutation
        }
    };

    const handleStartRename = (session: Session, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditingTitle(session.title);
    };

    const handleConfirmRename = async () => {
        if (!editingSessionId || !editingTitle.trim()) {
            setEditingSessionId(null);
            return;
        }
        try {
            await updateSessionMutation.mutateAsync({
                id: editingSessionId,
                title: editingTitle.trim()
            });
        } catch (err) {
            // Error handled in mutation
        }
        setEditingSessionId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pt-4 flex h-[calc(100dvh-60px)] min-h-[500px] relative font-sans gap-0 md:gap-6 overflow-hidden md:overflow-visible">

            <AiSidebar
                id="tutorial-ai-sidebar"
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                handleNewChat={handleNewChat}
                isLoadingMessages={isLoadingMessages}
                activeSessionId={activeSessionId}
                sessions={sessions}
                restoreSession={restoreSession}
                editingSessionId={editingSessionId}
                setEditingSessionId={setEditingSessionId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                handleConfirmRename={handleConfirmRename}
                handleStartRename={handleStartRename}
                handleDeleteSession={handleDeleteSession}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden relative">

                {viewMode === 'summary' ? (
                    <AiDetailSummary
                        onBack={() => setViewMode('chat')}
                        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                        isSidebarOpen={isSidebarOpen}
                        summary={dashboardData?.summary}
                        growth={dashboardData?.growth}
                        // Chat Props
                        query={query}
                        setQuery={setQuery}
                        onSearch={handleSearch}
                        isThinking={isThinking}
                        isListening={isListening}
                        onVoiceInput={handleVoiceInput}
                        onNewChat={handleNewChat}
                        messages={messages}
                        isStreaming={isStreaming}
                    />
                ) : viewMode === 'tools' ? (
                    <MarketingTools onBack={() => setViewMode('chat')} />
                ) : (
                    // Chat Interface
                    <>
                        {/* Chat Header */}
                        <div className="h-14 border-b border-slate-100 bg-white/80 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10 shrink-0">
                            <div className="flex items-center gap-2">
                                {/* Mobile/Desktop Toggle */}
                                <AnimatePresence mode="wait">
                                    {!isSidebarOpen && (
                                        <motion.button
                                            id="tutorial-ai-history-toggle"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsSidebarOpen(true)}
                                            className="p-2.5 mr-2 bg-white/80 hover:bg-white border border-slate-200/60 hover:border-slate-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 block text-slate-500 hover:text-indigo-600"
                                            title="View Chat History"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 p-1.5 overflow-hidden shrink-0">
                                    <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                                </div>
                                <span className="font-semibold text-slate-800">AI Assistant</span>
                                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold tracking-wide uppercase border border-orange-200">
                                    BETA
                                </span>
                            </div>


                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 pr-2 pb-20 pt-4 custom-scrollbar scroll-smooth"
                        >
                            <div className="flex flex-col space-y-6 max-w-3xl mx-auto w-full">
                                {/* Empty State / Welcome Screen */}
                                {messages.length === 0 && (
                                    <motion.div
                                        className="flex flex-col items-center justify-center py-4 space-y-6 mt-2"
                                    >
                                        <div className="space-y-4 text-center">
                                            <motion.div
                                                className="flex items-center justify-center gap-2 mb-4"
                                            >
                                                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                                    <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                                                </div>
                                            </motion.div>
                                            <motion.h1
                                                className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
                                            >
                                                How can I help you?
                                            </motion.h1>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                                            {/* AI Detail Summary Button (Primary) */}
                                            <motion.button
                                                id="tutorial-ai-detail-summary-card"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setViewMode('summary')}
                                                className="relative overflow-hidden px-6 py-6 rounded-2xl text-left border-0 shadow-lg group h-full"
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
                                                <div className="relative flex flex-col justify-between h-full z-10 gap-4">
                                                    <div className="p-3 bg-white/10 w-fit rounded-xl group-hover:bg-white/20 transition-colors backdrop-blur-sm">
                                                        <FileText className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <span className="text-lg font-bold text-white block mb-1">AI Detail Summary</span>
                                                        <span className="text-indigo-100/90 text-sm font-medium">Deep dive analysis & strategic reports</span>
                                                    </div>
                                                </div>
                                            </motion.button>

                                            {/* Campaign Tools Button (Secondary) */}
                                            <motion.button
                                                id="tutorial-ai-marketing-tools"
                                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(248, 250, 252, 1)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setViewMode('tools')}
                                                className="relative px-6 py-6 rounded-2xl text-left border border-slate-200 shadow-sm bg-white hover:border-slate-300 hover:shadow-md transition-all group h-full"
                                            >
                                                <div className="relative flex flex-col justify-between h-full gap-4">
                                                    <div className="p-3 bg-orange-50 w-fit rounded-xl mb-2 group-hover:bg-orange-100 transition-colors">
                                                        <Calculator className="w-6 h-6 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-lg font-bold text-slate-800">Marketing Calculators</span>
                                                        </div>
                                                        <span className="text-slate-500 text-sm font-medium">Quick actions for ads & content</span>
                                                    </div>
                                                </div>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Message List */}
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, index) => (
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
                                                <div className="whitespace-pre-wrap font-normal">{msg.content}</div>
                                            </div>

                                            {msg.role === 'user' && (
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                                    <User className="w-4 h-4 text-slate-500" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Thinking Indicator */}
                                <AnimatePresence>
                                    {isThinking && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex w-full items-start gap-4"
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
                            </div>
                        </div>

                        {/* Input Fixed at Bottom */}
                        <div id="tutorial-ai-input" className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100 sticky bottom-0 z-10 transition-all">
                            <AiChatInput
                                query={query}
                                setQuery={setQuery}
                                onSearch={handleSearch}
                                isThinking={isThinking}
                                isListening={isListening}
                                onVoiceInput={handleVoiceInput}
                                onNewChat={handleNewChat}
                            />
                        </div>
                    </>
                )
                }
            </div >
        </div >
    );
}
