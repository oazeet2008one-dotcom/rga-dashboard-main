import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TypewriterProps {
    text: string;
    speed?: number;
    delay?: number;
    className?: string;
    onComplete?: () => void;
    showCursor?: boolean;
}

export function Typewriter({
    text,
    speed = 30, // Default speed (ms per char)
    delay = 0,
    className = "",
    onComplete,
    showCursor = true
}: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        // Reset state if text changes
        setDisplayedText("");
        setIsComplete(false);
        indexRef.current = 0;

        const startTyping = () => {
            const intervalId = setInterval(() => {
                if (indexRef.current < text.length) {
                    setDisplayedText((prev) => prev + text.charAt(indexRef.current));
                    indexRef.current++;
                } else {
                    clearInterval(intervalId);
                    setIsComplete(true);
                    if (onCompleteRef.current) onCompleteRef.current();
                }
            }, speed);

            return () => clearInterval(intervalId);
        };

        const timeoutId = setTimeout(startTyping, delay);

        return () => clearTimeout(timeoutId);
    }, [text, speed, delay]); // Removed onComplete from dependency array

    return (
        <span className={className}>
            {displayedText}
            {showCursor && !isComplete && (
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-[2px] h-[1em] bg-current ml-1 align-middle"
                />
            )}
        </span>
    );
}
