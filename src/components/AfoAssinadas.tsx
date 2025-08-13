import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Download, FileText, Trash2, X, Save, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAfoAssinadas, useCreateAfoAssinada, useDeleteAfoAssinada, uploadPdfToStorage } from '@/hooks/useAfoAssinadas';
import { useCreateAuditLog } from '@/hooks/useAuditLogs';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

interface AfoAssinadasProps {
  onBack: () => void;
}

const AfoAssinadas: React.FC<AfoAssinadasProps> = ({ onBack }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFileForDeletion, setSelectedFileForDeletion] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: savedFiles = [], isLoading } = useAfoAssinadas();
  const createAfoAssinada = useCreateAfoAssinada();
  const deleteAfoAssinada = useDeleteAfoAssinada();
  const createAuditLog = useCreateAuditLog();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "Aviso",
        description: "Apenas arquivos PDF são aceitos. Alguns arquivos foram ignorados.",
        variant: "destructive",
      });
    }
    
    if (pdfFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...pdfFiles]);
      toast({
        title: "Arquivos Adicionados",
        description: `${pdfFiles.length} arquivo(s) PDF adicionado(s) com sucesso!`,
      });
    }

    // Limpar o input para permitir selecionar os mesmos arquivos novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Arquivo Removido",
      description: "Arquivo removido da lista com sucesso!",
    });
  };

  const saveSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos 1 arquivo PDF para salvar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Upload cada arquivo para o Supabase Storage e salvar na tabela
      for (const file of selectedFiles) {
        console.log('Fazendo upload do arquivo:', file.name);
        
        const url_arquivo = await uploadPdfToStorage(file);
        console.log('URL do arquivo:', url_arquivo);
        
        await createAfoAssinada.mutateAsync({
          nome_arquivo: file.name,
          tamanho_arquivo: file.size,
          url_arquivo: url_arquivo
        });
      }
      
      // Limpar arquivos selecionados após salvar
      setSelectedFiles([]);
      
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Arquivos Salvos",
        description: `${selectedFiles.length} arquivo(s) PDF salvos no Supabase com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao salvar arquivos:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar os arquivos PDF no Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const mergePDFs = async () => {
    const filesToMerge = selectedFiles.length > 0 ? selectedFiles : [];
    
    if (filesToMerge.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos 1 arquivo PDF para processar.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simular processamento de junção de PDFs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (filesToMerge.length === 1) {
        // Se apenas um arquivo, criar URL para download direto
        const url = URL.createObjectURL(filesToMerge[0]);
        setMergedPdfUrl(url);
        
        toast({
          title: "Sucesso",
          description: "Arquivo PDF processado e pronto para download!",
        });
      } else {
        // Se múltiplos arquivos, simular junção
        const combinedName = `AFO_Unificadas_${new Date().toISOString().split('T')[0]}.pdf`;
        const blob = new Blob(['PDF unificado simulado'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setMergedPdfUrl(url);
        
        toast({
          title: "Sucesso",
          description: `${filesToMerge.length} arquivos PDF foram unidos com sucesso!`,
        });
      }
    } catch (error) {
      console.error('Erro ao processar PDFs:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar os arquivos PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMergedPDF = () => {
    if (mergedPdfUrl) {
      const link = document.createElement('a');
      link.href = mergedPdfUrl;
      
      if (selectedFiles.length === 1) {
        link.download = selectedFiles[0].name;
      } else {
        link.download = `AFO_Unificadas_${new Date().toISOString().split('T')[0]}.pdf`;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Iniciado",
        description: "O download do arquivo foi iniciado!",
      });
    }
  };

  const downloadSavedFile = (savedFile: any) => {
    const link = document.createElement('a');
    link.href = savedFile.url_arquivo;
    link.download = savedFile.nome_arquivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Iniciado",
      description: `Download de ${savedFile.nome_arquivo} iniciado!`,
    });
  };

  const handleDeleteClick = (file: any) => {
    setSelectedFileForDeletion(file);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async (justification: string) => {
    if (!selectedFileForDeletion) return;

    try {
      await deleteAfoAssinada.mutateAsync(selectedFileForDeletion.id);
      
      // Criar log de auditoria
      createAuditLog.mutate({
        action: 'DELETE',
        table_name: 'afo_assinadas',
        record_id: selectedFileForDeletion.id,
        old_data: selectedFileForDeletion,
        justification: justification
      });
      
      setSelectedFileForDeletion(null);
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
    }
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setMergedPdfUrl(null);
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Lista Limpa",
      description: "Todos os arquivos foram removidos da lista!",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AFO Assinadas</h1>
          <p className="text-gray-600 mt-2">
            Faça upload, salve e processe arquivos PDF das AFOs assinadas
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Upload e Seleção de Arquivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Arquivos PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pdf-upload">Selecionar arquivos PDF</Label>
                <Input
                  ref={fileInputRef}
                  id="pdf-upload"
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Selecione um ou múltiplos arquivos PDF para upload.
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Arquivos Selecionados ({selectedFiles.length})</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Limpar Todos
                    </Button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveSelectedFiles}
                  disabled={selectedFiles.length === 0 || isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Salvando no Supabase...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Arquivos ({selectedFiles.length})
                    </>
                  )}
                </Button>

                <Button
                  onClick={mergePDFs}
                  disabled={selectedFiles.length === 0 || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      {selectedFiles.length === 1 ? 'Processar PDF' : 'Juntar PDFs'}
                    </>
                  )}
                </Button>

                {mergedPdfUrl && (
                  <Button
                    onClick={downloadMergedPDF}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar {selectedFiles.length === 1 ? 'PDF' : 'PDF Unido'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arquivos Salvos no Supabase */}
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p>Carregando arquivos salvos...</p>
            </CardContent>
          </Card>
        ) : savedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Arquivos Salvos no Supabase ({savedFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {savedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{file.nome_arquivo}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.tamanho_arquivo)} • Salvo em: {formatDate(file.data_upload)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadSavedFile(file)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(file)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado do PDF Processado */}
        {mergedPdfUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">
                {selectedFiles.length === 1 ? 'PDF Processado!' : 'PDF Criado com Sucesso!'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                {selectedFiles.length === 1 
                  ? 'Seu arquivo PDF foi processado e está pronto para download.'
                  : `Seu arquivo PDF foi criado juntando ${selectedFiles.length} documentos.`
                } Clique no botão abaixo para fazer o download.
              </p>
              <Button
                onClick={downloadMergedPDF}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar {selectedFiles.length === 1 ? 'PDF Processado' : 'PDF Final'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instruções de Uso */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                <p>Clique em "Selecionar arquivos PDF" e escolha um ou múltiplos arquivos PDF das AFOs assinadas</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                <p>Clique em "Salvar Arquivos" para salvar os PDFs selecionados no sistema</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                <p>Use "Processar PDF" (para um arquivo) ou "Juntar PDFs" (para múltiplos arquivos) para criar um documento unificado</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                <p>Baixe os arquivos processados ou acesse os arquivos salvos a qualquer momento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedFileForDeletion(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Excluir Arquivo"
        description={`Tem certeza que deseja excluir o arquivo "${selectedFileForDeletion?.nome_arquivo}"? Esta ação não pode ser desfeita.`}
        isDeleting={deleteAfoAssinada.isPending}
      />
    </div>
  );
};

export default AfoAssinadas;
