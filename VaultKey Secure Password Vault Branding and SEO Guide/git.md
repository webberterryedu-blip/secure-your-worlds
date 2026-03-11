Execute um fluxo completo de Git para preparar o deploy do projeto VaultKey, garantindo que todas as alterações locais sejam versionadas corretamente e enviada para o branch main.

Siga exatamente esta sequência:

1. Verificar o status atual do repositório
```
git status
```

2. Verificar as diferenças exatas das alterações realizadas
```
git diff
```

3. Adicionar todos os arquivos modificados ou novos ao staging
```
git add .
```

4. Criar um commit seguindo o padrão Conventional Commits, incluindo as alterações identificadas: increase ITERATIONS from 100000 to 600000 in crypto.ts for enhanced security, update branding from Secure Your Worlds to VaultKey in i18n.ts, ensure no sensitive files are included
```
git commit -m "feat: enhance cryptographic iterations and update branding to VaultKey"
```

5. Verificar o histórico recente de commits para confirmar
```
git log --oneline -5
```

6. Confirmar que o branch atual é main
```
git branch
```

7. Enviar o commit para o repositório remoto
```
git push origin main
```

8. Verificar se o push foi bem-sucedido
```
git status
```

Regras importantes:

O commit message deve seguir o padrão Conventional Commits com tipo (feat, fix, refactor, chore, docs) e descrição clara
Antes do commit, executar verificação de arquivos sensíveis: confirmar que .env, tokens, secrets, chaves privadas não estão sendo versionados
Garantir que está no branch main antes do push
Executar npm run build ou equivalente para confirmar que o código compila corretamente antes do deploy
Verificar se não há dependências pendentes de instalação

Resultado esperado:
Todas as alterações locais (ajuste de segurança em crypto.ts com 600000 iterações, atualização de branding para VaultKey) devem estar commitadas e enviadas para o repositório remoto no branch main, prontas para o processo de deploy.