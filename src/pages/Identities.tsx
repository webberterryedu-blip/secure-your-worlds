import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, User, Trash2, Edit, Mail, Key } from "lucide-react";
import { useCredentialStore, type Identity } from "@/stores/credentialStore";

export default function Identities() {
  const { 
    identities, 
    credentials, 
    addIdentity, 
    updateIdentity, 
    deleteIdentity,
    getCredentialsByIdentity 
  } = useCredentialStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<Identity | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [identityToDelete, setIdentityToDelete] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleOpenDialog = (identity?: Identity) => {
    if (identity) {
      setEditingIdentity(identity);
      setName(identity.name);
      setDescription(identity.description || "");
    } else {
      setEditingIdentity(null);
      setName("");
      setDescription("");
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (editingIdentity) {
      updateIdentity(editingIdentity.id, { name, description: description || undefined });
    } else {
      addIdentity({ 
        name, 
        description: description || undefined, 
        credentialIds: [] 
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setIdentityToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (identityToDelete) {
      deleteIdentity(identityToDelete);
      setIdentityToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Identidades</h1>
          <p className="text-muted-foreground">
            Agrupe credenciais relacionadas (ex: Pessoal = Gmail + GitHub + OpenAI)
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Identidade
        </Button>
      </div>

      {identities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium">Nenhuma identidade criada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie identidades para agrupar suas credenciais relacionadas
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {identities.map((identity) => {
            const identityCredentials = getCredentialsByIdentity(identity.id);
            
            return (
              <Card key={identity.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{identity.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleOpenDialog(identity)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(identity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {identity.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {identity.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {identityCredentials.length} credencial{identityCredentials.length !== 1 ? 'is' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {identityCredentials.slice(0, 5).map((cred) => (
                        <Badge key={cred.id} variant="outline" className="text-xs">
                          {cred.nick}
                        </Badge>
                      ))}
                      {identityCredentials.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{identityCredentials.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIdentity ? "Editar" : "Nova"} Identidade
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Pessoal, Trabalho, etc." 
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Descrição opcional..." 
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!name}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Identidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta identidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
