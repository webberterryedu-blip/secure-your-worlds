

# Harmonizar Formulários e Unificar Sistema de Dados

## Problema Atual
O projeto tem **dois sistemas de dados completamente separados** que causam confusão e erros de build:

1. **Supabase** (`useCredentials` hook) — usado pelo Dashboard e `CredentialForm.tsx`
2. **Zustand local** (`credentialStore.ts`) — usado pelas páginas de categoria, `CredentialList.tsx`, `CredentialFormDynamic.tsx`

Cada sistema tem tipos diferentes (snake_case vs camelCase), campos diferentes, e formulários diferentes. O `CredentialCard` importa tipos do store local mas recebe dados do Supabase, causando os erros de TypeScript.

## Solução: Unificar Tudo no Supabase

### Passo 1 — Definir o tipo Credential único
Usar o tipo gerado pelo Supabase (`Tables<"credentials">`) como fonte única de verdade. Eliminar o tipo `Credential` do `credentialStore.ts`.

### Passo 2 — Reescrever `CredentialForm.tsx` (formulário unificado)
Um único formulário harmonizado com seções organizadas logicamente:

```text
┌─────────────────────────────────────┐
│  IDENTIFICAÇÃO                       │
│  ├─ Nick/Nome *          Categoria  │
│  ├─ E-mail               URL        │
│  └─ Serviço              Ambiente   │
├─────────────────────────────────────┤
│  SEGURANÇA                           │
│  ├─ Senha * [👁] [📋] [🎲 Gerar]   │
│  └─ Barra de força                  │
├─────────────────────────────────────┤
│  DISPOSITIVOS                        │
│  └─ ☑ Desktop  ☑ Laptop  ☐ Tablet  │
├─────────────────────────────────────┤
│  DETALHES (colapsável)               │
│  ├─ Descrição                       │
│  ├─ Notas                           │
│  ├─ Projetos [+ tag]               │
│  └─ Data de expiração              │
├─────────────────────────────────────┤
│          [Cancelar]  [Salvar]       │
└─────────────────────────────────────┘
```

Campos organizados em seções com separadores visuais e labels consistentes.

### Passo 3 — Atualizar `CredentialCard.tsx`
Mudar o import do tipo para usar `Tables<"credentials">` do Supabase. Usar campos snake_case (`is_favorite`, `created_at`, `expires_at`).

### Passo 4 — Atualizar `Dashboard.tsx`
Corrigir os tipos para usar o `Credential` do Supabase. Corrigir a chamada de `toggleFavorite` para usar `is_favorite`.

### Passo 5 — Atualizar páginas de categoria
Fazer `CategoryPage.tsx` e `CredentialList.tsx` usarem o hook `useCredentials` (Supabase) em vez do `credentialStore` (Zustand). Remover `CredentialFormDynamic.tsx` — usar o formulário unificado.

### Passo 6 — Limpar código morto
Remover campos e lógica do `credentialStore.ts` que duplicam o Supabase (manter apenas para identities se necessário).

## Detalhes Técnicos

**Arquivos modificados:**
- `src/components/CredentialForm.tsx` — reescrita com seções organizadas
- `src/components/CredentialCard.tsx` — tipos corrigidos para Supabase
- `src/pages/Dashboard.tsx` — tipos e chamadas corrigidas
- `src/pages/CategoryPage.tsx` — migrar para `useCredentials`
- `src/components/CredentialList.tsx` — migrar para `useCredentials`

**Arquivos removidos:**
- `src/components/CredentialFormDynamic.tsx` — substituído pelo form unificado

**Tipo único usado em todo o projeto:**
```typescript
import type { Tables } from "@/integrations/supabase/types";
type Credential = Tables<"credentials">;
```

