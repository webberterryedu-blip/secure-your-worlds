import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "./Dashboard";
import { Shield } from "lucide-react";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <Dashboard />;
}
