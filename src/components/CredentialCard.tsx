import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Star, Trash2, Pencil, Mail, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Credential = Tables<"credentials">;

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "E-mails": <Mail className="h-4 w-4" />,
  "Redes Sociais": <Globe className="h-4 w-4" />,
  "Projetos/Dev": <Globe className="h-4 w-4" />,
  "Financeiro": <Globe className="h-4 w-4" />,
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
      <CardContent className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {CATEGORY_ICON[c.category] ?? <Globe className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold truncate">{c.nick}</h3>
                {isExpired && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expirada</Badge>}
                {isExpiringSoon && <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Expira em {daysUntilExpiry}d</Badge>}
              </div>
            </div>
          </div>
          <button onClick={() => onToggleFavorite({ id: c.id, is_favorite: c.is_favorite })} className="shrink-0">
            <Star className={`h-5 w-5 transition-colors ${c.is_favorite ? "fill-primary text-primary" : "text-muted-foreground/40 hover:text-primary"}`} />
          </button>
        </div>

        {/* Email */}
        {c.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{c.email}</span>
          </div>
        )}

        {/* URL */}
        {c.url && (
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-mono">{c.url}</span>
          </a>
        )}

        {/* Password */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md bg-muted px-3 py-1.5 font-mono text-sm truncate">
            {showPassword ? c.password : "••••••••••••"}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyText(c.password, "Senha")}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Footer: category + actions */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{c.category}</Badge>
            {c.description && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={c.description}>{c.description}</span>
            )}
          </div>
          <div className="flex gap-1">
            {c.email && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyText(c.email!, "E-mail")} title="Copiar e-mail">
                <Mail className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(c)} title="Editar">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(c.id)} title="Excluir">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Devices */}
        {c.devices && c.devices.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
            {c.devices.map((d) => (
              <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
