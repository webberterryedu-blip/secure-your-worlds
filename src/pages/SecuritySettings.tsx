/**
 * Security Settings Page — gerencia 2FA TOTP da conta.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { toast } from "sonner";
import { AlertTriangle, Shield, Loader2 } from "lucide-react";

export function SecuritySettings() {
  const { status, refresh, disable } = useTwoFactor();
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSwitch = (checked: boolean) => {
    if (checked) setSetupOpen(true);
    else setDisableOpen(true);
  };

  const handleDisableConfirm = async () => {
    if (disableCode.length !== 6) return;
    setBusy(true);
    try {
      const ok = await disable(disableCode);
      if (ok) {
        toast.success("2FA desativado.");
        setDisableOpen(false);
        setDisableCode("");
      } else {
        toast.error("Código inválido. 2FA continua ativo.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao desativar 2FA.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Configurações de Segurança</h2>
        <p className="text-muted-foreground">Gerencie a segurança da sua conta VaultKey.</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta. Após ativada, será solicitado um código a cada login.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {status.loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="2fa-mode"
                checked={status.enabled}
                onCheckedChange={handleSwitch}
                disabled={status.loading}
              />
            )}
            <Label htmlFor="2fa-mode">{status.enabled ? "2FA Ativado" : "2FA Desativado"}</Label>
          </div>
          {!status.loading && !status.enabled && (
            <Button onClick={() => setSetupOpen(true)}>Configurar 2FA</Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-500/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Recomendações de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>Use uma senha mestra forte e única</li>
            <li>Ative a autenticação de dois fatores</li>
            <li>Nunca compartilhe sua senha mestra ou códigos 2FA</li>
            <li>Faça backup regular dos dados do cofre</li>
            <li>Use senhas diferentes para cada serviço</li>
          </ul>
        </CardContent>
      </Card>

      <TwoFactorSetup
        isOpen={setupOpen}
        onClose={() => setSetupOpen(false)}
        onSetupComplete={() => {
          refresh();
        }}
      />

      <Dialog open={disableOpen} onOpenChange={(o) => { if (!busy) { setDisableOpen(o); if (!o) setDisableCode(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar 2FA</DialogTitle>
            <DialogDescription>
              Para confirmar, digite o código atual de 6 dígitos do seu app autenticador.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="000000"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            inputMode="numeric"
            autoFocus
            className="text-center font-mono text-lg tracking-widest"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDisableConfirm} disabled={busy || disableCode.length !== 6}>
              {busy ? "Verificando..." : "Desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SecuritySettings;
