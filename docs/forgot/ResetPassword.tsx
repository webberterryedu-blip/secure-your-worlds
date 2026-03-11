
// src/pages/ResetPassword.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateUserPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      toast.error("Token de redefinição de senha inválido ou ausente.");
      navigate("/auth");
    }
  }, [accessToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      // O Supabase SDK usa o access_token da URL automaticamente para atualizar a senha do usuário logado
      await updateUserPassword(password);
      toast.success("Sua senha foi redefinida com sucesso!");
      navigate("/auth");
    } catch (error) {
      // Erro já tratado no AuthContext com toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
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
              Redefinir sua senha de login **NÃO** redefine sua Master Password. Você ainda precisará da Master Password original para descriptografar suas credenciais.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Nova Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input border-border text-foreground"
            />
            <Input
              type="password"
              placeholder="Confirmar Nova Senha"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-input border-border text-foreground"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
