
// src/lib/crypto.ts

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
 * @param {string} masterPassword The user's master password.
 * @param {Uint8Array} salt The salt for key derivation.
 * @returns {Promise<CryptoKey>} The cached or newly derived key.
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
 * Gera um salt criptograficamente seguro.
 * @returns {Uint8Array} O salt gerado.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16)); // 16 bytes = 128 bits
}

/**
 * Deriva uma chave de criptografia a partir de uma senha mestra e um salt.
 * @param {string} masterPassword A senha mestra do usuário.
 * @param {Uint8Array} salt O salt para a derivação da chave.
 * @returns {Promise<CryptoKey>} A chave de criptografia derivada.
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
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    passwordKey,
    { name: ALGORITHM_AES_GCM, length: KEY_LENGTH },
    false, // Não exportável
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa dados usando AES-256 GCM.
 * @param {string} data Os dados a serem criptografados.
 * @param {CryptoKey} key A chave de criptografia.
 * @returns {Promise<{encryptedData: Uint8Array, iv: Uint8Array}>} Os dados criptografados e o IV.
 */
export async function encrypt(data: string, key: CryptoKey): Promise<{ encryptedData: Uint8Array; iv: Uint8Array }> {
  const enc = new TextEncoder();
  const encodedData = enc.encode(data);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes = 96 bits para IV do GCM

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM_AES_GCM,
      iv: iv,
    },
    key,
    encodedData
  );

  return { encryptedData: new Uint8Array(encryptedData), iv };
}

/**
 * Descriptografa dados usando AES-256 GCM.
 * @param {Uint8Array} encryptedData Os dados criptografados.
 * @param {Uint8Array} iv O IV usado na criptografia.
 * @param {CryptoKey} key A chave de criptografia.
 * @returns {Promise<string>} Os dados descriptografados.
 */
export async function decrypt(encryptedData: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<string> {
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM_AES_GCM,
      iv: iv,
    },
    key,
    encryptedData
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedData);
}

/**
 * Converte um Uint8Array para uma string Base64Url.
 * @param {Uint8Array} arr O array a ser convertido.
 * @returns {string} A string Base64Url.
 */
export function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Converte uma string Base64Url para um Uint8Array.
 * @param {string} base64url A string Base64Url a ser convertida.
 * @returns {Uint8Array} O Uint8Array.
 */
export function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const paddedBase64 = pad === 2 ? base64 + '==' : pad === 3 ? base64 + '=' : base64;
  return Uint8Array.from(atob(paddedBase64), c => c.charCodeAt(0));
}

/**
 * Deriva sub-chaves usando HKDF para separação de chaves.
 * Cada campo sensível deve ter sua própria chave derivada da master key.
 * @param {CryptoKey} masterKey A chave mestra derivada.
 * @param {string} purpose O propósito da sub-chave (password, email, url, notes, auth).
 * @param {Uint8Array} salt O salt para a derivação.
 * @returns {Promise<CryptoKey>} A sub-chave derivada.
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
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}
