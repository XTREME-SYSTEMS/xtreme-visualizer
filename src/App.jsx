import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import { VisualXProvider } from '@/components/vx/VisualXContext';
import AppShell from '@/components/vx/AppShell';
import Home from '@/pages/Home';
import Scan from '@/pages/Scan';
import Visualizer from '@/pages/Visualizer';
import Compare from '@/pages/Compare';
import Blends from '@/pages/Blends';
import Metallic from '@/pages/Metallic';
import Products from '@/pages/Products';
import Quote from '@/pages/Quote';
import ProposalPage from '@/pages/Proposal';
import LeadPage from '@/pages/Lead';
import Settings from '@/pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<Navigate to="/app/home" replace />} />
      <Route path="/app" element={<Navigate to="/app/home" replace />} />
      <Route element={<AppShell />}>
        <Route path="/app/home" element={<Home />} />
        <Route path="/app/scan" element={<Scan />} />
        <Route path="/app/visualizer" element={<Visualizer />} />
        <Route path="/app/compare" element={<Compare />} />
        <Route path="/app/blends" element={<Blends />} />
        <Route path="/app/metallic" element={<Metallic />} />
        <Route path="/app/products" element={<Products />} />
        <Route path="/app/quote" element={<Quote />} />
        <Route path="/app/proposal" element={<ProposalPage />} />
        <Route path="/app/lead" element={<LeadPage />} />
        <Route path="/app/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <VisualXProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
        </VisualXProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App