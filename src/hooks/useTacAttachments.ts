import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface TacAttachment {
  id: string;
  tac_id: number;
  arquivo_url: string;
  nome_arquivo: string;
  tamanho_arquivo: number | null;
  created_at: string;
  user_id: string;
}

// Hook para buscar anexos de um TAC específico
export function useTacAttachments(tacId: number | null) {
  return useQuery<TacAttachment[], Error>({
    queryKey: ['tac-attachments', tacId],
    queryFn: async () => {
      if (!tacId) return [];
      
      const { data, error } = await supabase
        .from('tac_attachments')
        .select('*')
        .eq('tac_id', tacId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar anexos do TAC:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!tacId,
  });
}

// Hook para adicionar um novo anexo a um TAC
export function useAddTacAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      tacId,
      file,
    }: {
      tacId: number;
      file: File;
    }) => {
      // Verificar se o arquivo é PDF
      if (file.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são permitidos.');
      }

      // Gerar nome único para o arquivo
      const fileName = `${uuidv4()}-${file.name}`;
      
      // Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from('tacs')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Erro no upload do arquivo: ${uploadError.message}`);
      }

      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Inserir registro na tabela de anexos
      const { data, error } = await supabase
        .from('tac_attachments')
        .insert({
          tac_id: tacId,
          arquivo_url: fileName,
          nome_arquivo: file.name,
          tamanho_arquivo: file.size,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        // Se a inserção falhar, remover o arquivo do storage
        await supabase.storage.from('tacs').remove([fileName]);
        throw new Error(`Erro ao salvar anexo: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar cache dos anexos do TAC
      queryClient.invalidateQueries({ queryKey: ['tac-attachments', variables.tacId] });
    },
  });
}

// Hook para deletar um anexo
export function useDeleteTacAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      attachmentId,
      arquivoUrl,
      tacId,
    }: {
      attachmentId: string;
      arquivoUrl: string;
      tacId: number;
    }) => {
      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('tacs')
        .remove([arquivoUrl]);
      
      if (storageError) {
        console.error('Erro ao deletar arquivo do storage:', storageError.message);
      }

      // Deletar registro da tabela
      const { error } = await supabase
        .from('tac_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) {
        throw new Error(`Erro ao deletar anexo: ${error.message}`);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar cache dos anexos do TAC
      queryClient.invalidateQueries({ queryKey: ['tac-attachments', variables.tacId] });
    },
  });
}