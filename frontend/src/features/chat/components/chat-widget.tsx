import { useState } from 'react';
import { ChatButton } from './chat-button';
import { ChatWindow } from './chat-window';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
            <ChatWindow
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
            <ChatButton
                isOpen={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            />
        </div>
    );
}
