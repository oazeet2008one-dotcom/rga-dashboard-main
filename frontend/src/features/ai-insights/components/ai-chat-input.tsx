
import { useRef, useEffect } from "react";
import { Send, Plus, Mic, StopCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiChatInputProps {
    query: string;
    setQuery: (query: string) => void;
    onSearch: () => void;
    isThinking: boolean;
    isListening: boolean;
    onVoiceInput: () => void;
    onNewChat?: () => void;
    placeholder?: string;
    variant?: 'default' | 'simple';
    isStreaming?: boolean;
}

export function AiChatInput({
    query,
    setQuery,
    onSearch,
    isThinking,
    isListening,
    onVoiceInput,
    onNewChat,
    placeholder = "Ask me anything...",
    variant = "default",
    isStreaming = false
}: AiChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (e.nativeEvent.isComposing) return;
            e.preventDefault();
            onSearch();
        }
    };

    if (variant === 'simple') {
        return (
            <div className="relative w-full">
                <div className="relative bg-slate-100/50 hover:bg-slate-100 transition-colors rounded-xl border border-slate-200 p-1 flex items-center gap-2 pr-2">
                    <textarea
                        ref={textareaRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isListening ? "Listening..." : placeholder}
                        className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-slate-800 placeholder:text-slate-400 min-h-[40px] max-h-[120px] resize-none py-2.5 custom-scrollbar overflow-y-auto"
                        disabled={isThinking}
                        rows={1}
                    />

                    {isThinking ? (
                        <button
                            disabled
                            className="p-1.5 rounded-lg transition-all duration-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                        >
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </button>
                    ) : query.trim() ? (
                        <button
                            onClick={() => onSearch()}
                            disabled={isThinking}
                            className="p-1.5 rounded-lg transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={onVoiceInput}
                            className={cn(
                                "p-1.5 rounded-lg transition-all duration-200",
                                isListening
                                    ? "bg-red-100 text-red-500 animate-pulse"
                                    : "bg-transparent text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                            )}
                        >
                            {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div id="tutorial-ai-chat-input" className="relative group max-w-3xl mx-auto w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-200/20 to-amber-200/20 rounded-[1.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-white rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 p-1.5 flex items-center gap-2 pr-2">
                {onNewChat && (
                    <div className="pl-1">
                        <button
                            id="tutorial-ai-new-chat"
                            type="button"
                            onClick={onNewChat}
                            className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors duration-300 cursor-pointer hover:shadow-sm"
                            title="New Chat"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening..." : placeholder}
                    className="flex-1 bg-transparent border-none outline-none text-base px-2 text-slate-900 placeholder:text-slate-400 min-h-[44px] max-h-[200px] resize-none py-3 custom-scrollbar overflow-y-auto"
                    disabled={isThinking || isStreaming}
                    rows={1}
                />

                {/* Mic / Send Button / Loading - Unified to prevent click loss */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        if (isThinking || isStreaming) return;
                        if (query.trim()) {
                            onSearch();
                        } else {
                            onVoiceInput();
                        }
                    }}
                    disabled={isThinking || isStreaming}
                    className={cn(
                        "p-2 rounded-full transition-all duration-200 flex items-center justify-center",
                        (isThinking || isStreaming)
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : query.trim()
                                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md transform hover:scale-105"
                                : isListening
                                    ? "bg-red-100 text-red-500 animate-pulse hover:bg-red-200"
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                    )}
                    title={
                        (isThinking || isStreaming)
                            ? "AI is working..."
                            : query.trim()
                                ? "Send Message"
                                : isListening
                                    ? "Stop Listening"
                                    : "Start Voice Input"
                    }
                >
                    {(isThinking || isStreaming) ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : query.trim() ? (
                        <Send className="w-4 h-4" />
                    ) : isListening ? (
                        <StopCircle className="w-4 h-4" />
                    ) : (
                        <Mic className="w-4 h-4" />
                    )}
                </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-slate-400/80 font-medium tracking-wide">
                AI can make mistakes. Consider checking important information.
            </div>
        </div>
    );
}
