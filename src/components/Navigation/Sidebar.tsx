import { NavLink } from "react-router-dom";
import { 
  Shield, 
  Mail, 
  Code, 
  Cloud, 
  Bot, 
  Users, 
  Wallet, 
  MoreHorizontal,
  Key,
  User,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type CredentialCategory } from "@/stores/credentialStore";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  className?: string;
}

const categoryNavItems: { to: string; icon: React.ElementType; label: string; category: CredentialCategory }[] = [
  { to: "/emails", icon: Mail, label: 'category.emails', category: 'emails' },
  { to: "/development", icon: Code, label: 'category.development', category: 'development' },
  { to: "/cloud", icon: Cloud, label: 'category.cloud', category: 'cloud' },
  { to: "/ai", icon: Bot, label: 'category.ai', category: 'ai' },
  { to: "/social", icon: Users, label: 'category.social', category: 'social' },
  { to: "/financial", icon: Wallet, label: 'category.financial', category: 'financial' },
  { to: "/other", icon: MoreHorizontal, label: 'category.other', category: 'other' },
];

export function Sidebar({ className }: SidebarProps) {
  const { t } = useTranslation();
  
  const mainNavItems = [
    { to: "/dashboard", icon: Shield, label: t('nav.all') },
    { to: "/identities", icon: User, label: t('nav.identities') },
    { to: "/settings/security", icon: Settings, label: t('nav.settings') || 'Security' },
  ];

  return (
    <aside className={cn("w-64 border-r bg-card", className)}>
      <div className="flex h-16 items-center border-b px-4">
        <Key className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">VaultKey</span>
      </div>
      
      <nav className="space-y-1 p-2">
        {/* Main Navigation */}
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
        
        <div className="my-3 border-t" />
        
        {/* Category Navigation */}
        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
          {t('nav.categories')}
        </div>
        
        {categoryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {t(item.label)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
