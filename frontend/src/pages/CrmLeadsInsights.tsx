import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CrmPage } from '@/features/crm';

export default function CrmLeadsInsights() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <CrmPage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
