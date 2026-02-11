import { MessageCircle, X } from 'lucide-react';
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
                "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50",
                isOpen ? "bg-destructive hover:bg-destructive/90 rotate-90" : "bg-primary hover:bg-primary/90"
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
                        <X className="h-6 w-6 text-white" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="open"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <MessageCircle className="h-7 w-7 text-white" />
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>
    );
}
