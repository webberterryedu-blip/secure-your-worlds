import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Key, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSecrets } from "@/hooks/useSecrets";
import { toast } from "sonner";
import { evaluatePasswordStrength, type PasswordStrength } from "@/lib/crypto";

export default function SecretsSetup() {
  const navigate = useNavigate();
  const { setupSecretsPassword, setupTOTP, isConfigured } = useSecrets();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enableTOTP, setEnableTOTP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already configured
  if (isConfigured) {
    navigate("/secrets");
    return null;
  }

  const passwordStrength = evaluatePasswordStrength(password);

  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getStrengthLabel = (strength: PasswordStrength) => {
    switch (strength) {
      case "weak":
        return "Weak";
      case "medium":
        return "Medium";
      case "strong":
        return "Strong";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await setupSecretsPassword(password);

      if (enableTOTP) {
        await setupTOTP();
        toast.success("TOTP enabled! You can now use it to access your secrets vault.");
      }

      toast.success("Secrets vault configured successfully!");
      navigate("/secrets");
    } catch (err: any) {
      setError(err.message || "Failed to set up secrets vault");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Secrets Vault</CardTitle>
          <CardDescription>
            Create a separate password to protect your API keys and tokens
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
              <Label htmlFor="password">Secrets Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {password && (
                <div className="space-y-1">
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all ${getStrengthColor(passwordStrength)}`}
                      style={{
                        width:
                          passwordStrength === "weak"
                            ? "33%"
                            : passwordStrength === "medium"
                            ? "66%"
                            : "100%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength: {getStrengthLabel(passwordStrength)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableTOTP"
                checked={enableTOTP}
                onCheckedChange={(checked) => setEnableTOTP(checked as boolean)}
              />
              <Label htmlFor="enableTOTP" className="text-sm font-normal">
                Enable Two-Factor Authentication (recommended)
              </Label>
            </div>

            {enableTOTP && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-medium">What is 2FA?</p>
                <p className="text-muted-foreground">
                  Two-Factor Authentication adds an extra layer of security. You'll need to enter a
                  code from an authenticator app (like Google Authenticator, Authy, or 1Password)
                  each time you access your secrets.
                </p>
              </div>
            )}

            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Why a separate password?</p>
                  <p className="text-muted-foreground">
                    Your secrets vault uses client-side encryption. Even if someone gains access to
                    your account, they cannot read your API keys without this separate password.
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Setting up..." : "Set Up Vault"}
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
