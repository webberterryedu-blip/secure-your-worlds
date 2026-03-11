import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
import { useSecrets } from "@/hooks/useSecrets";
import SecretsUnlock from "@/pages/SecretsUnlock";

interface SecretsAuthProps {
  children: React.ReactNode;
}

export default function SecretsAuth({ children }: SecretsAuthProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isUnlocked, isConfigured, isLoading } = useSecrets();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is configured
    if (!isLoading) {
      setIsChecking(false);
    }
  }, [isLoading, isConfigured]);

  // Show loading while checking
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not configured, redirect to setup
  if (!isConfigured && location.pathname !== "/secrets/setup") {
    navigate("/secrets/setup");
    return null;
  }

  // If not unlocked, show unlock screen
  if (!isUnlocked) {
    // Allow access to setup page if not configured
    if (location.pathname === "/secrets/setup") {
      return <>{children}</>;
    }

    return <SecretsUnlock onUnlock={() => navigate("/secrets")} />;
  }

  // If unlocked, render children
  return <>{children}</>;
}
