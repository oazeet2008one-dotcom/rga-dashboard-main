import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DemoBannerProps {
    isDemo?: boolean;
}

export function DemoBanner({ isDemo }: DemoBannerProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isDemo || !isVisible) {
        return null;
    }

    return (
        <Alert
            variant="default"
            className="mb-4 relative border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:border-yellow-500/30 dark:text-yellow-400"
        >
            <AlertCircle className="h-4 w-4 stroke-yellow-600 dark:stroke-yellow-400" />
            <AlertTitle className="text-yellow-700 dark:text-yellow-400">Demo Mode</AlertTitle>
            <AlertDescription className="mr-8 text-yellow-600/90 dark:text-yellow-400/90">
                You are viewing Demo Data. Connect your ad accounts to see real insights.
            </AlertDescription>
            <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/20 dark:text-yellow-400 dark:hover:text-yellow-300"
                onClick={() => setIsVisible(false)}
            >
                <X className="h-4 w-4" />
            </Button>
        </Alert>
    )
}
