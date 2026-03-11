
// src/components/MasterPasswordDialog.tsx
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMasterPassword } from "@/contexts/MasterPasswordContext";
import { toast } from "sonner";
import { getPasswordStrength } from "@/lib/password";

const MIN_PASSWORD_LENGTH = 12;
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface MasterPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMasterPasswordSet: (password: string) => void;
}

export function MasterPasswordDialog({ isOpen, onClose, onMasterPasswordSet }: MasterPasswordDialogProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const [sessionTimer, setSessionTimer] = useState<NodeJS.Timeout | null>(null);
  const { setMasterPassword } = useMasterPassword();

  const strength = getPasswordStrength(passwordInput);

  // Clear password from memory after session timeout
  const clearSession = useCallback(() => {
    setMasterPassword(null);
    setPasswordInput("");
    toast.info("Sessão expirada. Por favor, insira sua senha mestra novamente.");
  }, [setMasterPassword]);

  // Reset session timer on activity
  const resetSessionTimer = useCallback(() => {
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }
    const timer = setTimeout(clearSession, SESSION_TIMEOUT_MS);
    setSessionTimer(timer);
  }, [sessionTimer, clearSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, [sessionTimer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate minimum length
    if (passwordInput.length < MIN_PASSWORD_LENGTH) {
      toast.error(`A senha mestra deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    
    // Validate password strength
    const passwordStrength = getPasswordStrength(passwordInput);
    if (passwordStrength.score < 50) {
      toast.error("A senha mestra é muito fraca. Use uma combinação de letras, números e símbolos.");
      return;
    }
    
    setMasterPassword(passwordInput);
    onMasterPasswordSet(passwordInput);
    resetSessionTimer(); // Start session timer
    onClose();
    setPasswordInput(""); // Clear input after use
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Senha Mestra do VaultKey</DialogTitle>
          <DialogDescription>
            Por favor, insira sua senha mestra para descriptografar suas credenciais.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <Input
            id="master-password"
            type="password"
            placeholder="Sua Senha Mestra"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            required
          />
          <Button type="submit">Desbloquear Cofre</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
