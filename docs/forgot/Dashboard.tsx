
// src/pages/Dashboard.tsx
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVaultStore } from "@/store/vaultStore";
import { Mail, Users, Code, Cloud, Bot, DollarSign, MoreHorizontal, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";

const CATEGORY_ICON: Record<string, React.ElementType> = {
  "E-mails": Mail,
  "Desenvolvimento": Code,
  "Cloud": Cloud,
  "Inteligência Artificial": Bot,
  "Redes Sociais": Users,
  "Financeiro": DollarSign,
  "Outros": MoreHorizontal,
};

const CATEGORIES = ["E-mails", "Desenvolvimento", "Cloud", "Inteligência Artificial", "Redes Sociais", "Financeiro", "Outros"];

export function Dashboard() {
  const { user } = useAuth();
  const { credentials } = useVaultStore();

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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Bem-vindo, {user?.email}!</h2>
      <p className="text-muted-foreground">Visão geral das suas credenciais e atividades recentes.</p>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de Credenciais</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {React.createElement(CATEGORY_ICON[cat], { className: "h-5 w-5 text-primary" })} {cat}
            </div>
            <p className="text-3xl font-bold text-foreground">{stats.byCategory[cat]}</p>
          </div>
        ))}
        {(stats.expiring > 0 || stats.expired > 0) && (
          <div className="rounded-xl border border-destructive bg-destructive/20 p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-5 w-5" /> Alertas
            </div>
            <p className="text-3xl font-bold text-destructive">{stats.expiring + stats.expired}</p>
          </div>
        )}
      </div>

      {/* Seções adicionais podem ser adicionadas aqui, como 
