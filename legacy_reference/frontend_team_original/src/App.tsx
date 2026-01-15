import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import OAuthCallback from './components/OAuthCallback';
import WebhookEvents from './components/WebhookEvents';
import SyncHistory from './components/SyncHistory';
import { TermsOfService } from './components/legal/TermsOfService';
import { PrivacyPolicy } from './components/legal/PrivacyPolicy';
import { Dashboard } from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import Checklist from './components/Checklist';
import IntegrationManager from './components/IntegrationManager';
import ProductPerformanceDetails from './components/ProductPerformanceDetails';
import { clearSession, getTenantId, getToken } from './services/auth/session';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const tenantId = getTenantId();
    if (token && tenantId) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          <LoginForm 
            onForgotPassword={() => window.location.href = '/forgot-password'}
            onRegister={() => window.location.href = '/register'}
            onLoginSuccess={() => setIsAuthenticated(true)}
          />
        } />
        <Route path="/register" element={
          <RegisterForm 
            onBackToLogin={() => window.location.href = '/login'}
          />
        } />
        <Route path="/forgot-password" element={
          <ForgotPasswordForm 
            onBackToLogin={() => window.location.href = '/login'}
          />
        } />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        
        {/* Legal Pages */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        
        {/* Protected Routes */}
        <Route path="/checklist" element={
          isAuthenticated ? <Checklist /> : <Navigate to="/login" replace />
        } />
        <Route path="/integrations" element={
          isAuthenticated ? <IntegrationManager /> : <Navigate to="/login" replace />
        } />
        <Route path="/dashboard" element={
          isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />
        } />
        <Route path="/profile" element={
          isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />
        } />
        <Route path="/webhooks" element={
          isAuthenticated ? <WebhookEvents /> : <Navigate to="/login" replace />
        } />
        <Route path="/history" element={
          isAuthenticated ? <SyncHistory /> : <Navigate to="/login" replace />
        } />
        <Route path="/product-performance-details" element={
          isAuthenticated ? <ProductPerformanceDetails /> : <Navigate to="/login" replace />
        } />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
    </Router>
  );
};

export default App;
