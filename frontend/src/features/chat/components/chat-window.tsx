import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! 👋 I'm your AI Assistant. How can I help you with your dashboard today?",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

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
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-24 right-6 w-[350px] z-40 shadow-2xl"
                >
                    <Card className="border-0 shadow-xl overflow-hidden flex flex-col h-[500px]">
                        {/* Header */}
                        <CardHeader className="p-4 bg-primary text-primary-foreground flex flex-row items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-full">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold flex items-center gap-1">
                                        AI Assistant <Sparkles className="h-3 w-3 text-yellow-300" />
                                    </CardTitle>
                                    <p className="text-[10px] text-primary-foreground/80 font-medium">Online • RGA.Data Bot</p>
                                </div>
                            </div>
                        </CardHeader>

                        {/* Messages Body */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth"
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-2 max-w-[85%]",
                                        msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <Avatar className="h-8 w-8 mt-1 border">
                                        {msg.sender === 'user' ? (
                                            <>
                                                <AvatarImage src="/avatars/user.png" />
                                                <AvatarFallback className="bg-indigo-100 text-indigo-600"><User className="h-4 w-4" /></AvatarFallback>
                                            </>
                                        ) : (
                                            <>
                                                <AvatarImage src="/avatars/bot.png" />
                                                <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                                            </>
                                        )}
                                    </Avatar>

                                    <div className={cn(
                                        "p-3 rounded-2xl text-sm shadow-sm",
                                        msg.sender === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-white border text-foreground rounded-tl-none"
                                    )}>
                                        {msg.text}
                                        <div className={cn(
                                            "text-[10px] mt-1 text-right opacity-70",
                                            msg.sender === 'user' ? "text-primary-foreground" : "text-muted-foreground"
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
                                    className="flex gap-2 max-w-[85%]"
                                >
                                    <Avatar className="h-8 w-8 mt-1 border">
                                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white border p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                                        <motion.div
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                                            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                                            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                                            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer Input */}
                        <CardFooter className="p-3 bg-white border-t">
                            <div className="flex w-full items-center gap-2">
                                <Input
                                    placeholder="Type your message..."
                                    className="flex-1 focus-visible:ring-primary"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isTyping}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="shrink-0"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
