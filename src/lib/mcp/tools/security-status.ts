// src/lib/mcp/tools/security-status.ts
import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "security_status",
  title: "Security status",
  description:
    "Check the signed-in user's VaultKey security posture: whether two-factor authentication (2FA) and the secrets vault are configured.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data, error } = await supabase
      .from("user_secrets_config")
      .select("totp_enabled, secrets_password_hash")
      .maybeSingle();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const status = {
      two_factor_enabled: Boolean(data?.totp_enabled),
      secrets_vault_configured: Boolean(data?.secrets_password_hash),
      recommendation: !data?.totp_enabled
        ? "Enable two-factor authentication in Security Settings for stronger protection."
        : "Your account has 2FA enabled.",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      structuredContent: status,
    };
  },
});
