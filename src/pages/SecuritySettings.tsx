/**
 * Security Settings Page
 * Page for managing 2FA and other security settings
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { useVaultStore } from "@/stores/vaultStore";
import { toast } from "sonner";
import { Shield, AlertTriangle } from "lucide-react";

export function SecuritySettings() {
  const { is2FAEnabled, set2FAEnabled, clear2FASecret } = useVaultStore();
  const [isTwoFactorSetupOpen, setIsTwoFactorSetupOpen] = useState(false);

  const handleToggle2FA = () => {
    if (is2FAEnabled) {
      // Disable 2FA
      clear2FASecret();
      toast.info("2FA disabled. Remember to remove the account from your authenticator app.");
    } else {
      // Enable 2FA
      setIsTwoFactorSetupOpen(true);
    }
  };

  const handle2FASetupComplete = () => {
    toast.success("2FA configuration complete!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Security Settings</h2>
        <p className="text-muted-foreground">Manage your VaultKey security settings.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="2fa-mode"
              checked={is2FAEnabled}
              onCheckedChange={handleToggle2FA}
            />
            <Label htmlFor="2fa-mode">
              {is2FAEnabled ? "2FA Enabled" : "2FA Disabled"}
            </Label>
          </div>
          {!is2FAEnabled && (
            <Button onClick={() => setIsTwoFactorSetupOpen(true)}>
              Setup 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>Use a strong, unique master password</li>
            <li>Enable two-factor authentication</li>
            <li>Never share your master password or 2FA codes</li>
            <li>Regularly backup your vault data</li>
            <li>Use different passwords for each service</li>
          </ul>
        </CardContent>
      </Card>

      <TwoFactorSetup
        isOpen={isTwoFactorSetupOpen}
        onClose={() => setIsTwoFactorSetupOpen(false)}
        onSetupComplete={handle2FASetupComplete}
      />
    </div>
  );
}

export default SecuritySettings;
