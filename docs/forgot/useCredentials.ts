
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { encrypt, decrypt, deriveKey, generateSalt, uint8ArrayToBase64Url, base64UrlToUint8Array } from "@/lib/crypto";
import { useMasterPassword } from "@/contexts/MasterPasswordContext"; // Novo contexto para a Master Password

export type Credential = Tables<"credentials">;
// Modificamos CredentialInsert para incluir salt e iv, e o password será o texto cifrado
export type CredentialInsert = Omit<TablesInsert<"credentials">, "user_id" | "password" | "salt" | "iv"> & {
  password: string; // Senha em texto claro antes da criptografia
  encrypted_password?: string; // Senha criptografada
  salt?: string; // Salt em base64url
  iv?: string; // IV em base64url
};
export type CredentialUpdate = TablesUpdate<"credentials">;

export function useCredentials() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { masterPassword } = useMasterPassword(); // Obter a Master Password do contexto

  const query = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      if (!user || !masterPassword) return [];

      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Descriptografar as credenciais
      const decryptedCredentials = await Promise.all(data.map(async (cred) => {
        if (!cred.encrypted_password || !cred.salt || !cred.iv) {
          console.warn("Credencial sem dados de criptografia, pulando descriptografia.", cred);
          return cred; // Retorna a credencial como está se não houver dados de criptografia
        }
        try {
          const saltUint8 = base64UrlToUint8Array(cred.salt);
          const ivUint8 = base64UrlToUint8Array(cred.iv);
          const cryptoKey = await deriveKey(masterPassword, saltUint8);
          const decryptedPassword = await decrypt(base64UrlToUint8Array(cred.encrypted_password), ivUint8, cryptoKey);
          // Descriptografar outros campos sensíveis se existirem
          const decryptedEmail = cred.email ? await decrypt(base64UrlToUint8Array(cred.email), ivUint8, cryptoKey) : cred.email;
          const decryptedUrl = cred.url ? await decrypt(base64UrlToUint8Array(cred.url), ivUint8, cryptoKey) : cred.url;
          const decryptedNotes = cred.notes ? await decrypt(base64UrlToUint8Array(cred.notes), ivUint8, cryptoKey) : cred.notes;

          return {
            ...cred,
            password: decryptedPassword, // Sobrescreve com a senha descriptografada
            email: decryptedEmail,
            url: decryptedUrl,
            notes: decryptedNotes,
          };
        } catch (e) {
          console.error("Erro ao descriptografar credencial:", e);
          toast.error("Erro ao descriptografar uma credencial.");
          return cred; // Retorna a credencial original em caso de erro
        }
      }));
      return decryptedCredentials as Credential[];
    },
    enabled: !!user && !!masterPassword, // Habilita a query apenas se o usuário e a masterPassword estiverem disponíveis
  });

  const addMutation = useMutation({
    mutationFn: async (cred: CredentialInsert) => {
      if (!user || !masterPassword) throw new Error("Usuário não autenticado ou Master Password não fornecida.");

      const salt = generateSalt();
      const cryptoKey = await deriveKey(masterPassword, salt);

      const encryptedPassword = await encrypt(cred.password, cryptoKey);
      const encryptedEmail = cred.email ? await encrypt(cred.email, cryptoKey) : null;
      const encryptedUrl = cred.url ? await encrypt(cred.url, cryptoKey) : null;
      const encryptedNotes = cred.notes ? await encrypt(cred.notes, cryptoKey) : null;

      const { error } = await supabase
        .from("credentials")
        .insert({
          ...cred,
          user_id: user.id,
          encrypted_password: uint8ArrayToBase64Url(encryptedPassword.encryptedData),
          salt: uint8ArrayToBase64Url(salt),
          iv: uint8ArrayToBase64Url(encryptedPassword.iv),
          // Armazenar os campos criptografados e não os originais
          password: null, // Limpar o campo original 'password' ou removê-lo do schema
          email: encryptedEmail ? uint8ArrayToBase64Url(encryptedEmail.encryptedData) : null,
          url: encryptedUrl ? uint8ArrayToBase64Url(encryptedUrl.encryptedData) : null,
          notes: encryptedNotes ? uint8ArrayToBase64Url(encryptedNotes.encryptedData) : null,
        });
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
      if (!user || !masterPassword) throw new Error("Usuário não autenticado ou Master Password não fornecida.");

      const existingCred = queryClient.getQueryData(["credentials"])?.find((c: Credential) => c.id === id);
      if (!existingCred || !existingCred.salt) throw new Error("Credencial existente ou salt não encontrado para atualização.");

      const saltUint8 = base64UrlToUint8Array(existingCred.salt);
      const cryptoKey = await deriveKey(masterPassword, saltUint8);

      const updatedFields: Partial<TablesUpdate<"credentials">> = { ...updates };

      // Criptografar campos que podem ter sido atualizados
      if (updates.password) {
        const encryptedPassword = await encrypt(updates.password as string, cryptoKey);
        updatedFields.encrypted_password = uint8ArrayToBase64Url(encryptedPassword.encryptedData);
        updatedFields.iv = uint8ArrayToBase64Url(encryptedPassword.iv);
        updatedFields.password = null; // Limpar o campo original
      }
      if (updates.email) {
        const encryptedEmail = await encrypt(updates.email as string, cryptoKey);
        updatedFields.email = uint8ArrayToBase64Url(encryptedEmail.encryptedData);
      }
      if (updates.url) {
        const encryptedUrl = await encrypt(updates.url as string, cryptoKey);
        updatedFields.url = uint8ArrayToBase64Url(encryptedUrl.encryptedData);
      }
      if (updates.notes) {
        const encryptedNotes = await encrypt(updates.notes as string, cryptoKey);
        updatedFields.notes = uint8ArrayToBase64Url(encryptedNotes.encryptedData);
      }

      const { error } = await supabase
        .from("credentials")
        .update(updatedFields)
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
    addCredential: addMutation.mutateAsync,
    updateCredential: updateMutation.mutateAsync,
    deleteCredential: deleteMutation.mutateAsync,
    toggleFavorite: toggleFavorite.mutate,
  };
}
