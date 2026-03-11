
// src/components/CredentialList.tsx
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Copy, Trash2, Edit, Star, StarOff } from "lucide-react";
import { useVaultStore, StoredCredential } from "@/store/vaultStore";
import { toast } from "sonner";

interface CredentialListProps {
  categoryFilter?: string; // Filtra por categoria principal
  providerFilter?: string; // Filtra por provedor dentro da categoria (ex: Gmail para E-mails)
  onEdit: (credential: StoredCredential) => void;
}

export function CredentialList({ categoryFilter, providerFilter, onEdit }: CredentialListProps) {
  const { credentials, deleteCredential, updateCredential, masterPassword, loadAndDecryptCredentials } = useVaultStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Se a masterPassword não estiver definida, tentamos carregar/descriptografar
  React.useEffect(() => {
    if (!masterPassword && credentials.length > 0) {
      // Isso pode disparar o MasterPasswordDialog se não estiver no contexto
      // Ou podemos ter um botão "Desbloquear Cofre" aqui
      toast.info("Cofre bloqueado. Insira a senha mestra para ver as credenciais.");
    }
  }, [masterPassword, credentials.length]);

  const filteredCredentials = useMemo(() => {
    let filtered = credentials;

    if (categoryFilter) {
      filtered = filtered.filter(cred => cred.category === categoryFilter);
    }

    // TODO: Implementar providerFilter se houver um campo 'provider' nas credenciais
    // if (providerFilter) {
    //   filtered = filtered.filter(cred => cred.provider === providerFilter);
    // }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        cred =>
          cred.nick.toLowerCase().includes(lowerCaseSearchTerm) ||
          cred.description?.toLowerCase().includes(lowerCaseSearchTerm) ||
          cred.decrypted_email?.toLowerCase().includes(lowerCaseSearchTerm) ||
          cred.decrypted_url?.toLowerCase().includes(lowerCaseSearchTerm) ||
          cred.decrypted_notes?.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    return filtered;
  }, [credentials, categoryFilter, providerFilter, searchTerm]);

  const toggleShowPassword = (id: string) => {
    if (!masterPassword) {
      toast.error("Cofre bloqueado. Insira a senha mestra para ver a senha.");
      return;
    }
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string | undefined) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copiado para a área de transferência!");
    } else {
      toast.error("Nada para copiar.");
    }
  };

  const toggleFavorite = (cred: StoredCredential) => {
    updateCredential(cred.id, { is_favorite: !cred.is_favorite });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar credenciais..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {filteredCredentials.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma credencial encontrada nesta categoria.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCredentials.map((cred) => (
            <Card key={cred.id} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">{cred.nick}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => toggleFavorite(cred)}>
                    {cred.is_favorite ? <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> : <StarOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(cred)}>
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCredential(cred.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-muted-foreground">
                {cred.decrypted_email && (
                  <p className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{cred.decrypted_email}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.decrypted_email)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </p>
                )}
                {cred.decrypted_password && (
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {showPasswordMap[cred.id] ? cred.decrypted_password : "••••••••••••"}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleShowPassword(cred.id)}>
                      {showPasswordMap[cred.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.decrypted_password)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {cred.decrypted_url && (
                  <p className="text-sm flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <a href={cred.decrypted_url} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                      {cred.decrypted_url}
                    </a>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.decrypted_url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </p>
                )}
                {cred.description && <p className="text-xs text-muted-foreground">{cred.description}</p>}
                {cred.expires_at && <p className="text-xs text-muted-foreground">Expira em: {new Date(cred.expires_at).toLocaleDateString()}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
