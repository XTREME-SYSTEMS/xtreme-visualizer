import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Visual X — faithful ZIP architecture (TypeScript + custom CSS). No Tailwind, no mobile-shell.
import { AppProvider } from '@/components/AppProvider';
import { UIProvider } from '@/lib/uiContext';
import { DeviceShell } from '@/components/visual-x/DeviceShell';
import '@/styles.css';
import '@/vx4-pages.css';

// VX4 pages
import Home from '@/pages/Home';
import Projects from '@/pages/Projects';
import Leads from '@/pages/Leads';
import LeadDetail from '@/pages/LeadDetail';
import Inbox from '@/pages/Inbox';
import More from '@/pages/More';
import Visualizer from '@/pages/Visualizer';
import Systems from '@/pages/Systems';
import Pricing from '@/pages/Pricing';
import ClosePage from '@/pages/Close';
import CRM from '@/pages/CRM';
import Products from '@/pages/Products';
import ColorCharts from '@/pages/ColorCharts';
import EmailTemplates from '@/pages/EmailTemplates';
import LeadGenerator from '@/pages/LeadGenerator';
import BidGenerator from '@/pages/BidGenerator';
import CompetitivePricing from '@/pages/CompetitivePricing';
import IndustryReference from '@/pages/IndustryReference';
import Appointments from '@/pages/Appointments';
import Receipts from '@/pages/Receipts';
import Guardrails from '@/pages/Guardrails';
import SettingsPage from '@/pages/Settings';
import Generator from '@/pages/Generator';
import Dashboard from '@/pages/Dashboard';
import Tracking from '@/pages/Tracking';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors — skip redirect when already on an auth page
  if (authError && !isAuthPage) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Legacy /app/* redirects */}
      <Route path="/app" element={<Navigate to="/" replace />} />
      <Route path="/app/:screen" element={<Navigate to="/" replace />} />

      {/* Main app inside DeviceShell */}
      <Route element={<DeviceShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/more" element={<More />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/systems" element={<Systems />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/close" element={<ClosePage />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/products" element={<Products />} />
        <Route path="/colors" element={<ColorCharts />} />
        <Route path="/email-templates" element={<EmailTemplates />} />
        <Route path="/lead-generator" element={<LeadGenerator />} />
        <Route path="/bid-generator" element={<BidGenerator />} />
        <Route path="/competitive-pricing" element={<CompetitivePricing />} />
        <Route path="/industry" element={<IndustryReference />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="/guardrails" element={<Guardrails />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/generator" element={<Generator />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tracking" element={<Tracking />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AppProvider>
          <UIProvider>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
          </UIProvider>
        </AppProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App