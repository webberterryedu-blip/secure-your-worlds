import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Star, Trash2, Pencil, Mail, Users, Code, Wallet, ExternalLink, Server, Folder } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import type { Credential } from "@/hooks/useCredentials";

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "E-mails": <Mail className="h-4 w-4" />,
  "Redes Sociais": <Users className="h-4 w-4" />,
  "Projetos/Dev": <Code className="h-4 w-4" />,
  "Financeiro": <Wallet className="h-4 w-4" />,
};

const ENVIRONMENTS = {
  development: { label: "Dev", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  staging: { label: "Staging", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  production: { label: "Prod", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  personal: { label: "Pessoal", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  work: { label: "Trabalho", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

interface Props {
  credential: Credential;
  onEdit: (c: Credential) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (p: { id: string; is_favorite: boolean }) => void;
}

export default function CredentialCard({ credential, onEdit, onDelete, onToggleFavorite }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const c = credential;

  const daysUntilExpiry = c.expires_at ? differenceInDays(new Date(c.expires_at), new Date()) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Card className="group relative transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {CATEGORY_ICON[c.category] ?? <Mail className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{c.service || c.nick}</h3>
                {c.environment && (
                  <Badge className={`text-[10px] px-1.5 py-0 border ${ENVIRONMENTS[c.environment as keyof typeof ENVIRONMENTS]?.color || "bg-muted text-muted-foreground"}`}>
                    {ENVIRONMENTS[c.environment as keyof typeof ENVIRONMENTS]?.label || c.environment}
                  </Badge>
                )}
                {isExpired && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expirada</Badge>}
                {isExpiringSoon && <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Expira em {daysUntilExpiry}d</Badge>}
              </div>
              {(c.service ? c.nick : c.email) && (
                <p className="text-sm text-muted-foreground truncate">{c.service ? c.nick : c.email}</p>
              )}
              {!c.service && c.email && (
                <p className="text-sm text-muted-foreground truncate">{c.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite({ id: c.id, is_favorite: c.is_favorite })}
            className="shrink-0"
          >
            <Star className={`h-5 w-5 transition-colors ${c.is_favorite ? "fill-primary text-primary" : "text-muted-foreground/40 hover:text-primary"}`} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-md bg-muted px-3 py-1.5 font-mono text-sm">
            {showPassword ? c.password : "••••••••••"}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyText(c.password, "Senha")}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {c.devices.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {c.devices.slice(0, 3).map((d) => (
              <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
            ))}
            {c.devices.length > 3 && (
              <Badge variant="outline" className="text-[10px]">+{c.devices.length - 3}</Badge>
            )}
          </div>
        )}

        {(c.projects && c.projects.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {c.projects.slice(0, 3).map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                <Folder className="h-3 w-3 mr-1" />
                {p}
              </Badge>
            ))}
            {c.projects.length > 3 && (
              <Badge variant="outline" className="text-[10px]">+{c.projects.length - 3} projetos</Badge>
            )}
          </div>
        )}

        {c.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <Badge variant="outline" className="text-[10px]">{c.category}</Badge>
          <div className="flex gap-1">
            {c.url && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            {c.email && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyText(c.email!, "E-mail")}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(c)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(c.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
