import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Key, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSecrets } from "@/hooks/useSecrets";
import { toast } from "sonner";

interface SecretsUnlockProps {
  onUnlock: () => void;
}

export default function SecretsUnlock({ onUnlock }: SecretsUnlockProps) {
  const navigate = useNavigate();
  const { isConfigured, config, unlock } = useSecrets();
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await unlock(password, totpCode || undefined);
      if (success) {
        toast.success("Secrets vault unlocked!");
        onUnlock();
      } else {
        setError("Invalid password or TOTP code");
      }
    } catch (err: any) {
      setError(err.message || "Failed to unlock secrets vault");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup = () => {
    navigate("/secrets/setup");
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Secrets Vault</CardTitle>
            <CardDescription>
              Set up your secrets vault to store API keys, tokens, and other sensitive credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSetup} className="w-full" size="lg">
              <Key className="mr-2 h-4 w-4" />
              Set Up Secrets Vault
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Unlock Secrets Vault</CardTitle>
          <CardDescription>
            Enter your secrets password and 2FA code to access your API keys and tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Secrets Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your secrets password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {config?.totp_enabled && (
              <div className="space-y-2">
                <label htmlFor="totp" className="text-sm font-medium">
                  Two-Factor Code
                </label>
                <Input
                  id="totp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Unlocking..." : "Unlock Vault"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <a href="/dashboard" className="underline hover:text-primary">
                Back to Password Vault
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
