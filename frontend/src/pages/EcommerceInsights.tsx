import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EcommerceLandingPage } from '@/features/ecommerce-landing';

export default function EcommerceInsights() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="-m-6">
                    <EcommerceLandingPage />
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
