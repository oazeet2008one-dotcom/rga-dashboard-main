import { useState, useRef, useEffect } from "react";
import { Brain, Sparkles, Plus, Mic, PenTool, TrendingUp, Lightbulb, FileText, Send, User, MessageSquare, Trash2, PanelLeftClose, PanelLeft, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

export function AiAssistant() {
    const [query, setQuery] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false); // Voice Input State
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<Session[]>([
        {
            id: '1',
            title: 'Marketing Strategy Q1',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
            messages: []
        },
        {
            id: '2',
            title: 'Ad Caption Ideas',
            date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
            messages: []
        }
    ]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null); // Ref to store recognition instance

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isThinking]);

    const saveCurrentSession = () => {
        if (messages.length === 0) return;

        if (activeSessionId) {
            setSessions(prev => prev.map(session =>
                session.id === activeSessionId
                    ? { ...session, messages: [...messages] }
                    : session
            ));
        } else {
            const newSession: Session = {
                id: Date.now().toString(),
                title: messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : ''),
                date: new Date(),
                messages: [...messages]
            };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
        }
    };

    const handleSearch = async (q: string = query) => {
        if (!q.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: q,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setQuery("");
        setIsThinking(true);

        // Simulate AI Delay then Stream Response
        setTimeout(() => {
            const lowerQ = q.toLowerCase();
            let responseText = "";

            if (lowerQ.includes('caption')) {
                responseText = "Here are a few caption options:\n\n1. 🚀 **Boost your ROI** with AI! #Marketing\n2. Stop guessing, start scaling. 📈\n3. Connect better with smart targeting. 🎯";
            } else if (lowerQ.includes('performance')) {
                responseText = "Recent data:\n\n- 🟢 **CTR +15%**\n- 🔴 **CPC $1.35**\n- 💡 **Suggestion:** Pause 'Mobile_Feed_B'.";
            } else if (lowerQ.includes('trend')) {
                responseText = "🔥 **Trending:**\n\n1. *Short-form video* (2x engagement)\n2. *Sustainability messaging*\n3. *Interactive polls*";
            } else if (lowerQ.includes('lead') || lowerQ.includes('summarize')) {
                responseText = "📊 **Daily Leads:**\n\n- **Total:** 42 (+5)\n- **Qualified:** 18 (43%)\n- **Action:** Follow up 5 high-intent leads.";
            } else {
                responseText = `Analyzed "${q}".Metrics stable.\nRecommendation: Improve ad relevance to lower CPA.`;
            }

            const aiMsgId = (Date.now() + 1).toString();
            const aiMsg: Message = {
                id: aiMsgId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };

            setIsThinking(false);
            setMessages(prev => [...prev, aiMsg]);

            // Streaming Effect
            let i = 0;
            const interval = setInterval(() => {
                i++;
                const currentContent = responseText.slice(0, i);

                setMessages(prev => prev.map(msg =>
                    msg.id === aiMsgId
                        ? { ...msg, content: currentContent }
                        : msg
                ));

                if (i >= responseText.length) {
                    clearInterval(interval);
                    // Update session/Save to history only when fully typed
                    if (activeSessionId) {
                        setSessions(prev => prev.map(s =>
                            s.id === activeSessionId
                                ? { ...s, messages: [...s.messages, userMsg, { ...aiMsg, content: responseText }] }
                                : s
                        ));
                    }
                }
            }, 20); // Typing speed
        }, 1200);
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
        saveCurrentSession();
        setMessages([]);
        setQuery("");
        setIsThinking(false);
        setActiveSessionId(null);
        if (!isSidebarOpen) setIsSidebarOpen(true);
    };

    const restoreSession = (session: Session) => {
        saveCurrentSession();
        setMessages(session.messages.length > 0 ? session.messages : []);
        setActiveSessionId(session.id);
    };

    const handleDeleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) {
            setActiveSessionId(null);
            setMessages([]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSearch();
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto pt-6 flex h-[700px] relative font-sans gap-0 md:gap-6 transition-all duration-300 overflow-hidden md:overflow-visible">

            {/* Mobile Overlay Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Left Sidebar (GPT Style) - Collapsible */}
            <div className={cn(
                "flex flex-col gap-2 shrink-0 h-full transition-all duration-300 bg-white md:bg-transparent z-40 absolute md:relative shadow-xl md:shadow-none border-r md:border-r-0 border-slate-100",
                isSidebarOpen ? "w-64 translate-x-0 opacity-100" : "w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 overflow-hidden"
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
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Close Sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 rounded-xl border border-slate-100/50 overflow-y-auto custom-scrollbar">
                    <div className="flex-1 px-2 py-2">
                        <div className="space-y-1">
                            {sessions.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">Recent Chats</div>
                                    <AnimatePresence initial={false}>
                                        {sessions.map(session => (
                                            <motion.button
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                key={session.id}
                                                onClick={() => restoreSession(session)}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all group text-left border relative",
                                                    activeSessionId === session.id
                                                        ? "bg-white border-slate-200 shadow-sm text-slate-900 font-medium"
                                                        : "text-slate-600 hover:bg-white/60 border-transparent hover:border-slate-100"
                                                )}
                                            >
                                                <MessageSquare className={cn("w-3.5 h-3.5", activeSessionId === session.id ? "text-orange-500" : "text-slate-400 group-hover:text-slate-600")} />
                                                <span className="truncate flex-1 pr-6">{session.title}</span>

                                                <div
                                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete chat"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </AnimatePresence>
                                </>
                            )}
                            {sessions.length === 0 && (
                                <div className="px-2 py-4 text-center text-xs text-slate-400">
                                    No history yet. Start a new chat!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-white/50 rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">

                {/* Toggle Button (Visible when sidebar is closed) */}
                {!isSidebarOpen && (
                    <div className="absolute top-4 left-4 z-20 animate-in fade-in duration-300">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg shadow-sm border border-slate-200 transition-all"
                            title="Open Sidebar"
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Native Scrollable Chat Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 pr-2 pb-20 pt-12 md:pt-4 custom-scrollbar scroll-smooth"
                >
                    <div className="flex flex-col space-y-6 max-w-3xl mx-auto w-full">
                        {/* Empty State / Welcome Screen */}
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center justify-center py-10 space-y-8 mt-10"
                            >
                                <div className="space-y-4 text-center">
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="flex items-center justify-center gap-2 mb-4"
                                    >
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                                            <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                                        </div>
                                    </motion.div>
                                    <motion.h1
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
                                    >
                                        How can I help you?
                                    </motion.h1>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                                    {[
                                        { label: 'Write caption', icon: PenTool },
                                        { label: 'Analyze performance', icon: TrendingUp },
                                        { label: 'Market trends', icon: Lightbulb },
                                        { label: 'Summarize leads', icon: FileText }
                                    ].map((action, index) => {
                                        const Icon = action.icon;
                                        return (
                                            <motion.button
                                                key={action.label}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 + (index * 0.1) }}
                                                whileHover={{ scale: 1.02, backgroundColor: "rgb(255 247 237)" }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleSearch(action.label)}
                                                className="px-4 py-3 rounded-xl bg-white hover:bg-orange-50/50 text-slate-600 hover:text-orange-600 text-sm font-medium transition-colors duration-200 border border-slate-200 hover:border-orange-200 shadow-sm hover:shadow-md flex items-center gap-3 group text-left"
                                            >
                                                <Icon className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors duration-200" />
                                                {action.label}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* Message List */}
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className={cn(
                                        "flex w-full items-start gap-4",
                                        msg.role === 'user' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                            <Brain className="w-4 h-4 text-orange-600" />
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
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                                        <Brain className="w-4 h-4 text-orange-600 animate-pulse" />
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
            </div>
        </div>
    );
}
