import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasTwoFactorPassed, useTwoFactor } from "@/hooks/useTwoFactor";
import { Shield } from "lucide-react";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isEnabledForUser } = useTwoFactor();
  const location = useLocation();
  const [check, setCheck] = useState<{ loading: boolean; needs2FA: boolean }>({
    loading: true,
    needs2FA: false,
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user) {
        setCheck({ loading: false, needs2FA: false });
        return;
      }
      if (hasTwoFactorPassed()) {
        setCheck({ loading: false, needs2FA: false });
        return;
      }
      const enabled = await isEnabledForUser(user.id);
      if (!cancelled) setCheck({ loading: false, needs2FA: enabled });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [user, isEnabledForUser]);

  if (loading || check.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (check.needs2FA && location.pathname !== "/auth/2fa-verify") {
    return <Navigate to="/auth/2fa-verify" replace />;
  }

  return <>{children}</>;
}
