import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import DashboardOverview from "@/pages/dashboard/Overview";
import UsersPage from "@/pages/dashboard/Users";
import KYCReviewPage from "@/pages/dashboard/KYCReview";
import WalletsPage from "@/pages/dashboard/Wallets";
import TransactionsPage from "@/pages/dashboard/Transactions";
import SavingsPage from "@/pages/dashboard/Savings";
import ThriftPage from "@/pages/dashboard/Thrift";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="kyc" element={<KYCReviewPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="savings" element={<SavingsPage />} />
              <Route path="thrift" element={<ThriftPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
