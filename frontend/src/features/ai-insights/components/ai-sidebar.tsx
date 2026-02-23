import { Plus, PanelLeftClose, MessageSquare, Sparkles, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Define Session type locally or import it if shared
// Ideally this should be in a shared types file
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

interface AiSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    handleNewChat: () => void;
    isLoadingMessages: boolean;
    activeSessionId: string | null;
    sessions: Session[];
    restoreSession: (session: Session) => void;
    editingSessionId: string | null;
    setEditingSessionId: (id: string | null) => void;
    editingTitle: string;
    setEditingTitle: (title: string) => void;
    handleConfirmRename: () => void;
    handleStartRename: (session: Session, e: React.MouseEvent) => void;
    handleDeleteSession: (id: string, e: React.MouseEvent) => void;
    id?: string;
}

export function AiSidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    handleNewChat,
    isLoadingMessages,
    activeSessionId,
    sessions,
    restoreSession,
    editingSessionId,
    setEditingSessionId,
    editingTitle,
    setEditingTitle,
    handleConfirmRename,
    handleStartRename,
    handleDeleteSession,
    id
}: AiSidebarProps) {
    return (
        <>
            {/* Mobile Overlay Backdrop */}
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
            <div id={id} className={cn(
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
        </>
    );
}
