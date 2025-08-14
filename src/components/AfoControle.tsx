import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash, FileText, ArrowLeft, Search, Calendar, Paperclip, Upload, Download, X, Filter, SlidersHorizontal, Building2, DollarSign, Clock, Package, Sparkles, TrendingUp, BarChart3, Activity } from 'lucide-react';
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
  const [attachmentCounts, setAttachmentCounts] = useState<{ [key: string]: number }>({});
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
      const counts: { [key: string]: number } = {};

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
      return (
        <Badge className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
          N/A
        </Badge>
      );
    }

    // Como não há propriedade status, vamos criar uma lógica baseada na data
    const isRecent = new Date(afo.data_emissao) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (isRecent) {
      return (
        <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-green-200">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
          Recente
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-blue-200">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
          Processada
        </Badge>
      );
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
      {/* Modern Header with Back Button */}
      {onBack && (
        <div className="mb-8 relative z-10">
          <div className="flex items-center justify-between">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botão Voltar clicado no AfoControle');
                console.log('onBack existe?', !!onBack);
                if (onBack) {
                  console.log('Chamando função onBack');
                  try {
                    onBack();
                    console.log('onBack executado com sucesso');
                  } catch (error) {
                    console.error('Erro ao executar onBack:', error);
                  }
                } else {
                  console.log('onBack não está definido');
                }
              }}
              variant="ghost"
              className="flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-transparent hover:border-blue-200 text-slate-600 hover:text-blue-700 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Voltar ao Menu Principal</span>
            </Button>
            <div className="flex items-center gap-3 text-slate-500">
              <Package className="h-5 w-5" />
              <span className="text-lg font-semibold">Controle de AFOs</span>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-Modern Header Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">Controle de AFOs</CardTitle>
                <p className="text-blue-100 text-sm">Gestão completa de Autorizações de Fornecimento</p>
              </div>
            </div>
            <Button
              onClick={handleCreateClick}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all duration-300 hover:scale-105 px-6 py-3 rounded-xl shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="font-semibold">Nova AFO</span>
            </Button>
          </div>
        </CardHeader>
      </Card>
      {/* Modern Enhanced Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Filtros Avançados</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Filtro por Ano */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Ano</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                  <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {year}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Busca por texto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Número AFO ou favorecido..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro por Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      Todos os Status
                    </div>
                  </SelectItem>
                  <SelectItem value="processada">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Processada
                    </div>
                  </SelectItem>
                  <SelectItem value="recente">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Recente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumo dos resultados */}
            <div className="flex items-end">
              <div className="bg-white rounded-lg p-4 border border-slate-200 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Resultados</span>
                </div>
                <p className="text-lg font-bold text-blue-600">{filteredAfos?.length || 0}</p>
                <p className="text-xs text-slate-500">AFOs encontradas em {selectedYear}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ultra-Modern AFO Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredAfos?.map(afo => {
          // Verificação adicional de segurança
          if (!afo || !afo.id) return null;

          return (
            <Card key={afo.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <CardHeader className="text-white bg-gradient-to-r from-blue-600 to-indigo-700 relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg">AFO {afo.numero_afo || 'N/A'}</div>
                      <div className="text-xs opacity-90 font-normal">
                        ID: #{afo.id.slice(-8)}
                      </div>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(afo)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 relative z-10">
                <div className="space-y-4">
                  {/* Favorecido */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-600">Favorecido</span>
                    </div>
                    <p className="font-semibold text-slate-800 truncate" title={afo.favorecido || 'N/A'}>
                      {afo.favorecido || 'N/A'}
                    </p>
                  </div>

                  {/* Data e Valor */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Data Emissão</span>
                      </div>
                      <p className="text-sm font-semibold text-blue-800">
                        {formatDate(afo.data_emissao)}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Valor Total</span>
                      </div>
                      <p className="text-sm font-bold text-green-800">
                        {afo.valor_total ? `R$ ${afo.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  {(afo.adesao_ata || afo.numero_processo) && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="text-xs font-medium text-amber-700 mb-2">Informações Adicionais</div>
                      {afo.adesao_ata && (
                        <p className="text-xs text-amber-800 mb-1">
                          <span className="font-medium">Adesão ATA:</span> {afo.adesao_ata}
                        </p>
                      )}
                      {afo.numero_processo && (
                        <p className="text-xs text-amber-800">
                          <span className="font-medium">Processo:</span> {afo.numero_processo}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-lg text-white border-0 transition-all duration-300"
                      onClick={() => handleViewClick(afo)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(afo)}
                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                        title="Editar AFO"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAttachmentClick(afo)}
                        className="hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors relative"
                        title="Anexar PDFs"
                      >
                        <Paperclip className="h-4 w-4" />
                        {attachmentCounts[afo.id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                            {attachmentCounts[afo.id]}
                          </span>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClick(afo)}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                        title="Excluir AFO"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAfos?.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhuma AFO encontrada</h3>
          <p className="text-slate-500 mb-6">
            {afos?.length === 0
              ? "Ainda não há AFOs cadastradas no sistema."
              : "Tente ajustar os filtros para encontrar as AFOs desejadas."
            }
          </p>
          {afos?.length === 0 && (
            <Button
              onClick={handleCreateClick}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira AFO
            </Button>
          )}
        </div>
      )}

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
