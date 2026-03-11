/**
 * Two-Factor Authentication (2FA) utilities using TOTP
 * Uses otplib v13 for TOTP generation and verification
 */

import { generateSecret, generateURI, verifySync } from 'otplib';

/**
 * Generates a new TOTP secret
 * @returns The TOTP secret in base32
 */
export function generate2FASecret(): string {
  return generateSecret();
}

/**
 * Generates the URL for the QR Code to be scanned by the authenticator app
 * @param secret The TOTP secret
 * @param accountName The account name (usually user's email)
 * @param issuer The issuer name (your app, e.g., VaultKey)
 * @returns The otpauth:// URL
 */
export function generate2FAQRCodeUrl(secret: string, accountName: string, issuer: string = 'VaultKey'): string {
  return generateURI({
    issuer,
    label: accountName,
    secret,
  });
}

/**
 * Verifies a TOTP token (synchronous version)
 * @param token The 6-digit token provided by the user
 * @param secret The TOTP secret
 * @returns True if the token is valid, False otherwise
 */
export function verify2FAToken(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret });
    // Result is either VerifyResultValid (truthy) or VerifyResultInvalid (falsy)
    return !!result;
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
}
