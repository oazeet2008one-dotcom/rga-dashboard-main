import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mic, Trash2, StopCircle, RefreshCw } from 'lucide-react';
import chatbotImage from '../chatbot.webp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// reuse types if possible or redefine
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export function ChatInterface() {
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

    // Load from SessionStorage on mount (using different key for page vs widget if needed, or same to sync?)
    // Let's use 'page_chat_history' to distinguish
    useEffect(() => {
        const saved = sessionStorage.getItem('page_chat_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setMessages(parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                })));
            } catch (e) {
                console.error("Failed to parse page chat history", e);
            }
        }
    }, []);

    // Save to SessionStorage whenever messages change
    useEffect(() => {
        sessionStorage.setItem('page_chat_history', JSON.stringify(messages));
    }, [messages]);

    // Auto-scroll to bottom
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
        recognition.lang = 'th-TH';

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
        <Card className="w-full max-w-4xl mx-auto h-[700px] border-0 shadow-xl overflow-hidden flex flex-col rounded-2xl bg-white border-slate-100 ring-1 ring-slate-200/50">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 p-1.5 overflow-hidden">
                        <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <div className="text-base font-bold text-slate-800 flex items-center gap-2">
                            AI Assistant
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold tracking-wide uppercase border border-orange-200">
                                Beta
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Always online
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewChat}
                        className="text-slate-500 hover:text-slate-700 hover:bg-white"
                        title="Start New Chat"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        New Chat
                    </Button>
                </div>
            </div>

            {/* Messages Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-white scroll-smooth custom-scrollbar"
            >
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex w-full items-start gap-4",
                            msg.sender === 'user' ? "flex-row-reverse" : ""
                        )}
                    >
                        <Avatar className="h-9 w-9 mt-0.5 border border-slate-100 shadow-sm bg-slate-50">
                            {msg.sender === 'user' ? (
                                <>
                                    <AvatarImage src="/avatars/user.png" />
                                    <AvatarFallback className="bg-slate-100 text-slate-500"><User className="h-4 w-4" /></AvatarFallback>
                                </>
                            ) : (
                                <>
                                    <AvatarImage src={chatbotImage} className="object-cover" />
                                    <AvatarFallback className="bg-white"><Bot className="h-4 w-4 text-orange-500" /></AvatarFallback>
                                </>
                            )}
                        </Avatar>

                        <div className={cn(
                            "max-w-[80%] p-4 text-sm leading-relaxed shadow-sm break-words",
                            msg.sender === 'user'
                                ? "bg-orange-500 text-white rounded-2xl rounded-tr-sm"
                                : "bg-slate-50 border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm"
                        )}>
                            {msg.text}
                            <div className={cn(
                                "text-[10px] mt-1.5 text-right opacity-70",
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
                        className="flex w-full items-start gap-4"
                    >
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 p-1.5 overflow-hidden shrink-0 mt-0.5">
                            <img src={chatbotImage} alt="AI" className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                            <div className="flex gap-1">
                                <motion.div
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                />
                                <motion.div
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                />
                                <motion.div
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                    className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Footer Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-200 transition-all p-2">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleVoiceInput}
                        className={cn(
                            "h-10 w-10 rounded-full hover:bg-slate-200 text-slate-400 transition-colors shrink-0 mb-0.5",
                            isListening && "text-red-500 bg-red-50 hover:bg-red-100 animate-pulse"
                        )}
                        title="Voice Input"
                    >
                        {isListening ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    <textarea
                        ref={textareaRef}
                        placeholder={isListening ? "Listening..." : "Type your message here..."}
                        className="flex-1 bg-transparent border-none outline-none text-sm px-2 py-3 text-slate-700 placeholder:text-slate-400 min-h-[44px] max-h-[150px] resize-none custom-scrollbar"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isTyping}
                        rows={1}
                    />

                    <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isTyping}
                        className={cn(
                            "h-10 w-10 rounded-full transition-all shadow-sm shrink-0 mb-0.5",
                            inputValue.trim()
                                ? "bg-orange-500 hover:bg-orange-600 text-white"
                                : "bg-slate-200 text-slate-400"
                        )}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-center mt-2 text-[10px] text-slate-400 font-medium tracking-wide opacity-80">
                    AI can make mistakes. Please verify important information.
                </div>
            </div>
        </Card>
    );
}
