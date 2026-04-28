/**
 * Reset Password Page
 * Allows users to set a new password using the reset token from email.
 * Supports both hash-based (#access_token=...&type=recovery) and PKCE (?code=...) flows.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const { updateUserPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const establishSession = async () => {
      try {
        // Flow 1: Hash-based (#access_token=...&refresh_token=...&type=recovery)
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken && type === "recovery") {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          window.history.replaceState(null, "", window.location.pathname);
          setReady(true);
          return;
        }

        // Flow 2: PKCE (?code=...)
        const search = new URLSearchParams(window.location.search);
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState(null, "", window.location.pathname);
          setReady(true);
          return;
        }

        // Flow 3: Session already exists (e.g. user clicked link, supabase-js auto-handled it)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setReady(true);
          return;
        }

        toast.error("Link de redefinição inválido ou expirado.");
        navigate("/auth/forgot-password", { replace: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao validar link de recuperação";
        toast.error(msg);
        navigate("/auth/forgot-password", { replace: true });
      } finally {
        setChecking(false);
      }
    };

    establishSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    if (password.length < 6) return;

    setLoading(true);
    try {
      await updateUserPassword(password);
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      // toast handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 6 && passwordsMatch;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!ready) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Redefinir Senha</CardTitle>
          <CardDescription className="text-muted-foreground">
            Defina sua nova senha para acessar o VaultKey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção: Master Password!</AlertTitle>
            <AlertDescription>
              Redefinir sua senha de login <strong>NÃO</strong> redefine sua Master Password. Você ainda precisará da Master Password original para descriptografar suas credenciais.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Nova Senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirmar Nova Senha"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input border-border text-foreground"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500">As senhas não coincidem</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !isValid}>
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
