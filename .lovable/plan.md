# Tornar 2FA Funcional em /settings/security

## Problema Atual

A página existe e renderiza, mas o fluxo está quebrado:

1. **Persistência apenas local**: o segredo TOTP é guardado só no `localStorage` (Zustand `vaultStore`). Se o usuário trocar de dispositivo/navegador, perde o 2FA.
2. **Dependência de Master Password inexistente**: `TwoFactorSetup` chama `encryptAndSet2FASecret(secret, masterPassword)`, mas em `/settings/security` o `masterPassword` nunca é definido (só existe no fluxo do cofre `/secrets`). Logo, ao clicar em "Setup 2FA" e tentar verificar, dá erro "Master password not set".
3. **Login não exige 2FA**: mesmo se ativado, o `signIn` em `Auth.tsx` redireciona direto para `/dashboard` sem checar a flag `totp_enabled`.
4. **Botão "Disable 2FA" sem confirmação** e sem exigir código TOTP atual (risco de bypass se sessão for sequestrada).

## Solução

Aproveitar a tabela `user_secrets_config` que já existe no Supabase (campos `totp_secret` e `totp_enabled`) como fonte da verdade. O segredo TOTP é guardado em texto base32 — protegido por RLS (apenas o próprio usuário lê). Isso é o padrão da indústria (mesmo modelo de Supabase MFA, GitHub etc.) e elimina a fricção da master password só para 2FA.

### 1. Hook novo `src/hooks/useTwoFactor.ts`

Centraliza todo o ciclo de vida do 2FA contra Supabase:

- `status`: `{ enabled: boolean, loading: boolean }` — lê `totp_enabled` de `user_secrets_config` para o `auth.uid()` atual.
- `enable(secret, verificationCode)`: valida o código com `verify2FAToken`, e dá `upsert` em `user_secrets_config` com `totp_secret = secret`, `totp_enabled = true`. Para satisfazer o `NOT NULL` de `secrets_password_hash/salt`, gera valores placeholder aleatórios (pois o cofre de Secrets é independente — quando o usuário configurar o cofre, esses campos são sobrescritos). Alternativa mais limpa: criar migração para tornar essas colunas NULLable (preferida — ver seção SQL).
- `disable(verificationCode)`: exige código TOTP válido antes de fazer `update` setando `totp_enabled = false` e `totp_secret = null`.
- `verify(code)`: helper para login — busca `totp_secret`, valida o código.

### 2. Migração SQL

Tornar campos do cofre de Secrets opcionais (já que `user_secrets_config` agora serve a dois propósitos: 2FA da conta + cofre de secrets):

```sql
ALTER TABLE public.user_secrets_config
  ALTER COLUMN secrets_password_hash DROP NOT NULL,
  ALTER COLUMN secrets_password_salt DROP NOT NULL;
```

### 3. Refatorar `src/components/TwoFactorSetup.tsx`

- Remover toda a dependência de `useVaultStore` / `masterPassword` / `encryptAndSet2FASecret`.
- Usar `useAuth()` para pegar o e-mail real do usuário no QR Code (hoje está hardcoded como `user@example.com`).
- Passo 2 (verificar): chamar `useTwoFactor().enable(secret, code)`.
- Mostrar **códigos de backup** (gerar 8 códigos one-time aleatórios) — opcional na v1; podemos só avisar para guardar o segredo manualmente.

### 4. Refatorar `src/pages/SecuritySettings.tsx`

- Substituir `useVaultStore` por `useTwoFactor`.
- Estado do switch vem de `status.enabled` (Supabase), não do localStorage.
- Ao desativar: abrir um dialog pedindo código TOTP atual. Só desativa se válido.
- Skeleton/loader enquanto `loading`.

### 5. Exigir 2FA no Login (`src/pages/Auth.tsx` + `TwoFactorVerifyPage`)

Fluxo após `signIn` bem-sucedido:

```text
signIn() OK
  └─ consulta user_secrets_config.totp_enabled
       ├─ false → navigate('/dashboard')
       └─ true  → navigate('/auth/2fa-verify')
```

Refatorar `TwoFactorVerifyPage`:
- Não usar `vaultStore`. Buscar `totp_secret` direto do Supabase (RLS já protege).
- Ao verificar OK: marcar uma flag em `sessionStorage` (`vk_2fa_passed = true`) e ir para `/dashboard`.
- Criar guarda em `PrivateRoute` (ou wrapper novo `Require2FA`) que, se `totp_enabled && !vk_2fa_passed`, redireciona para `/auth/2fa-verify`. Isso evita bypass por digitação direta da URL `/dashboard`.
- Limpar `vk_2fa_passed` no `signOut`.

### 6. Limpeza

- `vaultStore.ts`: remover campos e ações ligados a 2FA (`is2FAEnabled`, `encrypted2FASecret*`, `encryptAndSet2FASecret`, `decrypt2FASecret`, `set2FAVerified`). Manter só o que serve ao cofre de Secrets (master password em memória).
- `TwoFactorVerify.tsx` (componente dialog): adaptar para usar `useTwoFactor().verify` em vez do vault store, ou remover se não for mais usado fora da página.

## Arquivos Afetados

**Criados:**
- `src/hooks/useTwoFactor.ts`
- `supabase/migrations/<timestamp>_relax_user_secrets_config.sql`

**Editados:**
- `src/components/TwoFactorSetup.tsx` — remove dependência de masterPassword, usa Supabase
- `src/pages/SecuritySettings.tsx` — switch reativo ao Supabase + confirmação para desativar
- `src/pages/Auth.tsx` — checa `totp_enabled` após login
- `src/pages/TwoFactorVerifyPage.tsx` — verifica direto contra Supabase
- `src/components/TwoFactorVerify.tsx` — usa `useTwoFactor`
- `src/components/PrivateRoute.tsx` — guarda 2FA
- `src/contexts/AuthContext.tsx` — limpa `sessionStorage` no `signOut`
- `src/stores/vaultStore.ts` — remove campos de 2FA

## Resultado Esperado

- Usuário entra em **/settings/security**, clica **Setup 2FA**, escaneia QR no Google Authenticator/Authy, digita o código de 6 dígitos, vê toast "2FA enabled".
- Recarrega a página → switch continua ligado (porque vem do Supabase).
- Faz logout, faz login com e-mail/senha → é redirecionado para **/auth/2fa-verify**, digita o código, entra no dashboard.
- Tenta acessar `/dashboard` direto sem passar pelo 2FA → é mandado de volta a `/auth/2fa-verify`.
- Para desativar: precisa digitar um código TOTP válido.
