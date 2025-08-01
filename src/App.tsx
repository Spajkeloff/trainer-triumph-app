import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import Services from "./pages/Services";
import PackageManagement from "./pages/PackageManagement";
import Finances from "./pages/Finances";
import Reporting from "./pages/Reporting";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientProfile />} />
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
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
