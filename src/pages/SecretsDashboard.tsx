import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Search,
  Key,
  Terminal,
  Link,
  Lock,
  Settings,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSecrets } from "@/hooks/useSecrets";
import { toast } from "sonner";
import type { SecretType } from "@/lib/secretsCrypto";
import { getSecretTypeLabel } from "@/lib/secretsCrypto";

const SECRET_TYPES: SecretType[] = [
  "api_key",
  "jwt_secret",
  "oauth_token",
  "ssh_key",
  "env_variable",
];

const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export default function SecretsDashboard() {
  const navigate = useNavigate();
  const {
    secrets,
    isLoading,
    isUnlocked,
    lock,
    addSecret,
    deleteSecret,
    decryptSecretValue,
    config,
  } = useSecrets();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);

  // Form state
  const [newSecret, setNewSecret] = useState({
    service_name: "",
    token_name: "",
    value: "",
    secret_type: "api_key" as SecretType,
    description: "",
  });

  // Auto-lock functionality
  const resetAutoLockTimer = useCallback(() => {
    const timer = setTimeout(() => {
      lock();
      toast.warning("Secrets vault locked due to inactivity");
      navigate("/secrets/unlock");
    }, AUTO_LOCK_TIMEOUT);

    return timer;
  }, [lock, navigate]);

  useEffect(() => {
    if (!isUnlocked) return;

    let timer = resetAutoLockTimer();

    const handleActivity = () => {
      clearTimeout(timer);
      timer = resetAutoLockTimer();
    };

    // Reset on user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, [isUnlocked, resetAutoLockTimer]);

  // Filter secrets
  const filteredSecrets = secrets.filter((secret) => {
    const matchesSearch =
      secret.service_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      secret.token_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || secret.secret_type === filterType;
    return matchesSearch && matchesType;
  });

  // Toggle secret visibility
  const toggleSecretVisibility = async (id: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(id)) {
      newVisible.delete(id);
      // Clear decrypted value from memory
      const newDecrypted = { ...decryptedValues };
      delete newDecrypted[id];
      setDecryptedValues(newDecrypted);
    } else {
      // Decrypt and show
      const secret = secrets.find((s) => s.id === id);
      if (secret) {
        try {
          const value = await decryptSecretValue(secret);
          setDecryptedValues((prev) => ({ ...prev, [id]: value }));
          newVisible.add(id);
        } catch (error) {
          toast.error("Failed to decrypt secret");
          return;
        }
      }
    }
    setVisibleSecrets(newVisible);
  };

  // Copy to clipboard
  const copyToClipboard = async (id: string) => {
    const secret = secrets.find((s) => s.id === id);
    if (!secret) return;

    let value: string;
    if (decryptedValues[id]) {
      value = decryptedValues[id];
    } else {
      try {
        value = await decryptSecretValue(secret);
      } catch (error) {
        toast.error("Failed to decrypt secret");
        return;
      }
    }

    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard!");
  };

  // Add new secret
  const handleAddSecret = async () => {
    if (!newSecret.service_name || !newSecret.token_name || !newSecret.value) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsAddLoading(true);
    try {
      await addSecret(newSecret);
      setIsAddDialogOpen(false);
      setNewSecret({
        service_name: "",
        token_name: "",
        value: "",
        secret_type: "api_key",
        description: "",
      });
    } catch (error) {
      toast.error("Failed to add secret");
    } finally {
      setIsAddLoading(false);
    }
  };

  // Delete secret
  const handleDeleteSecret = async (id: string) => {
    if (confirm("Are you sure you want to delete this secret?")) {
      try {
        await deleteSecret(id);
      } catch (error) {
        toast.error("Failed to delete secret");
      }
    }
  };

  // Handle lock
  const handleLock = () => {
    lock();
    navigate("/secrets/unlock");
  };

  const getSecretTypeIcon = (type: SecretType) => {
    switch (type) {
      case "api_key":
        return <Key className="h-4 w-4" />;
      case "jwt_secret":
        return <Shield className="h-4 w-4" />;
      case "oauth_token":
        return <Link className="h-4 w-4" />;
      case "ssh_key":
        return <Terminal className="h-4 w-4" />;
      case "env_variable":
        return <Settings className="h-4 w-4" />;
      default:
        return <Key className="h-4 w-4" />;
    }
  };

  const maskSecret = (value: string) => {
    if (value.length <= 8) return "*".repeat(value.length);
    return value.substring(0, 4) + "*".repeat(value.length - 8) + value.substring(value.length - 4);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 animate-pulse text-primary" />
          <p className="mt-4 text-muted-foreground">Redirecting to unlock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Secrets Vault</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLock}>
              <LogOut className="mr-2 h-4 w-4" />
              Lock
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <Shield className="mr-2 h-4 w-4" />
              Password Vault
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search secrets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SECRET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getSecretTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Secret
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Secret</DialogTitle>
                <DialogDescription>
                  Add a new API key, token, or other sensitive credential to your secrets vault.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service Name *</Label>
                  <Input
                    id="service"
                    placeholder="e.g., GitHub, AWS, OpenAI"
                    value={newSecret.service_name}
                    onChange={(e) =>
                      setNewSecret((prev) => ({ ...prev, service_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">Token Name *</Label>
                  <Input
                    id="token"
                    placeholder="e.g., Personal Access Token, API Key"
                    value={newSecret.token_name}
                    onChange={(e) =>
                      setNewSecret((prev) => ({ ...prev, token_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Secret Type *</Label>
                  <Select
                    value={newSecret.secret_type}
                    onValueChange={(value) =>
                      setNewSecret((prev) => ({ ...prev, secret_type: value as SecretType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECRET_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getSecretTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Secret Value *</Label>
                  <Textarea
                    id="value"
                    placeholder="Enter the secret value..."
                    value={newSecret.value}
                    onChange={(e) => setNewSecret((prev) => ({ ...prev, value: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description..."
                    value={newSecret.description}
                    onChange={(e) =>
                      setNewSecret((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSecret} disabled={isAddLoading}>
                  {isAddLoading ? "Adding..." : "Add Secret"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Secrets Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredSecrets.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No secrets found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchQuery || filterType !== "all"
                ? "Try adjusting your search or filter"
                : "Add your first secret to get started"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSecrets.map((secret) => (
              <Card key={secret.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSecretTypeIcon(secret.secret_type as SecretType)}
                      <CardTitle className="text-base">{secret.service_name}</CardTitle>
                    </div>
                    <Badge variant="secondary">{getSecretTypeLabel(secret.secret_type as SecretType)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{secret.token_name}</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                    <code className="flex-1 truncate text-sm font-mono">
                      {visibleSecrets.has(secret.id)
                        ? decryptedValues[secret.id] || "***"
                        : maskSecret("encrypted_value")}
                    </code>
                  </div>

                  {secret.description && (
                    <p className="mb-3 text-xs text-muted-foreground">{secret.description}</p>
                  )}

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(secret.id)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSecretVisibility(secret.id)}
                    >
                      {visibleSecrets.has(secret.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSecret(secret.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
