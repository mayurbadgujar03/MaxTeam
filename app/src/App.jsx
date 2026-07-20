import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstitutionAdminRoute } from "@/components/auth/InstitutionAdminRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import BatchesPage from "./pages/BatchesPage";
import IntakeFormPage from "./pages/IntakeFormPage";

const Router = typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron')
  ? HashRouter
  : BrowserRouter;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Router>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/auth/register" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/auth/forgot-password" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/auth/reset-password/:token" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/auth/verify-email" element={<Navigate to="/auth/login" replace />} />
                  <Route path="/auth/verify-email/:token" element={<Navigate to="/auth/login" replace />} />

                  {/* Public intake form — outside ProtectedRoute */}
                  <Route path="/intake/:batchId" element={<IntakeFormPage />} />

                  <Route
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/projects" element={<ProjectsPage />} />
                    <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route 
                      path="/batches" 
                      element={
                        <InstitutionAdminRoute>
                          <BatchesPage />
                        </InstitutionAdminRoute>
                      } 
                    />
                  </Route>

                  <Route
                    element={
                      <ProtectedRoute allowedRoles={["superadmin"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/admin" element={<AdminDashboardPage />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            </TooltipProvider>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
