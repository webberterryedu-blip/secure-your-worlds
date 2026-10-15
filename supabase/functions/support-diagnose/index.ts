import { createOpenAI } from "npm:@ai-sdk/openai@2";
import { streamText } from "npm:ai@5";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Strip anything that looks like a secret before it ever reaches the model.
function redact(text: string) {
  return text
    .replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[TOKEN REMOVIDO]")
    .replace(/\b(sk|pk|sb|ghp|gho|xox[abp])[-_][\w-]{10,}/gi, "[CHAVE REMOVIDA]")
    .replace(/((senha|password|pass|pwd|secret|segredo|token|api[_-]?key)\s*[:=]\s*)\S+/gi, "$1[REMOVIDO]")
    .replace(/\b[A-Za-z0-9+/_-]{32,}={0,2}\b/g, "[VALOR LONGO REMOVIDO]");
}

const SYSTEM = `Você é o assistente de diagnóstico do VaultKey, um cofre de senhas zero-knowledge.
Ajude a pessoa a diagnosticar problemas de: login (e-mail/senha, Google, verificação em duas etapas/2FA, redefinição de senha),
tela de consentimento OAuth das integrações de agentes (MCP) e ferramentas MCP (vault_overview, security_status).

Regras OBRIGATÓRIAS de segurança:
- NUNCA peça senhas, Master Password, códigos 2FA, segredos TOTP, tokens, chaves de API, cookies ou conteúdo de credenciais.
- Se a pessoa colou algo sensível, avise para não compartilhar e sugira trocar esse segredo.
- Não sugira desativar 2FA, RLS ou criptografia como solução.
- Lembre que o VaultKey é zero-knowledge: a equipe não consegue recuperar a Master Password.

Contexto útil: o login falha com "credenciais inválidas" quando e-mail/senha estão errados ou o e-mail não foi confirmado.
Após login com 2FA ativo, é preciso informar o código do app autenticador; relógio do celular fora de sincronia causa códigos inválidos.
Redefinir a senha da conta não altera a Master Password do cofre. A tela de consentimento fica em /.lovable/oauth/consent e exige estar logado.
As ferramentas MCP retornam só contagens e status, nunca valores secretos; precisam de autorização OAuth válida.

Responda no idioma da pessoa, em Markdown curto: 1) Provável causa, 2) Passos de diagnóstico numerados e seguros, 3) Quando procurar suporte.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (!userData?.user) return json({ error: "Faça login para usar o diagnóstico." }, 401);

  let body: { area?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requisição inválida" }, 400);
  }
  const area = ["login", "consent", "mcp"].includes(body.area ?? "") ? body.area : "login";
  const description = redact(String(body.description ?? "").slice(0, 4000)).trim();
  if (description.length < 10) return json({ error: "Descreva o problema com mais detalhes." }, 400);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "IA não configurada." }, 500);

  let runId = req.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
  let upstreamStatus = 0;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
      if (!res.ok) upstreamStatus = res.status;
      return res;
    },
  });

  try {
    let streamError: unknown;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: SYSTEM,
      messages: [{ role: "user", content: `Área: ${area}\n\nDescrição do problema:\n${description}` }],
      abortSignal: req.signal,
      onError: ({ error }) => { streamError = error; },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = await result.text;
    if (streamError || !text.trim()) throw streamError ?? new Error("empty");
    const headers: Record<string, string> = {};
    if (runId) headers["X-Lovable-AIG-Run-ID"] = runId;
    return new Response(JSON.stringify({ steps: text, redacted: description !== String(body.description ?? "").slice(0, 4000).trim() }), {
      headers: { ...corsHeaders, ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("support-diagnose error", upstreamStatus, e);
    if (req.signal.aborted) return json({ error: "Cancelado" }, 499);
    if (upstreamStatus === 429) return json({ error: "Muitas solicitações. Tente novamente em instantes." }, 429);
    if (upstreamStatus === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }, 402);
    if (upstreamStatus === 403) return json({ error: "Acesso ao modelo de IA negado para este workspace." }, 403);
    return json({ error: "Não foi possível gerar o diagnóstico agora." }, 502);
  }
});
