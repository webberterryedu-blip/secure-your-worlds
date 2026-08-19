/**
 * useTwoFactor — 2FA TOTP da conta, com autoridade no servidor.
 * O segredo TOTP nunca é lido pelo navegador: toda verificação/ativação passa
 * pela edge function `two-factor`, que registra a verificação na sessão.
 * As políticas de RLS exigem essa verificação antes de liberar credenciais/secrets.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TwoFactorStatus {
  enabled: boolean;
  /** true quando a sessão atual já passou pelo 2FA no servidor (ou 2FA está desativado). */
  verified: boolean;
  loading: boolean;
}

type TwoFactorAction = "status" | "enable" | "disable" | "verify";

async function callTwoFactor(action: TwoFactorAction, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("two-factor", {
    body: { action, ...payload },
  });
  if (error) throw error;
  return (data ?? {}) as { ok?: boolean; enabled?: boolean; verified?: boolean };
}

export function useTwoFactor() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus>({
    enabled: false,
    verified: true,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus({ enabled: false, verified: true, loading: false });
      return;
    }
    setStatus((s) => ({ ...s, loading: true }));
    try {
      const res = await callTwoFactor("status");
      setStatus({ enabled: !!res.enabled, verified: !!res.verified, loading: false });
    } catch (err) {
      console.error("2FA status error:", err);
      setStatus({ enabled: false, verified: true, loading: false });
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Ativa 2FA: o servidor valida o código antes de persistir o segredo. */
  const enable = useCallback(async (secret: string, code: string): Promise<boolean> => {
    const res = await callTwoFactor("enable", { secret, code });
    if (res.ok) setStatus({ enabled: true, verified: true, loading: false });
    return !!res.ok;
  }, []);

  /** Desativa 2FA: exige um código TOTP válido, validado no servidor. */
  const disable = useCallback(async (code: string): Promise<boolean> => {
    const res = await callTwoFactor("disable", { code });
    if (res.ok) setStatus({ enabled: false, verified: true, loading: false });
    return !!res.ok;
  }, []);

  /** Verifica um código TOTP no servidor e libera a sessão (RLS passa a permitir os dados). */
  const verify = useCallback(async (code: string): Promise<boolean> => {
    const res = await callTwoFactor("verify", { code });
    if (res.ok) setStatus((s) => ({ ...s, verified: true, loading: false }));
    return !!res.ok;
  }, []);

  /** Estado do 2FA da sessão atual, consultado no servidor. */
  const getSessionStatus = useCallback(async (): Promise<{ enabled: boolean; verified: boolean }> => {
    try {
      const res = await callTwoFactor("status");
      return { enabled: !!res.enabled, verified: !!res.verified };
    } catch (err) {
      console.error("2FA status error:", err);
      return { enabled: false, verified: true };
    }
  }, []);

  return { status, refresh, enable, disable, verify, getSessionStatus };
}
