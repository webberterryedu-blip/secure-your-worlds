import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptSecret, decryptSecret } from '@/lib/secretsCrypto';

interface VaultStore {
  // 2FA State
  is2FAEnabled: boolean;
  is2FAVerified: boolean;
  encrypted2FASecretData: string | null;
  encrypted2FASecretIV: string | null;
  encrypted2FASecretSalt: string | null;
  
  // Master password state (not persisted)
  masterPassword: string | null;
  
  // 2FA Actions
  set2FAEnabled: (enabled: boolean) => void;
  set2FAVerified: (verified: boolean) => void;
  set2FASecret: (encryptedSecretData: string, iv: string, salt: string) => void;
  clear2FASecret: () => void;
  
  // Master password actions
  setMasterPassword: (password: string) => void;
  clearMasterPassword: () => void;
  
  // Helper to encrypt 2FA secret with master password
  encryptAndSet2FASecret: (secret: string, masterPassword: string) => Promise<void>;
  
  // Helper to decrypt 2FA secret
  decrypt2FASecret: () => Promise<string | null>;
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      // Initial 2FA state
      is2FAEnabled: false,
      is2FAVerified: false,
      encrypted2FASecretData: null,
      encrypted2FASecretIV: null,
      encrypted2FASecretSalt: null,
      
      // Master password (not persisted)
      masterPassword: null,
      
      // 2FA Actions
      set2FAEnabled: (enabled: boolean) => {
        set({ is2FAEnabled: enabled });
      },
      
      set2FAVerified: (verified: boolean) => {
        set({ is2FAVerified: verified });
      },
      
      set2FASecret: (encryptedSecretData: string, iv: string, salt: string) => {
        set({
          encrypted2FASecretData: encryptedSecretData,
          encrypted2FASecretIV: iv,
          encrypted2FASecretSalt: salt,
          is2FAEnabled: true,
        });
      },
      
      clear2FASecret: () => {
        set({
          encrypted2FASecretData: null,
          encrypted2FASecretIV: null,
          encrypted2FASecretSalt: null,
          is2FAEnabled: false,
          is2FAVerified: false,
        });
      },
      
      // Master password actions
      setMasterPassword: (password: string) => {
        set({ masterPassword: password });
      },
      
      clearMasterPassword: () => {
        set({ masterPassword: null, is2FAVerified: false });
      },
      
      // Encrypt and set 2FA secret
      encryptAndSet2FASecret: async (secret: string, masterPassword: string) => {
        try {
          const { encryptedValue, iv, salt } = await encryptSecret(secret, masterPassword);
          set({
            encrypted2FASecretData: encryptedValue,
            encrypted2FASecretIV: iv,
            encrypted2FASecretSalt: salt,
            is2FAEnabled: true,
          });
        } catch (error) {
          console.error('Failed to encrypt 2FA secret:', error);
          throw error;
        }
      },
      
      // Decrypt 2FA secret
      decrypt2FASecret: async () => {
        const { masterPassword, encrypted2FASecretData, encrypted2FASecretIV, encrypted2FASecretSalt } = get();
        
        if (!masterPassword || !encrypted2FASecretData || !encrypted2FASecretIV || !encrypted2FASecretSalt) {
          return null;
        }
        
        try {
          const decrypted = await decryptSecret(
            encrypted2FASecretData,
            encrypted2FASecretIV,
            encrypted2FASecretSalt,
            masterPassword
          );
          return decrypted;
        } catch (error) {
          console.error('Failed to decrypt 2FA secret:', error);
          return null;
        }
      },
    }),
    {
      name: 'vaultkey-vault-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        is2FAEnabled: state.is2FAEnabled,
        encrypted2FASecretData: state.encrypted2FASecretData,
        encrypted2FASecretIV: state.encrypted2FASecretIV,
        encrypted2FASecretSalt: state.encrypted2FASecretSalt,
      }),
    }
  )
);
