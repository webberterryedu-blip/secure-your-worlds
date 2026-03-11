import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Wand2, Copy, Plus, X } from "lucide-react";
import { generatePassword, getPasswordStrength } from "@/lib/password";
import { toast } from "sonner";
import { 
  CATEGORY_PROVIDERS, 
  CATEGORY_LABELS, 
  type Credential, 
  type CredentialCategory 
} from "@/stores/credentialStore";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Credential>) => Promise<void>;
  initial?: Credential | null;
  category?: CredentialCategory;
}

export default function CredentialFormDynamic({ 
  open, 
  onClose, 
  onSubmit, 
  initial,
  category = 'other' 
}: Props) {
  const [nick, setNick] = useState("");
  const [provider, setProvider] = useState("");
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Category-specific fields
  // Email fields
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Cloud fields
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [region, setRegion] = useState("");
  const [accountId, setAccountId] = useState("");
  
  // Dev fields
  const [patToken, setPatToken] = useState("");
  const [tokenExpiration, setTokenExpiration] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  
  // AI fields
  const [apiKey, setApiKey] = useState("");
  const [associatedModel, setAssociatedModel] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | undefined>();
  
  // Social fields
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  
  // Financial fields
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  
  const [showSensitive, setShowSensitive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync form with initial data
  useEffect(() => {
    if (initial) {
      setNick(initial.nick || "");
      setProvider(initial.provider || "");
      setEmail(initial.email || "");
      setUrl(initial.url || "");
      setDescription(initial.description || "");
      setNotes(initial.notes || "");
      setIsFavorite(initial.isFavorite || false);
      setRecoveryEmail(initial.recoveryEmail || "");
      setTwoFactorEnabled(initial.twoFactorEnabled || false);
      setAccessKey(initial.accessKey || "");
      setSecretKey(initial.secretKey || "");
      setRegion(initial.region || "");
      setAccountId(initial.accountId || "");
      setPatToken(initial.patToken || "");
      setTokenExpiration(initial.tokenExpiration || "");
      setScopes(initial.scopes || []);
      setApiKey(initial.apiKey || "");
      setAssociatedModel(initial.associatedModel || "");
      setUsageLimit(initial.usageLimit);
      setUsername(initial.username || "");
      setPhone(initial.phone || "");
      setAccountNumber(initial.accountNumber || "");
      setBankName(initial.bankName || "");
    } else {
      resetForm();
    }
  }, [initial, open]);

  const resetForm = () => {
    setNick("");
    setProvider("");
    setEmail("");
    setUrl("");
    setDescription("");
    setNotes("");
    setIsFavorite(false);
    setRecoveryEmail("");
    setTwoFactorEnabled(false);
    setAccessKey("");
    setSecretKey("");
    setRegion("");
    setAccountId("");
    setPatToken("");
    setTokenExpiration("");
    setScopes([]);
    setApiKey("");
    setAssociatedModel("");
    setUsageLimit(undefined);
    setUsername("");
    setPhone("");
    setAccountNumber("");
    setBankName("");
  };

  const handleGenerate = () => {
    const generated = generatePassword(24);
    setSecretKey(generated);
    toast.success("Senha gerada!");
  };

  const handleGenerateApiKey = () => {
    const generated = generatePassword(40);
    setApiKey(generated);
    toast.success("API Key gerada!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        nick,
        category,
        provider,
        email: email || undefined,
        url: url || undefined,
        description: description || undefined,
        notes: notes || undefined,
        isFavorite,
        // Email fields
        recoveryEmail: recoveryEmail || undefined,
        twoFactorEnabled,
        // Cloud fields
        accessKey: accessKey || undefined,
        secretKey: secretKey || undefined,
        region: region || undefined,
        accountId: accountId || undefined,
        // Dev fields
        patToken: patToken || undefined,
        tokenExpiration: tokenExpiration || undefined,
        scopes: scopes.length > 0 ? scopes : undefined,
        // AI fields
        apiKey: apiKey || undefined,
        associatedModel: associatedModel || undefined,
        usageLimit,
        // Social fields
        username: username || undefined,
        phone: phone || undefined,
        // Financial fields
        accountNumber: accountNumber || undefined,
        bankName: bankName || undefined,
      });
      resetForm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleScope = (scope: string) => {
    setScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const renderCategoryFields = () => {
    switch (category) {
      case 'emails':
        return (
          <>
            <div className="space-y-2">
              <Label>Provedor de E-mail</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_PROVIDERS.emails.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>E-mail de Recuperação</Label>
              <Input 
                type="email" 
                value={recoveryEmail} 
                onChange={e => setRecoveryEmail(e.target.value)} 
                placeholder="recovery@email.com" 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>2FA Habilitado</Label>
              <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
            </div>
          </>
        );

      case 'cloud':
        return (
          <>
            <div className="space-y-2">
              <Label>Provedor Cloud</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_PROVIDERS.cloud.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Access Key ID</Label>
              <Input value={accessKey} onChange={e => setAccessKey(e.target.value)} placeholder="AKIA..." />
            </div>
            <div className="space-y-2">
              <Label>Secret Access Key</Label>
              <div className="flex gap-2">
                <Input 
                  type={showSensitive ? "text" : "password"} 
                  value={secretKey} 
                  onChange={e => setSecretKey(e.target.value)} 
                  placeholder="••••••••••••••••" 
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowSensitive(!showSensitive)}>
                  {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="us-east-1" />
              </div>
              <div className="space-y-2">
                <Label>Account ID</Label>
                <Input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="123456789012" />
              </div>
            </div>
          </>
        );

      case 'development':
        return (
          <>
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_PROVIDERS.development.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PAT Token</Label>
              <div className="flex gap-2">
                <Input 
                  type={showSensitive ? "text" : "password"} 
                  value={patToken} 
                  onChange={e => setPatToken(e.target.value)} 
                  placeholder="ghp_••••••••••••••••" 
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowSensitive(!showSensitive)}>
                  {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Expiração</Label>
              <Input 
                type="date" 
                value={tokenExpiration} 
                onChange={e => setTokenExpiration(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="flex flex-wrap gap-2">
                {['repo', 'workflow', 'write:packages', 'delete:packages', 'admin:org'].map(scope => (
                  <Badge 
                    key={scope} 
                    variant={scopes.includes(scope) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleScope(scope)}
                  >
                    {scope}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        );

      case 'ai':
        return (
          <>
            <div className="space-y-2">
              <Label>Provedor de IA</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_PROVIDERS.ai.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input 
                  type={showSensitive ? "text" : "password"} 
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)} 
                  placeholder="sk-••••••••••••••••" 
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleGenerateApiKey}>
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Modelo Associado</Label>
              <Input value={associatedModel} onChange={e => setAssociatedModel(e.target.value)} placeholder="gpt-4, claude-3, etc." />
            </div>
            <div className="space-y-2">
              <Label>Limite de Uso (USD)</Label>
              <Input 
                type="number" 
                value={usageLimit || ''} 
                onChange={e => setUsageLimit(e.target.value ? parseInt(e.target.value) : undefined)} 
                placeholder="100" 
              />
            </div>
          </>
        );

      case 'social':
        return (
          <>
            <div className="space-y-2">
              <Label>Plataforma</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_PROVIDERS.social.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="@username" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 99999-9999" />
            </div>
          </>
        );

      case 'financial':
        return (
          <>
            <div className="space-y-2">
              <Label>Instituição</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_PROVIDERS.financial.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Banco</Label>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Banco do Brasil" />
            </div>
            <div className="space-y-2">
              <Label>Número da Conta</Label>
              <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="••••••••-•" />
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
            {initial ? "Editar" : "Nova"} {CATEGORY_LABELS[category]}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Fields */}
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input 
              value={nick} 
              onChange={e => setNick(e.target.value)} 
              placeholder="Minha credencial" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="user@email.com" 
            />
          </div>

          <div className="space-y-2">
            <Label>URL</Label>
            <Input 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="https://..." 
            />
          </div>

          {/* Category-specific fields */}
          {renderCategoryFields()}

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Descrição breve" 
            />
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Informações adicionais..." 
              rows={3} 
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Favorito</Label>
            <Switch checked={isFavorite} onCheckedChange={setIsFavorite} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Salvando..." : initial ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
