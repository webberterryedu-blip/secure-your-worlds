
// src/pages/VaultPageTemplate.tsx
import React, { useState } from "react";
import { CredentialList } from "@/components/CredentialList";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CredentialForm } from "@/components/CredentialForm";
import { StoredCredential } from "@/store/vaultStore";

interface VaultPageTemplateProps {
  title: string;
  category: string;
}

export function VaultPageTemplate({ title, category }: VaultPageTemplateProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<StoredCredential | null>(null);

  const handleAddCredential = () => {
    setEditingCredential(null);
    setIsFormOpen(true);
  };

  const handleEditCredential = (credential: StoredCredential) => {
    setEditingCredential(credential);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCredential(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <Button onClick={handleAddCredential} className="bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Credencial
        </Button>
      </div>

      <CredentialList categoryFilter={category} onEdit={handleEditCredential} />

      <CredentialForm
        open={isFormOpen}
        onClose={handleFormClose}
        initial={editingCredential}
        category={category} // Passa a categoria para o formulário
      />
    </div>
  );
}
