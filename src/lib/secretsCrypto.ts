/**
 * Secrets Crypto Utilities
 * Client-side encryption using Web Crypto API with AES-256-GCM and PBKDF2
 * Includes TOTP support for two-factor authentication
 */

import { base64UrlToUint8Array, uint8ArrayToBase64Url, deriveKey, generateSalt } from './crypto';

const ALGORITHM_AES_GCM = 'AES-GCM';
const ALGORITHM_PBKDF2 = 'PBKDF2';
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const HASH_ALGORITHM = 'SHA-256';

// Secrets-specific key cache
let secretsKeyCache: {
  key: CryptoKey;
  salt: string;
  timestamp: number;
} | null = null;

const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Secret types supported by the vault
 */
export type SecretType = 'api_key' | 'jwt_secret' | 'oauth_token' | 'ssh_key' | 'env_variable';

/**
 * Clear the secrets key cache
 */
export function clearSecretsKeyCache(): void {
  secretsKeyCache = null;
}

/**
 * Get or derive the secrets encryption key
 */
export async function getSecretsDerivedKey(
  secretsPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const saltKey = uint8ArrayToBase64Url(salt);
  const now = Date.now();

  if (
    secretsKeyCache &&
    secretsKeyCache.salt === saltKey &&
    now - secretsKeyCache.timestamp < CACHE_MAX_AGE_MS
  ) {
    return secretsKeyCache.key;
  }

  const key = await deriveKey(secretsPassword, salt);

  secretsKeyCache = {
    key,
    salt: saltKey,
    timestamp: now,
  };

  return key;
}

/**
 * Encrypt a secret value
 */
export async function encryptSecret(
  value: string,
  secretsPassword: string
): Promise<{
  encryptedValue: string;
  iv: string;
  salt: string;
}> {
  const salt = generateSalt();
  const key = await getSecretsDerivedKey(secretsPassword, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const enc = new TextEncoder();
  const encodedData = enc.encode(value);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM_AES_GCM,
      iv: iv.buffer as ArrayBuffer,
    },
    key,
    encodedData
  );

  return {
    encryptedValue: uint8ArrayToBase64Url(new Uint8Array(encryptedData)),
    iv: uint8ArrayToBase64Url(iv),
    salt: uint8ArrayToBase64Url(salt),
  };
}

/**
 * Decrypt a secret value
 */
export async function decryptSecret(
  encryptedValue: string,
  iv: string,
  salt: string,
  secretsPassword: string
): Promise<string> {
  const saltArray = base64UrlToUint8Array(salt);
  const ivArray = base64UrlToUint8Array(iv);
  const encryptedArray = base64UrlToUint8Array(encryptedValue);

  const key = await getSecretsDerivedKey(secretsPassword, saltArray);

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM_AES_GCM,
      iv: ivArray.buffer as ArrayBuffer,
    },
    key,
    encryptedArray.buffer as ArrayBuffer
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedData);
}

/**
 * Hash the secrets password for storage
 */
export async function hashSecretsPassword(password: string): Promise<{
  hash: string;
  salt: string;
}> {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  
  // Export key to get hash
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  
  return {
    hash: uint8ArrayToBase64Url(new Uint8Array(exportedKey)),
    salt: uint8ArrayToBase64Url(salt),
  };
}

/**
 * Verify secrets password against stored hash
 */
export async function verifySecretsPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  const salt = base64UrlToUint8Array(storedSalt);
  const key = await deriveKey(password, salt);
  
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const computedHash = uint8ArrayToBase64Url(new Uint8Array(exportedKey));
  
  return computedHash === storedHash;
}

/**
 * TOTP Generation and Validation
 * Uses time-based one-time passwords
 */
const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;

/**
 * Generate a TOTP secret
 */
export function generateTOTPSecret(): string {
  const secret = crypto.getRandomValues(new Uint8Array(20));
  return uint8ArrayToBase64Url(secret);
}

/**
 * Base32 encoding for TOTP
 */
function base32Encode(buffer: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  
  const chunks = bits.match(/.{1,5}/g) || [];
  let result = '';
  
  for (const chunk of chunks) {
    const index = parseInt(chunk.padEnd(5, '0'), 2);
    result += alphabet[index];
  }
  
  return result;
}

/**
 * Generate TOTP code from secret
 */
export async function generateTOTPCode(secret: string): Promise<string> {
  try {
    const secretBytes = base64UrlToUint8Array(secret);
    const base32Secret = base32Encode(secretBytes);
    
    const time = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(time), false);
    
    // Use HMAC-SHA1 (simplified TOTP implementation)
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes.buffer as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, timeBuffer);
    const signatureBytes = new Uint8Array(signature);
    
    // Dynamic truncation
    const offset = signatureBytes[signatureBytes.length - 1] & 0x0f;
    const binary =
      ((signatureBytes[offset] & 0x7f) << 24) |
      ((signatureBytes[offset + 1] & 0xff) << 16) |
      ((signatureBytes[offset + 2] & 0xff) << 8) |
      (signatureBytes[offset + 3] & 0xff);
    
    const otp = binary % Math.pow(10, TOTP_DIGITS);
    return otp.toString().padStart(TOTP_DIGITS, '0');
  } catch (error) {
    console.error('TOTP generation error:', error);
    return '000000';
  }
}

/**
 * Verify TOTP code
 */
export async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  // Check current code
  const currentCode = await generateTOTPCode(secret);
  
  // For simplicity, we just check current code
  // A production version would check ±1 period for clock skew tolerance
  return currentCode === code;
}

/**
 * Get secret type label
 */
export function getSecretTypeLabel(type: SecretType): string {
  const labels: Record<SecretType, string> = {
    api_key: 'API Key',
    jwt_secret: 'JWT Secret',
    oauth_token: 'OAuth Token',
    ssh_key: 'SSH Key',
    env_variable: 'Environment Variable',
  };
  return labels[type] || 'Unknown';
}

/**
 * Get secret type icon
 */
export function getSecretTypeIcon(type: SecretType): string {
  const icons: Record<SecretType, string> = {
    api_key: 'key',
    jwt_secret: 'shield',
    oauth_token: 'link',
    ssh_key: 'terminal',
    env_variable: 'settings',
  };
  return icons[type] || 'key';
}
