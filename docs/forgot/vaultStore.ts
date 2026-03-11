
// src/store/vaultStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encrypt, decrypt, deriveKey, generateSalt, uint8ArrayToBase64Url, base64UrlToUint8Array } from "@/lib/crypto";
import { Credential, CredentialInsert, CredentialUpdate } from "@/hooks/useCredentials"; // Reutiliza os tipos existentes
import { toast } from "sonner";

// Definir um tipo para as credenciais no store, que pode incluir o estado descriptografado
export interface StoredCredential extends Omit<Credential, 'password' | 'email' | 'url' | 'notes'> {
  encrypted_password: string; // A senha criptografada
  salt: string; // O salt usado para a chave
  iv: string; // O IV usado na criptografia
  decrypted_password?: string; // A senha descriptografada (opcional, para uso em UI)
  decrypted_email?: string;
  decrypted_url?: string;
  decrypted_notes?: string;
}

export interface Identity {
  id: string;
  name: string;
  credentialIds: string[]; // IDs das credenciais associadas a esta identidade
  // Outros campos como ícone, descrição, etc.
}

interface VaultState {
  credentials: StoredCredential[];
  identities: Identity[];
  masterPassword: string | null; // A Master Password é armazenada aqui temporariamente
  setMasterPassword: (password: string | null) => void;
  addCredential: (cred: CredentialInsert) => Promise<void>;
  updateCredential: (id: string, updates: CredentialUpdate) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  addIdentity: (identity: Omit<Identity, 'id'>) => void;
  updateIdentity: (id: string, updates: Partial<Identity>) => void;
  deleteIdentity: (id: string) => Promise<void>;
  // Ações para carregar e descriptografar todas as credenciais
  loadAndDecryptCredentials: (masterPass: string) => Promise<void>;
  // Ação para limpar dados descriptografados (logout ou inatividade)
  clearDecryptedData: () => void;

  // 2FA State
  encrypted_2fa_secret: string | null;
  _2fa_salt: string | null;
  _2fa_iv: string | null;
  is2FAEnabled: boolean;
  is2FAVerified: boolean; // Para a sessão atual
  set2FASecret: (secret: string | null, salt: string | null, iv: string | null) => void;
  set2FAEnabled: (enabled: boolean) => void;
  set2FAVerified: (verified: boolean) => void;
  decrypt2FASecret: (masterPass: string) => Promise<string | null>;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      credentials: [],
      identities: [],
      masterPassword: null,
      encrypted_2fa_secret: null,
      _2fa_salt: null,
      _2fa_iv: null,
      is2FAEnabled: false,
      is2FAVerified: false,

      setMasterPassword: (password) => set({ masterPassword: password }),

      set2FASecret: (secret, salt, iv) => set({ encrypted_2fa_secret: secret, _2fa_salt: salt, _2fa_iv: iv }),
      set2FAEnabled: (enabled) => set({ is2FAEnabled: enabled }),
      set2FAVerified: (verified) => set({ is2FAVerified: verified }),

      addCredential: async (cred) => {
        const { masterPassword } = get();
        if (!masterPassword) {
          toast.error("Master Password não definida. Não é possível adicionar credencial.");
          return;
        }

        const salt = generateSalt();
        const cryptoKey = await deriveKey(masterPassword, salt);

        const encryptedPassword = await encrypt(cred.password, cryptoKey);
        const encryptedEmail = cred.email ? await encrypt(cred.email, cryptoKey) : null;
        const encryptedUrl = cred.url ? await encrypt(cred.url, cryptoKey) : null;
        const encryptedNotes = cred.notes ? await encrypt(cred.notes, cryptoKey) : null;

        const newStoredCred: StoredCredential = {
          id: crypto.randomUUID(), // Gerar ID localmente
          user_id: "", // Será preenchido pelo Supabase ou removido se não for necessário no store
          nick: cred.nick,
          encrypted_password: uint8ArrayToBase64Url(encryptedPassword.encryptedData),
          salt: uint8ArrayToBase64Url(salt),
          iv: uint8ArrayToBase64Url(encryptedPassword.iv),
          category: cred.category,
          devices: cred.devices || [],
          is_favorite: cred.is_favorite || false,
          expires_at: cred.expires_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Campos criptografados
          email: encryptedEmail ? uint8ArrayToBase64Url(encryptedEmail.encryptedData) : null,
          url: encryptedUrl ? uint8ArrayToBase64Url(encryptedUrl.encryptedData) : null,
          notes: encryptedNotes ? uint8ArrayToBase64Url(encryptedNotes.encryptedData) : null,
          description: cred.description || null,
        };

        set((state) => ({ credentials: [...state.credentials, newStoredCred] }));
        toast.success("Credencial adicionada (localmente)!");
      },

      updateCredential: async (id, updates) => {
        const { masterPassword, credentials } = get();
        if (!masterPassword) {
          toast.error("Master Password não definida. Não é possível atualizar credencial.");
          return;
        }

        const credIndex = credentials.findIndex((c) => c.id === id);
        if (credIndex === -1) return;

        const existingCred = credentials[credIndex];
        const saltUint8 = base64UrlToUint8Array(existingCred.salt);
        const cryptoKey = await deriveKey(masterPassword, saltUint8);

        const updatedStoredCred: StoredCredential = { ...existingCred };

        if (updates.password) {
          const encryptedPassword = await encrypt(updates.password as string, cryptoKey);
          updatedStoredCred.encrypted_password = uint8ArrayToBase64Url(encryptedPassword.encryptedData);
          updatedStoredCred.iv = uint8ArrayToBase64Url(encryptedPassword.iv);
          updatedStoredCred.decrypted_password = updates.password as string; // Atualiza o descriptografado
        }
        if (updates.email) {
          const encryptedEmail = await encrypt(updates.email as string, cryptoKey);
          updatedStoredCred.email = uint8ArrayToBase64Url(encryptedEmail.encryptedData);
          updatedStoredCred.decrypted_email = updates.email as string;
        }
        if (updates.url) {
          const encryptedUrl = await encrypt(updates.url as string, cryptoKey);
          updatedStoredCred.url = uint8ArrayToBase64Url(encryptedUrl.encryptedData);
          updatedStoredCred.decrypted_url = updates.url as string;
        }
        if (updates.notes) {
          const encryptedNotes = await encrypt(updates.notes as string, cryptoKey);
          updatedStoredCred.notes = uint8ArrayToBase64Url(encryptedNotes.encryptedData);
          updatedStoredCred.decrypted_notes = updates.notes as string;
        }

        // Atualizar outros campos não criptografados
        Object.assign(updatedStoredCred, updates);
        updatedStoredCred.updated_at = new Date().toISOString();

        set((state) => ({
          credentials: state.credentials.map((c, i) => (i === credIndex ? updatedStoredCred : c)),
        }));
        toast.success("Credencial atualizada (localmente)!");
      },

      deleteCredential: (id) => {
        set((state) => ({
          credentials: state.credentials.filter((cred) => cred.id !== id),
        }));
        toast.success("Credencial removida (localmente)!");
      },

      addIdentity: (identity) => {
        const newIdentity: Identity = { ...identity, id: crypto.randomUUID() };
        set((state) => ({ identities: [...state.identities, newIdentity] }));
        toast.success("Identidade adicionada!");
      },

      updateIdentity: (id, updates) => {
        set((state) => ({
          identities: state.identities.map((identity) =>
            identity.id === id ? { ...identity, ...updates } : identity
          ),
        }));
        toast.success("Identidade atualizada!");
      },

      deleteIdentity: (id) => {
        set((state) => ({
          identities: state.identities.filter((identity) => identity.id !== id),
        }));
        toast.success("Identidade removida!");
      },

      loadAndDecryptCredentials: async (masterPass) => {
        const { credentials } = get();
        const decryptedList: StoredCredential[] = await Promise.all(
          credentials.map(async (cred) => {
            if (!cred.encrypted_password || !cred.salt || !cred.iv) {
              return cred; // Retorna como está se não houver dados de criptografia
            }
            try {
              const saltUint8 = base64UrlToUint8Array(cred.salt);
              const ivUint8 = base64UrlToUint8Array(cred.iv);
              const cryptoKey = await deriveKey(masterPass, saltUint8);

              const decryptedPassword = await decrypt(base64UrlToUint8Array(cred.encrypted_password), ivUint8, cryptoKey);
              const decryptedEmail = cred.email ? await decrypt(base64UrlToUint8Array(cred.email), ivUint8, cryptoKey) : undefined;
              const decryptedUrl = cred.url ? await decrypt(base64UrlToUint8Array(cred.url), ivUint8, cryptoKey) : undefined;
              const decryptedNotes = cred.notes ? await decrypt(base64UrlToUint8Array(cred.notes), ivUint8, cryptoKey) : undefined;

              return {
                ...cred,
                decrypted_password: decryptedPassword,
                decrypted_email: decryptedEmail,
                decrypted_url: decryptedUrl,
                decrypted_notes: decryptedNotes,
              };
            } catch (e) {
              console.error("Erro ao descriptografar credencial:", e);
              toast.error("Erro ao descriptografar uma credencial.");
              return cred; // Retorna a credencial original em caso de erro
            }
          })
        );
        set({ credentials: decryptedList, masterPassword: masterPass });
        toast.success("Cofre descriptografado com sucesso!");
      },

      decrypt2FASecret: async (masterPass) => {
        const { encrypted_2fa_secret, _2fa_salt, _2fa_iv } = get();
        if (!encrypted_2fa_secret || !_2fa_salt || !_2fa_iv) {
          return null;
        }
        try {
          const saltUint8 = base64UrlToUint8Array(_2fa_salt);
          const ivUint8 = base64UrlToUint8Array(_2fa_iv);
          const cryptoKey = await deriveKey(masterPass, saltUint8);
          const decryptedSecret = await decrypt(base64UrlToUint8Array(encrypted_2fa_secret), ivUint8, cryptoKey);
          return decryptedSecret;
        } catch (e) {
          console.error("Erro ao descriptografar segredo 2FA:", e);
          toast.error("Erro ao descriptografar segredo 2FA.");
          return null;
        }
      },

      clearDecryptedData: () => {
        set((state) => ({
          credentials: state.credentials.map(cred => {
            const newCred = { ...cred };
            delete newCred.decrypted_password;
            delete newCred.decrypted_email;
            delete newCred.decrypted_url;
            delete newCred.decrypted_notes;
            return newCred;
          }),
          masterPassword: null,
          is2FAVerified: false, // Limpa o status de verificação 2FA
        }));
        toast.info("Dados descriptografados e status 2FA limpos.");
      },
    }),
    {
      name: 'vault-storage', // Nome para o item no localStorage
      storage: createJSONStorage(() => localStorage),
      // Apenas persistir os dados criptografados, não a masterPassword ou dados descriptografados
      partialize: (state) => ({
        credentials: state.credentials.map(cred => {
          const { decrypted_password, decrypted_email, decrypted_url, decrypted_notes, ...rest } = cred;
          return rest; // Persiste apenas os campos criptografados
        }),
        identities: state.identities,
        encrypted_2fa_secret: state.encrypted_2fa_secret,
        _2fa_salt: state._2fa_salt,
        _2fa_iv: state._2fa_iv,
        is2FAEnabled: state.is2FAEnabled,
      }),
    }
  )
);
