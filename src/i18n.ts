import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      "nav.sign_in": "Sign In",
      "nav.get_started": "Get Started",
      
      // Hero
      "hero.subtitle": "Enterprise-grade security",
      "hero.title": "Your digital vault for",
      "hero.title_highlight": "secure passwords",
      "hero.subtitle_alt": "Your secure and intelligent password vault",
      "hero.description": "Manage your passwords, API keys, and credentials with military-grade security. Everything encrypted on your device - not even we can access your data.",
      "hero.cta": "Get Started for Free",
      "hero.secondary_cta": "View on GitHub",
      "hero.no_credit_card": "✨ No credit card • ✨ Install in 1 minute",
      
      // Features
      "features.title": "Advanced Security Features",
      "features.subtitle": "Everything you need to keep your credentials safe and organized",
      
      // Feature items
      "features.end_to_end.title": "End-to-end encryption",
      "features.end_to_end.description": "Your passwords are encrypted on your device before being stored. Only you can access them.",
      
      "features.secure_view.title": "Secure viewing",
      "features.secure_view.description": "View your passwords when you need to, with options to automatically hide after use.",
      
      "features.password_generator.title": "Strong password generator",
      "features.password_generator.description": "Create unique and complex passwords with one click. Customize length and character types.",
      
      "features.cross_platform.title": "Cross-platform access",
      "features.cross_platform.description": "Access your credentials from any device, at any time.",
      
      "features.secure_sync.title": "Secure synchronization",
      "features.secure_sync.description": "Your data is synced between devices with end-to-end encryption.",
      
      "features.expiration.title": "Expiration control",
      "features.expiration.description": "Receive alerts when your passwords are about to expire.",
      
      // Benefits
      "benefits.title": "Why choose VaultKey?",      "benefits.subtitle": "An open-source alternative to commercial password managers, with a focus on privacy and security.",
      "benefits.cta": "Create Free Account",
      
      // Benefit items
      "benefits.item.1": "Zero-knowledge architecture",
      "benefits.item.2": "Open source and auditable",
      "benefits.item.3": "No password limits",
      "benefits.item.4": "Smart categorization",
      "benefits.item.5": "Advanced filters",
      "benefits.item.6": "Encrypted export",
      
      // Mockup
      "mockup.github": "GitHub Pro",
      "mockup.aws": "AWS Production",
      "mockup.gmail": "Gmail Personal",
      "mockup.email": "email@example.com",
      "mockup.admin": "admin@company.com",
      "mockup.me": "me@example.com",
      "mockup.category.dev": "Projects/Dev",
      "mockup.category.finance": "Finance",
      "mockup.category.email": "E-mails",
      
      // CTA
      "cta.title": "Ready to protect your passwords?",
      "cta.subtitle": "Start for free today. No limits, no commitments.",
      "cta.button": "Create Free Account",
      
      // Footer
      "footer.copyright": "© 2024 VaultKey. Open source.",
      
      // Auth
      "auth.login": "Sign In",
      "auth.signup": "Create account",
      "auth.login_title": "Access your password vault",
      "auth.signup_title": "Create your account to get started",
      "auth.email_label": "Email",
      "auth.email_placeholder": "your@email.com",
      "auth.password_label": "Password",
      "auth.password_placeholder": "••••••••",
      "auth.name_label": "Name",
      "auth.name_placeholder": "Your name",
      "auth.submit_login": "Sign In",
      "auth.submit_signup": "Create account",
      "auth.no_account": "Don't have an account?",
      "auth.has_account": "Already have an account?",
      "auth.switch_login": "Sign In",
      "auth.switch_signup": "Create account",
      "auth.vault_subtitle": "Your secure and intelligent password vault",
      
      // Theme
      "theme.toggle": "Toggle Theme",
      "language.toggle": "Change Language",
      
      // Password
      "auth.confirm_password": "Confirm Password",
      "auth.confirm_password_placeholder": "••••••••",
      "auth.password_mismatch": "Passwords do not match",
      "auth.password_strength.weak": "Weak",
      "auth.password_strength.medium": "Medium",
      "auth.password_strength.strong": "Strong",
      "auth.password_hint.min_length": "At least 8 characters",
      "auth.password_hint.uppercase": "One uppercase letter",
      "auth.password_hint.lowercase": "One lowercase letter",
      "auth.password_hint.number": "One number",
      "auth.password_hint.special": "One special character",
      "auth.password_complexity": "Password must include uppercase, lowercase, number and special character",
      "auth.show_password": "Show password",
      "auth.hide_password": "Hide password",
      "auth.back": "Back",

      // Dashboard
      "dashboard.title": "Dashboard",
      "dashboard.welcome": "Welcome back",
      "dashboard.total_credentials": "Total Credentials",
      "dashboard.expiring_soon": "Expiring Soon",
      "dashboard.expired": "Expired",
      "dashboard.favorites": "Favorites",
      "dashboard.all_credentials": "All Credentials",
      "dashboard.recent_activity": "Recent Activity",
      "dashboard.search_placeholder": "Search credentials...",
      "dashboard.filter_all": "All",
      "dashboard.filter_favorites": "Favorites",
      "dashboard.no_credentials": "No credentials yet",
      "dashboard.no_results": "No results",
      "dashboard.add_first": "Add your first credential to get started",
      "dashboard.adjust_filters": "Try adjusting the filters",
      "dashboard.credentials": "credentials",
      "dashboard.credential": "credential",
      "dashboard.found": "found",
      "dashboard.no_credential_found": "No credential found",
      "dashboard.add_new_credential": "Add New Credential",

      // Identities
      "identities.title": "Identities",
      "identities.subtitle": "Group related credentials together (e.g., Personal = Gmail + GitHub + OpenAI)",
      "identities.create_identity": "Create Identity",
      "identities.no_identities": "No identities created",
      "identities.create_to_group": "Create identities to group your related credentials",
      "identities.credentials_count": "credentials",
      "identities.new_identity": "New Identity",
      "identities.edit_identity": "Edit Identity",
      "identities.name_label": "Name",
      "identities.name_placeholder": "Personal, Work, etc.",
      "identities.description_label": "Description",
      "identities.description_placeholder": "Optional description...",
      "identities.cancel": "Cancel",
      "identities.save": "Save",
      "identities.delete_identity": "Delete Identity",
      "identities.delete_warning": "Are you sure you want to delete this identity? This action cannot be undone.",

      // Categories
      "category.emails": "E-mails",
      "category.development": "Development",
      "category.cloud": "Cloud",
      "category.ai": "Artificial Intelligence",
      "category.social": "Social Networks",
      "category.financial": "Financial",
      "category.other": "Other",
      "category.manage": "Manage your {{category}} credentials",

      // Credentials Form
      "credential.new": "New",
      "credential.edit": "Edit",
      "credential.name": "Name",
      "credential.name_placeholder": "My credential",
      "credential.email": "Email",
      "credential.email_placeholder": "user@email.com",
      "credential.url": "URL",
      "credential.url_placeholder": "https://...",
      "credential.description": "Description",
      "credential.notes": "Notes",
      "credential.notes_placeholder": "Additional information...",
      "credential.favorite": "Favorite",
      "credential.cancel": "Cancel",
      "credential.save": "Save",

      // Credential List
      "credential.search": "Search credentials...",
      "credential.add_new": "New",
      "credential.provider": "Provider",
      "credential.all_providers": "All",
      "credential.filter_provider": "Filter by provider",

      // Navigation
      "nav.all": "All",
      "nav.identities": "Identities",
      "nav.categories": "Categories"
    }
  },
  pt: {
    translation: {
      // Navigation
      "nav.sign_in": "Entrar",
      "nav.get_started": "Começar Agora",
      
      // Hero
      "hero.subtitle": "Segurança de nível empresarial",
      "hero.title": "Seu cofre digital de",
      "hero.title_highlight": "senhas seguras",
      "hero.subtitle_alt": "Seu cofre de senhas seguro e inteligente",
      "hero.description": "Gerencie suas senhas, chaves API e credenciais com segurança de nível militar. Tudo criptografado no seu dispositivo - nem nós temos acesso aos seus dados.",
      "hero.cta": "Começar Gratuitamente",
      "hero.secondary_cta": "Ver no GitHub",
      "hero.no_credit_card": "✨ Sem cartão de crédito • ✨ Instalação em 1 minuto",
      
      // Features
      "features.title": "Recursos de segurança avançados",
      "features.subtitle": "Tudo que você precisa para manter suas credenciais seguras e organizadas",
      
      // Feature items
      "features.end_to_end.title": "Criptografia de ponta a ponta",
      "features.end_to_end.description": "Suas senhas são criptografadas no seu dispositivo antes de serem armazenadas. Apenas você pode acessá-las.",
      
      "features.secure_view.title": "Visualização segura",
      "features.secure_view.description": "Veja suas senhas quando precisar, com opções para ocultar automaticamente após uso.",
      
      "features.password_generator.title": "Gerador de senhas fortes",
      "features.password_generator.description": "Crie senhas únicas e complexas com um clique. Customize comprimento e tipos de caracteres.",
      
      "features.cross_platform.title": "Acesso multiplataforma",
      "features.cross_platform.description": "Acesse suas credenciais de qualquer dispositivo, a qualquer momento.",
      
      "features.secure_sync.title": "Sincronização segura",
      "features.secure_sync.description": "Seus dados são sincronizados entre dispositivos com criptografia end-to-end.",
      
      "features.expiration.title": "Controle de expiração",
      "features.expiration.description": "Receba alertas quando suas senhas estiverem prestes a expirar.",
      
      // Benefits
      "benefits.title": "Por que escolher o VaultKey?",      "benefits.subtitle": "Uma alternativa open-source aos gerenciadores de senhas comerciais, com foco em privacidade e segurança.",
      "benefits.cta": "Criar Conta Grátis",
      
      // Benefit items
      "benefits.item.1": "Zero-knowledge architecture",
      "benefits.item.2": "Código aberto e auditável",
      "benefits.item.3": "Sem limites de senhas",
      "benefits.item.4": "Categorização inteligente",
      "benefits.item.5": "Filtros avançados",
      "benefits.item.6": "Exportação criptografada",
      
      // Mockup
      "mockup.github": "GitHub Pro",
      "mockup.aws": "AWS Production",
      "mockup.gmail": "Gmail Pessoal",
      "mockup.email": "weber@email.com",
      "mockup.admin": "admin@company.com",
      "mockup.me": "meu@email.com",
      "mockup.category.dev": "Projetos/Dev",
      "mockup.category.finance": "Financeiro",
      "mockup.category.email": "E-mails",
      
      // CTA
      "cta.title": "Pronto para proteger suas senhas?",
      "cta.subtitle": "Comece gratuitamente hoje. Sem limites, sem compromissos.",
      "cta.button": "Criar Conta Grátis",
      
      // Footer
      "footer.copyright": "© 2024 VaultKey. Open source.",
      
      // Auth
      "auth.login": "Entrar",
      "auth.signup": "Criar conta",
      "auth.login_title": "Acesse seu cofre de senhas",
      "auth.signup_title": "Crie sua conta para começar",
      "auth.email_label": "E-mail",
      "auth.email_placeholder": "seu@email.com",
      "auth.password_label": "Senha",
      "auth.password_placeholder": "••••••••",
      "auth.name_label": "Nome",
      "auth.name_placeholder": "Seu nome",
      "auth.submit_login": "Entrar",
      "auth.submit_signup": "Criar conta",
      "auth.no_account": "Não tem conta?",
      "auth.has_account": "Já tem conta?",
      "auth.switch_login": "Fazer login",
      "auth.switch_signup": "Criar conta",
      "auth.vault_subtitle": "Seu cofre de senhas seguro e inteligente",
      
      // Theme
      "theme.toggle": "Alternar Tema",
      "language.toggle": "Mudar Idioma",
      
      // Password
      "auth.confirm_password": "Confirmar Senha",
      "auth.confirm_password_placeholder": "••••••••",
      "auth.password_mismatch": "As senhas não coincidem",
      "auth.password_strength.weak": "Fraca",
      "auth.password_strength.medium": "Média",
      "auth.password_strength.strong": "Forte",
      "auth.password_hint.min_length": "Mínimo 8 caracteres",
      "auth.password_hint.uppercase": "Uma letra maiúscula",
      "auth.password_hint.lowercase": "Uma letra minúscula",
      "auth.password_hint.number": "Um número",
      "auth.password_hint.special": "Um caractere especial",
      "auth.password_complexity": "A senha deve ter letras maiúsculas, minúsculas, números e caracteres especiais",
      "auth.show_password": "Mostrar senha",
      "auth.hide_password": "Ocultar senha",
      "auth.back": "Voltar",

      // Dashboard
      "dashboard.title": "Painel",
      "dashboard.welcome": "Bem-vindo de volta",
      "dashboard.total_credentials": "Total de Credenciais",
      "dashboard.expiring_soon": "Expirando em Breve",
      "dashboard.expired": "Expiradas",
      "dashboard.favorites": "Favoritas",
      "dashboard.all_credentials": "Todas as Credenciais",
      "dashboard.recent_activity": "Atividade Recente",
      "dashboard.search_placeholder": "Buscar credenciais...",
      "dashboard.filter_all": "Todas",
      "dashboard.filter_favorites": "Favoritas",
      "dashboard.no_credentials": "Nenhuma credencial ainda",
      "dashboard.no_results": "Nenhum resultado",
      "dashboard.add_first": "Adicione sua primeira credencial para começar",
      "dashboard.adjust_filters": "Tente ajustar os filtros",
      "dashboard.credentials": "credenciais",
      "dashboard.credential": "credencial",
      "dashboard.found": "encontrada",
      "dashboard.no_credential_found": "Nenhuma credencial encontrada",
      "dashboard.add_new_credential": "Adicionar Nova Credencial",

      // Identities
      "identities.title": "Identidades",
      "identities.subtitle": "Agrupe credenciais relacionadas (ex: Pessoal = Gmail + GitHub + OpenAI)",
      "identities.create_identity": "Criar Identidade",
      "identities.no_identities": "Nenhuma identidade criada",
      "identities.create_to_group": "Crie identidades para agrupar suas credenciais relacionadas",
      "identities.credentials_count": "credenciais",
      "identities.new_identity": "Nova Identidade",
      "identities.edit_identity": "Editar Identidade",
      "identities.name_label": "Nome",
      "identities.name_placeholder": "Pessoal, Trabalho, etc.",
      "identities.description_label": "Descrição",
      "identities.description_placeholder": "Descrição opcional...",
      "identities.cancel": "Cancelar",
      "identities.save": "Salvar",
      "identities.delete_identity": "Excluir Identidade",
      "identities.delete_warning": "Tem certeza que deseja excluir esta identidade? Esta ação não pode ser desfeita.",

      // Categories
      "category.emails": "E-mails",
      "category.development": "Desenvolvimento",
      "category.cloud": "Cloud",
      "category.ai": "Inteligência Artificial",
      "category.social": "Redes Sociais",
      "category.financial": "Financeiro",
      "category.other": "Outros",
      "category.manage": "Gerencie suas credenciais de {{category}}",

      // Credentials Form
      "credential.new": "Nova",
      "credential.edit": "Editar",
      "credential.name": "Nome",
      "credential.name_placeholder": "Minha credencial",
      "credential.email": "E-mail",
      "credential.email_placeholder": "user@email.com",
      "credential.url": "URL",
      "credential.url_placeholder": "https://...",
      "credential.description": "Descrição",
      "credential.notes": "Notas",
      "credential.notes_placeholder": "Informações adicionais...",
      "credential.favorite": "Favorito",
      "credential.cancel": "Cancelar",
      "credential.save": "Salvar",

      // Credential List
      "credential.search": "Buscar credenciais...",
      "credential.add_new": "Nova",
      "credential.provider": "Provedor",
      "credential.all_providers": "Todos",
      "credential.filter_provider": "Filtrar por provedor",

      // Navigation
      "nav.all": "Todas",
      "nav.identities": "Identidades",
      "nav.categories": "Categorias"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt',
    supportedLngs: ['en', 'pt'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'vaultkey-language',
    }
  });

export default i18n;
