import { useState, useRef, useEffect } from "react";
import { Send, FileText, Sparkles, Plus, Mic, PenTool, TrendingUp, Lightbulb, User, MessageSquare, Trash2, PanelLeftClose, PanelLeft, StopCircle, Pencil, X, PanelRight, Zap, ChevronRight, Calculator } from "lucide-react";
import chatbotImage from "../../chat/chatbot.webp";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AiDetailSummary } from "./ai-detail-summary";
import { MarketingTools } from "./marketing-tools";
import { chatService, ChatSession, ChatMessage } from "../services/chat-service";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Add Speech Recognition Type Definition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

type Session = {
    id: string;
    title: string;
    date: Date;
    messages: Message[];
};

const ROLE_OPTIONS = [
    { id: 'general', label: 'ทั่วไป' },
    { id: 'ads', label: 'Ads' },
    { id: 'seo', label: 'SEO' },
] as const;

type RoleId = (typeof ROLE_OPTIONS)[number]['id'];

export function AiAssistant() {
    const [query, setQuery] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false); // Voice Input State
    const [isStreaming, setIsStreaming] = useState(false); // Fix: Prevent useEffect from overwriting streaming text
    const [activeRole, setActiveRole] = useState<RoleId>('general');
    const [messagesByRole, setMessagesByRole] = useState<Record<RoleId, Message[]>>({
        general: [],
        ads: [],
        seo: [],
    });

    const messages = messagesByRole[activeRole] || [];
    const updateMessages = (updater: (prev: Message[]) => Message[]) => {
        setMessagesByRole((prev) => ({
            ...prev,
            [activeRole]: updater(prev[activeRole] || []),
        }));
    };
    const setMessagesForRole = (next: Message[]) => {
        setMessagesByRole((prev) => ({
            ...prev,
            [activeRole]: next,
        }));
    };

    // Controlled locally to avoid flash, but synced with React Query
    const [activeSessionIdByRole, setActiveSessionIdByRole] = useState<Record<RoleId, string | null>>({
        general: null,
        ads: null,
        seo: null,
    });
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
    const envWebhookGeneral =
        (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL_GENERAL : '') || '';
    const envWebhookAds =
        (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL_ADS : '') || '';
    const envWebhookSeo =
        (typeof import.meta !== 'undefined' ? import.meta.env.VITE_CHATBOT_WEBHOOK_URL_SEO : '') || '';
    const webhookUrl =
        activeRole === 'ads' ? envWebhookAds : activeRole === 'seo' ? envWebhookSeo : envWebhookGeneral;
    const activeSessionId = activeSessionIdByRole[activeRole];

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
            setMessagesForRole(mappedMessages);
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
            // 2. Ensure Session Exists (if API available)
            let currentSessionId = activeSessionId;
            if (!currentSessionId) {
                try {
                    const newSession = await createSessionMutation.mutateAsync(savedQuery.slice(0, 50));
                    currentSessionId = newSession.id;
                    setActiveSessionIdByRole((prev) => ({ ...prev, [activeRole]: currentSessionId }));
                } catch {
                    currentSessionId = null;
                }
            }

            // 3. Optimistic User Message
            const userMsg: Message = {
                id: tempUserMsgId,
                role: 'user',
                content: savedQuery,
                timestamp: new Date()
            };

            updateMessages(prev => [...prev, userMsg]);
            setQuery(""); // Clear input AFTER adding message

            // 4. Send User Message to API (skip if no session)
            if (currentSessionId) {
                await sendMessageMutation.mutateAsync({
                    sessionId: currentSessionId,
                    role: 'user',
                    content: savedQuery
                });
            }
            // 5. Determine Response Logic (Webhook preferred, fallback to mock)
            const lowerQ = savedQuery.toLowerCase();
            let responseText = "";

            if (webhookUrl) {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: savedQuery,
                        role: activeRole,
                        timestamp: new Date().toISOString(),
                    }),
                });

                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data?.error || data?.message || `HTTP ${response.status}`);
                    }
                    responseText = data.reply || data.response || data.message || data.output || '';
                } else {
                    const text = await response.text();
                    if (!response.ok) {
                        throw new Error(text || `HTTP ${response.status}`);
                    }
                    responseText = text;
                }
            }

            if (!responseText) {
                if (lowerQ.includes('caption')) {
                    responseText = "Here are a few caption options:\n\n1. Boost your ROI with AI!\n2. Stop guessing, start scaling.\n3. Connect better with smart targeting.";
                } else if (lowerQ.includes('performance')) {
                    responseText = "Recent data:\n\n- CTR +15%\n- CPC $1.35\n- Suggestion: Pause 'Mobile_Feed_B'.";
                } else if (lowerQ.includes('trend')) {
                    responseText = "Trending:\n\n1. Short-form video (2x engagement)\n2. Sustainability messaging\n3. Interactive polls";
                } else if (lowerQ.includes('lead') || lowerQ.includes('summarize') || lowerQ.includes('summary')) {
                    responseText = "AI Summary Report:\n\n- Overall Performance: Strong growth in Q3.\n- Key Driver: Organic traffic increased by 22%.\n- Risk: CPA is trending up in paid channels.\n- Recommendation: Reallocate budget to high-performing ad sets.";
                } else {
                    responseText = `Analyzed "${savedQuery}". Metrics stable.\nRecommendation: Improve ad relevance to lower CPA.`;
                }
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
            updateMessages(prev => [...prev, aiMsg]);

            // Streaming Visuals
            let charIndex = 0;
            const chunkSize = 3; // characters per tick
            streamIntervalRef.current = setInterval(() => {
                charIndex += chunkSize;
                const currentContent = responseText.slice(0, Math.min(charIndex, responseText.length));
                updateMessages(prev => prev.map(msg =>
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
                    if (currentSessionId) {
                        sendMessageMutation.mutateAsync({
                            sessionId: currentSessionId,
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
                    } else {
                        setIsStreaming(false);
                        isProcessingRef.current = false;
                    }
                }
            }, 30);

        } catch (err: any) {
            console.error("Chat error:", err);
            setIsThinking(false);
            isProcessingRef.current = false;
            // Restore query so user can retry
            setQuery(savedQuery);
            // Remove the optimistic user message that failed
            updateMessages(prev => prev.filter(m => m.id !== tempUserMsgId));

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
        setActiveSessionIdByRole((prev) => ({
            ...prev,
            [activeRole]: null,
        }));
        setMessagesForRole([]);
        setQuery("");
        setIsThinking(false);
        if (!isSidebarOpen) setIsSidebarOpen(true);
    };

    const restoreSession = (session: Session) => {
        setActiveSessionIdByRole((prev) => ({ ...prev, [activeRole]: session.id }));
        // Messages synced via React Query useEffect
    };

    const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteSessionMutation.mutateAsync(id);
            if (activeSessionId === id) {
                setActiveSessionIdByRole((prev) => ({
                    ...prev,
                    [activeRole]: null,
                }));
                setMessagesForRole([]);
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
        <div className="w-full max-w-7xl mx-auto pt-4 flex h-[calc(100vh-60px)] min-h-[500px] relative font-sans gap-0 md:gap-6 overflow-hidden md:overflow-visible">

            {/* Mobile Overlay Backdrop (Left) */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-[60] md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>



            {/* Left Sidebar (GPT Style) - Collapsible */}
            <div className={cn(
                "flex flex-col gap-2 shrink-0 transition-all duration-300 bg-white md:bg-transparent border-r md:border-r-0 border-slate-100",
                // Mobile: Fixed drawer
                "fixed inset-y-0 left-0 z-[70] h-full shadow-2xl md:shadow-none",
                // Desktop: Relative sidebar
                "md:relative md:z-auto md:h-full md:inset-auto",
                isSidebarOpen
                    ? "translate-x-0 w-[280px] md:w-64 opacity-100"
                    : "-translate-x-full w-[280px] md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
            )}>
                <div className="flex items-center justify-between mb-2 px-1">
                    <button
                        onClick={handleNewChat}
                        className="flex-1 flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <PanelLeftClose className="w-5 h-5" />
                    </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto px-1 space-y-2 custom-scrollbar">
                    <div className="px-2 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Recent Chats
                    </div>
                    {isLoadingMessages && activeSessionId ? (
                        <div className="flex justify-center p-4">
                            <Sparkles className="w-5 h-5 text-orange-400 animate-spin" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-sm">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            No history yet
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {sessions.map(session => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    key={session.id}
                                    className="group relative"
                                >
                                    <button
                                        onClick={() => restoreSession(session)}
                                        className={cn(
                                            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all group text-left border relative",
                                            activeSessionId === session.id
                                                ? "bg-white text-orange-600 font-medium shadow-sm border-orange-100"
                                                : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-100"
                                        )}
                                    >
                                        <MessageSquare className={cn(
                                            "w-4 h-4 shrink-0 transition-colors",
                                            activeSessionId === session.id ? "text-orange-500" : "text-slate-400 group-hover:text-slate-500"
                                        )} />
                                        {editingSessionId === session.id ? (
                                            <input
                                                autoFocus
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                onBlur={handleConfirmRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleConfirmRename();
                                                    if (e.key === 'Escape') setEditingSessionId(null);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 bg-white border border-orange-300 rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-orange-400 min-w-0"
                                            />
                                        ) : (
                                            <span className="truncate flex-1 pr-12">{session.title}</span>
                                        )}
                                    </button>

                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={(e) => handleStartRename(session, e)}
                                            className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded"
                                            title="Rename chat"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteSession(session.id, e)}
                                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                                            title="Delete chat"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-xl overflow-hidden relative">

                {viewMode === 'summary' ? (
                    <AiDetailSummary onBack={() => setViewMode('chat')} />
                ) : viewMode === 'tools' ? (
                    <MarketingTools onBack={() => setViewMode('chat')} />
                ) : (
                    // Chat Interface
                    <>
                        {/* Chat Header */}
                        <div className="border-b border-slate-100 bg-white/80 backdrop-blur px-6 sticky top-0 z-10 shrink-0">
                            <div className="h-14 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {/* Mobile/Desktop Toggle */}
                                    {!isSidebarOpen && (
                                        <button
                                            onClick={() => setIsSidebarOpen(true)}
                                            className="p-2 mr-2 bg-white/50 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors block"
                                            title="View Chat History"
                                        >
                                            <PanelLeft className="w-5 h-5 text-slate-600" />
                                        </button>
                                    )}
                                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 p-1.5 overflow-hidden shrink-0">
                                        <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-semibold text-slate-800">AI Assistant</span>
                                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold tracking-wide uppercase border border-orange-200">
                                        Beta
                                    </span>
                                </div>
                            </div>
                            <div className="pb-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    {ROLE_OPTIONS.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setActiveRole(role.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                                                activeRole === role.id
                                                    ? "bg-orange-500 text-white border-orange-500"
                                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            )}
                                            aria-pressed={activeRole === role.id}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                                {!webhookUrl && (
                                    <div className="mt-2 text-[11px] text-slate-400">
                                        ยังไม่ได้ตั้งค่า `VITE_CHATBOT_WEBHOOK_URL_GENERAL/ADS/SEO` — ระบบจะใช้ข้อความจำลอง
                                    </div>
                                )}
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
                        <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-slate-100 sticky bottom-0 z-10 transition-all">
                            <div className="relative group max-w-3xl mx-auto">
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-200/20 to-amber-200/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative bg-white rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 p-1.5 flex items-center gap-2 pr-2">
                                    <div className="pl-1">
                                        <button
                                            type="button"
                                            onClick={handleNewChat}
                                            className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors duration-300 cursor-pointer hover:shadow-sm"
                                            title="New Chat"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <textarea
                                        ref={(el) => {
                                            if (el) {
                                                el.style.height = 'auto';
                                                el.style.height = el.scrollHeight + 'px';
                                            }
                                        }}
                                        value={query}
                                        onChange={(e) => {
                                            setQuery(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isListening ? "Listening..." : "Ask me anything..."}
                                        className="flex-1 bg-transparent border-none outline-none text-base px-2 text-slate-900 placeholder:text-slate-400 min-h-[44px] max-h-[200px] resize-none py-3 custom-scrollbar overflow-y-auto"
                                        disabled={isThinking}
                                        rows={1}
                                    />

                                    {/* Mic / Send Button */}
                                    {query.trim() ? (
                                        <button
                                            onClick={() => handleSearch()}
                                            disabled={isThinking}
                                            className="p-2 rounded-full transition-all duration-200 bg-orange-500 text-white hover:bg-orange-600 shadow-md transform hover:scale-105"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleVoiceInput}
                                            className={cn(
                                                "p-2 rounded-full transition-all duration-200",
                                                isListening
                                                    ? "bg-red-100 text-red-500 animate-pulse hover:bg-red-200"
                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                                            )}
                                            title={isListening ? "Stop Listening" : "Start Voice Input"}
                                        >
                                            {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                                <div className="text-center mt-2 text-[10px] text-slate-400/80 font-medium tracking-wide">
                                    AI can make mistakes. Consider checking important information.
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div >
    );
}
