import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Upload, X, Download, Loader2, Plus } from 'lucide-react';
import { useTacAttachments, useAddTacAttachment, useDeleteTacAttachment } from '@/hooks/useTacAttachments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TacAttachmentsManagerProps {
  tacId: number | null;
  mode: 'create' | 'manage'; // 'create' para durante criação, 'manage' para após criação
  additionalFiles?: File[]; // Para modo criação
  onAdditionalFilesChange?: (files: File[]) => void; // Para modo criação
  disabled?: boolean;
}

export default function TacAttachmentsManager({
  tacId,
  mode,
  additionalFiles = [],
  onAdditionalFilesChange,
  disabled = false,
}: TacAttachmentsManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Hooks para modo 'manage'
  const { data: attachments = [], isLoading } = useTacAttachments(mode === 'manage' ? tacId : null);
  const addAttachmentMutation = useAddTacAttachment();
  const deleteAttachmentMutation = useDeleteTacAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Verificar se é PDF
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Erro',
        description: 'Apenas arquivos PDF são permitidos.',
        variant: 'destructive',
      });
      return;
    }

    // Verificar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'O arquivo deve ter no máximo 10MB.',
        variant: 'destructive',
      });
      return;
    }

    if (mode === 'create') {
      // Modo criação: adicionar à lista local
      const newFiles = [...additionalFiles, file];
      onAdditionalFilesChange?.(newFiles);
      toast({
        title: 'Sucesso',
        description: 'Arquivo adicionado à lista de anexos.',
      });
    } else if (mode === 'manage' && tacId) {
      // Modo gerenciamento: fazer upload imediatamente
      setIsUploading(true);
      try {
        await addAttachmentMutation.mutateAsync({ tacId, file });
        toast({
          title: 'Sucesso',
          description: 'Anexo adicionado com sucesso.',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao adicionar anexo.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    }

    // Limpar input
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    if (mode === 'create') {
      const newFiles = additionalFiles.filter((_, i) => i !== index);
      onAdditionalFilesChange?.(newFiles);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, arquivoUrl: string) => {
    if (!tacId) return;
    
    try {
      await deleteAttachmentMutation.mutateAsync({ attachmentId, arquivoUrl, tacId });
      toast({
        title: 'Sucesso',
        description: 'Anexo removido com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao remover anexo.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (arquivoUrl: string, nomeArquivo: string) => {
    const { data } = supabase.storage.from('tacs').getPublicUrl(arquivoUrl);
    if (data.publicUrl) {
      const link = document.createElement('a');
      link.href = data.publicUrl;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível obter a URL do arquivo.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          {mode === 'create' ? 'Anexos Adicionais (Opcional)' : 'Gerenciar Anexos'}
        </Label>
        
        {/* Botão para adicionar arquivo */}
        <div className="flex items-center gap-2">
          <label 
            htmlFor={`additional-files-${mode}`}
            className="flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Adicionar PDF
              </>
            )}
          </label>
          <input
            id={`additional-files-${mode}`}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>
        
        <p className="text-xs text-gray-500">
          Apenas arquivos PDF são permitidos (máx. 10MB cada)
        </p>
      </div>

      {/* Lista de arquivos */}
      <div className="space-y-2">
        {mode === 'create' && additionalFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Arquivos a serem anexados:</Label>
            {additionalFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-md bg-gray-50 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="truncate max-w-[300px]">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {mode === 'manage' && (
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando anexos...
              </div>
            ) : attachments.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Anexos existentes:</Label>
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between rounded-md bg-gray-50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="truncate max-w-[250px]">{attachment.nome_arquivo}</span>
                      {attachment.tamanho_arquivo && (
                        <span className="text-xs text-gray-500">
                          ({formatFileSize(attachment.tamanho_arquivo)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment.arquivo_url, attachment.nome_arquivo)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment.id, attachment.arquivo_url)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        disabled={deleteAttachmentMutation.isPending}
                      >
                        {deleteAttachmentMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum anexo adicional encontrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}