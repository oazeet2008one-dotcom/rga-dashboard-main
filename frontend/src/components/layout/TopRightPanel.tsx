import { NotificationWidget } from '@/features/notifications';
import { ContactButton } from '@/components/ui/ContactButton';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTutorialStore } from '@/stores/tutorial-store';
import { TUTORIAL_steps } from '@/components/tutorial/tutorial-data';

/**
 * TopRightPanel - Container for top-right floating action widgets
 * 
 * This component serves as a wrapper for all widgets that should appear
 * in the top-right corner of the application. Add new widgets here
 * to keep them organized in a consistent layout.
 * 
 * Current widgets:
 * - ContactButton (Mail icon)
 * - NotificationWidget (Bell icon)
 * - TutorialTrigger (Help icon)
 * 
 * Future widgets can be added here:
 * - UserProfileDropdown
 * - QuickSearch
 * - ThemeToggle
 * - etc.
 */
export function TopRightPanel() {
    const [location] = useLocation();
    const { startTutorial } = useTutorialStore();

    const handleStartTutorial = () => {
        let tutorialKey = '';
        if (location === '/' || location === '/dashboard') tutorialKey = 'overview';
        else if (location.startsWith('/campaigns')) tutorialKey = 'campaigns';
        else if (location.startsWith('/ai-insights')) tutorialKey = 'ai_insights';
        else if (location.startsWith('/seo-web-analytics') || location.startsWith('/seo')) tutorialKey = 'seo';
        else if (location.startsWith('/data-sources')) tutorialKey = 'data_sources';

        console.log('Targeting Tutorial:', { location, tutorialKey }); // Debug log

        if (tutorialKey && TUTORIAL_steps[tutorialKey]) {
            startTutorial(tutorialKey, TUTORIAL_steps[tutorialKey]);
        }
    };

    return (
        <div className="fixed top-4 right-6 z-[55] flex items-center gap-3">
            <Button
                variant="outline"
                size="icon"
                className="rounded-full shadow-sm bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white"
                onClick={handleStartTutorial}
                title="Start Tutorial"
            >
                <HelpCircle className="h-5 w-5 text-slate-600" />
            </Button>
            <ContactButton />
            <NotificationWidget />
        </div>
    );
}
