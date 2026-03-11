
// src/lib/crypto.ts

const ALGORITHM_AES_GCM = 'AES-GCM';
const ALGORITHM_PBKDF2 = 'PBKDF2';
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const HASH_ALGORITHM = 'SHA-256';

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
