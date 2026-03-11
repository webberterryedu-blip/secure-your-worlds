/**
 * Two-Factor Authentication Verification Component
 * Dialog for verifying 2FA token during login
 */

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { verify2FAToken } from "@/lib/2fa";
import { useVaultStore } from "@/stores/vaultStore";

interface TwoFactorVerifyProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export function TwoFactorVerify({ isOpen, onClose, onVerified }: TwoFactorVerifyProps) {
  const { masterPassword, decrypt2FASecret, set2FAVerified } = useVaultStore();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!token) {
      toast.error("Please enter the 6-digit code.");
      return;
    }
    if (!masterPassword) {
      toast.error("Master password not set. Cannot verify 2FA.");
      onClose();
      return;
    }

    setLoading(true);
    try {
      const secret = await decrypt2FASecret();
      if (!secret) {
        toast.error("2FA secret not found or decryption error.");
        onClose();
        return;
      }

      const isValid = verify2FAToken(token, secret);
      if (isValid) {
        set2FAVerified(true);
        toast.success("2FA verification successful!");
        onVerified();
        onClose();
      } else {
        toast.error("Invalid 2FA code. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      toast.error("Error verifying 2FA.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && token.length === 6) {
      handleVerify();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication (2FA)</DialogTitle>
          <DialogDescription>
            Please enter the 6-digit code from your authenticator app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="6-digit code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={handleKeyPress}
            maxLength={6}
            className="text-center text-lg tracking-widest font-mono"
            autoFocus
          />
          <Button 
            onClick={handleVerify} 
            disabled={loading || token.length !== 6} 
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
