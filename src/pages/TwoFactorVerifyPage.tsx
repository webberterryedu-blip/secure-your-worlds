/**
 * 2FA Verification Page — exigida após login quando o usuário tem 2FA ativo.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTwoFactor, markTwoFactorPassed } from "@/hooks/useTwoFactor";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function TwoFactorVerifyPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { verify } = useTwoFactor();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6 || !user) return;
    setLoading(true);
    try {
      const ok = await verify(code);
      if (ok) {
        markTwoFactorPassed();
        toast.success("Verificação concluída.");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error("Código inválido. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Verificação em Duas Etapas</h1>
          <p className="text-muted-foreground">
            Digite o código de 6 dígitos do seu app autenticador.
          </p>
        </div>
        <div className="space-y-3">
          <Input
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            maxLength={6}
            inputMode="numeric"
            autoFocus
            className="text-center font-mono text-2xl tracking-widest"
          />
          <Button onClick={handleVerify} disabled={loading || code.length !== 6} className="w-full">
            {loading ? "Verificando..." : "Verificar"}
          </Button>
          <Button variant="ghost" onClick={handleCancel} className="w-full">
            Cancelar e sair
          </Button>
        </div>
      </div>
    </div>
  );
}
