import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mic, Trash2, StopCircle, RefreshCw } from 'lucide-react';
import chatbotImage from '../chatbot.webp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Add Speech Recognition Type Definition
declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface ChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
    const DEFAULT_MESSAGE: Message = {
        id: '1',
        text: "Hello! 👋 I'm your AI Assistant. How can I help you regarding your dashboard today?",
        sender: 'ai',
        timestamp: new Date()
    };

    const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load from SessionStorage on mount
    useEffect(() => {
        const saved = sessionStorage.getItem('widget_chat_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                })));
            } catch (e) {
                console.error("Failed to parse widget history", e);
            }
        }
    }, []);

    // Save to SessionStorage whenever messages change
    useEffect(() => {
        sessionStorage.setItem('widget_chat_history', JSON.stringify(messages));
    }, [messages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputValue]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue("");
        setIsTyping(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        // Simulate AI Response
        setTimeout(() => {
            const aiResponses = [
                "I understand. As an AI assistant, I'm here to help guide you through the dashboard.",
                "Could you provide more details about that?",
                "I can help you navigate to the Campaigns or SEO sections if you need.",
                "That's a great question. Let me check the documentation for you.",
                "I'm designed to assist with data visualization and reporting."
            ];
            const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

            const newAiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: randomResponse,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, newAiMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleNewChat = () => {
        setMessages([DEFAULT_MESSAGE]);
        setInputValue("");
        setIsTyping(false);
        setIsListening(false);
        if (recognitionRef.current) recognitionRef.current.stop();
    };

    const handleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'th-TH'; // Default to Thai/English mix

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => (prev ? prev + " " + transcript : transcript));
        };

        recognition.start();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-24 right-6 w-[300px] z-[60] origin-bottom-right"
                >
                    <Card className="border-0 shadow-2xl overflow-hidden flex flex-col h-[480px] rounded-2xl bg-white/95 backdrop-blur-xl border-slate-100 ring-1 ring-slate-200">
                        {/* Header */}
                        <div className="p-3 border-b border-slate-100 bg-white/60 backdrop-blur flex flex-row items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 p-1.5 overflow-hidden">
                                    <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                        AI Assistant
                                        <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold tracking-wide uppercase border border-orange-200">
                                            Beta
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                        Online
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNewChat}
                                className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                                title="Start New Chat"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Messages Body */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50 scroll-smooth custom-scrollbar"
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex w-full items-start gap-2.5",
                                        msg.sender === 'user' ? "flex-row-reverse" : ""
                                    )}
                                >
                                    <Avatar className="h-7 w-7 mt-0.5 border border-slate-100 shadow-sm bg-white">
                                        {msg.sender === 'user' ? (
                                            <>
                                                <AvatarImage src="/avatars/user.png" />
                                                <AvatarFallback className="bg-slate-100 text-slate-500"><User className="h-3.5 w-3.5" /></AvatarFallback>
                                            </>
                                        ) : (
                                            <>
                                                <AvatarImage src={chatbotImage} className="object-cover" />
                                                <AvatarFallback className="bg-white"><Bot className="h-3.5 w-3.5 text-orange-500" /></AvatarFallback>
                                            </>
                                        )}
                                    </Avatar>

                                    <div className={cn(
                                        "max-w-[85%] p-3 text-[13px] leading-relaxed shadow-sm break-words",
                                        msg.sender === 'user'
                                            ? "bg-orange-500 text-white rounded-2xl rounded-tr-sm"
                                            : "bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm"
                                    )}>
                                        {msg.text}
                                        <div className={cn(
                                            "text-[9px] mt-1 text-right opacity-70",
                                            msg.sender === 'user' ? "text-orange-100" : "text-slate-400"
                                        )}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex w-full items-start gap-2.5"
                                >
                                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 p-1.5 overflow-hidden shrink-0 mt-0.5">
                                        <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-3 shadow-sm">
                                        <div className="flex gap-1">
                                            <motion.div
                                                animate={{ y: [0, -3, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                                className="w-1 h-1 bg-slate-400 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ y: [0, -3, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                                className="w-1 h-1 bg-slate-400 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ y: [0, -3, 0] }}
                                                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                                className="w-1 h-1 bg-slate-400 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Input */}
                        <div className="p-3 bg-white border-t border-slate-100">
                            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-[1.5rem] shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-200 transition-all pr-1">
                                <textarea
                                    ref={textareaRef}
                                    placeholder={isListening ? "Listening..." : "Ask me anything..."}
                                    className="flex-1 bg-transparent border-none outline-none text-[13px] px-3 py-3 text-slate-700 placeholder:text-slate-400 min-h-[44px] max-h-[120px] resize-none custom-scrollbar"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isTyping}
                                    rows={1}
                                />

                                <div className="flex items-center gap-1 pr-1">
                                    {!inputValue.trim() && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={handleVoiceInput}
                                            className={cn(
                                                "h-8 w-8 rounded-full hover:bg-slate-200 text-slate-400 transition-colors",
                                                isListening && "text-red-500 bg-red-50 hover:bg-red-100 animate-pulse"
                                            )}
                                        >
                                            {isListening ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        </Button>
                                    )}

                                    <Button
                                        size="icon"
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isTyping}
                                        className={cn(
                                            "h-8 w-8 rounded-full transition-all shadow-sm",
                                            inputValue.trim()
                                                ? "bg-orange-500 hover:bg-orange-600 text-white"
                                                : "bg-slate-200 text-slate-400 opacity-0 w-0 p-0 overflow-hidden"
                                        )}
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                    </Button>
                                    {!inputValue.trim() && <div className="w-1" />} {/* Spacer when send is hidden */}
                                </div>
                            </div>
                            <div className="text-center mt-1.5 text-[9px] text-slate-400 font-medium tracking-wide opacity-80">
                                AI can make mistakes. Check important info.
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
