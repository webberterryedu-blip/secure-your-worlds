
// src/contexts/MasterPasswordContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { clearKeyCache } from '@/lib/crypto';

interface MasterPasswordContextType {
  masterPassword: string | null;
  setMasterPassword: (password: string | null) => void;
  isMasterPasswordSet: boolean;
  clearSession: () => void;
}

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(undefined);

export function MasterPasswordProvider({ children }: { children: ReactNode }) {
  const [masterPassword, setMasterPasswordState] = useState<string | null>(null);
  const [isMasterPasswordSet, setIsMasterPasswordSet] = useState(false);

  // Clear key cache when password is cleared
  const clearSession = useCallback(() => {
    clearKeyCache();
    setMasterPasswordState(null);
    toast.info("Sessão encerrada. Cofre bloqueado.");
  }, []);

  // Wrapper to also clear cache when setMasterPassword is called with null
  const setMasterPassword = useCallback((password: string | null) => {
    if (password === null) {
      clearKeyCache();
    }
    setMasterPasswordState(password);
  }, []);

  useEffect(() => {
    setIsMasterPasswordSet(masterPassword !== null);
  }, [masterPassword]);

  return (
    <MasterPasswordContext.Provider value={{ masterPassword, setMasterPassword, isMasterPasswordSet, clearSession }}>
      {children}
    </MasterPasswordContext.Provider>
  );
}

export function useMasterPassword() {
  const context = useContext(MasterPasswordContext);
  if (context === undefined) {
    throw new Error('useMasterPassword must be used within a MasterPasswordProvider');
  }
  return context;
}
