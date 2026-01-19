import { useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
// ✅ NEW: Import from feature module (replaces legacy pages/Dashboard)
import { DashboardPage } from "@/features/dashboard";
// ✅ NEW: Import from feature module (replaces legacy pages/Campaigns)
import { CampaignsPage, CampaignDetailsPage } from "@/features/campaigns";
// ✅ NEW: Import from feature module (replaces legacy pages/Integrations)
import { DataSourcesPage } from "@/features/data-sources";
import Users from "./pages/Users";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import TrendAnalysis from "./pages/TrendAnalysis";
import SeoWebAnalytics from "./pages/SeoWebAnalytics";
import EcommerceInsights from "./pages/EcommerceInsights";
import CrmLeadsInsights from "./pages/CrmLeadsInsights";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from '@/stores/auth-store';
import { useAuthEventListener } from '@/lib/auth-events';

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      {/* ✅ NEW: Use feature-based DashboardPage with ProtectedRoute wrapper */}
      <Route path="/dashboard">
        {() => <ProtectedRoute><DashboardPage /></ProtectedRoute>}
      </Route>
      {/* ✅ NEW: Use feature-based CampaignsPage with ProtectedRoute wrapper */}
      <Route path="/campaigns">
        {() => <ProtectedRoute><CampaignsPage /></ProtectedRoute>}
      </Route>
      {/* ✅ NEW: Campaign Details Page */}
      <Route path="/campaigns/:campaignId">
        {() => <ProtectedRoute><CampaignDetailsPage /></ProtectedRoute>}
      </Route>
      {/* ✅ NEW: Data Sources page with OAuth callback handling */}
      <Route path="/data-sources">
        {() => <ProtectedRoute><DataSourcesPage /></ProtectedRoute>}
      </Route>
      <Route path="/users" component={Users} />
      {/* Legacy integrations page - kept for backward compatibility */}
      <Route path="/integrations" component={Integrations} />
      <Route path="/settings" component={Settings} />
      <Route path="/reports" component={Reports} />
      <Route path="/trend-analysis" component={TrendAnalysis} />
      <Route path="/seo-web-analytics" component={SeoWebAnalytics} />
      <Route path="/ecommerce-insights" component={EcommerceInsights} />
      <Route path="/crm-leads-insights" component={CrmLeadsInsights} />
      <Route path="/">
        {() => <ProtectedRoute><DashboardPage /></ProtectedRoute>}
      </Route>
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// React Query Best Practice: ตั้งค่า staleTime และ cacheTime
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30 วินาที - data จะถือว่า fresh ไม่ต้อง refetch
      cacheTime: 5 * 60 * 1000,  // 5 นาที - เก็บ cache ไว้
      refetchOnWindowFocus: false, // ไม่ refetch เมื่อกลับมาที่ window
    },
  },
});

function App() {
  const [, setLocation] = useLocation();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const logout = useAuthStore((state) => state.logout);

  // ✅ Initialize auth on app mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // ✅ Handle session expiry events (soft navigation, no hard reload)
  useAuthEventListener(() => {
    logout();
    setLocation('/login?expired=true');
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          {/* ✅ REMOVED: AuthProvider - Zustand doesn't need a Provider */}
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
