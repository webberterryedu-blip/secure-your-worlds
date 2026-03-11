import { useState } from "react";
import { CredentialList } from "@/components/CredentialList";
import CredentialFormDynamic from "@/components/CredentialFormDynamic";
import { useCredentialStore, CATEGORY_LABELS, type CredentialCategory, type Credential } from "@/stores/credentialStore";

interface CategoryPageProps {
  category: CredentialCategory;
}

export default function CategoryPage({ category }: CategoryPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { credentials, addCredential, updateCredential } = useCredentialStore();

  const editingCredential = editingId 
    ? credentials.find(c => c.id === editingId) 
    : null;

  const handleAddNew = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const handleEdit = (credentialId: string) => {
    setEditingId(credentialId);
    setFormOpen(true);
  };

  const handleSubmit = async (data: Partial<Credential>) => {
    if (editingId) {
      await updateCredential(editingId, data);
    } else {
      // Validate required fields before adding
      if (!data.nick || !data.category) {
        console.error('Missing required fields: nick and category are required');
        return;
      }
      await addCredential(data as Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const label = CATEGORY_LABELS[category];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="text-muted-foreground">
          Gerencie suas credenciais de {label.toLowerCase()}
        </p>
      </div>

      <CredentialList
        category={category}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
      />

      <CredentialFormDynamic
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        initial={editingCredential || null}
        category={category}
      />
    </div>
  );
}

// Individual category page components
export function EmailsPage() { return <CategoryPage category="emails" />; }
export function DevelopmentPage() { return <CategoryPage category="development" />; }
export function CloudPage() { return <CategoryPage category="cloud" />; }
export function AIPage() { return <CategoryPage category="ai" />; }
export function SocialPage() { return <CategoryPage category="social" />; }
export function FinancialPage() { return <CategoryPage category="financial" />; }
export function OtherPage() { return <CategoryPage category="other" />; }
