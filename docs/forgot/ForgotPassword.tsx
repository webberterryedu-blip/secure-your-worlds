
// src/pages/ForgotPassword.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendPasswordResetEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(email);
      toast.success("Link de recuperação enviado! Verifique seu e-mail.");
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
          <CardTitle className="text-2xl font-bold text-foreground">Esqueceu sua Senha?</CardTitle>
          <CardDescription className="text-muted-foreground">
            Insira seu e-mail para receber um link de recuperação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Seu e-mail"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border text-foreground"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Link de Recuperação"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Lembrou da senha?{" "}
            <Link to="/auth" className="text-primary hover:underline">
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
