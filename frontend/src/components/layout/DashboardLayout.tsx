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
        <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-slate-200/70 bg-background/95 backdrop-blur-sm px-4 shadow-sm md:hidden">
          <SidebarTrigger />
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
