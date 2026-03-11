import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredentials } from "@/hooks/useCredentials";
import type { Credential, CredentialInsert, CredentialUpdate } from "@/hooks/useCredentials";
import CredentialForm from "@/components/CredentialForm";
import CredentialCard from "@/components/CredentialCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Search, LogOut, Download, Mail, Users, Code, Wallet, Star, AlertTriangle, Key } from "lucide-react";
import { CATEGORIES, DEVICES } from "@/lib/password";
import { differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "E-mails": <Mail className="h-4 w-4" />,
  "Redes Sociais": <Users className="h-4 w-4" />,
  "Projetos/Dev": <Code className="h-4 w-4" />,
  "Financeiro": <Wallet className="h-4 w-4" />,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { credentials, isLoading, addCredential, updateCredential, deleteCredential, toggleFavorite } = useCredentials();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterDevice, setFilterDevice] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [filterFavorite, setFilterFavorite] = useState(false);

  // Get unique services for filter dropdown
  const services = useMemo(() => {
    const uniqueServices = new Set<string>();
    credentials.forEach((c) => {
      if (c.service) uniqueServices.add(c.service);
    });
    return Array.from(uniqueServices).sort();
  }, [credentials]);

  const filtered = useMemo(() => {
    return credentials
      .filter((c) => {
        if (search) {
          const q = search.toLowerCase();
          if (!c.nick.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q) && !c.service?.toLowerCase().includes(q)) return false;
        }
        if (filterCategory !== "all" && c.category !== filterCategory) return false;
        if (filterDevice !== "all" && !c.devices.includes(filterDevice)) return false;
        if (filterService !== "all" && c.service !== filterService) return false;
        if (filterEnvironment !== "all" && c.environment !== filterEnvironment) return false;
        if (filterFavorite && !c.is_favorite) return false;
        return true;
      })
      // Sort: favorites first, then by last_used desc, then by created_at desc
      .sort((a, b) => {
        if (a.is_favorite !== b.is_favorite) {
          return a.is_favorite ? -1 : 1;
        }
        const aTime = a.last_used ? new Date(a.last_used).getTime() : 0;
        const bTime = b.last_used ? new Date(b.last_used).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [credentials, search, filterCategory, filterDevice, filterService, filterEnvironment, filterFavorite]);

  const stats = useMemo(() => {
    const total = credentials.length;
    const byCategory = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = credentials.filter((c) => c.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
    const expiring = credentials.filter((c) => {
      if (!c.expires_at) return false;
      const d = differenceInDays(new Date(c.expires_at), new Date());
      return d <= 30 && d > 0;
    }).length;
    const expired = credentials.filter((c) => {
      if (!c.expires_at) return false;
      return differenceInDays(new Date(c.expires_at), new Date()) <= 0;
    }).length;
    return { total, byCategory, expiring, expired };
  }, [credentials]);

  const handleExport = () => {
    const data = JSON.stringify(credentials, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vaultkey-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados!");
  };

  const handleFormSubmit = async (data: CredentialInsert) => {
    if (editing) {
      await updateCredential({ id: editing.id, ...data } as CredentialUpdate & { id: string });
    } else {
      await addCredential(data);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold font-mono tracking-tight">VaultKey</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleExport} title="Exportar JSON">
              <Download className="h-4 w-4" />
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => navigate("/secrets")} title="Secrets Vault">
                  <Key className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={async () => {
                  await signOut();
                  navigate("/"); 
                }} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-2xl font-bold font-mono">{stats.total}</p>
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {CATEGORY_ICON[cat]} {cat}
              </div>
              <p className="text-2xl font-bold font-mono">{stats.byCategory[cat]}</p>
            </div>
          ))}
          {(stats.expiring > 0 || stats.expired > 0) && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Alertas
              </div>
              <p className="text-2xl font-bold font-mono text-destructive">{stats.expiring + stats.expired}</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nick, e-mail, serviço, descrição..."
              className="pl-9"
            />
          </div>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Serviço" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os serviços</SelectItem>
              {services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterEnvironment} onValueChange={setFilterEnvironment}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Ambiente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="development">Desenvolvimento</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Produção</SelectItem>
              <SelectItem value="personal">Pessoal</SelectItem>
              <SelectItem value="work">Trabalho</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDevice} onValueChange={setFilterDevice}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Dispositivo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {DEVICES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant={filterFavorite ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterFavorite(!filterFavorite)}
          >
            <Star className={`h-4 w-4 ${filterFavorite ? "fill-current" : ""}`} />
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Nova
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-muted-foreground">
              {credentials.length === 0 ? "Nenhuma credencial ainda" : "Nenhum resultado"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {credentials.length === 0 ? "Adicione sua primeira credencial para começar" : "Tente ajustar os filtros"}
            </p>
            {credentials.length === 0 && (
              <Button className="mt-4" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" /> Adicionar credencial
              </Button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <CredentialCard
                    credential={c}
                    onEdit={(c) => { setEditing(c); setFormOpen(true); }}
                    onDelete={(id) => setDeleteId(id)}
                    onToggleFavorite={toggleFavorite}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Form dialog */}
      <CredentialForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleFormSubmit}
        initial={editing}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A credencial será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteCredential(deleteId); setDeleteId(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
