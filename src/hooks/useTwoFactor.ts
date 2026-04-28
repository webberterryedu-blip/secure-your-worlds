/**
 * useTwoFactor — gerencia o ciclo de vida do 2FA TOTP da conta contra o Supabase.
 * Fonte da verdade: tabela user_secrets_config (campos totp_secret, totp_enabled).
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { verify2FAToken } from "@/lib/2fa";

interface TwoFactorStatus {
  enabled: boolean;
  loading: boolean;
}

export function useTwoFactor() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus>({ enabled: false, loading: true });

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus({ enabled: false, loading: false });
      return;
    }
    setStatus((s) => ({ ...s, loading: true }));
    const { data, error } = await supabase
      .from("user_secrets_config")
      .select("totp_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("2FA status fetch error:", error);
    }
    setStatus({ enabled: !!data?.totp_enabled, loading: false });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Ativa 2FA: valida o código primeiro, depois persiste o segredo. */
  const enable = useCallback(
    async (secret: string, code: string): Promise<boolean> => {
      if (!user) throw new Error("Not authenticated");
      if (!verify2FAToken(code, secret)) return false;

      // Verifica se já existe um registro
      const { data: existing } = await supabase
        .from("user_secrets_config")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_secrets_config")
          .update({ totp_secret: secret, totp_enabled: true })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_secrets_config").insert({
          user_id: user.id,
          totp_secret: secret,
          totp_enabled: true,
          secrets_password_hash: null,
          secrets_password_salt: null,
        });
        if (error) throw error;
      }

      setStatus({ enabled: true, loading: false });
      return true;
    },
    [user]
  );

  /** Desativa 2FA: exige um código TOTP válido atual. */
  const disable = useCallback(
    async (code: string): Promise<boolean> => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("user_secrets_config")
        .select("totp_secret")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.totp_secret) return false;
      if (!verify2FAToken(code, data.totp_secret)) return false;

      const { error: updErr } = await supabase
        .from("user_secrets_config")
        .update({ totp_enabled: false, totp_secret: null })
        .eq("user_id", user.id);
      if (updErr) throw updErr;

      setStatus({ enabled: false, loading: false });
      return true;
    },
    [user]
  );

  /** Verifica um código TOTP — usado no fluxo de login. */
  const verify = useCallback(
    async (code: string): Promise<boolean> => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_secrets_config")
        .select("totp_secret, totp_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data?.totp_enabled || !data.totp_secret) return false;
      return verify2FAToken(code, data.totp_secret);
    },
    [user]
  );

  /** Verifica se um usuário (por id) tem 2FA ativo — usado pós signIn antes de o contexto sincronizar. */
  const isEnabledForUser = useCallback(async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("user_secrets_config")
      .select("totp_enabled")
      .eq("user_id", userId)
      .maybeSingle();
    return !!data?.totp_enabled;
  }, []);

  return { status, refresh, enable, disable, verify, isEnabledForUser };
}

/** Helpers para flag de "já passou pelo 2FA nesta sessão". */
export const TWO_FA_PASSED_KEY = "vk_2fa_passed";
export function markTwoFactorPassed() {
  sessionStorage.setItem(TWO_FA_PASSED_KEY, "1");
}
export function clearTwoFactorPassed() {
  sessionStorage.removeItem(TWO_FA_PASSED_KEY);
}
export function hasTwoFactorPassed(): boolean {
  return sessionStorage.getItem(TWO_FA_PASSED_KEY) === "1";
}
