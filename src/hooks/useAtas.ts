import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreateAuditLog } from '@/hooks/useAuditLogs';

export interface ATA {
  id: string;
  n_ata: string;
  numero_termo?: string;
  pregao: string;
  processo_adm: string;
  processo_emp_afo: string;
  objeto: string;
  favorecido: string;
  valor: number;
  vencimento: string;
  data_inicio: string;
  data_validade: string;
  informacoes: string;
  saldo_disponivel: number;
  category: 'normal' | 'adesao' | 'aquisicao' | 'antigo';
  created_at: string;
  updated_at: string;
}

export interface CreateATAData {
  n_ata: string;
  numero_termo?: string;
  pregao: string;
  objeto: string;
  processo_adm?: string;
  processo_emp_afo?: string;
  favorecido?: string;
  valor?: number;
  vencimento?: string;
  informacoes?: string;
  saldo_disponivel?: number;
  category: 'normal' | 'adesao' | 'aquisicao' | 'antigo';
}

// Hook para estatísticas das ATAs
export const useAtasStats = () => {
  return useQuery({
    queryKey: ['atas-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_atas_stats_by_category');
      
      if (error) {
        console.error('Erro ao buscar estatísticas das ATAs:', error);
        throw error;
      }
      
      return data;
    },
  });
};

export const useAtas = () => {
  return useQuery({
    queryKey: ['atas'],
    queryFn: async () => {
      console.log('Buscando ATAs ativas...');
      const { data, error } = await supabase
        .from('atas')
        .select('*')
        .or('is_deleted.is.null,is_deleted.eq.false') // Incluir ATAs onde is_deleted é null ou false
        .order('n_ata', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar ATAs:', error);
        throw error;
      }
      
      console.log('ATAs encontradas:', data?.length);
      console.log('Primeira ATA:', data?.[0]);
      
      // Log específico para ATA 085/2025
      const ata085 = data?.find(ata => ata.n_ata === '085/2025');
      if (ata085) {
        console.log('ATA 085/2025 encontrada:', ata085);
      } else {
        console.log('ATA 085/2025 NÃO encontrada na lista');
        // Buscar especificamente a ATA 085/2025 para debug
        const { data: debugData } = await supabase
          .from('atas')
          .select('*')
          .eq('n_ata', '085/2025');
        console.log('Debug ATA 085/2025:', debugData);
      }
      
      return data as ATA[];
    },
    // Forçar refetch mais frequente para garantir dados atualizados
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
};

export const useCreateAta = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async (ata: CreateATAData) => {
      console.log('Criando ATA com categoria:', ata.category);
      
      // Verificar se ATA já existe na mesma categoria (apenas ATAs ativas)
      const { data: existing, error: checkError } = await supabase
        .from('atas')
        .select('id, n_ata')
        .eq('n_ata', ata.n_ata)
        .eq('category', ata.category)
        .neq('is_deleted', true)
        .maybeSingle(); // Usar maybeSingle para evitar erro se não encontrar

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar ATA existente:', checkError);
        // Não bloquear a criação por erro de verificação
      }

      if (existing) {
        const categoryNames = {
          normal: 'Atas de Registro de Preços',
          adesao: 'Adesões',
          antigo: 'Contratos Antigos',
          aquisicao: 'Aquisição Global'
        };
        throw new Error(`❌ Já existe uma ATA ativa com o número "${ata.n_ata}" na categoria ${categoryNames[ata.category]}!`);
      }

      // Calcular data de validade (1 ano a partir da data atual)
      const dataValidade = new Date();
      dataValidade.setFullYear(dataValidade.getFullYear() + 1);

      // Preparar dados para inserção, garantindo que a categoria seja salva corretamente
      const dataToInsert = {
        n_ata: ata.n_ata,
        pregao: ata.pregao || '',
        objeto: ata.objeto || '',
        processo_adm: ata.processo_adm || '',
        processo_emp_afo: ata.processo_emp_afo || '',
        favorecido: ata.favorecido || '',
        valor: ata.valor || 0,
        vencimento: ata.vencimento || null,
        informacoes: ata.informacoes || '',
        saldo_disponivel: ata.saldo_disponivel || ata.valor || 0,
        category: ata.category,
        data_validade: dataValidade.toISOString().split('T')[0],
        data_inicio: new Date().toISOString().split('T')[0],
        is_deleted: false
      };

      console.log('Dados a serem inseridos:', dataToInsert);

      const { data, error } = await supabase
        .from('atas')
        .insert(dataToInsert)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar ATA:', error);
        
        // Tratar erros específicos
        if (error.code === '23505') {
          throw new Error('❌ Já existe uma ATA com este número. Tente um número diferente.');
        } else if (error.message.includes('duplicate key')) {
          throw new Error('❌ Número de ATA duplicado. Use um número único.');
        } else if (error.message.includes('violates unique constraint')) {
          throw new Error('❌ Este número de ATA já está em uso. Escolha outro número.');
        } else {
          throw new Error(`❌ Erro ao criar ATA: ${error.message}`);
        }
      }

      console.log('ATA criada com sucesso:', data);

      // Log de auditoria (assíncrono para não bloquear)
      setTimeout(() => {
        try {
          createAuditLog.mutate({
            action: 'CREATE',
            table_name: 'atas',
            record_id: data.id,
            new_data: data
          });
        } catch (auditError) {
          console.warn('Erro ao criar log de auditoria:', auditError);
          // Não falhar a criação da ATA por erro de auditoria
        }
      }, 100);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['atas'] });
      queryClient.invalidateQueries({ queryKey: ['atas-stats'] });
      
      const categoryNames = {
        normal: 'ATA',
        adesao: 'Adesão',
        antigo: 'Contrato Antigo',
        aquisicao: 'Aquisição Global'
      };
      
      toast({
        title: "✅ Sucesso!",
        description: `${categoryNames[data.category]} "${data.n_ata}" foi criada com sucesso!`,
      });
    },
    onError: (error: Error) => {
      console.error('Erro na criação da ATA:', error);
      toast({
        title: "❌ Erro ao criar ATA",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAta = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async (ata: ATA) => {
      console.log('Atualizando ATA:', ata);
      
      // Buscar dados antigos para auditoria
      const { data: oldData } = await supabase
        .from('atas')
        .select('*')
        .eq('id', ata.id)
        .single();

      console.log('Dados antigos:', oldData);

      const { data, error } = await supabase
        .from('atas')
        .update({
          n_ata: ata.n_ata,
          pregao: ata.pregao,
          processo_adm: ata.processo_adm,
          processo_emp_afo: ata.processo_emp_afo,
          objeto: ata.objeto,
          favorecido: ata.favorecido,
          valor: ata.valor,
          vencimento: ata.vencimento || null,
          informacoes: ata.informacoes,
          saldo_disponivel: ata.saldo_disponivel,
          category: ata.category
        })
        .eq('id', ata.id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar ATA:', error);
        throw error;
      }

      console.log('ATA atualizada com sucesso:', data);

      // Log de auditoria
      createAuditLog.mutate({
        action: 'UPDATE',
        table_name: 'atas',
        record_id: ata.id,
        old_data: oldData,
        new_data: data
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atas'] });
      queryClient.invalidateQueries({ queryKey: ['atas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "✅ ATA atualizada",
        description: "ATA foi atualizada com sucesso!",
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

export const useDeleteAta = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async ({ id, justification }: { id: string; justification: string }) => {
      // Buscar dados da ATA antes de mover para lixeira
      const { data: ataData } = await supabase
        .from('atas')
        .select('*')
        .eq('id', id)
        .single();

      if (!ataData) {
        throw new Error('❌ ATA não encontrada');
      }

      // Buscar pedidos associados
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, status, valor')
        .eq('ata_id', id);

      console.log(`Movendo ATA ${ataData.n_ata} para lixeira com ${pedidos?.length || 0} pedidos associados`);

      // Mover ATA para lixeira usando a função do sistema
      const { data: moveResult, error: moveError } = await supabase.rpc('move_to_trash', {
        p_table_name: 'atas',
        p_record_id: id
      });
      
      if (moveError) {
        console.error('Erro ao mover ATA para lixeira:', moveError);
        throw moveError;
      }

      console.log('Resultado da função move_to_trash:', moveResult);
      
      // A função pode retornar true, false, ou null dependendo do resultado
      if (moveResult === false) {
        throw new Error('❌ ATA não encontrada ou já está na lixeira');
      }

      // Mover pedidos associados para lixeira também
      if (pedidos && pedidos.length > 0) {
        for (const pedido of pedidos) {
          const { error: pedidoError } = await supabase.rpc('move_to_trash', {
            p_table_name: 'pedidos',
            p_record_id: pedido.id
          });
          
          if (pedidoError) {
            console.error(`Erro ao mover pedido ${pedido.id} para lixeira:`, pedidoError);
          }
        }
      }

      // Log de auditoria com informações sobre pedidos
      const auditData = {
        ...ataData,
        pedidos_movidos: pedidos?.length || 0,
        total_valor_pedidos: pedidos?.reduce((sum, p) => sum + (p.valor || 0), 0) || 0
      };

      createAuditLog.mutate({
        action: 'MOVED_TO_TRASH',
        table_name: 'atas',
        record_id: id,
        old_data: auditData,
        justification: `${justification} - ATA movida para lixeira com ${pedidos?.length || 0} pedidos associados`
      });
      
      return { success: true, pedidosMovidos: pedidos?.length || 0 };
    },
    onSuccess: (result) => {
      // Invalidar e forçar refetch imediato
      queryClient.invalidateQueries({ queryKey: ['atas'] });
      queryClient.invalidateQueries({ queryKey: ['atas-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      
      // Forçar refetch imediato
      queryClient.refetchQueries({ queryKey: ['atas'] });
      
      const message = result.pedidosMovidos > 0 
        ? `✅ ATA e ${result.pedidosMovidos} pedidos associados foram movidos para a lixeira!`
        : '✅ ATA foi movida para a lixeira com sucesso!';
        
      toast({
        title: "ATA movida para lixeira",
        description: message,
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
