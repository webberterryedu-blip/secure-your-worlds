/**
 * Reset Password Page
 * Allows users to set a new password using the reset token from email
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, AlertTriangle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateUserPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      navigate("/auth");
    }
  }, [accessToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    if (password.length < 6) {
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(password);
      navigate("/auth");
    } catch (error) {
      // Error already handled in AuthContext with toast
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= 6 && passwordsMatch;

  if (!accessToken) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Reset Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Set your new password to access VaultKey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Attention: Master Password!</AlertTitle>
            <AlertDescription>
              Resetting your login password <strong>does NOT</strong> reset your Master Password. You will still need the original Master Password to decrypt your credentials.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm New Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input border-border text-foreground"
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !isValid}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
