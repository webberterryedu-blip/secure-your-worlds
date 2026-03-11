/**
 * VaultKey Crypto Utilities
 * Client-side encryption using Web Crypto API with AES-256-GCM and PBKDF2
 */

const ALGORITHM_AES_GCM = 'AES-GCM';
const ALGORITHM_PBKDF2 = 'PBKDF2';
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const HASH_ALGORITHM = 'SHA-256';

// Key cache for performance optimization
// Cache stores derived keys to avoid re-computing PBKDF2 on every encrypt/decrypt
let keyCache: {
  key: CryptoKey;
  salt: string;
  timestamp: number;
} | null = null;

const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes max cache lifetime

/**
 * Clears the cached key from memory.
 * Should be called on logout or session timeout.
 */
export function clearKeyCache(): void {
  keyCache = null;
}

/**
 * Gets a cached key if available and not expired, otherwise derives a new one.
 * @param masterPassword The user's master password.
 * @param salt The salt for key derivation.
 * @returns The cached or newly derived key.
 */
export async function getDerivedKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const saltKey = uint8ArrayToBase64Url(salt);
  const now = Date.now();

  // Check if cached key is valid
  if (keyCache && 
      keyCache.salt === saltKey && 
      (now - keyCache.timestamp) < CACHE_MAX_AGE_MS) {
    return keyCache.key;
  }

  // Derive new key
  const key = await deriveKey(masterPassword, salt);
  
  // Update cache
  keyCache = {
    key,
    salt: saltKey,
    timestamp: now
  };
  
  return key;
}

/**
 * Generates a cryptographically secure salt.
 * @returns The generated salt.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16)); // 16 bytes = 128 bits
}

/**
 * Derives an encryption key from a master password and salt.
 * @param masterPassword The user's master password.
 * @param salt The salt for key derivation.
 * @returns The derived encryption key.
 */
export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: ALGORITHM_PBKDF2 },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: ALGORITHM_PBKDF2,
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    passwordKey,
    { name: ALGORITHM_AES_GCM, length: KEY_LENGTH },
    false, // Not exportable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-256-GCM.
 * @param data The data to encrypt.
 * @param key The encryption key.
 * @returns The encrypted data and IV.
 */
export async function encrypt(data: string, key: CryptoKey): Promise<{ encryptedData: Uint8Array; iv: Uint8Array }> {
  const enc = new TextEncoder();
  const encodedData = enc.encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes = 96 bits for GCM IV

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM_AES_GCM,
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    encodedData
  );

  return { encryptedData: new Uint8Array(encryptedData), iv };
}

/**
 * Decrypts data using AES-256-GCM.
 * @param encryptedData The encrypted data.
 * @param iv The IV used during encryption.
 * @param key The encryption key.
 * @returns The decrypted data.
 */
export async function decrypt(encryptedData: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<string> {
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM_AES_GCM,
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    encryptedData.buffer as ArrayBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedData);
}

/**
 * Converts a Uint8Array to a Base64Url string.
 * @param arr The array to convert.
 * @returns The Base64Url string.
 */
export function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Converts a Base64Url string to a Uint8Array.
 * @param base64url The Base64Url string to convert.
 * @returns The Uint8Array.
 */
export function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const paddedBase64 = pad === 2 ? base64 + '==' : pad === 3 ? base64 + '=' : base64;
  return Uint8Array.from(atob(paddedBase64), c => c.charCodeAt(0));
}

/**
 * Derives sub-keys using HKDF for key separation.
 * Each sensitive field should have its own key derived from the master key.
 * @param masterKey The derived master key.
 * @param purpose The purpose of the sub-key (password, email, url, notes, auth).
 * @param salt The salt for derivation.
 * @returns The derived sub-key.
 */
export async function deriveSubKey(
  masterKey: CryptoKey,
  purpose: 'password' | 'email' | 'url' | 'notes' | 'auth',
  salt: Uint8Array
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      salt: salt.buffer as ArrayBuffer,
      info: new TextEncoder().encode(`vaultkey-${purpose}`),
      hash: 'SHA-256',
    },
    masterKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * Evaluates password strength based on multiple criteria.
 * @param password The password to evaluate.
 * @returns The password strength level.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  // Length checks
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  
  // Character type checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  // Penalize common patterns
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters
  if (/^(password|123456|qwerty)/i.test(password)) score -= 2; // Common patterns
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}
