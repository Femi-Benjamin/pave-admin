import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { AdminApp } from "@/components/admin/AdminApp";
import { AdminEntrySplash } from "@/components/admin/AdminEntrySplash";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Direct root redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected admin dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminEntrySplash>
                    <AdminApp />
                  </AdminEntrySplash>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <AdminEntrySplash>
                    <AdminApp />
                  </AdminEntrySplash>
                </ProtectedRoute>
              }
            />

            {/* Direct shortcuts for ease of use */}
            <Route path="/members" element={<Navigate to="/dashboard/members" replace />} />
            <Route path="/users" element={<Navigate to="/dashboard/members" replace />} />
            <Route path="/kyc" element={<Navigate to="/dashboard/kyc" replace />} />
            <Route path="/savings" element={<Navigate to="/dashboard/savings-programs" replace />} />
            <Route path="/savings-programs" element={<Navigate to="/dashboard/savings-programs" replace />} />
            <Route path="/wallets" element={<Navigate to="/dashboard/wallets" replace />} />
            <Route path="/marketplace" element={<Navigate to="/dashboard/marketplace" replace />} />
            <Route path="/messaging" element={<Navigate to="/dashboard/messaging" replace />} />
            <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
            <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
            <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
