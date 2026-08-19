/**
 * useVaultKey — senha mestra do cofre (mantida apenas em memória) e o salt
 * do usuário usados para criptografar/descriptografar credenciais no navegador.
 */

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useVaultStore } from "@/stores/vaultStore";
import { hashSecretsPassword, verifySecretsPassword, clearSecretsKeyCache } from "@/lib/secretsCrypto";

export function useVaultKey() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { masterPassword, setMasterPassword, clearMasterPassword } = useVaultStore();

  const configQuery = useQuery({
    queryKey: ["vaultKeyConfig", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_secrets_config")
        .select("id, secrets_password_hash, secrets_password_salt")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const config = configQuery.data;
  const isConfigured = !!config?.secrets_password_hash && !!config?.secrets_password_salt;
  const salt = config?.secrets_password_salt ?? null;

  /** Define a senha mestra pela primeira vez. */
  const setup = useCallback(
    async (password: string) => {
      const { hash, salt: newSalt } = await hashSecretsPassword(password);
      const { error } = await supabase
        .from("user_secrets_config")
        .upsert(
          {
            user_id: user!.id,
            secrets_password_hash: hash,
            secrets_password_salt: newSalt,
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
      clearSecretsKeyCache();
      setMasterPassword(password);
      await queryClient.invalidateQueries({ queryKey: ["vaultKeyConfig"] });
    },
    [user, setMasterPassword, queryClient]
  );

  /** Verifica a senha mestra e a mantém em memória para esta sessão. */
  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      if (!config?.secrets_password_hash || !config?.secrets_password_salt) return false;
      const ok = await verifySecretsPassword(
        password,
        config.secrets_password_hash,
        config.secrets_password_salt
      );
      if (!ok) return false;
      setMasterPassword(password);
      return true;
    },
    [config, setMasterPassword]
  );

  const lock = useCallback(() => {
    clearSecretsKeyCache();
    clearMasterPassword();
    queryClient.removeQueries({ queryKey: ["credentials"] });
  }, [clearMasterPassword, queryClient]);

  return {
    masterPassword,
    salt,
    isConfigured,
    isLoading: configQuery.isLoading,
    isUnlocked: !!masterPassword && !!salt,
    setup,
    unlock,
    lock,
  };
}
