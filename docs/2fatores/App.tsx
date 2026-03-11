
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, PrivateRoute } from "@/contexts/AuthContext";
import { MasterPasswordProvider } from "@/contexts/MasterPasswordContext";
import { MasterPasswordDialog } from "@/components/MasterPasswordDialog";
import { Layout } from "@/components/Layout";
import { useVaultStore } from "@/store/vaultStore";
import { useState, useEffect } from "react";

// Páginas existentes
import { Landing } from "@/pages/Landing"; // Renomeado de Index para Landing
import { Auth } from "@/pages/Auth";
import { Dashboard } from "@/pages/Dashboard";
import { NotFound } from "@/pages/NotFound";

// Novas páginas de cofre especializadas
import { EmailVault } from "@/pages/EmailVault";
import { DevVault } from "@/pages/DevVault";
import { CloudVault } from "@/pages/CloudVault";
import { AIVault } from "@/pages/AIVault";
import { SocialVault } from "@/pages/SocialVault";
import { FinanceVault } from "@/pages/FinanceVault";
import { OthersVault } from "@/pages/OthersVault";
import { IdentitiesPage } from "@/pages/IdentitiesPage";
import { SecuritySettings } from "@/pages/SecuritySettings"; // Nova página de segurança
import { TwoFactorVerify } from "@/components/TwoFactorVerify"; // Componente de verificação 2FA

// Supondo que SecretsAuth e SecretsDashboard existam
// import { SecretsAuth } from "@/components/SecretsAuth";
// import { SecretsDashboard } from "@/pages/SecretsDashboard";

const queryClient = new QueryClient();

function App() {
  const { masterPassword, loadAndDecryptCredentials } = useVaultStore();
  const [isMasterPasswordDialogOpen, setIsMasterPasswordDialogOpen] = useState(false);

  useEffect(() => {
    // Abre o diálogo da Master Password se não estiver definida e o usuário estiver logado
    // (A lógica de login deve ser gerenciada pelo AuthProvider)
    // Por simplicidade, vamos abrir o diálogo se masterPassword for null
    if (!masterPassword) {
      setIsMasterPasswordDialogOpen(true);
    }
  }, [masterPassword]);

  const handleMasterPasswordSet = (password: string) => {
    loadAndDecryptCredentials(password);
    setIsMasterPasswordDialogOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MasterPasswordProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/2fa-verify" element={<TwoFactorVerify isOpen={true} onClose={() => {}} onVerified={() => {}} />} /> {/* Rota para verificação 2FA */}

                {/* Rotas autenticadas que usam o Layout com Sidebar */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/vault/emails"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <EmailVault />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/vault/dev"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <DevVault />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/vault/cloud"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <CloudVault />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/vault/ai"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <AIVault />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/vault/social"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <SocialVault />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/vault/finance"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <FinanceVault />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/vault/others"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <OthersVault />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/identities"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <IdentitiesPage />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/security"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <SecuritySettings />
                      </Layout>
                    </PrivateRoute>
                  }
                />

                {/* Exemplo de rota para Secrets Manager, se existir */}
                {/* <Route
                  path="/secrets"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <SecretsAuth>
                          <SecretsDashboard />
                        </SecretsAuth>
                      </Layout>
                    </PrivateRoute>
                  }
                /> */}

                <Route path="*" element={<NotFound />} />
              </Routes>

              <MasterPasswordDialog
                isOpen={isMasterPasswordDialogOpen}
                onClose={() => setIsMasterPasswordDialogOpen(false)}
                onMasterPasswordSet={handleMasterPasswordSet}
              />
            </MasterPasswordProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
