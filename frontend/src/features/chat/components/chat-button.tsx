import { MessageCircle, X } from 'lucide-react';
import chatbotImage from '../chatbot.webp';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export function ChatButton({ isOpen, onClick }: ChatButtonProps) {
    return (
        <Button
            onClick={onClick}
            size="icon"
            className={cn(
                "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 overflow-hidden",
                isOpen ? "bg-destructive hover:bg-destructive/90 rotate-90 text-white" : "bg-white hover:bg-white/90 drop-shadow p-2"
            )}
        >
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="close"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <X className="h-20 w-20 text-white" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="open"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full w-full flex items-center justify-center"
                    >
                        <img
                            src={chatbotImage}
                            alt="Chat"
                            className="h-full w-full object-contain"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>
    );
}
