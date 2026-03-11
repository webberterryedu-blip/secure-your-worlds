import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import SecretsUnlock from "./pages/SecretsUnlock";
import SecretsSetup from "./pages/SecretsSetup";
import SecretsDashboard from "./pages/SecretsDashboard";

import MainLayout from "./components/Layout/MainLayout";
import Identities from "./pages/Identities";
import {
  EmailsPage,
  DevelopmentPage,
  CloudPage,
  AIPage,
  SocialPage,
  FinancialPage,
  OtherPage,
} from "./pages/CategoryPage";

import PrivateRoute from "./components/PrivateRoute";
import SecretsAuth from "./components/SecretsAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Landing - pública */}
              <Route path="/" element={<Landing />} />

              {/* Auth - pública (login/register) */}
              <Route path="/auth" element={<Auth />} />

              {/* Dashboard com Sidebar - protegido */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="identities" element={<Identities />} />
                <Route path="emails" element={<EmailsPage />} />
                <Route path="development" element={<DevelopmentPage />} />
                <Route path="cloud" element={<CloudPage />} />
                <Route path="ai" element={<AIPage />} />
                <Route path="social" element={<SocialPage />} />
                <Route path="financial" element={<FinancialPage />} />
                <Route path="other" element={<OtherPage />} />
              </Route>

              {/* Secrets Vault - protegido por múltiplas camadas de autenticação */}
              <Route
                path="/secrets/setup"
                element={
                  <PrivateRoute>
                    <SecretsAuth>
                      <SecretsSetup />
                    </SecretsAuth>
                  </PrivateRoute>
                }
              />
              <Route
                path="/secrets/unlock"
                element={
                  <PrivateRoute>
                    <SecretsUnlock onUnlock={() => {}} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/secrets"
                element={
                  <PrivateRoute>
                    <SecretsAuth>
                      <SecretsDashboard />
                    </SecretsAuth>
                  </PrivateRoute>
                }
              />

              {/* 404 - fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
