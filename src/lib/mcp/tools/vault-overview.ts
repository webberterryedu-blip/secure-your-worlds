// src/lib/mcp/tools/vault-overview.ts
import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

// NOTE: VaultKey is zero-knowledge — credential fields are encrypted in the
// browser with the user's master password, so this tool only reports counts
// and category distribution, never secret values.
export default defineTool({
  name: "vault_overview",
  title: "Vault overview",
  description:
    "Get an overview of the signed-in user's VaultKey vault: credential counts per category and secrets count. Secret values are never exposed (zero-knowledge encryption).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: credentials, error: credError } = await supabase
      .from("credentials")
      .select("category, favorite, created_at");
    if (credError) {
      return { content: [{ type: "text", text: credError.message }], isError: true };
    }

    const byCategory: Record<string, number> = {};
    let favorites = 0;
    for (const row of credentials ?? []) {
      const cat = (row as { category?: string }).category ?? "Outros";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
      if ((row as { favorite?: boolean }).favorite) favorites += 1;
    }

    const { count: secretsCount, error: secretsError } = await supabase
      .from("secrets")
      .select("id", { count: "exact", head: true });
    if (secretsError) {
      return { content: [{ type: "text", text: secretsError.message }], isError: true };
    }

    const overview = {
      credentials_total: credentials?.length ?? 0,
      credentials_favorites: favorites,
      credentials_by_category: byCategory,
      secrets_total: secretsCount ?? 0,
      note: "VaultKey is zero-knowledge: secret values are encrypted in the browser and cannot be read through this API.",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(overview, null, 2) }],
      structuredContent: overview,
    };
  },
});
