import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import React from "react";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import {
  encryptSecret,
  decryptSecret,
  hashSecretsPassword,
  verifySecretsPassword,
  generateTOTPSecret,
  generateTOTPCode,
  verifyTOTP,
  type SecretType,
} from "@/lib/secretsCrypto";

export type Secret = Tables<"secrets">;
export type SecretInsert = Omit<TablesInsert<"secrets">, "user_id">;
export type SecretUpdate = TablesUpdate<"secrets">;

export type UserSecretsConfig = Tables<"user_secrets_config">;

interface SecretsState {
  isUnlocked: boolean;
  secretsPassword: string | null;
}

/**
 * Hook for managing secrets vault
 */
export function useSecrets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [secretsState, setSecretsState] = React.useState<SecretsState>({
    isUnlocked: false,
    secretsPassword: null,
  });

  // Query for secrets
  const secretsQuery = useQuery({
    queryKey: ["secrets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("secrets")
        .select("*")
        .order("service_name", { ascending: true });
      if (error) throw error;
      return data as Secret[];
    },
    enabled: !!user && secretsState.isUnlocked,
  });

  // Query for user secrets config
  const configQuery = useQuery({
    queryKey: ["userSecretsConfig"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_secrets_config")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as UserSecretsConfig;
    },
    enabled: !!user,
  });

  // Add secret mutation
  const addMutation = useMutation({
    mutationFn: async (secret: {
      service_name: string;
      token_name: string;
      value: string;
      secret_type: SecretType;
      description?: string;
      expires_at?: string;
    }) => {
      if (!secretsState.secretsPassword) {
        throw new Error("Secrets vault is locked");
      }

      const { encryptedValue, iv, salt } = await encryptSecret(
        secret.value,
        secretsState.secretsPassword
      );

      const { error } = await supabase.from("secrets").insert({
        service_name: secret.service_name,
        token_name: secret.token_name,
        encrypted_value: encryptedValue,
        iv,
        salt,
        secret_type: secret.secret_type,
        description: secret.description || null,
        expires_at: secret.expires_at || null,
        user_id: user!.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets"] });
      toast.success("Secret added successfully!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update secret mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: SecretUpdate & { id: string; value?: string }) => {
      let finalUpdates = { ...updates };

      if (updates.value && secretsState.secretsPassword) {
        const { encryptedValue, iv, salt } = await encryptSecret(
          updates.value,
          secretsState.secretsPassword
        );
        finalUpdates = {
          ...updates,
          encrypted_value: encryptedValue,
          iv,
          salt,
        };
      }

      const { error } = await supabase
        .from("secrets")
        .update(finalUpdates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets"] });
      toast.success("Secret updated successfully!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete secret mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("secrets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets"] });
      toast.success("Secret deleted successfully!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Setup secrets password
  const setupSecretsPassword = useMutation({
    mutationFn: async (password: string) => {
      const { hash, salt } = await hashSecretsPassword(password);

      const { error } = await supabase.from("user_secrets_config").upsert({
        user_id: user!.id,
        secrets_password_hash: hash,
        secrets_password_salt: salt,
        auto_lock_minutes: 5,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSecretsConfig"] });
      toast.success("Secrets password configured!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Unlock secrets vault
  const unlock = async (password: string, totpCode?: string): Promise<boolean> => {
    const config = configQuery.data;
    if (!config) {
      toast.error("Secrets not configured. Please set up your secrets password first.");
      return false;
    }

    // Verify password
    const isValid = await verifySecretsPassword(
      password,
      config.secrets_password_hash,
      config.secrets_password_salt
    );

    if (!isValid) {
      toast.error("Invalid password");
      return false;
    }

    // Verify TOTP if enabled
    if (config.totp_enabled && config.totp_secret) {
      const isTotpValid = await verifyTOTP(config.totp_secret, totpCode || "");
      if (!isTotpValid) {
        toast.error("Invalid TOTP code");
        return false;
      }
    }

    setSecretsState({
      isUnlocked: true,
      secretsPassword: password,
    });

    return true;
  };

  // Lock secrets vault
  const lock = () => {
    setSecretsState({
      isUnlocked: false,
      secretsPassword: null,
    });
  };

  // Decrypt a secret value
  const decryptSecretValue = async (secret: Secret): Promise<string> => {
    if (!secretsState.secretsPassword) {
      throw new Error("Secrets vault is locked");
    }

    return decryptSecret(
      secret.encrypted_value,
      secret.iv,
      secret.salt,
      secretsState.secretsPassword
    );
  };

  // Setup TOTP
  const setupTOTP = useMutation({
    mutationFn: async () => {
      const secret = generateTOTPSecret();

      const { error } = await supabase
        .from("user_secrets_config")
        .update({
          totp_secret: secret,
          totp_enabled: true,
        })
        .eq("user_id", user!.id);

      if (error) throw error;

      return secret;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSecretsConfig"] });
      toast.success("TOTP enabled! Save your secret key.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Disable TOTP
  const disableTOTP = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_secrets_config")
        .update({
          totp_secret: null,
          totp_enabled: false,
        })
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSecretsConfig"] });
      toast.success("TOTP disabled!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    // Data
    secrets: secretsQuery.data ?? [],
    isLoading: secretsQuery.isLoading,
    config: configQuery.data,
    isConfigured: !!configQuery.data,
    isUnlocked: secretsState.isUnlocked,

    // Actions
    addSecret: addMutation.mutateAsync,
    updateSecret: updateMutation.mutateAsync,
    deleteSecret: deleteMutation.mutateAsync,
    decryptSecretValue,
    unlock,
    lock,
    setupSecretsPassword: setupSecretsPassword.mutateAsync,
    setupTOTP: setupTOTP.mutateAsync,
    disableTOTP: disableTOTP.mutateAsync,

    // Mutations
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
