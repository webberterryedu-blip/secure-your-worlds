
// src/components/MasterPasswordDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMasterPassword } from "@/contexts/MasterPasswordContext";
import { toast } from "sonner";

interface MasterPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMasterPasswordSet: (password: string) => void;
}

export function MasterPasswordDialog({ isOpen, onClose, onMasterPasswordSet }: MasterPasswordDialogProps) {
  const [passwordInput, setPasswordInput] = useState("");
  const { setMasterPassword } = useMasterPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === "") {
      toast.error("A senha mestra não pode ser vazia.");
      return;
    }
    setMasterPassword(passwordInput);
    onMasterPasswordSet(passwordInput);
    onClose();
    setPasswordInput(""); // Limpa o input após o uso
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
