import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContactButtonProps {
    onClick?: () => void;
}

export function ContactButton({ onClick }: ContactButtonProps) {
    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            // Default action: open email client
            window.location.href = 'mailto:support@rga.data';
        }
    };

    return (
        <Button
            onClick={handleClick}
            size="icon"
            className={cn(
                "h-10 w-10 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40",
                "bg-white/90 backdrop-blur-sm border border-slate-200/80",
                "hover:bg-white hover:shadow-xl"
            )}
            title="Contact Support"
        >
            <Mail className="h-4 w-4 text-slate-700" />
        </Button>
    );
}
