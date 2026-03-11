
// src/components/CredentialForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Wand2, Copy } from "lucide-react";
import { generatePassword, getPasswordStrength } from "@/lib/password";
import { toast } from "sonner";
import { useVaultStore, StoredCredential } from "@/store/vaultStore";

// Definir categorias e seus campos específicos
const CATEGORIES = ["E-mails", "Desenvolvimento", "Cloud", "Inteligência Artificial", "Redes Sociais", "Financeiro", "Outros"];
const DEVICES = ["Desktop", "Laptop", "Tablet", "iPhone", "Android"];

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: StoredCredential | null;
  category: string; // Categoria atual da página
}

export function CredentialForm({ open, onClose, initial, category }: Props) {
  const addCredential = useVaultStore((state) => state.addCredential);
  const updateCredential = useVaultStore((state) => state.updateCredential);

  const [nick, setNick] = useState(initial?.nick ?? "");
  const [email, setEmail] = useState(initial?.decrypted_email ?? "");
  const [password, setPassword] = useState(initial?.decrypted_password ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [selectedCategory, setSelectedCategory] = useState(initial?.category ?? category);
  const [devices, setDevices] = useState<string[]>(initial?.devices ?? []);
  const [url, setUrl] = useState(initial?.decrypted_url ?? "");
  const [notes, setNotes] = useState(initial?.decrypted_notes ?? "");
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at?.slice(0, 10) ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Campos específicos por categoria
  const [provider, setProvider] = useState(""); // Para E-mails
  const [recoveryEmail, setRecoveryEmail] = useState(""); // Para E-mails
  const [twoFactorAuth, setTwoFactorAuth] = useState(false); // Para E-mails

  const [accessKey, setAccessKey] = useState(""); // Para Cloud
  const [secretKey, setSecretKey] = useState(""); // Para Cloud
  const [region, setRegion] = useState(""); // Para Cloud
  const [accountId, setAccountId] = useState(""); // Para Cloud

  const [patToken, setPatToken] = useState(""); // Para Dev
  const [scopes, setScopes] = useState<string[]>([]); // Para Dev

  const [apiKey, setApiKey] = useState(""); // Para IA
  const [apiModel, setApiModel] = useState(""); // Para IA
  const [usageLimits, setUsageLimits] = useState(""); // Para IA

  useEffect(() => {
    if (initial) {
      setNick(initial.nick ?? "");
      setEmail(initial.decrypted_email ?? "");
      setPassword(initial.decrypted_password ?? "");
      setDescription(initial.description ?? "");
      setSelectedCategory(initial.category ?? category);
      setDevices(initial.devices ?? []);
      setUrl(initial.decrypted_url ?? "");
      setNotes(initial.decrypted_notes ?? "");
      setExpiresAt(initial.expires_at?.slice(0, 10) ?? "");

      // Carregar campos específicos se existirem nos notes (exemplo simples)
      try {
        const extraData = initial.decrypted_notes ? JSON.parse(initial.decrypted_notes) : {};
        if (initial.category === "E-mails") {
          setProvider(extraData.provider || "");
          setRecoveryEmail(extraData.recoveryEmail || "");
          setTwoFactorAuth(extraData.twoFactorAuth || false);
        } else if (initial.category === "Cloud") {
          setAccessKey(extraData.accessKey || "");
          setSecretKey(extraData.secretKey || "");
          setRegion(extraData.region || "");
          setAccountId(extraData.accountId || "");
        } else if (initial.category === "Desenvolvimento") {
          setPatToken(extraData.patToken || "");
          setScopes(extraData.scopes || []);
        } else if (initial.category === "Inteligência Artificial") {
          setApiKey(extraData.apiKey || "");
          setApiModel(extraData.apiModel || "");
          setUsageLimits(extraData.usageLimits || "");
        }
      } catch (e) {
        console.error("Erro ao parsear notas para campos específicos:", e);
      }
    } else {
      // Resetar campos ao adicionar nova credencial
      setNick("");
      setEmail("");
      setPassword("");
      setDescription("");
      setSelectedCategory(category);
      setDevices([]);
      setUrl("");
      setNotes("");
      setExpiresAt("");
      setProvider("");
      setRecoveryEmail("");
      setTwoFactorAuth(false);
      setAccessKey("");
      setSecretKey("");
      setRegion("");
      setAccountId("");
      setPatToken("");
      setScopes([]);
      setApiKey("");
      setApiModel("");
      setUsageLimits("");
    }
  }, [initial, category]);

  const strength = getPasswordStrength(password);

  const handleGenerate = () => {
    const generated = generatePassword(20);
    setPassword(generated);
    toast.success("Senha gerada!");
  };

  const toggleDevice = (d: string) => {
    setDevices((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let extraNotes = {};
    if (selectedCategory === "E-mails") {
      extraNotes = { provider, recoveryEmail, twoFactorAuth };
    } else if (selectedCategory === "Cloud") {
      extraNotes = { accessKey, secretKey, region, accountId };
    } else if (selectedCategory === "Desenvolvimento") {
      extraNotes = { patToken, scopes };
    } else if (selectedCategory === "Inteligência Artificial") {
      extraNotes = { apiKey, apiModel, usageLimits };
    }

    const credentialData = {
      nick,
      email: email || null,
      password,
      description: description || null,
      category: selectedCategory,
      devices,
      url: url || null,
      notes: JSON.stringify({ ...extraNotes, originalNotes: notes }) || null, // Armazena campos específicos nas notas
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    try {
      if (initial) {
        await updateCredential(initial.id, credentialData);
      } else {
        await addCredential(credentialData);
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar credencial:", error);
      toast.error("Erro ao salvar credencial.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCategorySpecificFields = () => {
    switch (selectedCategory) {
      case "E-mails":
        return (
          <>
            <div className="space-y-2">
              <Label>Provedor de E-mail</Label>
              <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Gmail, Outlook, ProtonMail" />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Recuperação</Label>
              <Input type="email" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} placeholder="recovery@example.com" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="2fa-email" checked={twoFactorAuth} onCheckedChange={(checked) => setTwoFactorAuth(checked as boolean)} />
              <Label htmlFor="2fa-email">Autenticação de Dois Fatores (2FA) Ativada</Label>
            </div>
          </>
        );
      case "Cloud":
        return (
          <>
            <div className="space-y-2">
              <Label>Access Key ID</Label>
              <Input value={accessKey} onChange={(e) => setAccessKey(e.target.value)} placeholder="AKIA..." />
            </div>
            <div className="space-y-2">
              <Label>Secret Access Key</Label>
              <Input type={showPassword ? "text" : "password"} value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="wJalrXU..." />
            </div>
            <div className="space-y-2">
              <Label>Região</Label>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="us-east-1" />
            </div>
            <div className="space-y-2">
              <Label>Account ID</Label>
              <Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="123456789012" />
            </div>
          </>
        );
      case "Desenvolvimento":
        return (
          <>
            <div className="space-y-2">
              <Label>Personal Access Token (PAT)</Label>
              <Input type={showPassword ? "text" : "password"} value={patToken} onChange={(e) => setPatToken(e.target.value)} placeholder="ghp_..." />
            </div>
            <div className="space-y-2">
              <Label>Escopos (separados por vírgula)</Label>
              <Input value={scopes.join(", ")} onChange={(e) => setScopes(e.target.value.split(", ").map(s => s.trim()))} placeholder="repo, read:user" />
            </div>
          </>
        );
      case "Inteligência Artificial":
        return (
          <>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input type={showPassword ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
            </div>
            <div className="space-y-2">
              <Label>Modelo Associado</Label>
              <Input value={apiModel} onChange={(e) => setApiModel(e.target.value)} placeholder="gpt-4, claude-3-opus" />
            </div>
            <div className="space-y-2">
              <Label>Limites de Uso/Notas</Label>
              <Input value={usageLimits} onChange={(e) => setUsageLimits(e.target.value)} placeholder="Max 1000 req/min" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono">
            {initial ? "Editar Credencial" : "Nova Credencial"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nick / Nome *</Label>
              <Input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Gmail pessoal" required />
            </div>
            <div className="space-y-2">
              <Label>E-mail da conta</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Senha *</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-20 font-mono"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(password); toast.success("Copiado!"); }} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={handleGenerate} title="Gerar senha">
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
            {password && (
              <div className="space-y-1">
                <Progress value={strength.score} className="h-2" style={{ ["--progress-color" as any]: strength.color }} />
                <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL do serviço</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {renderCategorySpecificFields()}

          <div className="space-y-2">
            <Label>Dispositivos</Label>
            <div className="flex flex-wrap gap-3">
              {DEVICES.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={devices.includes(d)} onCheckedChange={() => toggleDevice(d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conta principal do Google" />
          </div>

          <div className="space-y-2">
            <Label>Data de expiração</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Notas Adicionais</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qualquer nota extra não coberta pelos campos específicos." rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : initial ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
