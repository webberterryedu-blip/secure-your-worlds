import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter } from "lucide-react";
import { useCredentialStore, CATEGORY_PROVIDERS, type Credential, type CredentialCategory } from "@/stores/credentialStore";
import CredentialCard from "@/components/CredentialCard";
import CredentialCardMicro from "@/components/CredentialCardMicro";

interface CredentialListProps {
  category?: CredentialCategory | "all";
  onAddNew?: () => void;
  onEdit?: (credentialId: string) => void;
}

export function CredentialList({ 
  category = "all", 
  onAddNew,
  onEdit 
}: CredentialListProps) {
  const {
    searchQuery,
    selectedProvider,
    setSearchQuery,
    setSelectedProvider,
    setSelectedCategory,
    getFilteredCredentials,
    credentials,
    toggleFavorite,
  } = useCredentialStore();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get providers for current category
  const availableProviders = category !== "all" ? CATEGORY_PROVIDERS[category] : [];

  // Filter credentials by category if specified
  const filteredCredentials = getFilteredCredentials().filter((cred) => {
    if (category !== "all" && cred.category !== category) {
      return false;
    }
    return true;
  });

  const handleDelete = (id: string) => {
    useCredentialStore.getState().deleteCredential(id);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar credenciais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Provider Filter */}
          {availableProviders.length > 0 && (
            <Select
              value={selectedProvider || "all"}
              onValueChange={(value) => setSelectedProvider(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Provedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Add New Button */}
          {onAddNew && (
            <Button onClick={onAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nova
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredCredentials.length} credencial{filteredCredentials.length !== 1 ? 'is' : ''} encontrada{filteredCredentials.length !== 1 ? 's' : ''}
      </div>

      {/* Credentials Grid/List */}
      {filteredCredentials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">Nenhuma credencial encontrada</p>
            <p className="text-sm mt-1">
              {searchQuery || selectedProvider
                ? "Tente ajustar os filtros de busca"
                : "Adicione sua primeira credencial"}
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCredentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onEdit={(c) => onEdit?.(c.id)}
              onDelete={handleDelete}
              onToggleFavorite={({ id }) => toggleFavorite(id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCredentials.map((credential) => (
            <CredentialCardMicro
              key={credential.id}
              credential={credential}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CredentialList;
