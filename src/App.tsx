import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import ClientLayout from "./components/ClientLayout";
import Dashboard from "./pages/Dashboard";
import ClientDashboard from "./pages/ClientDashboard";
import Calendar from "./pages/Calendar";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import ClientDetails from "./pages/ClientDetails";
import MySessions from "./pages/MySessions";
import MyPackages from "./pages/MyPackages";
import Services from "./pages/Services";

import Finances from "./pages/Finances";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import CheckEmail from "./pages/CheckEmail";
import { useAuth } from "@/contexts/AuthContext";

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user, profile, loading } = useAuth();
  
  // Add debugging
  console.log('RoleBasedRedirect rendered:', { 
    loading, 
    hasUser: !!user, 
    userRole: profile?.role,
    profileLoading: !profile && !!user 
  });
  
  if (loading) {
    console.log('RoleBasedRedirect: Still loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('RoleBasedRedirect: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // CRITICAL: Wait for profile to load before redirecting
  if (!profile) {
    console.log('RoleBasedRedirect: User exists but profile still loading, waiting...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  console.log('RoleBasedRedirect: Redirecting based on role:', profile.role);
  switch (profile?.role) {
    case 'admin':
    case 'trainer':
      return <Navigate to="/admin/dashboard" replace />;
    case 'client':
    case 'lead':
      return <Navigate to="/client/dashboard" replace />;
    default:
      console.log('RoleBasedRedirect: Unknown role, redirecting to /auth');
      return <Navigate to="/auth" replace />;
  }
};

const queryClient = new QueryClient();

const App = () => {
  console.log('App component mounted');
  
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/check-email" element={<CheckEmail />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Role-based redirect for root */}
            <Route path="/" element={<RoleBasedRedirect />} />
            
            {/* Client routes - SECURITY FIX: Separate client area */}
            <Route path="/client" element={
              <ProtectedRoute requiredRole="client">
                <ClientLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="profile" element={<ClientProfile />} />
              <Route path="sessions" element={<MySessions />} />
              <Route path="packages" element={<MyPackages />} />
            </Route>
            
            {/* Admin/Trainer routes - SECURITY FIX: Admin only access */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="clients/leads" element={<Clients />} />
              <Route path="clients/active" element={<Clients />} />
              <Route path="clients/new" element={<Clients />} />
              <Route path="services" element={<Services />} />
              <Route path="finances" element={<Finances />} />
              <Route path="finances/payments" element={<Finances />} />
              <Route path="finances/invoices" element={<Finances />} />
              <Route path="finances/expenses" element={<Finances />} />
              <Route path="finances/reports" element={<Finances />} />
              <Route path="reporting" element={<Reporting />} />
              <Route path="reporting/revenue" element={<Reporting />} />
              <Route path="reporting/clients" element={<Reporting />} />
              <Route path="reporting/sessions" element={<Reporting />} />
              <Route path="reporting/financial" element={<Reporting />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Trainer routes */}
            <Route path="/trainer" element={
              <ProtectedRoute requiredRole="trainer">
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="sessions" element={<Calendar />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
