import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EcommercePage } from '@/features/ecommerce';

export default function EcommerceInsights() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <EcommercePage />
            </DashboardLayout>
        </ProtectedRoute>
    );
}
