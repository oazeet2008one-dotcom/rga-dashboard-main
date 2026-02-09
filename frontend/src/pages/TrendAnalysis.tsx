import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import TrendAnalysisPage from '@/features/trend-analysis/pages/trend-analysis-page';

export default function TrendAnalysis() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <TrendAnalysisPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
