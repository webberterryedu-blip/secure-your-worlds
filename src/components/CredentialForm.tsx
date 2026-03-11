import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Wand2, Copy } from "lucide-react";
import { generatePassword, getPasswordStrength, CATEGORIES, DEVICES } from "@/lib/password";
import { toast } from "sonner";
import type { Credential, CredentialInsert } from "@/hooks/useCredentials";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CredentialInsert) => Promise<void>;
  initial?: Credential | null;
}

export default function CredentialForm({ open, onClose, onSubmit, initial }: Props) {
  const [nick, setNick] = useState(initial?.nick ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "E-mails");
  const [devices, setDevices] = useState<string[]>(initial?.devices ?? []);
  const [url, setUrl] = useState(initial?.url ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [expiresAt, setExpiresAt] = useState(initial?.expires_at?.slice(0, 10) ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
              <Select value={category} onValueChange={setCategory}>
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
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pergunta de segurança, 2FA, etc." rows={3} />
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
