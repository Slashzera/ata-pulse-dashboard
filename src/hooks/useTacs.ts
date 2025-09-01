import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Caminho corrigido
import { v4 as uuidv4 } from 'uuid';

export interface TAC {
  id: string;
  created_at: string;
  nome_empresa: string;
  numero_processo: string;
  data_entrada: string;
  assunto_objeto: string;
  n_notas: number;
  valor: number;
  unidade_beneficiada: string;
  arquivo_url: string;
  user_id: string;
  profiles?: {
    nome: string;
  };
}

// Hook para buscar todos os TACs do Supabase
export function useTacs() {
  return useQuery<TAC[], Error>({
    queryKey: ['tacs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tacs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar TACs:', error);
        throw new Error(error.message);
      }
      return data || [];
    },
  });
}

// Hook para deletar um TAC do Supabase
export function useDeleteTac() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; arquivo_url: string }>({
    mutationFn: async ({ id, arquivo_url }) => {
      if (arquivo_url) {
        const { error: storageError } = await supabase.storage.from('tacs').remove([arquivo_url]);
        if (storageError) {
          console.error('Erro ao deletar arquivo do storage:', storageError.message);
        }
      }
      const { error } = await supabase.from('tacs').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tacs'] });
    },
  });
}

// Hook para criar um novo TAC no Supabase
export function useCreateTac() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTac: {
      nomeEmpresa: string;
      numeroProcesso: string;
      dataEntrada: string;
      assuntoObjeto: string;
      nNotas: number;
      valor: number;
      unidadeBeneficiada: string;
      file: File;
      additionalFiles?: File[];
    }) => {
      // Upload do arquivo principal
      const fileName = `${uuidv4()}-${newTac.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('tacs')
        .upload(fileName, newTac.file);

      if (uploadError) {
        throw new Error(`Erro no upload do arquivo: ${uploadError.message}`);
      }

      // Obter usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      // Inserir TAC principal
      const { data, error } = await supabase.from('tacs').insert({
        nome_empresa: newTac.nomeEmpresa,
        numero_processo: newTac.numeroProcesso,
        data_entrada: newTac.dataEntrada,
        assunto_objeto: newTac.assuntoObjeto,
        n_notas: newTac.nNotas,
        valor: newTac.valor,
        unidade_beneficiada: newTac.unidadeBeneficiada,
        arquivo_url: fileName,
        user_id: user.id,
      }).select().single();

      if (error) {
        // Se a inserção no banco falhar, remove o arquivo que já foi salvo
        await supabase.storage.from('tacs').remove([fileName]);
        console.error('Erro ao inserir TAC:', error);
        throw new Error(`Erro ao salvar no banco de dados: ${error.message}`);
      }

      // Upload dos arquivos adicionais, se houver
      if (newTac.additionalFiles && newTac.additionalFiles.length > 0) {
        const uploadedAttachments: string[] = [];
        
        try {
          for (const additionalFile of newTac.additionalFiles) {
            const additionalFileName = `${uuidv4()}-${additionalFile.name}`;
            
            // Upload do arquivo adicional
            const { error: additionalUploadError } = await supabase.storage
              .from('tacs')
              .upload(additionalFileName, additionalFile);

            if (additionalUploadError) {
              throw new Error(`Erro no upload do arquivo ${additionalFile.name}: ${additionalUploadError.message}`);
            }

            uploadedAttachments.push(additionalFileName);

            // Inserir registro na tabela de anexos
            const { error: attachmentError } = await supabase
              .from('tac_attachments')
              .insert({
                tac_id: data.id,
                arquivo_url: additionalFileName,
                nome_arquivo: additionalFile.name,
                tamanho_arquivo: additionalFile.size,
                user_id: user.id,
              });

            if (attachmentError) {
              throw new Error(`Erro ao salvar anexo ${additionalFile.name}: ${attachmentError.message}`);
            }
          }
        } catch (attachmentError) {
          // Se houver erro com anexos, limpar arquivos já enviados
          if (uploadedAttachments.length > 0) {
            await supabase.storage.from('tacs').remove(uploadedAttachments);
          }
          // Também remover o TAC e arquivo principal
          await supabase.from('tacs').delete().eq('id', data.id);
          await supabase.storage.from('tacs').remove([fileName]);
          throw attachmentError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tacs'] });
    },
  });
}

// Hook para atualizar um TAC existente
export function useUpdateTac() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedTac: {
      id: string;
      nome_empresa: string;
      numero_processo: string;
      data_entrada: string;
      assunto_objeto: string;
      n_notas: number;
      valor: number;
      unidade_beneficiada: string;
    }) => {
      console.log('Iniciando atualização do TAC:', updatedTac);

      // Verificar se o TAC existe antes de tentar atualizar
      const { data: existingTac, error: checkError } = await supabase
        .from('tacs')
        .select('id')
        .eq('id', updatedTac.id)
        .single();

      if (checkError) {
        console.error('Erro ao verificar TAC existente:', checkError);
        throw new Error(`TAC não encontrado: ${checkError.message}`);
      }

      if (!existingTac) {
        throw new Error('TAC não encontrado no sistema');
      }

      // Preparar dados para atualização
      const updateData = {
        nome_empresa: updatedTac.nome_empresa.trim(),
        numero_processo: updatedTac.numero_processo.trim(),
        data_entrada: updatedTac.data_entrada,
        assunto_objeto: updatedTac.assunto_objeto.trim(),
        n_notas: Number(updatedTac.n_notas),
        valor: Number(updatedTac.valor),
        unidade_beneficiada: updatedTac.unidade_beneficiada.trim(),
        updated_at: new Date().toISOString()
      };

      console.log('Dados preparados para atualização:', updateData);

      const { data, error } = await supabase
        .from('tacs')
        .update(updateData)
        .eq('id', updatedTac.id)
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado ao atualizar TAC:', error);
        
        // Tratar diferentes tipos de erro
        if (error.code === 'PGRST116') {
          throw new Error('TAC não encontrado para atualização');
        } else if (error.code === '23505') {
          throw new Error('Já existe um TAC com estes dados');
        } else if (error.message.includes('permission')) {
          throw new Error('Você não tem permissão para editar este TAC');
        } else {
          throw new Error(`Erro ao atualizar TAC: ${error.message}`);
        }
      }

      console.log('TAC atualizado com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Invalidando queries após sucesso');
      queryClient.invalidateQueries({ queryKey: ['tacs'] });
    },
    onError: (error) => {
      console.error('Erro na mutation de atualização:', error);
    },
  });
}
