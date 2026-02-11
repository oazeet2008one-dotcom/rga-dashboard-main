import { NotificationWidget } from '@/features/notifications';
import { ContactButton } from '@/components/ui/ContactButton';

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
 * 
 * Future widgets can be added here:
 * - UserProfileDropdown
 * - QuickSearch
 * - ThemeToggle
 * - etc.
 */
export function TopRightPanel() {
    return (
        <div className="fixed top-4 right-6 z-[55] flex items-center gap-3">
            <ContactButton />
            <NotificationWidget />
        </div>
    );
}
