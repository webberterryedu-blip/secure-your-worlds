
// src/pages/SecuritySettings.tsx
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { useVaultStore } from "@/store/vaultStore";
import { toast } from "sonner";

export function SecuritySettings() {
  const { is2FAEnabled, set2FAEnabled, encrypted_2fa_secret } = useVaultStore();
  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false);

  const handleToggle2FA = () => {
    if (is2FAEnabled) {
      // Desativar 2FA
      set2FAEnabled(false);
      // TODO: Limpar o segredo 2FA do store e do Supabase
      toast.info("2FA desativado. Lembre-se de remover a conta do seu aplicativo autenticador.");
    } else {
      // Ativar 2FA
      setIsTwoFactorSetupOpen(true);
    }
  };

  const handle2FASetupComplete = () => {
    // A lógica de set2FAEnabled(true) já está no TwoFactorSetup
    toast.success("Configuração 2FA concluída!");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Configurações de Segurança</h2>
      <p className="text-muted-foreground">Gerencie a segurança da sua conta VaultKey.</p>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta com 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="2fa-mode"
              checked={is2FAEnabled}
              onCheckedChange={handleToggle2FA}
            />
            <Label htmlFor="2fa-mode">
              {is2FAEnabled ? "2FA Ativado" : "2FA Desativado"}
            </Label>
          </div>
          {!is2FAEnabled && (
            <Button onClick={() => setIsTwoFactorSetupOpen(true)}>
              Configurar 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Outras configurações de segurança podem vir aqui */}

      <TwoFactorSetup
        isOpen={isTwoFactorSetupOpen}
        onClose={() => setIsTwoFactorSetupOpen(false)}
        onSetupComplete={handle2FASetupComplete}
      />
    </div>
  );
}
