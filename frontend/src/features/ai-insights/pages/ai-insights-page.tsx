import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AiAssistant } from "../components/ai-assistant";
import { useRedirectEmptyState } from "@/features/shared/hooks/use-redirect-empty-state";

export function AiInsightsPage() {
    const { getEmptyStateProps } = useRedirectEmptyState();
    // AI Insights is considered empty when user has no chat history
    // The AI Assistant component manages its own state
    const isEmptyState = false; // Always allow AI chat, even for new users
    const emptyStateProps = getEmptyStateProps(isEmptyState);

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-48px)] overflow-hidden animate-in fade-in duration-500" {...emptyStateProps}>
                {/* AI Assistant Section */}
                <AiAssistant />
            </div>
        </DashboardLayout>
    );
}
