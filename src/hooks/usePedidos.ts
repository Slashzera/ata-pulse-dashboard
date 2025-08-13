import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreateAuditLog } from '@/hooks/useAuditLogs';

export interface Pedido {
  id: string;
  ata_id: string;
  departamento: string;
  descricao: string;
  valor: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'finalizado';
  observacoes: string;
  data_solicitacao: string;
  created_at: string;
  updated_at: string;
  ata_category?: string;
  ata_number?: string;
}

export interface CreatePedidoData {
  ata_id: string;
  departamento: string;
  descricao: string;
  valor: number;
  observacoes?: string;
  data_solicitacao: string;
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'finalizado';
}

export const usePedidos = (category?: string) => {
  return useQuery({
    queryKey: ['pedidos', category],
    queryFn: async () => {
      console.log('Buscando pedidos para categoria:', category);
      
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          atas!inner (
            n_ata,
            category,
            favorecido,
            saldo_disponivel
          )
        `)
        .neq('is_deleted', true)
        .order('created_at', { ascending: false });

      // Filtrar por categoria específica se especificada e não for 'all'
      if (category && category !== 'all') {
        query = query.eq('atas.category', category);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        throw error;
      }
      
      // Mapear os dados com verificação de categoria
      const pedidosWithCategory = data
        .filter(item => {
          // Se uma categoria específica foi solicitada, só retornar pedidos dessa categoria
          if (category && category !== 'all') {
            return item.atas.category === category;
          }
          return true;
        })
        .map(item => ({
          id: item.id,
          ata_id: item.ata_id,
          departamento: item.departamento,
          descricao: item.descricao,
          valor: item.valor,
          status: item.status,
          observacoes: item.observacoes || '',
          data_solicitacao: item.data_solicitacao,
          created_at: item.created_at,
          updated_at: item.updated_at,
          ata_category: item.atas.category,
          ata_number: item.atas.n_ata
        }));
      
      console.log('Pedidos carregados para categoria', category, ':', pedidosWithCategory);
      return pedidosWithCategory as Pedido[];
    },
  });
};

export const useCreatePedido = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async (pedido: CreatePedidoData) => {
      console.log('Criando pedido:', pedido);
      
      const { data, error } = await supabase
        .from('pedidos')
        .insert(pedido)
        .select(`
          *,
          atas!inner(
            n_ata,
            category
          )
        `)
        .single();
      
      if (error) {
        console.error('Erro ao criar pedido:', error);
        if (error.message.includes('Saldo insuficiente')) {
          throw new Error('❌ Saldo insuficiente na ATA selecionada para criar este pedido!');
        }
        throw error;
      }

      createAuditLog.mutate({
        action: 'CREATE',
        table_name: 'pedidos',
        record_id: data.id,
        new_data: data
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['atas'] });
      toast({
        title: "✅ Pedido criado",
        description: "Novo pedido foi criado e o saldo da ATA foi atualizado automaticamente!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePedido = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async (pedido: Pedido) => {
      console.log('Atualizando pedido:', pedido);
      
      const { data: oldData } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedido.id)
        .single();

      const { data, error } = await supabase
        .from('pedidos')
        .update({
          departamento: pedido.departamento,
          descricao: pedido.descricao,
          valor: pedido.valor,
          status: pedido.status,
          observacoes: pedido.observacoes,
          data_solicitacao: pedido.data_solicitacao
        })
        .eq('id', pedido.id)
        .select(`
          *,
          atas!inner(
            n_ata,
            category
          )
        `)
        .single();
      
      if (error) {
        console.error('Erro ao atualizar pedido:', error);
        if (error.message.includes('Saldo insuficiente')) {
          throw new Error('❌ Saldo insuficiente na ATA para o novo valor do pedido!');
        }
        throw error;
      }

      createAuditLog.mutate({
        action: 'UPDATE',
        table_name: 'pedidos',
        record_id: pedido.id,
        old_data: oldData,
        new_data: data
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['atas'] });
      toast({
        title: "✅ Pedido atualizado",
        description: "Pedido foi atualizado e o saldo da ATA foi ajustado automaticamente!",
      });
    },
    onError: (error: Error) => {
      console.error('Erro na mutation:', error);
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeletePedido = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async ({ id, justification }: { id: string; justification: string }) => {
      console.log('Movendo pedido para lixeira:', id);
      
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select(`
          *,
          atas!inner(
            n_ata,
            saldo_disponivel
          )
        `)
        .eq('id', id)
        .single();

      if (pedidoError) {
        console.error('Erro ao buscar pedido:', pedidoError);
        throw pedidoError;
      }

      // Mover pedido para lixeira usando a função do sistema
      const { data: moveResult, error: moveError } = await supabase.rpc('move_to_trash', {
        p_table_name: 'pedidos',
        p_record_id: id
      });
      
      if (moveError) {
        console.error('Erro ao mover pedido para lixeira:', moveError);
        throw moveError;
      }

      console.log('Resultado da função move_to_trash para pedido:', moveResult);
      
      // A função pode retornar true, false, ou null dependendo do resultado
      if (moveResult === false) {
        throw new Error('❌ Pedido não encontrado ou já está na lixeira');
      }

      createAuditLog.mutate({
        action: 'MOVED_TO_TRASH',
        table_name: 'pedidos',
        record_id: id,
        old_data: pedido,
        justification: justification
      });
      
      return { pedido, valorDevolvido: pedido.valor };
    },
    onSuccess: (result) => {
      // Invalidar e forçar refetch imediato
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['atas'] });
      
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['pedidos'] });
      
      toast({
        title: "✅ Pedido movido para lixeira",
        description: `Pedido foi movido para a lixeira. Acesse a lixeira para restaurar ou excluir permanentemente.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
