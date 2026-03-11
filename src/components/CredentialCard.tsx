import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Star, Trash2, Pencil, Mail, Users, Code, Wallet, ExternalLink, Globe, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import type { Credential } from "@/stores/credentialStore";

// Service detection mapping from URL hostname
const SERVICE_MAP: Record<string, string> = {
  "linkedin.com": "LinkedIn",
  "github.com": "GitHub",
  "gitlab.com": "GitLab",
  "bitbucket.org": "Bitbucket",
  "aws.amazon.com": "AWS",
  "console.aws.amazon.com": "AWS",
  "cloud.google.com": "Google Cloud",
  "console.cloud.google.com": "Google Cloud",
  "azure.microsoft.com": "Azure",
  "portal.azure.com": "Azure",
  "heroku.com": "Heroku",
  "render.com": "Render",
  "vercel.com": "Vercel",
  "netlify.com": "Netlify",
  "digitalocean.com": "DigitalOcean",
  "cloudflare.com": "Cloudflare",
  "namecheap.com": "Namecheap",
  "godaddy.com": "GoDaddy",
  "google.com": "Google",
  "microsoft.com": "Microsoft",
  "apple.com": "Apple",
  "facebook.com": "Facebook",
  "twitter.com": "Twitter",
  "instagram.com": "Instagram",
  "youtube.com": "YouTube",
  "reddit.com": "Reddit",
  "dropbox.com": "Dropbox",
  "drive.google.com": "Google Drive",
  "slack.com": "Slack",
  "discord.com": "Discord",
  "notion.so": "Notion",
  "figma.com": "Figma",
  "trello.com": "Trello",
  "asana.com": "Asana",
  "jira.atlassian.com": "Jira",
  "atlassian.net": "Jira",
  "zoom.us": "Zoom",
  "webex.com": "Webex",
  "shopify.com": "Shopify",
  "wordpress.com": "WordPress",
  "stripe.com": "Stripe",
  "paypal.com": "PayPal",
  "linear.app": "Linear",
  "supabase.com": "Supabase",
  "planetscale.com": "PlanetScale",
  "railway.app": "Railway",
  "fly.io": "Fly.io",
};

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

/**
 * Detects service name from URL hostname
 * Returns the detected service name or null if not recognized
 */
export function getServiceFromUrl(url: string | null): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Direct match
    if (SERVICE_MAP[hostname]) {
      return SERVICE_MAP[hostname];
    }
    
    // Check for subdomain matches (e.g., console.aws.amazon.com -> AWS)
    const parts = hostname.split(".");
    for (let i = parts.length - 1; i >= 2; i--) {
      const subdomain = parts.slice(i - 2).join(".");
      if (SERVICE_MAP[subdomain]) {
        return SERVICE_MAP[subdomain];
      }
    }
    
    // Return hostname as fallback for unrecognized services
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return null;
  }
}

/**
 * Formats URL for display - shows hostname + relevant path
 * Returns a shortened, readable version of the URL
 */
export function formatUrl(url: string | null): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    let display = urlObj.hostname;
    
    // Add relevant path (first 2 segments max)
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      const relevantPath = pathSegments.slice(0, 2).join("/");
      if (relevantPath) {
        display += `/${relevantPath}`;
      }
    }
    
    // Truncate if too long
    if (display.length > 40) {
      display = display.slice(0, 37) + "...";
    }
    
    return display;
  } catch {
    return url;
  }
}

interface Props {
  credential: Credential;
  onEdit: (c: Credential) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (p: { id: string; isFavorite: boolean }) => void;
}

export default function CredentialCard({ credential, onEdit, onDelete, onToggleFavorite }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const c = credential;

  // Handle both isFavorite (new) and is_favorite (legacy)
  const isFavorite = c.isFavorite ?? c.is_favorite ?? false;
  
  // Detect service from URL or use provided service field (supports both provider and service)
  const detectedService = getServiceFromUrl(c.url || '') || c.provider || c.service || '';
  
  // Format URL for display
  const displayUrl = formatUrl(c.url || '');

  // Calculate expiry info - support both expires_at and tokenExpiration
  const expiresAt = c.expires_at || c.tokenExpiration;
  const daysUntilExpiry = expiresAt ? differenceInDays(new Date(expiresAt), new Date()) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Card className="group relative transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-4 space-y-3">
        {/* LINE 1: Title - nick + service detected from URL in bold */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {CATEGORY_ICON[c.category] ?? <Globe className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold truncate">
                  {c.nick}
                  {detectedService && (
                    <span className="text-primary"> • {detectedService}</span>
                  )}
                </h3>
                {c.environment && (
                  <Badge className={`text-[10px] px-1.5 py-0 border ${ENVIRONMENTS[c.environment as keyof typeof ENVIRONMENTS]?.color || "bg-muted text-muted-foreground"}`}>
                    {ENVIRONMENTS[c.environment as keyof typeof ENVIRONMENTS]?.label || c.environment}
                  </Badge>
                )}
                {isExpired && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Expirada</Badge>}
                {isExpiringSoon && <Badge className="bg-warning text-warning-foreground text-[10px] px-1.5 py-0">Expira em {daysUntilExpiry}d</Badge>}
              </div>
            </div>
          </div>
          <button
            onClick={() => onToggleFavorite({ id: c.id, isFavorite })}
            className="shrink-0"
          >
            <Star className={`h-5 w-5 transition-colors ${isFavorite ? "fill-primary text-primary" : "text-muted-foreground/40 hover:text-primary"}`} />
          </button>
        </div>

        {/* LINE 2: Email or alternative username in smaller muted text */}
        {(c.email || c.username || c.nick) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{c.email || c.username || c.nick}</span>
          </div>
        )}

        {/* LINE 3: URL formatted and clickable with external link icon */}
        {c.url && (
          <a 
            href={c.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-mono">{displayUrl}</span>
          </a>
        )}

        {/* LINE 4: Password field with toggle eye and copy button */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md bg-muted px-3 py-1.5 font-mono text-sm truncate">
            {showPassword ? (c.password || c.secretKey || c.patToken || c.apiKey || '••••••••') : "••••••••••••"}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
            const credValue = c.password || c.secretKey || c.patToken || c.apiKey || '';
            if (!credValue && import.meta.env.DEV) {
              console.warn('No credential value found for entry:', c.id, c.nick);
            }
            copyText(credValue, "Senha");
          }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* LINE 5: Category badge + action buttons */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {c.category}
            </Badge>
            {c.description && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={c.description}>
                {c.description}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {c.email && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyText(c.email!, "E-mail")} title="Copiar e-mail">
                <Mail className="h-3.5 w-3.5" />
              </Button>
            )}
            {c.url && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Abrir URL">
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
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

        {/* Additional metadata - devices and projects */}
        {/* Devices and Projects - only show for legacy credentials with data */}
        {(c.devices && c.devices.length > 0 || c.projects && c.projects.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
            {c.environment && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Briefcase className="h-3 w-3" />
                {ENVIRONMENTS[c.environment as keyof typeof ENVIRONMENTS]?.label || c.environment}
              </Badge>
            )}
            {c.devices?.slice(0, 2).map((d) => (
              <Badge key={d} variant="outline" className="text-[10px]">
                {d}
              </Badge>
            ))}
            {c.devices && c.devices.length > 2 && (
              <Badge variant="outline" className="text-[10px]">+{c.devices.length - 2}</Badge>
            )}
            {c.projects?.slice(0, 2).map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                {p}
              </Badge>
            ))}
            {c.projects && c.projects.length > 2 && (
              <Badge variant="outline" className="text-[10px]">+{c.projects.length - 2}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
