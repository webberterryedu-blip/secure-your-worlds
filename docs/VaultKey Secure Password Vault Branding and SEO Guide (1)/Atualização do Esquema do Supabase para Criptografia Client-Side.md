
# Atualização do Esquema do Supabase para Criptografia Client-Side

Para implementar a criptografia client-side no VaultKey, é **essencial** que você atualize o esquema do seu banco de dados no Supabase. As credenciais não devem mais armazenar a senha em texto claro, mas sim os dados criptografados, o salt e o IV (Initialization Vector).

--- 

## ⚠️ Passos Críticos

Siga estes passos cuidadosamente para evitar perda de dados e garantir a segurança:

### 1. **Crie uma Nova Migração no Supabase**

Você precisará criar um novo arquivo de migração para alterar a tabela `credentials`. Se você estiver usando o CLI do Supabase, o comando seria:

```bash
supabase migration add add_encryption_fields_to_credentials
```

Isso criará um novo arquivo SQL em `supabase/migrations/`.

### 2. **Edite o Arquivo de Migração**

Abra o novo arquivo SQL gerado (ex: `supabase/migrations/YYYYMMDDHHMMSS_add_encryption_fields_to_credentials.sql`) e adicione o seguinte conteúdo:

```sql
-- Adiciona as novas colunas para armazenamento dos dados criptografados
ALTER TABLE public.credentials
ADD COLUMN encrypted_password TEXT,
ADD COLUMN salt TEXT,
ADD COLUMN iv TEXT;

-- Remove a coluna 'password' que armazenava a senha em texto claro
-- ATENÇÃO: ISSO APAGARÁ TODAS AS SENHAS EXISTENTES SE NÃO FOREM MIGRADAS ANTES!
-- Se você tiver dados existentes, DEVE primeiro migrá-los para o novo formato criptografado.
-- Para um projeto novo, pode remover diretamente.
ALTER TABLE public.credentials
DROP COLUMN password;

-- Opcional: Se você também criptografar email, url e notes
ALTER TABLE public.credentials
ALTER COLUMN email DROP NOT NULL, -- Permite NULL se for criptografado
ALTER COLUMN url DROP NOT NULL,   -- Permite NULL se for criptografado
ALTER COLUMN notes DROP NOT NULL; -- Permite NULL se for criptografado

-- Renomear colunas existentes para refletir que agora conterão dados criptografados
-- ALTER TABLE public.credentials RENAME COLUMN email TO encrypted_email;
-- ALTER TABLE public.credentials RENAME COLUMN url TO encrypted_url;
-- ALTER TABLE public.credentials RENAME COLUMN notes TO encrypted_notes;

-- Atualiza as políticas de RLS para as novas colunas, se necessário
-- As políticas existentes que usam 'user_id' devem continuar funcionando, pois 'user_id' não muda.
-- Certifique-se de que as políticas de RLS ainda se aplicam corretamente.
```

**Explicação das Mudanças:**
*   `encrypted_password TEXT`: Armazenará a senha criptografada (em formato Base64Url).
*   `salt TEXT`: Armazenará o salt usado para derivar a chave de criptografia (em formato Base64Url).
*   `iv TEXT`: Armazenará o Initialization Vector (IV) usado na criptografia AES-GCM (em formato Base64Url).
*   `DROP COLUMN password`: **Esta é a parte mais crítica.** Se você já tem dados no seu banco de dados, **NÃO** execute esta linha sem antes ter um plano de migração para criptografar as senhas existentes e salvá-las nas novas colunas. Para um projeto novo, sem dados, você pode remover a coluna `password` com segurança.

### 3. **Execute a Migração**

Após editar o arquivo de migração, aplique-o ao seu banco de dados Supabase:

```bash
supabase db push
```

Verifique no painel do Supabase se as colunas `encrypted_password`, `salt` e `iv` foram adicionadas à tabela `public.credentials` e se a coluna `password` foi removida (se você optou por isso).

--- 

## 💡 Próximos Passos

Com o esquema do banco de dados atualizado, você pode prosseguir com a integração do código JavaScript/TypeScript que eu forneci para o frontend. Lembre-se de que o `useCredentials.ts` já espera essas novas colunas.
