
// src/lib/2fa.ts
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configurações padrão para otplib
authenticator.options = {
  step: 30, // Código muda a cada 30 segundos
  window: 1, // Permite 1 código antes e 1 depois do atual
};

/**
 * Gera um novo segredo TOTP.
 * @returns {string} O segredo TOTP em base32.
 */
export function generate2FASecret(): string {
  return authenticator.generateSecret();
}

/**
 * Gera o URL para o QR Code que será escaneado pelo aplicativo autenticador.
 * @param {string} secret O segredo TOTP.
 * @param {string} accountName O nome da conta (geralmente o email do usuário).
 * @param {string} issuer O nome do emissor (seu aplicativo, ex: VaultKey).
 * @returns {string} O URL otpauth://.
 */
export function generate2FAQRCodeUrl(secret: string, accountName: string, issuer: string = 'VaultKey'): string {
  return authenticator.keyuri(accountName, issuer, secret);
}

/**
 * Gera um Data URL para a imagem do QR Code.
 * @param {string} otpAuthUrl O URL otpauth:// gerado por generate2FAQRCodeUrl.
 * @returns {Promise<string>} Uma Promise que resolve para o Data URL da imagem PNG.
 */
export async function generateQRCodeDataURL(otpAuthUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpAuthUrl);
  } catch (err) {
    console.error("Erro ao gerar QR Code:", err);
    throw new Error("Não foi possível gerar o QR Code.");
  }
}

/**
 * Verifica um token TOTP.
 * @param {string} token O token de 6 dígitos fornecido pelo usuário.
 * @param {string} secret O segredo TOTP.
 * @returns {boolean} True se o token for válido, False caso contrário.
 */
export function verify2FAToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}
