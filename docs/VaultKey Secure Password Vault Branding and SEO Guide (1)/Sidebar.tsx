
// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Mail, Code, Cloud, Bot, Users, DollarSign, MoreHorizontal, Lock, Fingerprint, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assumindo que você tem um utilitário para classes condicionais

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/vault/emails', icon: Mail, label: 'E-mails' },
  { href: '/vault/dev', icon: Code, label: 'Desenvolvimento' },
  { href: '/vault/cloud', icon: Cloud, label: 'Cloud & Infra' },
  { href: '/vault/ai', icon: Bot, label: 'Inteligência Artificial' },
  { href: '/vault/social', icon: Users, label: 'Redes Sociais' },
  { href: '/vault/finance', icon: DollarSign, label: 'Financeiro' },
  { href: '/vault/others', icon: MoreHorizontal, label: 'Outros' },
  { href: '/identities', icon: Fingerprint, label: 'Identidades' },
  { href: '/secrets', icon: Lock, label: 'Secrets Manager' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card text-foreground p-4 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="h-6 w-6 text-emerald-400" />
        <h1 className="text-xl font-bold">VaultKey</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-foreground hover:bg-secondary",
              location.pathname.startsWith(item.href) && "bg-secondary text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
