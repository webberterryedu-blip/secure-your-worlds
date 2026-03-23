import { useState } from "react";
import { useCredentials } from "@/hooks/useCredentials";
import type { Tables } from "@/integrations/supabase/types";
import type { CredentialInsert } from "@/hooks/useCredentials";
import CredentialForm from "@/components/CredentialForm";
import CredentialCard from "@/components/CredentialCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { CATEGORIES } from "@/lib/password";

type Credential = Tables<"credentials">;

const CATEGORY_LABELS: Record<string, string> = {
  "E-mails": "E-mails",
  "Redes Sociais": "Redes Sociais",
  "Projetos/Dev": "Projetos / Dev",
  "Financeiro": "Financeiro",
};

interface CategoryPageProps {
  category: string;
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const { credentials, isLoading, addCredential, updateCredential, deleteCredential, toggleFavorite } = useCredentials();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [search, setSearch] = useState("");

  const filtered = credentials
    .filter((c) => c.category === category)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.nick.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    });

  const handleSubmit = async (data: CredentialInsert) => {
    if (editing) {
      await updateCredential({ id: editing.id, ...data });
    } else {
      await addCredential({ ...data, category });
    }
  };

  const label = CATEGORY_LABELS[category] || category;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="text-muted-foreground">Gerencie suas credenciais de {label.toLowerCase()}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9" />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar
        </Button>
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
              onEdit={(c) => { setEditing(c); setFormOpen(true); }}
              onDelete={(id) => deleteCredential(id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <CredentialForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
        defaultCategory={category}
      />
    </div>
  );
}

// Individual category page components
export function EmailsPage() { return <CategoryPage category="E-mails" />; }
export function DevelopmentPage() { return <CategoryPage category="Projetos/Dev" />; }
export function CloudPage() { return <CategoryPage category="Projetos/Dev" />; }
export function AIPage() { return <CategoryPage category="Projetos/Dev" />; }
export function SocialPage() { return <CategoryPage category="Redes Sociais" />; }
export function FinancialPage() { return <CategoryPage category="Financeiro" />; }
export function OtherPage() { return <CategoryPage category="E-mails" />; }
