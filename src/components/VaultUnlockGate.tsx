/**
 * VaultUnlockGate — pede a senha mestra antes de mostrar dados do cofre.
 * A senha nunca é enviada ao servidor: ela só deriva, no navegador, a chave que
 * decifra as credenciais (arquitetura zero-knowledge).
 */

import { useState } from "react";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVaultKey } from "@/hooks/useVaultKey";
import { toast } from "sonner";

export default function VaultUnlockGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked, isConfigured, isLoading, unlock, setup } = useVaultKey();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (isUnlocked) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isConfigured) {
        const ok = await unlock(password);
        if (!ok) toast.error("Senha mestra inválida.");
      } else {
        if (password.length < 8) {
          toast.error("A senha mestra precisa ter pelo menos 8 caracteres.");
          return;
        }
        if (password !== confirm) {
          toast.error("As senhas não coincidem.");
          return;
        }
        await setup(password);
        toast.success("Cofre criado e desbloqueado.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao desbloquear o cofre.";
      toast.error(msg);
    } finally {
      setBusy(false);
      setPassword("");
      setConfirm("");
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">
            {isConfigured ? "Desbloquear cofre" : "Criar senha mestra"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isConfigured
              ? "Sua senha mestra descriptografa as credenciais no seu navegador."
              : "Ela criptografa suas credenciais no navegador e não pode ser recuperada."}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="master-password">Senha mestra</Label>
          <Input
            id="master-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
        </div>

        {!isConfigured && (
          <>
            <div className="space-y-2">
              <Label htmlFor="master-password-confirm">Confirmar senha mestra</Label>
              <Input
                id="master-password-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Alert>
              <AlertDescription className="text-xs">
                Guarde esta senha: sem ela, as credenciais criptografadas não podem ser lidas por
                ninguém — nem por nós.
              </AlertDescription>
            </Alert>
          </>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Processando..." : isConfigured ? "Desbloquear" : "Criar e desbloquear"}
        </Button>
      </form>
    </div>
  );
}
