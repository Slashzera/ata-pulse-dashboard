
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AfoControle {
  id: string;
  numero_afo: string;
  favorecido: string;
  adesao_ata: string | null;
  numero_processo: string | null;
  arp_numero: string | null;
  tipo_pregao: string | null;
  numero_pregao: string | null;
  data_emissao: string | null;
  valor_total: number | null;
  feito_por: string | null;
  ano: number;
  arquivo_pdf: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAfoControleData {
  numero_afo: string;
  favorecido: string;
  adesao_ata?: string;
  numero_processo?: string;
  arp_numero?: string;
  tipo_pregao?: string;
  numero_pregao?: string;
  data_emissao?: string;
  valor_total?: number;
  feito_por?: string;
  ano: number;
  arquivo_pdf?: string;
}

export const useAfoControle = (ano?: number) => {
  return useQuery({
    queryKey: ['afo_controle', ano],
    queryFn: async () => {
      let query = supabase
        .from('afo_controle')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ano) {
        query = query.eq('ano', ano);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar AFO controle:', error);
        throw error;
      }
      
      return data as AfoControle[];
    },
  });
};

export const useCreateAfoControle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (afoData: CreateAfoControleData) => {
      console.log('Criando AFO com dados:', afoData);
      
      const { data, error } = await supabase
        .from('afo_controle')
        .insert(afoData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar AFO:', error);
        throw error;
      }
      
      console.log('AFO criada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afo_controle'] });
      toast({
        title: "AFO criada",
        description: "Nova AFO foi criada com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error('Erro na criação da AFO:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAfoControle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AfoControle> & { id: string }) => {
      console.log('Atualizando AFO ID:', id);
      console.log('Dados de atualização:', updates);
      
      const { data, error } = await supabase
        .from('afo_controle')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar AFO:', error);
        throw error;
      }
      
      console.log('AFO atualizada com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afo_controle'] });
      toast({
        title: "AFO atualizada",
        description: "AFO foi atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error('Erro na atualização da AFO:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAfoControle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deletando AFO ID:', id);
      
      const { error } = await supabase
        .from('afo_controle')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar AFO:', error);
        throw error;
      }
      
      console.log('AFO deletada com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afo_controle'] });
      toast({
        title: "AFO excluída",
        description: "AFO foi excluída com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error('Erro na exclusão da AFO:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
