/**
 * Two-Factor Authentication Verification Dialog (componente reusável).
 * Verifica direto contra o Supabase via useTwoFactor.
 */

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { markTwoFactorPassed, useTwoFactor } from "@/hooks/useTwoFactor";

interface TwoFactorVerifyProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function TwoFactorVerify({ isOpen, onClose, onVerified }: TwoFactorVerifyProps) {
  const { verify } = useTwoFactor();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (token.length !== 6) return;
    setLoading(true);
    try {
      const ok = await verify(token);
      if (ok) {
        markTwoFactorPassed();
        toast.success("2FA verificado com sucesso!");
        onVerified();
        onClose();
      } else {
        toast.error("Código inválido. Tente novamente.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Autenticação de Dois Fatores</DialogTitle>
          <DialogDescription>Digite o código de 6 dígitos do seu app autenticador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="000000"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && token.length === 6 && handleVerify()}
            maxLength={6}
            inputMode="numeric"
            autoFocus
            className="text-center font-mono text-lg tracking-widest"
          />
          <Button onClick={handleVerify} disabled={loading || token.length !== 6} className="w-full">
            {loading ? "Verificando..." : "Verificar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
