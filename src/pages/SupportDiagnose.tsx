import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Loader2, ShieldAlert } from "lucide-react";

const SECRET_HINT = /(senha|password|token|secret|segredo|api[_-]?key)\s*[:=]|eyJ[\w-]+\.|\b\d{6}\b/i;

export default function SupportDiagnose() {
  const [area, setArea] = useState("login");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redacted, setRedacted] = useState(false);

  const looksSensitive = SECRET_HINT.test(description);

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const { data, error: fnError } = await supabase.functions.invoke("support-diagnose", {
      body: { area, description },
    });
    setLoading(false);
    if (fnError) {
      let msg = "Não foi possível gerar o diagnóstico agora.";
      try {
        const ctx = (fnError as { context?: Response }).context;
        const j = ctx ? await ctx.json() : null;
        if (j?.error) msg = j.error;
      } catch { /* ignore */ }
      setError(msg);
      return;
    }
    setResult(data.steps);
    setRedacted(Boolean(data.redacted));
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LifeBuoy className="h-6 w-6 text-primary" /> Diagnóstico de problemas
        </h1>
        <p className="text-muted-foreground">
          Descreva um problema de login, consentimento ou ferramenta MCP e receba passos seguros com IA.
        </p>
      </div>

      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Nunca inclua senhas, Master Password, códigos 2FA, tokens ou chaves. O diagnóstico não precisa deles.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Seu problema</CardTitle>
          <CardDescription>Conte o que você fez, o que esperava e a mensagem que apareceu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger aria-label="Área do problema"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="login">Login / 2FA / redefinição de senha</SelectItem>
              <SelectItem value="consent">Tela de consentimento (integrações de agentes)</SelectItem>
              <SelectItem value="mcp">Ferramentas MCP</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
            rows={6}
            placeholder="Ex.: Depois de digitar o código do autenticador aparece 'código inválido'..."
            aria-label="Descrição do problema"
          />
          {looksSensitive && (
            <p className="text-sm text-destructive">
              Parece que o texto contém algo sensível. Remova antes de enviar — valores assim serão ocultados automaticamente.
            </p>
          )}
          <Button onClick={submit} disabled={loading || description.trim().length < 10}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Analisando..." : "Gerar diagnóstico"}
          </Button>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {result && (
        <Card>
          <CardHeader><CardTitle>Passos sugeridos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {redacted && (
              <p className="text-sm text-muted-foreground">Alguns trechos sensíveis foram ocultados antes da análise.</p>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{result}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
