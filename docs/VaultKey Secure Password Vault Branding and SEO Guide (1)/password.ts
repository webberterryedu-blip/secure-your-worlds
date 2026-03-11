export function generatePassword(length = 16, options = { uppercase: true, lowercase: true, numbers: true, symbols: true }): string {
  let chars = "";
  if (options.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz0123456789";

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => chars[x % chars.length]).join("");
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score: Math.round((score / 6) * 100), label: "Fraca", color: "hsl(0, 72%, 51%)" };
  if (score <= 4) return { score: Math.round((score / 6) * 100), label: "Média", color: "hsl(38, 92%, 50%)" };
  return { score: Math.round((score / 6) * 100), label: "Forte", color: "hsl(160, 84%, 39%)" };
}

export const CATEGORIES = ["E-mails", "Redes Sociais", "Projetos/Dev", "Financeiro"] as const;
export type Category = typeof CATEGORIES[number];

export const DEVICES = ["Desktop", "Laptop", "Tablet", "iPhone"] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  "E-mails": "Mail",
  "Redes Sociais": "Users",
  "Projetos/Dev": "Code",
  "Financeiro": "Wallet",
};
