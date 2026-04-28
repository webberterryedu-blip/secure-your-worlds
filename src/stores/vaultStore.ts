/**
 * Vault Store — apenas guarda a master password do cofre de Secrets em memória (sessão).
 * O 2FA da conta agora é gerenciado em useTwoFactor (Supabase user_secrets_config).
 */

import { create } from "zustand";

interface VaultStore {
  masterPassword: string | null;
  setMasterPassword: (password: string) => void;
  clearMasterPassword: () => void;
}

export const useVaultStore = create<VaultStore>()((set) => ({
  masterPassword: null,
  setMasterPassword: (password: string) => set({ masterPassword: password }),
  clearMasterPassword: () => set({ masterPassword: null }),
}));
