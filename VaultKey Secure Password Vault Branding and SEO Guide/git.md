Execute um fluxo completo de Git para preparar o deploy do projeto.

Objetivo: garantir que todas as alterações locais sejam versionadas corretamente e enviadas para o branch `main`.

Siga exatamente esta sequência:

1. Verificar o status do repositório

```
git status
```

2. Adicionar todos os arquivos modificados ou novos

```
git add .
```

3. Criar um commit claro descrevendo as alterações realizadas

```
git commit -m "feat: descrição clara das mudanças realizadas"
```

4. Verificar o histórico recente de commits

```
git log --oneline -5
```

5. Enviar o commit para o branch principal

```
git push origin main
```

Regras importantes:

* O commit message deve seguir padrão profissional (feat, fix, refactor, chore, docs).
* Confirmar que não há arquivos sensíveis sendo enviados (tokens, .env, secrets).
* Garantir que o branch atual é `main` antes do push.

Resultado esperado:
As alterações locais devem estar commitadas e enviadas para o repositório remoto, prontas para o processo de deploy.
