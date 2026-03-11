import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Server, 
  Monitor, 
  Watch, 
  Globe, 
  ChevronDown, 
  ChevronUp,
  Folder,
  FileText,
  Mail
} from "lucide-react";

// Device icon mapping
const DEVICE_ICONS: Record<string, React.ReactNode> = {
  "Desktop": <Monitor className="h-3 w-3" />,
  "Laptop": <Laptop className="h-3 w-3" />,
  "Smartphone": <Smartphone className="h-3 w-3" />,
  "Tablet": <Tablet className="h-3 w-3" />,
  "Servidor": <Server className="h-3 w-3" />,
  "Relógio": <Watch className="h-3 w-3" />,
  "Web": <Globe className="h-3 w-3" />,
};

// Environment color mapping
const ENVIRONMENTS: Record<string, { label: string; color: string }> = {
  development: { label: "Dev", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  staging: { label: "Staging", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  production: { label: "Prod", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  personal: { label: "Pessoal", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  work: { label: "Trabalho", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
};

interface Credential {
  id: string;
  service_name?: string | null;
  nick?: string;
  email?: string | null;
  environment?: string | null;
  devices?: string[];
  projects?: string[] | null;
  description?: string | null;
  notes?: string | null;
}

interface Props {
  credential: Credential;
}

export default function CredentialCard({ credential }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const envConfig = credential.environment 
    ? ENVIRONMENTS[credential.environment] 
    : null;

  return (
    <Card 
      className="group relative transition-all duration-200 hover:shadow-md hover:border-primary/40 cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardContent className="p-3">
        {/* Main Row - Always Visible */}
        <div className="flex items-center gap-2">
          {/* Service Icon */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Globe className="h-4 w-4" />
          </div>

          {/* Service Name + Email */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate">
                {credential.service_name || credential.nick || "Sem nome"}
              </span>
              {envConfig && (
                <Badge 
                  className={`text-[10px] px-1.5 py-0 border ${envConfig.color}`}
                >
                  {envConfig.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{credential.email || "Sem e-mail"}</span>
            </div>
          </div>

          {/* Device Icons */}
          {credential.devices && credential.devices.length > 0 && (
            <div className="flex shrink-0">
              {credential.devices.slice(0, 3).map((device, idx) => (
                <div 
                  key={idx} 
                  className="ml-[-4px] flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background text-muted-foreground first:ml-0"
                  title={device}
                >
                  {DEVICE_ICONS[device] || <Globe className="h-3 w-3" />}
                </div>
              ))}
              {credential.devices.length > 3 && (
                <div className="ml-[-4px] flex h-6 w-6 items-center justify-center rounded-full bg-muted border-2 border-background text-[10px] text-muted-foreground">
                  +{credential.devices.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Expand/Collapse Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Expandable Details Area */}
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ 
            maxHeight: isExpanded ? "500px" : "0",
            opacity: isExpanded ? 1 : 0,
            marginTop: isExpanded ? "12px" : "0"
          }}
        >
          {/* Divider */}
          <div className="border-t border-border mb-3" />

          {/* Projects */}
          {credential.projects && credential.projects.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Folder className="h-3 w-3" />
                <span>Projetos</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {credential.projects.map((project, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-[10px] border-emerald-500/30 text-emerald-400"
                  >
                    {project}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {credential.description && (
            <div className="mb-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <FileText className="h-3 w-3" />
                <span>Descrição</span>
              </div>
              <p className="text-xs text-foreground/80 line-clamp-2">
                {credential.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {credential.notes && (
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <FileText className="h-3 w-3" />
                <span>Notas</span>
              </div>
              <p className="text-xs text-foreground/80 line-clamp-3">
                {credential.notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
