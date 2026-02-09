// frontend/src/components/layout/DashboardLayout.tsx
// =============================================================================
// Dashboard Layout - Uses Shadcn SidebarProvider for state management
// Features: Mobile-responsive sidebar, automatic Sheet drawer on mobile
// =============================================================================

import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ChatWidget } from '@/features/chat';
import { TopRightPanel } from '@/components/layout/TopRightPanel';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <SidebarInset>
        {/* Mobile Header with Trigger */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold">
              R
            </div>
            <span className="font-semibold text-sm">RGA.Data</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
      <ChatWidget />
      <TopRightPanel />
    </SidebarProvider>
  );
}
