/**
 * Two-Factor Authentication Setup Dialog
 * Persistência via Supabase (user_secrets_config). Sem dependência de master password.
 */

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generate2FAQRCodeUrl, generate2FASecret } from "@/lib/2fa";
import { useAuth } from "@/contexts/AuthContext";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { QRCodeSVG } from "qrcode.react";
import { Copy } from "lucide-react";

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

export function TwoFactorSetup({ isOpen, onClose, onSetupComplete }: TwoFactorSetupProps) {
  const { user } = useAuth();
  const { enable } = useTwoFactor();
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && step === 1 && !secret) {
      try {
        setSecret(generate2FASecret());
      } catch (err) {
        console.error("2FA secret generation error:", err);
        toast.error("Erro ao gerar segredo 2FA.");
        onClose();
      }
    }
    if (!isOpen) {
      setSecret(null);
      setToken("");
      setStep(1);
    }
  }, [isOpen, step, secret, onClose]);

  const accountLabel = user?.email ?? "VaultKey User";
  const otpAuthUrl = secret ? generate2FAQRCodeUrl(secret, accountLabel) : "";

  const handleVerify = async () => {
    if (!secret || token.length !== 6) return;
    setLoading(true);
    try {
      const ok = await enable(secret, token);
      if (ok) {
        toast.success("2FA ativado com sucesso!");
        onSetupComplete();
        onClose();
      } else {
        toast.error("Código inválido. Verifique o relógio do dispositivo e tente novamente.");
      }
    } catch (err) {
      console.error("2FA enable error:", err);
      toast.error("Erro ao ativar 2FA.");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    toast.success("Segredo copiado.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
          <DialogDescription>
            Proteja sua conta com um segundo fator usando seu app autenticador (Google Authenticator, Authy, 1Password, etc.).
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 text-center">
            <p className="text-sm">1. Escaneie o QR Code abaixo no seu app autenticador.</p>
            {secret ? (
              <div className="flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG value={otpAuthUrl} size={200} level="H" />
              </div>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Gerando QR Code...
              </div>
            )}
            <div className="rounded-md border border-border bg-muted/30 p-3 text-left">
              <p className="mb-1 text-xs text-muted-foreground">Ou digite manualmente:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all font-mono text-xs">{secret}</code>
                <Button size="icon" variant="ghost" onClick={copySecret} disabled={!secret} aria-label="Copiar segredo">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={() => setStep(2)} disabled={!secret} className="w-full">
              Avançar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm">2. Digite o código de 6 dígitos exibido no app para confirmar.</p>
            <Input
              placeholder="000000"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              inputMode="numeric"
              autoFocus
              className="text-center font-mono text-lg tracking-widest"
            />
            <Button onClick={handleVerify} disabled={loading || token.length !== 6} className="w-full">
              {loading ? "Verificando..." : "Verificar e ativar 2FA"}
            </Button>
            <Button variant="outline" onClick={() => setStep(1)} disabled={loading} className="w-full">
              Voltar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
