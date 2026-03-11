import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptSecret, decryptSecret, verifySecretsPassword } from '@/lib/secretsCrypto';

// Category types
export type CredentialCategory = 
  | 'emails'
  | 'development'
  | 'cloud'
  | 'ai'
  | 'social'
  | 'financial'
  | 'other';

export interface Identity {
  id: string;
  name: string;
  description?: string;
  credentialIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  id: string;
  // Common fields
  nick: string;
  category: CredentialCategory;
  provider?: string;
  // Legacy field - maps to provider
  service?: string;
  email?: string;
  url?: string;
  description?: string;
  notes?: string;
  isFavorite: boolean;
  // Legacy field for backward compatibility
  is_favorite?: boolean;
  identityId?: string;
  createdAt: string;
  // Legacy field
  created_at?: string;
  updatedAt: string;
  lastUsed?: string;
  // Legacy fields for CredentialCard compatibility
  password?: string;
  environment?: string;
  devices?: string[];
  projects?: string[];
  expires_at?: string;
  
  // Email specific
  recoveryEmail?: string;
  twoFactorEnabled?: boolean;
  
  // Cloud specific
  accessKey?: string;
  secretKey?: string;
  region?: string;
  accountId?: string;
  
  // Development specific
  patToken?: string;
  tokenExpiration?: string;
  scopes?: string[];
  
  // AI specific
  apiKey?: string;
  associatedModel?: string;
  usageLimit?: number;
  usageCount?: number;
  
  // Social specific
  username?: string;
  phone?: string;
  
  // Financial specific
  accountNumber?: string;
  bankName?: string;
}

interface CredentialStore {
  // State
  credentials: Credential[];
  identities: Identity[];
  selectedIdentityId: string | null;
  searchQuery: string;
  selectedProvider: string | null;
  selectedCategory: CredentialCategory | 'all';
  
  // Actions
  addCredential: (credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCredential: (id: string, updates: Partial<Credential>) => void;
  deleteCredential: (id: string) => void;
  toggleFavorite: (id: string) => void;
  
  // Identity actions
  addIdentity: (identity: Omit<Identity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIdentity: (id: string, updates: Partial<Identity>) => void;
  deleteIdentity: (id: string) => void;
  setSelectedIdentity: (id: string | null) => void;
  
  // Filter actions
  setSearchQuery: (query: string) => void;
  setSelectedProvider: (provider: string | null) => void;
  setSelectedCategory: (category: CredentialCategory | 'all') => void;
  
  // Utility
  getFilteredCredentials: () => Credential[];
  getCredentialsByCategory: (category: CredentialCategory) => Credential[];
  getCredentialsByIdentity: (identityId: string) => Credential[];
}

// Sensitive fields that should be encrypted
const SENSITIVE_FIELDS = [
  'email', 'url', 'notes', 'recoveryEmail', 'accessKey', 'secretKey',
  'patToken', 'apiKey', 'username', 'phone', 'accountNumber', 'bankName'
] as const;

// Storage key for encryption config
const STORAGE_KEY = 'vaultkey-credentials';
const ENCRYPTION_CONFIG_KEY = 'vaultkey-credentials-encryption';

interface EncryptionConfig {
  enabled: boolean;
  hash?: string;
  salt?: string;
}

// Get stored encryption config
function getEncryptionConfig(): EncryptionConfig | null {
  const stored = localStorage.getItem(ENCRYPTION_CONFIG_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save encryption config
function saveEncryptionConfig(config: EncryptionConfig): void {
  localStorage.setItem(ENCRYPTION_CONFIG_KEY, JSON.stringify(config));
}

// Encrypt sensitive fields in credential
async function encryptCredentialFields(
  credential: Credential,
  password: string
): Promise<Credential> {
  const sensitiveData: Record<string, string> = {};
  
  // Extract and encrypt sensitive fields
  for (const field of SENSITIVE_FIELDS) {
    const value = credential[field as keyof Credential];
    if (value && typeof value === 'string') {
      const { encryptedValue, iv, salt } = await encryptSecret(value, password);
      sensitiveData[field] = JSON.stringify({ encryptedValue, iv, salt });
    }
  }
  
  // Return credential with encrypted fields marked
  return {
    ...credential,
    _encryptedFields: sensitiveData,
  } as Credential;
}

// Decrypt sensitive fields in credential
async function decryptCredentialFields(
  credential: Credential,
  password: string
): Promise<Credential> {
  const encryptedFields = (credential as Credential & { _encryptedFields?: Record<string, string> })._encryptedFields;
  
  if (!encryptedFields) return credential;
  
  const decrypted = { ...credential };
  
  for (const [field, encryptedStr] of Object.entries(encryptedFields)) {
    try {
      const { encryptedValue, iv, salt } = JSON.parse(encryptedStr);
      const decryptedValue = await decryptSecret(encryptedValue, iv, salt, password);
      (decrypted as any)[field] = decryptedValue;
    } catch (e) {
      console.error(`Failed to decrypt field ${field}:`, e);
      // Mark credential as partially corrupted
      (decrypted as any)._decryptionError = true;
    }
  }
  
  // Clean up encryption metadata
  delete (decrypted as any)._encryptedFields;
  
  return decrypted;
}

// Custom storage that supports encryption
const createEncryptedStorage = () => {
  let cachedPassword: string | null = null;
  
  return {
    getItem: async (name: string): Promise<string | null> => {
      const value = localStorage.getItem(name);
      if (!value) return null;
      
      const config = getEncryptionConfig();
      
      // If encryption is not enabled or no password cached, return as-is
      if (!config?.enabled || !cachedPassword) {
        return value;
      }
      
      try {
        // Verify password before decrypting
        const isValid = await verifySecretsPassword(
          cachedPassword,
          config.hash!,
          config.salt!
        );
        
        if (!isValid) {
          console.error('Invalid password for credential decryption');
          return value;
        }
        
        const parsed = JSON.parse(value);
        
        // Decrypt credentials if they have encrypted fields
        if (parsed.state?.credentials) {
          const decryptedCredentials: typeof parsed.state.credentials = [];
          
          for (const cred of parsed.state.credentials) {
            if ((cred as any)._encryptedFields) {
              const decrypted = await decryptCredentialFields(cred, cachedPassword);
              decryptedCredentials.push(decrypted);
            } else {
              decryptedCredentials.push(cred);
            }
          }
          
          parsed.state.credentials = decryptedCredentials;
        }
        
        if (parsed.state?.identities) {
          const decryptedIdentities: typeof parsed.state.identities = [];
          
          for (const ident of parsed.state.identities) {
            if ((ident as any)._encryptedFields) {
              const decrypted = await decryptCredentialFields(ident as any, cachedPassword);
              decryptedIdentities.push(decrypted as any);
            } else {
              decryptedIdentities.push(ident);
            }
          }
          
          parsed.state.identities = decryptedIdentities;
        }
        
        return JSON.stringify(parsed);
      } catch (e) {
        console.error('Decryption failed:', e);
        return value;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      const config = getEncryptionConfig();
      
      // If encryption is not enabled or no password cached, store as-is
      if (!config?.enabled || !cachedPassword) {
        localStorage.setItem(name, value);
        return;
      }
      
      try {
        // Verify password before encrypting
        const isValid = await verifySecretsPassword(
          cachedPassword,
          config.hash!,
          config.salt!
        );
        
        if (!isValid) {
          console.error('Invalid password for credential encryption');
          localStorage.setItem(name, value);
          return;
        }
        
        const parsed = JSON.parse(value);
        
        // Encrypt credentials
        if (parsed.state?.credentials) {
          const encryptedCredentials = [];
          
          for (const cred of parsed.state.credentials) {
            const encrypted = await encryptCredentialFields(cred, cachedPassword);
            encryptedCredentials.push(encrypted);
          }
          
          parsed.state.credentials = encryptedCredentials;
        }
        
        if (parsed.state?.identities) {
          const encryptedIdentities = [];
          
          for (const ident of parsed.state.identities) {
            const encrypted = await encryptCredentialFields(ident as any, cachedPassword);
            encryptedIdentities.push(encrypted as any);
          }
          
          parsed.state.identities = encryptedIdentities;
        }
        
        localStorage.setItem(name, JSON.stringify(parsed));
      } catch (e) {
        console.error('Encryption failed:', e);
        // Don't silently fall back to plain storage - warn user
        if (import.meta.env.DEV) {
          console.warn('⚠️ SECURITY: Encryption failed, data will be stored UNENCRYPTED');
        }
        // Store with a flag indicating encryption failed
        try {
          const parsed = JSON.parse(value);
          parsed.state._encryptionFailed = true;
          localStorage.setItem(name, JSON.stringify(parsed));
        } catch {
          localStorage.setItem(name, value);
        }
      }
    },
    removeItem: (name: string): void => {
      localStorage.removeItem(name);
    },
    // Method to set the password for encryption/decryption
    setPassword: (password: string | null): void => {
      cachedPassword = password;
    },
    // Method to enable encryption with a new password
    enableEncryption: async (password: string): Promise<void> => {
      const salt = crypto.randomUUID();
      const { hash } = await (await import('@/lib/secretsCrypto')).hashSecretsPassword(password);
      
      const config: EncryptionConfig = {
        enabled: true,
        hash,
        salt,
      };
      
      saveEncryptionConfig(config);
      cachedPassword = password;
    },
    // Check if encryption is enabled
    isEncryptionEnabled: (): boolean => {
      return getEncryptionConfig()?.enabled ?? false;
    },
  };
};

const encryptedStorage = createEncryptedStorage();

export const useCredentialStore = create<CredentialStore>()(
  persist(
    (set, get) => ({
      // Initial state
      credentials: [],
      identities: [],
      selectedIdentityId: null,
      searchQuery: '',
      selectedProvider: null,
      selectedCategory: 'all',
      
      // Credential actions
      addCredential: (credentialData) => {
        const newCredential: Credential = {
          ...credentialData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          credentials: [...state.credentials, newCredential],
        }));
      },
      
      updateCredential: (id, updates) => {
        set((state) => ({
          credentials: state.credentials.map((cred) =>
            cred.id === id
              ? { ...cred, ...updates, updatedAt: new Date().toISOString() }
              : cred
          ),
        }));
      },
      
      deleteCredential: (id) => {
        set((state) => ({
          credentials: state.credentials.filter((cred) => cred.id !== id),
        }));
      },
      
      toggleFavorite: (id) => {
        set((state) => ({
          credentials: state.credentials.map((cred) =>
            cred.id === id
              ? { ...cred, isFavorite: !cred.isFavorite, updatedAt: new Date().toISOString() }
              : cred
          ),
        }));
      },
      
      // Identity actions
      addIdentity: (identityData) => {
        const newIdentity: Identity = {
          ...identityData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          identities: [...state.identities, newIdentity],
        }));
      },
      
      updateIdentity: (id, updates) => {
        set((state) => ({
          identities: state.identities.map((identity) =>
            identity.id === id
              ? { ...identity, ...updates, updatedAt: new Date().toISOString() }
              : identity
          ),
        }));
      },
      
      deleteIdentity: (id) => {
        set((state) => ({
          identities: state.identities.filter((identity) => identity.id !== id),
          // Remove identity reference from credentials
          credentials: state.credentials.map((cred) =>
            cred.identityId === id ? { ...cred, identityId: undefined } : cred
          ),
        }));
      },
      
      setSelectedIdentity: (id) => {
        set({ selectedIdentityId: id });
      },
      
      // Filter actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      setSelectedProvider: (provider) => {
        set({ selectedProvider: provider });
      },
      
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },
      
      // Utility functions
      getFilteredCredentials: () => {
        const { credentials, searchQuery, selectedProvider, selectedCategory, selectedIdentityId } = get();
        
        return credentials.filter((cred) => {
          // Filter by category
          if (selectedCategory !== 'all' && cred.category !== selectedCategory) {
            return false;
          }
          
          // Filter by provider
          if (selectedProvider && cred.provider !== selectedProvider) {
            return false;
          }
          
          // Filter by identity
          if (selectedIdentityId && cred.identityId !== selectedIdentityId) {
            return false;
          }
          
          // Filter by search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              cred.nick.toLowerCase().includes(query) ||
              cred.email?.toLowerCase().includes(query) ||
              cred.provider?.toLowerCase().includes(query) ||
              cred.description?.toLowerCase().includes(query)
            );
          }
          
          return true;
        });
      },
      
      getCredentialsByCategory: (category) => {
        return get().credentials.filter((cred) => cred.category === category);
      },
      
      getCredentialsByIdentity: (identityId) => {
        return get().credentials.filter((cred) => cred.identityId === identityId);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: async (name) => encryptedStorage.getItem(name),
        setItem: async (name, value) => encryptedStorage.setItem(name, value),
        removeItem: async (name) => encryptedStorage.removeItem(name),
      })),
      partialize: (state) => ({
        credentials: state.credentials,
        identities: state.identities,
      }),
    }
  )
);

// Export the storage methods for external use
export const credentialStorage = {
  setPassword: (password: string | null) => encryptedStorage.setPassword(password),
  enableEncryption: (password: string) => encryptedStorage.enableEncryption(password),
  isEncryptionEnabled: () => encryptedStorage.isEncryptionEnabled(),
};

// Provider/Credential type mappings
export const CATEGORY_PROVIDERS: Record<CredentialCategory, string[]> = {
  emails: ['Gmail', 'Outlook', 'Yahoo', 'iCloud', 'ProtonMail', 'Other'],
  development: ['GitHub', 'GitLab', 'Bitbucket', 'Vercel', 'Netlify', 'Heroku', 'Railway', 'Other'],
  cloud: ['AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Cloudflare', 'Other'],
  ai: ['OpenAI', 'Anthropic', 'HuggingFace', 'Google AI', 'Azure AI', 'Other'],
  social: ['LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'YouTube', 'Reddit', 'Discord', 'Other'],
  financial: ['Stripe', 'PayPal', 'Banco do Brasil', 'Nubank', 'Itau', 'Other'],
  other: ['Other'],
};

export const CATEGORY_LABELS: Record<CredentialCategory, string> = {
  emails: 'E-mails',
  development: 'Desenvolvimento',
  cloud: 'Cloud',
  ai: 'Inteligência Artificial',
  social: 'Redes Sociais',
  financial: 'Financeiro',
  other: 'Outros',
};
