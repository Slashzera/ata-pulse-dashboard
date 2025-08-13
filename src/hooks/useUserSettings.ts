
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  expiration_alert_months: number;
  notification_email: string;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  return useQuery({
    queryKey: ['user_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Erro ao buscar configurações:', error);
        throw error;
      }
      
      return data as UserSettings;
    },
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar configurações:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
      toast({
        title: "Configurações atualizadas",
        description: "Suas configurações foram salvas com sucesso!",
      });
    },
  });
};
