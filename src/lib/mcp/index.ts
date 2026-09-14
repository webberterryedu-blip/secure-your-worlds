// src/lib/mcp/index.ts
import { auth, defineMcp } from "@lovable.dev/mcp-js";
import vaultOverviewTool from "./tools/vault-overview";
import securityStatusTool from "./tools/security-status";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref
// (inlined at build time), never from SUPABASE_URL (a .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "secure-vault-manager",
  title: "Secure Vault Manager",
  version: "0.1.0",
  instructions:
    "VaultKey MCP server. VaultKey is a zero-knowledge password vault: secret values are encrypted in the browser and are never available through these tools. Use `vault_overview` for credential/secret counts and `security_status` to check the user's 2FA and vault configuration.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [vaultOverviewTool, securityStatusTool],
});
