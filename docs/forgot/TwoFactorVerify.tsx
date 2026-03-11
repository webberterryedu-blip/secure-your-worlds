
// src/components/TwoFactorVerify.tsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { verify2FAToken } from "@/lib/2fa";
import { useVaultStore } from "@/store/vaultStore";
import { useNavigate } from "react-router-dom";

interface TwoFactorVerifyProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function TwoFactorVerify({ isOpen, onClose, onVerified }: TwoFactorVerifyProps) {
  const { masterPassword, decrypt2FASecret, set2FAVerified } = useVaultStore();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!token) {
      toast.error("Por favor, insira o código de 6 dígitos.");
      return;
    }
    if (!masterPassword) {
      toast.error("Master Password não definida. Não é possível verificar 2FA.");
      // Redirecionar para login ou pedir Master Password
      navigate("/auth"); // Ou para uma tela que peça a Master Password
      return;
    }

    setLoading(true);
    try {
      const secret = await decrypt2FASecret(masterPassword);
      if (!secret) {
        toast.error("Segredo 2FA não encontrado ou erro na descriptografia.");
        onClose();
        return;
      }

      const isValid = verify2FAToken(token, secret);
      if (isValid) {
        set2FAVerified(true);
        toast.success("Verificação 2FA bem-sucedida!");
        onVerified();
        onClose();
      } else {
        toast.error("Código 2FA inválido. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao verificar 2FA:", error);
      toast.error("Erro ao verificar 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verificação de Dois Fatores (2FA)</DialogTitle>
          <DialogDescription>
            Por favor, insira o código de 6 dígitos do seu aplicativo autenticador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Código de 6 dígitos"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            maxLength={6}
            className="text-center text-lg tracking-widest"
          />
          <Button onClick={handleVerify} disabled={loading} className="w-full">
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
