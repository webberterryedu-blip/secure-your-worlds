import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Wand2, Copy } from "lucide-react";
import { generatePassword, getPasswordStrength, CATEGORIES, DEVICES } from "@/lib/password";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import type { CredentialInsert } from "@/hooks/useCredentials";

type Credential = Tables<"credentials">;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CredentialInsert) => Promise<void>;
  initial?: Credential | null;
  defaultCategory?: string;
}

export default function CredentialForm({ open, onClose, onSubmit, initial, defaultCategory }: Props) {
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("E-mails");
  const [devices, setDevices] = useState<string[]>([]);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setNick(initial.nick ?? "");
      setEmail(initial.email ?? "");
      setPassword(initial.password ?? "");
      setDescription(initial.description ?? "");
      setCategory(initial.category ?? "E-mails");
      setDevices(initial.devices ?? []);
      setUrl(initial.url ?? "");
      setNotes(initial.notes ?? "");
      setExpiresAt(initial.expires_at?.slice(0, 10) ?? "");
    } else {
      setNick("");
      setEmail("");
      setPassword("");
      setDescription("");
      setCategory(defaultCategory || "E-mails");
      setDevices([]);
      setUrl("");
      setNotes("");
      setExpiresAt("");
    }
  }, [initial, open, defaultCategory]);

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
    try {
      await onSubmit({
        nick,
        email: email || null,
        password,
        description: description || null,
        category,
        devices,
        url: url || null,
        notes: notes || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      onClose();
    } catch {
      // error handled in hook
    } finally {
      setSubmitting(false);
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── IDENTIFICAÇÃO ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Identificação</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nick / Nome *</Label>
                <Input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Gmail pessoal" required />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>E-mail da conta</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" />
              </div>
              <div className="space-y-2">
                <Label>URL do serviço</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── SEGURANÇA ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Segurança</p>
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
                  <Progress value={strength.score} className="h-2" />
                  <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* ── DISPOSITIVOS ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Dispositivos</p>
            <div className="flex flex-wrap gap-3">
              {DEVICES.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={devices.includes(d)} onCheckedChange={() => toggleDevice(d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── DETALHES ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Detalhes</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conta principal do Google" />
              </div>
              <div className="space-y-2">
                <Label>Data de expiração</Label>
                <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pergunta de segurança, 2FA, etc." rows={3} />
              </div>
            </div>
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
