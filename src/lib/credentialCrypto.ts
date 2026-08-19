/**
 * Credential Crypto — criptografia zero-knowledge dos campos sensíveis das credenciais.
 *
 * Os campos password/email/url/notes são cifrados no navegador com AES-256-GCM,
 * usando uma chave derivada (PBKDF2-SHA256, 600k iterações) da senha mestra do cofre.
 * O servidor só armazena o texto cifrado — nunca vê o conteúdo em claro.
 */

import { base64UrlToUint8Array, uint8ArrayToBase64Url } from "./crypto";
import { getSecretsDerivedKey } from "./secretsCrypto";

const PREFIX = "vk1";

/** Campos de uma credencial que devem ser criptografados no cliente. */
export const ENCRYPTED_FIELDS = ["password", "email", "url", "notes"] as const;
export type EncryptedField = (typeof ENCRYPTED_FIELDS)[number];

export function isEncryptedValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(`${PREFIX}:`);
}

export async function encryptValue(
  plain: string,
  masterPassword: string,
  saltB64: string
): Promise<string> {
  const salt = base64UrlToUint8Array(saltB64);
  const key = await getSecretsDerivedKey(masterPassword, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    new TextEncoder().encode(plain)
  );
  return `${PREFIX}:${uint8ArrayToBase64Url(iv)}:${uint8ArrayToBase64Url(new Uint8Array(encrypted))}`;
}

export async function decryptValue(
  stored: string,
  masterPassword: string,
  saltB64: string
): Promise<string> {
  if (!isEncryptedValue(stored)) return stored;
  const [, ivPart, dataPart] = stored.split(":");
  const salt = base64UrlToUint8Array(saltB64);
  const key = await getSecretsDerivedKey(masterPassword, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlToUint8Array(ivPart).buffer as ArrayBuffer },
    key,
    base64UrlToUint8Array(dataPart).buffer as ArrayBuffer
  );
  return new TextDecoder().decode(decrypted);
}

type FieldMap = Partial<Record<EncryptedField, string | null | undefined>>;

/** Cifra todos os campos sensíveis presentes no objeto. */
export async function encryptFields<T extends FieldMap>(
  input: T,
  masterPassword: string,
  saltB64: string
): Promise<T> {
  const out: Record<string, unknown> = { ...input };
  for (const field of ENCRYPTED_FIELDS) {
    const value = input[field];
    if (typeof value === "string" && value.length > 0 && !isEncryptedValue(value)) {
      out[field] = await encryptValue(value, masterPassword, saltB64);
    }
  }
  return out as T;
}

/** Decifra os campos sensíveis; valores legados (em claro) são mantidos como estão. */
export async function decryptFields<T extends FieldMap>(
  row: T,
  masterPassword: string,
  saltB64: string
): Promise<T> {
  const out: Record<string, unknown> = { ...row };
  for (const field of ENCRYPTED_FIELDS) {
    const value = row[field];
    if (isEncryptedValue(value)) {
      try {
        out[field] = await decryptValue(value, masterPassword, saltB64);
      } catch {
        out[field] = "";
      }
    }
  }
  return out as T;
}
