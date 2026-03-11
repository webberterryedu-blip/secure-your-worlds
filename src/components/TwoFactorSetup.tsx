/**
 * Two-Factor Authentication Setup Component
 * Dialog for setting up 2FA with QR code verification
 */

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generate2FASecret, generate2FAQRCodeUrl, verify2FAToken } from "@/lib/2fa";
import { useVaultStore } from "@/stores/vaultStore";
import { QRCodeSVG } from "qrcode.react";

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

export function TwoFactorSetup({ isOpen, onClose, onSetupComplete }: TwoFactorSetupProps) {
  const { masterPassword, encryptAndSet2FASecret } = useVaultStore();
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // 1: Generate Secret, 2: Verify
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && masterPassword && step === 1) {
      generateNewSecret();
    }
  }, [isOpen, masterPassword, step]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSecret(null);
      setVerificationToken("");
      setStep(1);
    }
  }, [isOpen]);

  const generateNewSecret = () => {
    setLoading(true);
    try {
      const newSecret = generate2FASecret();
      setSecret(newSecret);
      setLoading(false);
    } catch (error) {
      console.error("Error generating 2FA secret:", error);
      toast.error("Error generating 2FA secret.");
      setLoading(false);
      onClose();
    }
  };

  const handleVerify = async () => {
    if (!secret || !verificationToken) {
      toast.error("Please enter the verification code.");
      return;
    }
    if (!masterPassword) {
      toast.error("Master password not set. Cannot enable 2FA.");
      return;
    }

    setLoading(true);
    try {
      const isValid = verify2FAToken(verificationToken, secret);
      if (isValid) {
        // Encrypt and save the 2FA secret
        await encryptAndSet2FASecret(secret, masterPassword);
        toast.success("2FA enabled successfully!");
        onSetupComplete();
        onClose();
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      toast.error("Error enabling 2FA.");
    } finally {
      setLoading(false);
    }
  };

  const userEmail = "user@example.com"; // TODO: Get from auth context
  const otpAuthUrl = secret ? generate2FAQRCodeUrl(secret, userEmail) : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Two-Factor Authentication (2FA)</DialogTitle>
          <DialogDescription>
            Protect your account with a second factor of authentication.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 text-center">
            <p className="text-sm">1. Scan the QR Code with your authenticator app (e.g., Google Authenticator, Authy).</p>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <p>Generating QR Code...</p>
              </div>
            ) : (
              secret && (
                <div className="flex justify-center rounded-lg bg-white p-4 dark:bg-black">
                  <QRCodeSVG value={otpAuthUrl} size={200} level="H" />
                </div>
              )
            )}
            <p className="text-sm text-muted-foreground">
              Or enter the code manually: <strong className="font-mono">{secret}</strong>
            </p>
            <Button onClick={() => setStep(2)} disabled={loading || !secret} className="w-full">
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm">2. Enter the 6-digit code from your authenticator app to verify.</p>
            <Input
              placeholder="6-digit code"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
            />
            <Button onClick={handleVerify} disabled={loading || verificationToken.length !== 6} className="w-full">
              {loading ? "Verifying..." : "Verify and Enable 2FA"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setStep(1)} 
              disabled={loading}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
