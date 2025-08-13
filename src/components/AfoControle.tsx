import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash, FileText, ArrowLeft, Search, Calendar, Paperclip, Upload, Download, X } from 'lucide-react';
import { useAfoControle, useDeleteAfoControle } from '@/hooks/useAfoControle';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateAfoDialog from '@/components/CreateAfoDialog';
import EditAfoDialog from '@/components/EditAfoDialog';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AfoControleProps {
  onBack?: () => void;
}

const AfoControle: React.FC<AfoControleProps> = ({ onBack }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAfo, setSelectedAfo] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [attachmentCounts, setAttachmentCounts] = useState<{[key: string]: number}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: afos, isLoading } = useAfoControle(selectedYear);
  const deleteAfoMutation = useDeleteAfoControle();
  const { user } = useAuth();

  // Carregar contadores de anexos quando os AFOs carregarem
  React.useEffect(() => {
    if (afos && afos.length > 0) {
      loadAttachmentCounts();
    }
  }, [afos]);

  const loadAttachmentCounts = async () => {
    if (!afos || afos.length === 0) return;
    
    try {
      const counts: {[key: string]: number} = {};
      
      for (const afo of afos) {
        // Verificar se afo existe e tem id
        if (!afo || !afo.id) continue;
        
        const { data, error } = await supabase
          .from('afo_arquivos')
          .select('id')
          .eq('afo_id', afo.id);
        
        if (!error && data) {
          counts[afo.id] = data.length;
        }
      }
      
      setAttachmentCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar contadores de anexos:', error);
    }
  };

  // Gerar lista de anos (dos últimos 10 anos até o próximo ano)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 5 + i);

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (afo: any) => {
    setSelectedAfo(afo);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (afo: any) => {
    setSelectedAfo(afo);
    setIsDeleteDialogOpen(true);
  };

  const handleViewClick = (afo: any) => {
    setSelectedAfo(afo);
    setIsViewDialogOpen(true);
  };

  const handleAttachmentClick = async (afo: any) => {
    setSelectedAfo(afo);
    setIsAttachmentDialogOpen(true);
    await loadAttachments(afo.id);
  };

  const loadAttachments = async (afoId: string) => {
    setIsLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from('afo_arquivos')
        .select('*')
        .eq('afo_id', afoId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar anexos:', error);
        toast.error('Erro ao carregar anexos');
        return;
      }

      setAttachments(data || []);
      
      // Atualizar contador
      setAttachmentCounts(prev => ({
        ...prev,
        [afoId]: data?.length || 0
      }));
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      toast.error('Erro ao carregar anexos');
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('afo-attachments')
        .download(attachment.caminho_arquivo);

      if (error) {
        toast.error('Erro ao baixar arquivo');
        return;
      }

      // Criar URL para download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.nome_arquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleDeleteAttachment = async (attachment: any) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${attachment.nome_arquivo}"?`)) {
      return;
    }

    try {
      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from('afo-attachments')
        .remove([attachment.caminho_arquivo]);

      if (storageError) {
        console.error('Erro ao remover do storage:', storageError);
      }

      // Remover do banco
      const { error: dbError } = await supabase
        .from('afo_arquivos')
        .delete()
        .eq('id', attachment.id);

      if (dbError) {
        toast.error('Erro ao excluir arquivo');
        return;
      }

      // Atualizar lista e contador
      const newAttachments = attachments.filter(att => att.id !== attachment.id);
      setAttachments(newAttachments);
      
      if (selectedAfo) {
        setAttachmentCounts(prev => ({
          ...prev,
          [selectedAfo.id]: newAttachments.length
        }));
      }
      
      toast.success('Arquivo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir anexo:', error);
      toast.error('Erro ao excluir arquivo');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles || !selectedAfo || !user) {
      toast.error('Selecione os arquivos para upload');
      return;
    }

    // Validar tipos de arquivo (apenas PDFs)
    const invalidFiles = Array.from(selectedFiles).filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    // Verificar tamanho dos arquivos (limite de 50MB por arquivo)
    const oversizedFiles = Array.from(selectedFiles).filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('Arquivos muito grandes (limite 50MB por arquivo)');
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `afo-${selectedAfo.numero_afo}/${timestamp}_${safeFileName}`;

        // Upload do arquivo para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('afo-attachments')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error(`Erro ao fazer upload de ${file.name}: ${uploadError.message}`);
        }

        // Obter URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage
          .from('afo-attachments')
          .getPublicUrl(fileName);

        // Salvar informações do arquivo no banco usando a tabela existente
        const { error: dbError } = await supabase
          .from('afo_arquivos')
          .insert({
            afo_id: selectedAfo.id,
            nome_arquivo: file.name,
            caminho_arquivo: fileName,
            tamanho_arquivo: file.size,
            tipo_arquivo: 'application/pdf'
          });

        if (dbError) {
          // Se falhar ao salvar no banco, tentar remover o arquivo do storage
          await supabase.storage.from('afo-attachments').remove([fileName]);
          throw new Error(`Erro ao salvar informações de ${file.name}: ${dbError.message}`);
        }

        return { fileName: file.name, success: true };
      });

      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`${successful} arquivo(s) anexado(s) com sucesso!`);
      }
      
      if (failed > 0) {
        toast.error(`${failed} arquivo(s) falharam no upload`);
      }

      // Limpar seleção e recarregar anexos
      setSelectedFiles(null);
      if (selectedAfo) {
        await loadAttachments(selectedAfo.id);
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload dos arquivos');
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = async (justification: string) => {
    if (selectedAfo) {
      try {
        await deleteAfoMutation.mutateAsync(selectedAfo.id);
        console.log('AFO deletada com sucesso');
        setIsDeleteDialogOpen(false);
        setSelectedAfo(null);
      } catch (error) {
        console.error('Erro ao deletar AFO:', error);
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setSelectedAfo(null);
  };

  const getStatusBadge = (afo: any) => {
    // Verificar se afo existe e tem data_emissao
    if (!afo || !afo.data_emissao) {
      return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
    }

    // Como não há propriedade status, vamos criar uma lógica baseada na data
    const isRecent = new Date(afo.data_emissao) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (isRecent) {
      return <Badge className="bg-green-100 text-green-800">Recente</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Processada</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    try {
      // Para datas no formato YYYY-MM-DD, criar Date local
      const dateParts = dateString.split('T')[0].split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2]);
        const localDate = new Date(year, month, day);
        return format(localDate, 'dd/MM/yyyy', { locale: ptBR });
      }
      return 'N/A';
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'N/A';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data/hora:', error);
      return 'N/A';
    }
  };

  const filteredAfos = afos?.filter(afo => {
    // Verificar se afo existe e tem as propriedades necessárias
    if (!afo || !afo.numero_afo || !afo.favorecido) {
      return false;
    }

    const searchRegex = new RegExp(searchTerm, 'i');
    const matchesSearch = searchRegex.test(afo.numero_afo) || searchRegex.test(afo.favorecido);

    // Como não há propriedade status, vamos filtrar baseado no statusFilter se necessário
    const matchesStatus = statusFilter === 'all' || statusFilter === 'processada';

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div>Carregando AFOs...</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Back to Main Menu Button */}
      {onBack && (
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2 hover:bg-blue-50 border-blue-200 text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Menu Principal
          </Button>
        </div>
      )}

      <Card className="shadow-md rounded-md">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Controle de AFOs</CardTitle>
          <Button onClick={handleCreateClick} className="bg-blue-500 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo AFO
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <Card className="p-4 mb-6 bg-gray-50 border-2 border-dashed border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro por Ano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Ano
                </label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="bg-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Busca por texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pesquisar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Pesquisar por número AFO ou favorecido..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="processada">Processada</SelectItem>
                    <SelectItem value="recente">Recente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resumo dos resultados */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Resultados:</p>
                  <p>{filteredAfos?.length || 0} AFO(s) encontrada(s)</p>
                  <p className="text-xs">Ano: {selectedYear}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="overflow-x-auto">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Número AFO
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Favorecido
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data Emissão
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAfos?.map(afo => {
                  // Verificação adicional de segurança
                  if (!afo || !afo.id) return null;
                  
                  return (
                    <tr key={afo.id}>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        {afo.numero_afo || 'N/A'}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        {afo.favorecido || 'N/A'}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        {formatDate(afo.data_emissao)}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        {afo.valor_total ? `R$ ${afo.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        {getStatusBadge(afo)}
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewClick(afo)} title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(afo)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleAttachmentClick(afo)} title="Anexar PDFs" className="text-green-600 hover:text-green-700 hover:bg-green-50 relative">
                            <Paperclip className="h-4 w-4" />
                            {attachmentCounts[afo.id] > 0 && (
                              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                                {attachmentCounts[afo.id]}
                              </span>
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(afo)} title="Excluir">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <CreateAfoDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        selectedYear={selectedYear} 
      />
      
      <EditAfoDialog 
        isOpen={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)} 
        afo={selectedAfo} 
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a AFO ${selectedAfo?.numero_afo}?`}
        isDeleting={deleteAfoMutation.isPending}
      />

      {/* Dialog para gerenciar anexos PDFs */}
      <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-green-600" />
              Anexos PDF - AFO {selectedAfo?.numero_afo}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Seção de anexos existentes */}
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Anexos Existentes ({attachments.length})
              </h3>
              
              {isLoadingAttachments ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Carregando anexos...</p>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-md">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhum anexo encontrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-white border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-red-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{attachment.nome_arquivo}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.tamanho_arquivo / 1024 / 1024).toFixed(2)} MB
                            {attachment.created_at && ` • ${formatDateTime(attachment.created_at)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Baixar arquivo"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(attachment)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir arquivo"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção para adicionar novos anexos */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Adicionar Novos Anexos
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pdf-files">Selecionar Arquivos PDF</Label>
                  <Input
                    id="pdf-files"
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas arquivos PDF (máximo 50MB por arquivo)
                  </p>
                </div>

                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm font-medium mb-2 text-blue-800">Arquivos selecionados para upload:</p>
                    <ul className="text-xs space-y-1">
                      {Array.from(selectedFiles).map((file, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-red-600" />
                          <span>{file.name}</span>
                          <span className="text-gray-600">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2 justify-end border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAttachmentDialogOpen(false);
                  setSelectedFiles(null);
                  setAttachments([]);
                }}
                disabled={isUploading}
              >
                Fechar
              </Button>
              
              {selectedFiles && selectedFiles.length > 0 && (
                <Button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar {selectedFiles.length} arquivo(s)
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar AFO */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Detalhes da AFO - {selectedAfo?.numero_afo}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações Gerais
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Número AFO:</span>
                      <span className="text-blue-600 font-semibold">{selectedAfo?.numero_afo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Favorecido:</span>
                      <span className="text-gray-900">{selectedAfo?.favorecido}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Data de Emissão:</span>
                      <span className="text-gray-900">{formatDate(selectedAfo?.data_emissao)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Valor Total:</span>
                      <span className="text-green-600 font-bold">
                        {selectedAfo?.valor_total ? `R$ ${selectedAfo.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Dados Adicionais</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Processo:</span>
                      <span className="text-gray-900">{selectedAfo?.processo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Modalidade:</span>
                      <span className="text-gray-900">{selectedAfo?.modalidade || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Tipo:</span>
                      <span className="text-gray-900">{selectedAfo?.tipo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span>{getStatusBadge(selectedAfo)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Datas Importantes
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Data de Criação:</span>
                      <span className="text-gray-900">{selectedAfo?.created_at ? formatDateTime(selectedAfo.created_at) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Última Atualização:</span>
                      <span className="text-gray-900">{selectedAfo?.updated_at ? formatDateTime(selectedAfo.updated_at) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Data de Vencimento:</span>
                      <span className="text-gray-900">{formatDate(selectedAfo?.data_vencimento)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Anexos
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Total de anexos:</span>
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                        {attachmentCounts[selectedAfo?.id] || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsViewDialogOpen(false);
                          handleAttachmentClick(selectedAfo);
                        }}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Paperclip className="h-3 w-3 mr-1" />
                        Gerenciar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {selectedAfo?.observacoes && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Observações</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedAfo.observacoes}</p>
              </div>
            )}

            {/* Histórico de Alterações */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ID do Sistema:</span>
                  <span className="ml-2 text-gray-600 font-mono">{selectedAfo?.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Usuário Responsável:</span>
                  <span className="ml-2 text-gray-600">{selectedAfo?.user_id || 'Sistema'}</span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 justify-end border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditClick(selectedAfo);
                }}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar AFO
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleAttachmentClick(selectedAfo);
                }}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Gerenciar Anexos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AfoControle;
