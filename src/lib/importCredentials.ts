import { CATEGORIES, DEVICES } from "@/lib/password";
import type { CredentialInsert } from "@/hooks/useCredentials";

export interface ImportResult {
  valid: CredentialInsert[];
  errors: { row: number; reason: string }[];
}

const CATEGORY_SET = new Set(CATEGORIES as readonly string[]);
const DEVICE_SET = new Set(DEVICES as readonly string[]);

function normalizeCategory(value?: string): string {
  if (!value) return "E-mails";
  const v = value.trim();
  if (CATEGORY_SET.has(v)) return v;
  const lower = v.toLowerCase();
  for (const c of CATEGORIES) if (c.toLowerCase() === lower) return c;
  return "E-mails";
}

function normalizeDevices(value: unknown): string[] {
  let arr: string[] = [];
  if (Array.isArray(value)) arr = value.map(String);
  else if (typeof value === "string" && value.trim())
    arr = value.split(/[;,|]/).map((s) => s.trim()).filter(Boolean);
  const out: string[] = [];
  for (const d of arr) {
    if (DEVICE_SET.has(d)) out.push(d);
    else {
      const lower = d.toLowerCase();
      const match = DEVICES.find((x) => x.toLowerCase() === lower);
      if (match) out.push(match);
    }
  }
  return Array.from(new Set(out));
}

function normalizeDate(value?: string): string | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "1", "yes", "sim"].includes(value.trim().toLowerCase());
  return false;
}

function buildRow(raw: Record<string, any>, index: number): { ok: true; cred: CredentialInsert } | { ok: false; reason: string } {
  // Aliases para flexibilidade
  const nick = (raw.nick ?? raw.name ?? raw.title ?? raw.nome ?? "").toString().trim();
  const password = (raw.password ?? raw.senha ?? raw.pass ?? "").toString();
  if (!nick) return { ok: false, reason: "Campo 'nick' é obrigatório" };
  if (!password) return { ok: false, reason: "Campo 'password' é obrigatório" };

  const cred: CredentialInsert = {
    nick,
    password,
    email: (raw.email ?? raw.username ?? raw.usuario ?? null) || null,
    description: (raw.description ?? raw.descricao ?? null) || null,
    category: normalizeCategory(raw.category ?? raw.categoria),
    devices: normalizeDevices(raw.devices ?? raw.dispositivos),
    url: (raw.url ?? raw.site ?? null) || null,
    notes: (raw.notes ?? raw.notas ?? null) || null,
    expires_at: normalizeDate(raw.expires_at ?? raw.expiration ?? raw.expira_em),
    is_favorite: toBool(raw.is_favorite ?? raw.favorito),
  };
  return { ok: true, cred };
}

export function parseJSON(text: string): ImportResult {
  const result: ImportResult = { valid: [], errors: [] };
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e: any) {
    result.errors.push({ row: 0, reason: `JSON inválido: ${e.message}` });
    return result;
  }
  const arr = Array.isArray(data) ? data : Array.isArray(data?.credentials) ? data.credentials : null;
  if (!arr) {
    result.errors.push({ row: 0, reason: "JSON deve ser um array ou conter chave 'credentials'" });
    return result;
  }
  arr.forEach((item, i) => {
    if (typeof item !== "object" || !item) {
      result.errors.push({ row: i + 1, reason: "Item não é um objeto" });
      return;
    }
    const r = buildRow(item, i);
    if (r.ok) result.valid.push(r.cred);
    else result.errors.push({ row: i + 1, reason: r.reason });
  });
  return result;
}

// CSV parser simples com suporte a aspas
function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.some((c) => c !== "")) rows.push(cur);
        cur = [];
      } else field += ch;
    }
  }
  if (field !== "" || cur.length) { cur.push(field); if (cur.some((c) => c !== "")) rows.push(cur); }
  return rows;
}

export function parseCSV(text: string): ImportResult {
  const result: ImportResult = { valid: [], errors: [] };
  const rows = parseCSVText(text.trim());
  if (rows.length < 2) {
    result.errors.push({ row: 0, reason: "CSV vazio ou sem dados" });
    return result;
  }
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = row[idx] ?? ""; });
    const r = buildRow(obj, i);
    if (!r.ok) result.errors.push({ row: i + 1, reason: r.reason });
    else result.valid.push(r.cred);
  }
  return result;
}

export function parseFile(filename: string, text: string): ImportResult {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "json") return parseJSON(text);
  if (ext === "csv") return parseCSV(text);
  // Auto-detecção
  const trimmed = text.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return parseJSON(text);
  return parseCSV(text);
}
