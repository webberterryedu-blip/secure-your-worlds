import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useVaultKey } from "@/hooks/useVaultKey";
import { decryptFields, encryptFields, isEncryptedValue } from "@/lib/credentialCrypto";

export type Credential = Tables<"credentials">;
export type CredentialInsert = Omit<TablesInsert<"credentials">, "user_id">;
export type CredentialUpdate = TablesUpdate<"credentials">;

/**
 * Credenciais são criptografadas no navegador (AES-256-GCM) antes de irem ao banco.
 * O hook cifra na escrita e decifra na leitura; o servidor nunca vê texto em claro.
 */
export function useCredentials() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { masterPassword, salt } = useVaultKey();

  const canUseVault = !!user && !!masterPassword && !!salt;

  const query = useQuery({
    queryKey: ["credentials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as Credential[];

      // Migração transparente: rows legadas em texto claro são recifradas no cliente.
      const legacy = rows.filter((r) => r.enc_version !== 1);
      if (legacy.length > 0) {
        for (const row of legacy) {
          try {
            const encrypted = await encryptFields(
              { password: row.password, email: row.email, url: row.url, notes: row.notes },
              masterPassword!,
              salt!
            );
            await supabase
              .from("credentials")
              .update({ ...encrypted, enc_salt: salt, enc_version: 1 })
              .eq("id", row.id);
          } catch (err) {
            console.error("Credential migration error", err);
          }
        }
      }

      return Promise.all(
        rows.map(async (row) => {
          const decrypted = await decryptFields(row, masterPassword!, salt!);
          return { ...row, ...decrypted } as Credential;
        })
      );
    },
    enabled: canUseVault,
  });

  const requireVault = () => {
    if (!masterPassword || !salt) throw new Error("Cofre bloqueado. Informe sua senha mestra.");
  };

  const addMutation = useMutation({
    mutationFn: async (cred: CredentialInsert) => {
      requireVault();
      const encrypted = await encryptFields(cred, masterPassword!, salt!);
      const { error } = await supabase
        .from("credentials")
        .insert({ ...encrypted, user_id: user!.id, enc_salt: salt, enc_version: 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial adicionada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: CredentialUpdate & { id: string }) => {
      requireVault();
      const encrypted = await encryptFields(updates, masterPassword!, salt!);
      const { error } = await supabase
        .from("credentials")
        .update({ ...encrypted, enc_salt: salt, enc_version: 1 })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial atualizada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial removida!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("credentials")
        .update({ is_favorite: !is_favorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["credentials"] }),
    onError: (err: any) => toast.error(err.message),
  });

  return {
    credentials: query.data ?? [],
    isLoading: query.isLoading,
    isVaultUnlocked: canUseVault,
    addCredential: addMutation.mutateAsync,
    updateCredential: updateMutation.mutateAsync,
    deleteCredential: deleteMutation.mutateAsync,
    toggleFavorite: toggleFavorite.mutate,
  };
}

export { isEncryptedValue };
