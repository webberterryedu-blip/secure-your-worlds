import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Credential = Tables<"credentials">;
export type CredentialInsert = Omit<TablesInsert<"credentials">, "user_id">;
export type CredentialUpdate = TablesUpdate<"credentials">;

export function useCredentials() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Credential[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (cred: CredentialInsert) => {
      const { error } = await supabase
        .from("credentials")
        .insert({ ...cred, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial adicionada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: CredentialUpdate & { id: string }) => {
      const { error } = await supabase
        .from("credentials")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial atualizada!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credencial removida!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("credentials")
        .update({ is_favorite: !is_favorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["credentials"] }),
    onError: (err: any) => toast.error(err.message),
  });

  return {
    credentials: query.data ?? [],
    isLoading: query.isLoading,
    addCredential: addMutation.mutateAsync,
    updateCredential: updateMutation.mutateAsync,
    deleteCredential: deleteMutation.mutateAsync,
    toggleFavorite: toggleFavorite.mutate,
  };
}
