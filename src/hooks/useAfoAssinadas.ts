
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AfoAssinadaFile {
  id: string;
  user_id: string;
  nome_arquivo: string;
  tamanho_arquivo: number;
  url_arquivo: string;
  data_upload: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAfoAssinadaData {
  nome_arquivo: string;
  tamanho_arquivo: number;
  url_arquivo: string;
}

export const useAfoAssinadas = () => {
  return useQuery({
    queryKey: ['afo_assinadas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('afo_assinadas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar AFO assinadas:', error);
        throw error;
      }
      
      return data as AfoAssinadaFile[];
    },
  });
};

export const useCreateAfoAssinada = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fileData: CreateAfoAssinadaData) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('afo_assinadas')
        .insert({
          ...fileData,
          user_id: userData.user.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao salvar AFO assinada:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afo_assinadas'] });
      toast({
        title: "Arquivo salvo",
        description: "Arquivo PDF foi salvo com sucesso!",
      });
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

export const useDeleteAfoAssinada = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('afo_assinadas')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar AFO assinada:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['afo_assinadas'] });
      toast({
        title: "Arquivo excluído",
        description: "Arquivo foi excluído com sucesso!",
      });
    },
  });
};

export const uploadPdfToStorage = async (file: File): Promise<string> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Usuário não autenticado');

  const fileExt = file.name.split('.').pop();
  const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('afo-assinadas')
    .upload(fileName, file);

  if (error) {
    console.error('Erro no upload:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('afo-assinadas')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};
