
// src/components/TwoFactorSetup.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generate2FASecret, generate2FAQRCodeUrl, generateQRCodeDataURL, verify2FAToken } from "@/lib/2fa";
import { useVaultStore } from "@/store/vaultStore";
import { encrypt, generateSalt, deriveKey, uint8ArrayToBase64Url } from "@/lib/crypto";
import QRCodeSVG from "qrcode.react"; // Usar qrcode.react para renderizar o SVG

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

export function TwoFactorSetup({ isOpen, onClose, onSetupComplete }: TwoFactorSetupProps) {
  const { masterPassword, set2FASecret, set2FAEnabled } = useVaultStore();
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [step, setStep] = useState(1); // 1: Gerar Segredo, 2: Verificar
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && masterPassword && step === 1) {
      generateNewSecret();
    }
  }, [isOpen, masterPassword, step]);

  const generateNewSecret = async () => {
    setLoading(true);
    try {
      const newSecret = generate2FASecret();
      setSecret(newSecret);
      const userEmail = "user@example.com"; // TODO: Obter o email do usuário logado
      const otpAuthUrl = generate2FAQRCodeUrl(newSecret, userEmail);
      // Usar QRCodeSVG diretamente no render, não precisa de DataURL
      // const dataUrl = await generateQRCodeDataURL(otpAuthUrl);
      // setQrCodeDataURL(dataUrl);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao gerar segredo 2FA:", error);
      toast.error("Erro ao gerar segredo 2FA.");
      setLoading(false);
      onClose();
    }
  };

  const handleVerify = async () => {
    if (!secret || !verificationToken) {
      toast.error("Por favor, insira o código de verificação.");
      return;
    }
    if (!masterPassword) {
      toast.error("Master Password não definida. Não é possível ativar 2FA.");
      return;
    }

    setLoading(true);
    try {
      const isValid = verify2FAToken(verificationToken, secret);
      if (isValid) {
        // Criptografar e salvar o segredo 2FA
        const salt = generateSalt();
        const cryptoKey = await deriveKey(masterPassword, salt);
        const encryptedSecret = await encrypt(secret, cryptoKey);

        set2FASecret(
          uint8ArrayToBase64Url(encryptedSecret.encryptedData),
          uint8ArrayToBase64Url(salt),
          uint8ArrayToBase64Url(encryptedSecret.iv)
        );
        set2FAEnabled(true);
        toast.success("2FA ativado com sucesso!");
        onSetupComplete();
        onClose();
      } else {
        toast.error("Código de verificação inválido. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao verificar 2FA:", error);
      toast.error("Erro ao ativar 2FA.");
    } finally {
      setLoading(false);
    }
  };

  const userEmail = "user@example.com"; // TODO: Obter o email do usuário logado
  const otpAuthUrl = secret ? generate2FAQRCodeUrl(secret, userEmail) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Autenticação de Dois Fatores (2FA)</DialogTitle>
          <DialogDescription>
            Proteja sua conta com um segundo fator de autenticação.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 text-center">
            <p>1. Escaneie o QR Code com seu aplicativo autenticador (ex: Google Authenticator, Authy).</p>
            {loading ? (
              <div className="flex justify-center items-center h-40"><p>Gerando QR Code...</p></div>
            ) : (
              secret && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={otpAuthUrl} size={200} level="H" />
                </div>
              )
            )}
            <p className="text-sm text-muted-foreground">Ou insira o código manualmente: <strong>{secret}</strong></p>
            <Button onClick={() => setStep(2)} disabled={loading} className="w-full">
              Próximo
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p>2. Insira o código de 6 dígitos do seu aplicativo autenticador para verificar.</p>
            <Input
              placeholder="Código de 6 dígitos"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value)}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
            <Button onClick={handleVerify} disabled={loading} className="w-full">
              {loading ? "Verificando..." : "Verificar e Ativar 2FA"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
