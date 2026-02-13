import { useState, useRef, useEffect } from 'react';
import { ChatButton } from './chat-button';
import { ChatWindow } from './chat-window';
import { AnimatePresence, motion } from 'framer-motion';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                // Check if click is inside ChatWindow (which might be rendered outside via portal or fixed pos)
                // Since ChatWindow is fixed, it might be outside widgetRef.
                // But let's assume ChatWindow handles its own close or we rely on the button.
                // ChatWindow has onClose prop.
            }
        };
        // ...
    }, [isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4" ref={widgetRef}>
            <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <ChatButton
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
        </div>
    );
}
