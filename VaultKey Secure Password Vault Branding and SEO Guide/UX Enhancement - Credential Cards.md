# VaultKey UX Enhancement - Credential Cards

## Current Problem
The current flat data model makes users open each credential to understand context.

## Solution: Hierarchical Credential Model

### Recommended Data Structure

```
Identity (Email)
   └─ Service (GitHub, AWS, Google)
       └─ Context
           ├─ Projects
           ├─ Devices
           └─ Environment
```

---

## 1. Enhanced Data Model

### New Tables for Supabase

```sql
-- Identity table (primary email/identifier)
CREATE TABLE public.identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Services table (GitHub, AWS, Stripe, etc.)
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES public.identities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Projects table (associated projects)
CREATE TABLE public.credential_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID REFERENCES public.credentials(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add to credentials table
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id);
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS environment TEXT CHECK (environment IN ('development', 'staging', 'production', 'personal', 'work'));
ALTER TABLE public.credentials ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;
```

---

## 2. Enhanced Credential Card Design

### Smart Card Layout

```tsx
┌─────────────────────────────────────────────────────┐
│ 🖥️ GitHub                                          │
│ weber.terry.edu@gmail.com                           │
│                                                     │
│ Projects                                             │
│ • VaultKey                                          │
│ • DevOps Tools                                      │
│ • AI Experiments                                    │
│                                                     │
│ Devices: 🖥️ Desktop  💻 Laptop                    │
│ Environment: 🟢 Production                          │
│                                                     │
│ Category: Projects/Dev    Last used: 2 days ago    │
│                                                     │
│ [👁] [📋 Copy] [✏️ Edit] [🗑️ Delete]              │
└─────────────────────────────────────────────────────┘
```

### Badge Examples

```
[3 Projects] [2 Devices] [Production]
```

---

## 3. Compact Card Variants

### Default (Compact)
```
GitHub • weber.terry.edu@gmail.com
[3 Projects] [Desktop + Laptop]
```

### Expanded (On Click)
```
GitHub
weber.terry.edu@gmail.com

Projects
• VaultKey
• DevOps Tools
• AI Experiments

Devices
Desktop • Laptop

Category
Projects/Dev

Last used: 2 days ago
```

---

## 4. Icons for Quick Scanning

| Information | Icon | Usage |
|-------------|------|-------|
| Service | 🌐 | Service/website icon |
| Projects | 📦 | Project list |
| Devices | 💻 | Device list |
| Email | ✉ | Email field |
| Category | 🏷 | Category badge |
| Environment | 🟢 | Dev/Prod indicator |
| Last Used | ⏱ | Time since last access |

---

## 5. Smart Filters

### Filter Bar
```
🔍 Search...  [Device: All ▼]  [Service: All ▼]  [Category: All ▼]
```

### Filter Options
- By Device: Desktop, Laptop, Tablet, iPhone, Android
- By Service: GitHub, AWS, Google, Stripe, etc.
- By Category: E-mails, Social, Dev, Finance
- By Environment: Development, Staging, Production

---

## 6. Identity Hub View

```
weber.terry.edu@gmail.com
└─ Services
    ├─ GitHub
    │   └─ 3 projects
    ├─ AWS
    │   └─ 2 projects
    └─ Google
        └─ 5 projects
```

---

## 7. Implementation: Enhanced CredentialCard

```tsx
// src/components/CredentialCard.tsx (Enhanced)

import { useState } from "react";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Edit, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Package,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface Project {
  id: string;
  name: string;
}

interface CredentialCardProps {
  credential: {
    id: string;
    nick: string;
    email: string;
    url?: string;
    category: string;
    devices?: string[];
    projects?: Project[];
    service_id?: string;
    environment?: string;
    is_favorite: boolean;
    last_used_at?: string;
    created_at: string;
  };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCopy: (value: string) => void;
}

const DEVICE_ICONS: Record<string, React.ElementType> = {
  Desktop: Monitor,
  Laptop: Laptop,
  Tablet: Tablet,
  iPhone: Smartphone,
  Android: Smartphone,
};

const ENVIRONMENT_COLORS: Record<string, string> = {
  development: "bg-green-100 text-green-800",
  staging: "bg-yellow-100 text-yellow-800", 
  production: "bg-red-100 text-red-800",
  personal: "bg-blue-100 text-blue-800",
  work: "bg-purple-100 text-purple-800",
};

export function CredentialCard({ 
  credential, 
  onEdit, 
  onDelete, 
  onCopy 
}: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const formatLastUsed = (date?: string) => {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌐</span>
          <div>
            <h3 className="font-semibold">{credential.nick}</h3>
            <p className="text-sm text-gray-500">{credential.email}</p>
          </div>
        </div>
        {credential.is_favorite && <Badge variant="secondary">⭐</Badge>}
      </div>

      {/* Projects (only show if expanded or has projects) */}
      {(expanded || (credential.projects && credential.projects.length > 0)) && (
        <div className="mb-3">
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <Package className="w-4 h-4" />
            <span>Projects</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {credential.projects?.slice(0, expanded ? undefined : 2).map((project) => (
              <Badge key={project.id} variant="outline" className="text-xs">
                {project.name}
              </Badge>
            ))}
            {!expanded && (credential.projects?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs">
                +{credential.projects!.length - 2} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Devices */}
      {credential.devices && credential.devices.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <Monitor className="w-4 h-4" />
            <span>Devices</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {credential.devices.map((device) => {
              const Icon = DEVICE_ICONS[device] || Monitor;
              return (
                <Badge key={device} variant="outline" className="text-xs">
                  <Icon className="w-3 h-3 mr-1" />
                  {device}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Environment */}
      {credential.environment && (
        <div className="mb-3">
          <Badge className={ENVIRONMENT_COLORS[credential.environment]}>
            {credential.environment}
          </Badge>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{credential.category}</Badge>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatLastUsed(credential.last_used_at)}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showPassword ? "Hide" : "Show"} password
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onCopy(credential.email)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy email</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEdit(credential.id)}
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(credential.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Expand/Collapse */}
      {(credential.projects && credential.projects.length > 0) && (
        <Button 
          variant="link" 
          className="w-full mt-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>Show less <ChevronUp className="w-4 h-4 ml-1" /></>
          ) : (
            <>Show more <ChevronDown className="w-4 h-4 ml-1" /></>
          )}
        </Button>
      )}
    </div>
  );
}
```

---

## 8. Enhanced CredentialForm

```tsx
// New fields for CredentialForm.tsx

interface FormFields {
  // Existing
  nick: string;
  email: string;
  password: string;
  category: string;
  
  // New
  service: string;        // e.g., "GitHub", "AWS"
  serviceUrl: string;     // e.g., "https://github.com"
  projects: string[];     // e.g., ["VaultKey", "DevOps Tools"]
  devices: string[];      // e.g., ["Desktop", "Laptop"]
  environment: string;    // e.g., "production", "development"
}
```

---

## 9. Filter Component

```tsx
// src/components/CredentialFilters.tsx

interface FilterState {
  search: string;
  device: string | null;
  service: string | null;
  category: string | null;
  environment: string | null;
}

export function CredentialFilters({ 
  filters, 
  onChange 
}: { 
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Input 
        placeholder="Search..." 
        value={filters.search}
        onChange={(e) => onChange({...filters, search: e.target.value})}
        className="max-w-xs"
      />
      
      <Select 
        value={filters.device || ""}
        onValueChange={(value) => onChange({...filters, device: value || null})}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Device" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Devices</SelectItem>
          <SelectItem value="Desktop">Desktop</SelectItem>
          <SelectItem value="Laptop">Laptop</SelectItem>
          <SelectItem value="Mobile">Mobile</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.environment || ""}
        onValueChange={(value) => onChange({...filters, environment: value || null})}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="development">Development</SelectItem>
          <SelectItem value="staging">Staging</SelectItem>
          <SelectItem value="production">Production</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

## Summary: UX Improvements

| Improvement | Benefit |
|-------------|---------|
| Hierarchical data | Context without opening records |
| Expanded cards | 80% info visible without modal |
| Device icons | Quick visual scanning |
| Project badges | Know associated projects instantly |
| Environment tags | Clear dev/prod separation |
| Last used timestamp | Know if credentials are stale |
| Smart filters | Find credentials fast |
| Identity Hub | Full digital identity map |

---

*This document provides the UX enhancements for VaultKey to compete with 1Password and Bitwarden.*
