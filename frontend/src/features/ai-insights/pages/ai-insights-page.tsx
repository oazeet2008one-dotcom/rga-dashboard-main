import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AiAssistant } from "../components/ai-assistant";
import { MarketingTools } from "../components/marketing-tools";

export function AiInsightsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6 animate-in fade-in duration-500 pb-10">
                {/* AI Assistant Section */}
                <AiAssistant />

                {/* Marketing Tools Section */}
                <div className="mt-4 border-t border-slate-200 pt-6">
                    <MarketingTools />
                </div>
            </div>
        </DashboardLayout>
    );
}
