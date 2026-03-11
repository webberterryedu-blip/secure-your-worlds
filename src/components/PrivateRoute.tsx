import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useVaultStore } from "@/stores/vaultStore";
import { Shield } from "lucide-react";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { is2FAEnabled, is2FAVerified } = useVaultStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If 2FA is enabled but not verified for the current session, redirect to 2FA verification
  if (is2FAEnabled && !is2FAVerified) {
    return <Navigate to="/auth/2fa-verify" replace />;
  }

  return <>{children}</>;
}
