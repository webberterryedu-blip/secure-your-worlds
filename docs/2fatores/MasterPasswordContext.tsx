
// src/contexts/MasterPasswordContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

interface MasterPasswordContextType {
  masterPassword: string | null;
  setMasterPassword: (password: string | null) => void;
  isMasterPasswordSet: boolean;
}

const MasterPasswordContext = createContext<MasterPasswordContextType | undefined>(undefined);

export function MasterPasswordProvider({ children }: { children: ReactNode }) {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [isMasterPasswordSet, setIsMasterPasswordSet] = useState(false);

  useEffect(() => {
    setIsMasterPasswordSet(masterPassword !== null);
  }, [masterPassword]);

  return (
    <MasterPasswordContext.Provider value={{ masterPassword, setMasterPassword, isMasterPasswordSet }}>
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
