import { useState, useRef, useEffect } from 'react';
import { ChatButton } from './chat-button';
import { ChatInterface } from './chat-interface';
import { AnimatePresence, motion } from 'framer-motion';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4" ref={widgetRef}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
                    >
                        {/* Header for Widget Mode */}
                        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">AI Assistant</span>
                                <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Beta</span>
                            </div>
                        </div>

                        {/* Chat Interface in Widget Mode */}
                        <div className="flex-1 overflow-hidden bg-slate-50/30 relative">
                            <ChatInterface isWidget={true} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <ChatButton
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
        </div>
    );
}
