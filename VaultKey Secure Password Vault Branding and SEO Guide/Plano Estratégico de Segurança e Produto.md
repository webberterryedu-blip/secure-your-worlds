# VaultKey - Plano Estratégico de Segurança e Produto

## Visão Geral

Este documento consolida as recomendações técnicas e estratégicas para o desenvolvimento do VaultKey como um gerenciador de senhas de nível enterprise, focado no mercado de desenvolvedores e profissionais técnicos.

---

## 1. Arquitetura de Segurança Atual vs. Recomendada

### Estado Atual (v1.0)
- **Criptografia**: AES-256-GCM ✓
- **Derivação de Chave**: PBKDF2 (100.000 iterações)
- **Arquitetura**: Zero-knowledge client-side ✓

### Estado Recomendado (v2.0)
- **Criptografia**: AES-256-GCM (manter)
- **Derivação de Chave**: Argon2id (64MB memory, 3 iterações, 4 threads)
- **Separação de Chaves**: HKDF para derivar chaves distintas
- **Isolamento**: Web Worker para operações criptográficas

---

## 2. Upgrade de Criptografia: PBKDF2 → Argon2id

### Por que Argon2?

Argon2 foi vencedor do PHC (Password Hashing Competition) e é superior ao PBKDF2 porque:
- Resistente a ataques de GPU/ASIC
- Oferece resistência a ataques de timing
- memory-hard: dificulta ataques paralelos

### Implementação Sugerida

```typescript
// src/lib/crypto-argon2.ts

import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
  hashLength: 32, // 256 bits
  saltLength: 16,
  raw: true,
};

/**
 * Deriva uma chave usando Argon2id
 */
export async function deriveKeyArgon2(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const hash = await argon2.hash(masterPassword, {
    ...ARGON2_OPTIONS,
    salt,
  });
  
  return crypto.subtle.importKey(
    'raw',
    new Uint8Array(hash),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

---

## 3. Separação de Chaves com HKDF

### Por que Separar?

Usar a mesma chave para múltiplas operações criptográficas é um anti-pattern. Devemos derivar chaves distintas para:
- Criptografia de senhas
- Criptografia de notas
- Autenticação de dados

### Implementação

```typescript
// src/lib/hkdf.ts

/**
 * Deriva sub-chaves usando HKDF
 * Cada campo sensível deve ter sua própria chave
 */
export async function deriveSubKey(
  masterKey: CryptoKey,
  purpose: 'password' | 'email' | 'url' | 'notes' | 'auth',
  salt: Uint8Array
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      salt: salt,
      info: new TextEncoder().encode(`vaultkey-${purpose}`),
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

---

## 4. Isolamento com Web Worker

### Por que Web Worker?

Isolar operações criptográficas em um Web Worker oferece proteção adicional contra:
- Ataques XSS que tentam ler a master password da memória principal
- Timing attacks no JavaScript principal
- Extensions maliciosas que monitoram o DOM

### Estrutura Recomendada

```
src/
  workers/
    crypto.worker.ts    # Operações de criptografia isoladas
  lib/
    crypto.ts           # API que se comunica com o worker
```

### Implementação

```typescript
// src/workers/crypto.worker.ts

// Este worker isola todas as operações criptográficas
// A master password NUNCA sai deste worker

self.onmessage = async (e) => {
  const { id, action, payload } = e.data;
  
  try {
    let result;
    switch (action) {
      case 'deriveKey':
        result = await deriveKey(payload.masterPassword, payload.salt);
        break;
      case 'encrypt':
        result = await encrypt(payload.data, payload.key);
        break;
      case 'decrypt':
        result = await decrypt(payload.encryptedData, payload.iv, payload.key);
        break;
    }
    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};
```

---

## 5. Secrets Vault: Feature Diferenciadora

### Conceito

Além de senhas tradicionais, implementar um cofre específico para desenvolvedores:

### Estrutura de Dados Sugerida

```typescript
// src/types/secrets.ts

export type SecretType = 
  | 'api_key'
  | 'ssh_key'
  | 'jwt_token'
  | 'db_credentials'
  | 'env_variable'
  | 'certificate'
  | 'note_secure';

export interface Secret {
  id: string;
  user_id: string;
  name: string;
  type: SecretType;
  encrypted_value: string;  // Valor criptografado
  metadata: {
    service?: string;        // Ex: AWS, GitHub, Stripe
    environment?: string;    // Ex: dev, staging, prod
    expires_at?: string;
    rotation_period_days?: number;
  };
  salt: string;
  iv: string;
  created_at: string;
  updated_at: string;
}
```

### Abas Recomendadas

1. **Senhas** - Credenciais tradicionais
2. **Chaves API** - Tokens para serviços externos
3. **Chaves SSH** - Pares de chaves SSH
4. **Notas Seguras** - Documentos sensíveis
5. **Cartões** - Informações de pagamento

---

## 6. Estratégia SEO: Long-Tail

### Palavras-Chave Atuais (Genéricas)
❌ "password manager"
❌ "secure vault"
❌ "credential manager"

### Palavras-Chave Recomendadas (Long-Tail)
✅ "gerenciador de senhas para desenvolvedores"
✅ "vault de credenciais criptografadas"
✅ "gerenciador seguro de chaves API"
✅ "vault de secrets DevOps"
✅ "gerenciador de senhas self-hosted"

### Conteúdo Sugerido para Blog

1. "Como desenvolvedores armazenam chaves API com segurança"
2. "Gerenciadores de senhas para engenheiros de software"
3. "Gestão segura de credenciais para startups"
4. "Por que usar um vault de senhas local"
5. "Migração de LastPass/Bitwarden para solução self-hosted"

---

## 7. Features Competitivas

### Features Atuais ✓
- [x] Gerador de senhas
- [x] Indicador de força de senha
- [x] Vault criptografado
- [x] Interface moderna (React + Shadcn)

### Features Críticas missing
- [ ] Auto-fill em navegadores
- [ ] Extensão de browser
- [ ] Verificação de senhas vazadas (HaveIBeenPwned)
- [ ] Dashboard de saúde de senhas
- [ ] Importação de outros gerenciadores

### Features Diferenciadoras (Roadmap)
- [ ] Secrets Vault para desenvolvedores
- [ ] Integração com CLI
- [ ] Backup criptografado local
- [ ] Sync peer-to-peer

---

## 8. Matriz de Avaliação

| Domínio | Nota | Justificativa |
|---------|------|----------------|
| Branding | 9/10 | Consistência visual, posicionamento adequado |
| Criptografia | 7.5/10 | AES-256 correto, precisa de Argon2 |
| Arquitetura | 8/10 | Estrutura sólida, precisa de modularização |
| Produto | 7/10 | MVP funcional, defasado em features |
| SEO | 7/10 | Direção correta, precisa de long-tail |

**Nota Geral: 8/10** - Projeto sólido para início

---

## 9. Roadmap de Implementação

### Prioridade 1: Segurança Core
1. Upgrade para Argon2id
2. Implementação de HKDF
3. Isolamento em Web Worker

### Prioridade 2: Extensão
1. Desenvolvimento de extensão de browser
2. Auto-fill e captura automática
3. Verificação de breaches (HaveIBeenPwned)

### Prioridade 3: Diferenciação
1. Secrets Vault para devs
2. Integração CLI
3. Backup P2P criptografado

### Prioridade 4: Auditoria
1. Revisão completa de segurança
2. Testes de penetração
3. Bug bounty program

---

## 10. Contato de Emergência

Em caso de comprometimento de segurança:

1. **Suspensão imediata** de todas as operações
2. **Revogação de chaves** no Supabase Dashboard
3. **Geração de novas chaves** para todos os serviços
4. **Notificação** aos usuários afetados
5. **Documentação** do incidente

**Supabase**: https://supabase.com/dashboard/project/ekvhdyvfvehgoxcwnovv/settings/api

---

*Documento gerado em: 2026-03-11*
*Versão: 1.0.0*
