// Two-Factor (TOTP) server-side authority.
// The TOTP secret never leaves the server after enrollment, and completing a
// verification is recorded against the caller's auth session, which RLS requires
// before any credential/secret row can be read or written.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function totpAt(secret: string, counter: number): Promise<string> {
  const keyBytes = base32Decode(secret);
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, BigInt(counter), false);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const offset = sig[sig.length - 1] & 0x0f;
  const bin =
    ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return (bin % 1_000_000).toString().padStart(6, "0");
}

async function verifyTotp(secret: string, token: string): Promise<boolean> {
  const clean = (token || "").replace(/\D/g, "");
  if (clean.length !== 6 || !secret) return false;
  const counter = Math.floor(Date.now() / 30000);
  for (const drift of [-1, 0, 1]) {
    if (await totpAt(secret, counter + drift) === clean) return true;
  }
  return false;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeSessionId(jwt: string): string | null {
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.session_id ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "unauthorized" }, 401);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

    const userId = userData.user.id;
    const sessionId = decodeSessionId(jwt);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const code = typeof body?.code === "string" ? body.code : "";

    const { data: config } = await admin
      .from("user_secrets_config")
      .select("id, totp_secret, totp_enabled, totp_verified_session_id, totp_verified_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (action === "status") {
      const verified =
        !config?.totp_enabled ||
        (!!sessionId &&
          config?.totp_verified_session_id === sessionId &&
          !!config?.totp_verified_at &&
          Date.now() - new Date(config.totp_verified_at).getTime() < 12 * 60 * 60 * 1000);
      return json({ enabled: !!config?.totp_enabled, verified });
    }

    if (action === "enable") {
      const secret = typeof body?.secret === "string" ? body.secret : "";
      if (!secret || !(await verifyTotp(secret, code))) return json({ ok: false }, 200);

      const payload = {
        totp_secret: secret,
        totp_enabled: true,
        totp_verified_session_id: sessionId,
        totp_verified_at: new Date().toISOString(),
      };
      const { error } = config
        ? await admin.from("user_secrets_config").update(payload).eq("user_id", userId)
        : await admin.from("user_secrets_config").insert({ user_id: userId, ...payload });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "disable") {
      if (!config?.totp_secret || !(await verifyTotp(config.totp_secret, code))) {
        return json({ ok: false }, 200);
      }
      const { error } = await admin
        .from("user_secrets_config")
        .update({
          totp_enabled: false,
          totp_secret: null,
          totp_verified_session_id: null,
          totp_verified_at: null,
        })
        .eq("user_id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "verify") {
      if (!config?.totp_enabled || !config?.totp_secret) return json({ ok: false }, 200);
      if (!(await verifyTotp(config.totp_secret, code))) return json({ ok: false }, 200);
      const { error } = await admin
        .from("user_secrets_config")
        .update({
          totp_verified_session_id: sessionId,
          totp_verified_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    console.error("two-factor error:", err);
    return json({ error: "internal_error" }, 500);
  }
});
