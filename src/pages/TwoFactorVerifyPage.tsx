/**
 * 2FA Verification Page
 * Standalone page for 2FA verification
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TwoFactorVerify } from "@/components/TwoFactorVerify";
import { useVaultStore } from "@/stores/vaultStore";
import { Shield } from "lucide-react";

export default function TwoFactorVerifyPage() {
  const navigate = useNavigate();
  const { setMasterPassword } = useVaultStore();
  const [isVerifyOpen, setIsVerifyOpen] = useState(true);

  const handleVerified = () => {
    // After verification, redirect to dashboard
    navigate("/dashboard");
  };

  const handleClose = () => {
    // If user closes without verifying, stay on the page
    setIsVerifyOpen(true);
  };

  // If user needs to enter master password first
  const handleMasterPasswordSubmit = (password: string) => {
    setMasterPassword(password);
    setIsVerifyOpen(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Please verify your identity to continue
          </p>
        </div>

        <TwoFactorVerify
          isOpen={isVerifyOpen}
          onClose={handleClose}
          onVerified={handleVerified}
        />
      </div>
    </div>
  );
}
