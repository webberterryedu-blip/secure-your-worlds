
// src/pages/IdentitiesPage.tsx
import React, { useState } from "react";
import { useVaultStore, Identity, StoredCredential } from "@/store/vaultStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface IdentityFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentity?: Identity | null;
}

function IdentityForm({ isOpen, onClose, initialIdentity }: IdentityFormProps) {
  const [name, setName] = useState(initialIdentity?.name || "");
  const [selectedCredentialIds, setSelectedCredentialIds] = useState<string[]>(initialIdentity?.credentialIds || []);
  const { addIdentity, updateIdentity, credentials } = useVaultStore();

  useEffect(() => {
    if (initialIdentity) {
      setName(initialIdentity.name);
      setSelectedCredentialIds(initialIdentity.credentialIds);
    } else {
      setName("");
      setSelectedCredentialIds([]);
    }
  }, [initialIdentity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome da identidade não pode ser vazio.");
      return;
    }

    const identityData = { name, credentialIds: selectedCredentialIds };

    if (initialIdentity) {
      updateIdentity(initialIdentity.id, identityData);
    } else {
      addIdentity(identityData);
    }
    onClose();
  };

  const toggleCredentialSelection = (credId: string) => {
    setSelectedCredentialIds(prev =>
      prev.includes(credId) ? prev.filter(id => id !== credId) : [...prev, credId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialIdentity ? "Editar Identidade" : "Nova Identidade"}</DialogTitle>
          <DialogDescription>
            {initialIdentity ? "Edite os detalhes da sua identidade." : "Crie uma nova identidade para agrupar credenciais."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="identity-name">Nome da Identidade</Label>
            <Input
              id="identity-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pessoal, Trabalho, Freelance"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Credenciais Associadas</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-900">
              {credentials.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma credencial disponível.</p>
              ) : (
                credentials.map(cred => (
                  <div key={cred.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`cred-${cred.id}`}
                      checked={selectedCredentialIds.includes(cred.id)}
                      onChange={() => toggleCredentialSelection(cred.id)}
                      className="form-checkbox h-4 w-4 text-emerald-600 rounded border-gray-700 bg-gray-800 focus:ring-emerald-500"
                    />
                    <Label htmlFor={`cred-${cred.id}`} className="text-sm font-medium text-gray-300">
                      {cred.nick} ({cred.decrypted_email || cred.email || cred.category})
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button type="submit">{initialIdentity ? "Salvar Alterações" : "Criar Identidade"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function IdentitiesPage() {
  const { identities, deleteIdentity, credentials } = useVaultStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);

  const handleAddIdentity = () => {
    setEditingIdentity(null);
    setIsFormOpen(true);
  };

  const handleEditIdentity = (identity: Identity) => {
    setEditingIdentity(identity);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingIdentity(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Suas Identidades</h2>
        <Button onClick={handleAddIdentity} className="bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Identidade
        </Button>
      </div>

      {identities.length === 0 ? (
        <p className="text-gray-400">Nenhuma identidade criada ainda. Crie uma para agrupar suas credenciais.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {identities.map((identity) => (
            <Card key={identity.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-white">{identity.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditIdentity(identity)}>
                    <Edit className="h-4 w-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteIdentity(identity.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-gray-300">
                <p className="text-sm flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-gray-500" />
                  {identity.credentialIds.length} Credenciais Associadas
                </p>
                <ul className="list-disc list-inside text-xs text-gray-400 pl-2">
                  {identity.credentialIds.map(credId => {
                    const cred = credentials.find(c => c.id === credId);
                    return cred ? <li key={credId}>{cred.nick} ({cred.category})</li> : null;
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IdentityForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        initialIdentity={editingIdentity}
      />
    </div>
  );
}
