import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useCredentials } from "@/hooks/useCredentials";
import type { Tables } from "@/integrations/supabase/types";
import CredentialCard from "@/components/CredentialCard";

type Credential = Tables<"credentials">;

interface CredentialListProps {
  category?: string;
  onAddNew?: () => void;
  onEdit?: (credential: Credential) => void;
}

export function CredentialList({ category, onAddNew, onEdit }: CredentialListProps) {
  const { credentials, toggleFavorite, deleteCredential } = useCredentials();
  const [search, setSearch] = useState("");

  const filtered = credentials
    .filter((c) => !category || c.category === category)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.nick.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar credenciais..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {onAddNew && (
          <Button onClick={onAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "credencial" : "credenciais"}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">Nenhuma credencial encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Tente ajustar a busca" : "Adicione sua primeira credencial"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CredentialCard
              key={c.id}
              credential={c}
              onEdit={(cred) => onEdit?.(cred)}
              onDelete={(id) => deleteCredential(id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CredentialList;
