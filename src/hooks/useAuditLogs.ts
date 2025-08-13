
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  justification: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface CreateAuditLogData {
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
  justification?: string;
}

export const useAuditLogs = () => {
  return useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar logs de auditoria:', error);
        throw error;
      }
      
      return data as AuditLog[];
    },
  });
};

export const useCreateAuditLog = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (logData: CreateAuditLogData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          ...logData,
          user_id: user.id,
          user_email: user.email,
          ip_address: 'N/A', // Em produção, seria necessário capturar o IP real
          user_agent: navigator.userAgent
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar log de auditoria:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
