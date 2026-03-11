

# 🔐 Hub de Senhas — Password Vault

## Visão Geral
Um gerenciador pessoal de senhas e contas na nuvem, com login seguro, organizado por categorias e dispositivos.

## Autenticação
- Login/cadastro com e-mail e senha via Supabase Auth
- Tabela de perfil do usuário criada automaticamente no cadastro

## Banco de Dados (Supabase)
- **Tabela `credentials`**: nick, e-mail da conta, senha (armazenada), descrição, categoria (E-mails / Redes Sociais / Projetos-Dev / Financeiro), dispositivo/máquina (Desktop, Laptop, Tablet, iPhone), data de criação, data de expiração (opcional), favorito (sim/não), notas extras, URL do serviço
- RLS para que cada usuário só veja suas próprias credenciais

## Páginas e Funcionalidades

### 1. Login / Cadastro
- Formulários simples com validação

### 2. Dashboard Principal
- Lista de todas as credenciais em cards ou tabela
- Filtros por: categoria, dispositivo/máquina, favoritos
- Barra de busca por nome/nick/descrição
- Badge de alerta para senhas próximas de expirar (destaque vermelho/amarelo)
- Contadores rápidos: total de contas, por categoria, expiradas

### 3. Adicionar / Editar Credencial
- Formulário com todos os campos: nick, e-mail, senha, descrição, categoria (select), dispositivos (multi-select: Desktop, Laptop, Tablet, iPhone), data de expiração, URL, notas
- **Gerador de senhas** integrado com opções (tamanho, símbolos, números)
- **Indicador de força** da senha (barra colorida)

### 4. Visualização de Credencial
- Senhas ocultas (••••••) com botão de olho para revelar
- Botões de copiar com 1 clique (e-mail, usuário, senha)
- Info completa com dispositivos, datas, notas

### 5. Configurações
- Gerenciar dispositivos/máquinas (adicionar novos como "PC do Trabalho")
- Exportar dados em JSON

## Design
- Tema escuro por padrão (combina com app de segurança)
- Interface limpa e moderna usando shadcn/ui
- Responsivo para funcionar bem no tablet/celular também
- Ícones por categoria para identificação visual rápida

