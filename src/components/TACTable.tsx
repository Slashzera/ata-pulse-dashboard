import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash, Download, Search, FileText, AlertTriangle, Loader2, Edit, Eye, Paperclip, Filter, SlidersHorizontal, Building2, DollarSign, Calendar, Package, Activity, Sparkles, TrendingUp, BarChart3, Users, Clock, Star } from 'lucide-react';
import { TAC, useTacs, useDeleteTac } from '@/hooks/useTacs';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditTACDialog from '@/components/EditTACDialog';
import ViewTACDialog from '@/components/ViewTACDialog';
import ManageTacAttachmentsDialog from '@/components/ManageTacAttachmentsDialog';

interface TACTableProps {
  onBack?: () => void;
}

const TACTable: React.FC<TACTableProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTacToEdit, setSelectedTacToEdit] = useState<TAC | null>(null);
  const [selectedTacToView, setSelectedTacToView] = useState<TAC | null>(null);
  const [selectedTacToManageAttachments, setSelectedTacToManageAttachments] = useState<TAC | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isManageAttachmentsDialogOpen, setIsManageAttachmentsDialogOpen] = useState(false);
  const { data: tacs = [], isLoading, isError, error } = useTacs();
  const deleteTacMutation = useDeleteTac();

  const filteredTacs = useMemo(() => {
    const data = Array.isArray(tacs) ? tacs : [];
    if (!searchQuery) return data;
    return data.filter(tac =>
      tac.nome_empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tac.numero_processo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tac.profiles?.nome && tac.profiles.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tacs, searchQuery]);

  const handleDelete = (id: string, filePath: string) => {
    if (window.confirm('Tem certeza que deseja excluir este TAC?')) {
      deleteTacMutation.mutate({ id, filePath });
    }
  };
  
  const handleDownload = (filePath: string) => {
    const { data } = supabase.storage.from('tacs').getPublicUrl(filePath);
    if (data.publicUrl) {
      window.open(data.publicUrl, '_blank');
    } else {
      alert('Não foi possível obter a URL do arquivo.');
    }
  };

  const handleEdit = (tac: TAC) => {
    setSelectedTacToEdit(tac);
    setIsEditDialogOpen(true);
  };

  const handleView = (tac: TAC) => {
    setSelectedTacToView(tac);
    setIsViewDialogOpen(true);
  };

  const handleManageAttachments = (tac: TAC) => {
    setSelectedTacToManageAttachments(tac);
    setIsManageAttachmentsDialogOpen(true);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedTacToEdit(null);
  };

  const closeViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedTacToView(null);
  };

  const closeManageAttachmentsDialog = () => {
    setIsManageAttachmentsDialogOpen(false);
    setSelectedTacToManageAttachments(null);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Modern Header with Back Button */}
      {onBack && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                console.log('BOTÃO VOLTAR CLICADO - FORÇANDO EXECUÇÃO');
                if (onBack) {
                  onBack();
                } else {
                  console.log('onBack não definido');
                }
              }}
              className="flex items-center gap-3 bg-white hover:bg-pink-50 border border-pink-200 text-pink-600 hover:text-pink-700 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer font-medium"
              style={{ zIndex: 9999, position: 'relative' }}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Voltar ao Menu Principal</span>
            </button>
            <div className="flex items-center gap-3 text-slate-500">
              <Package className="h-5 w-5" />
              <span className="text-lg font-semibold">Termos de Aceite de Contratação</span>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-Modern Header Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-pink-600 via-purple-700 to-indigo-800 text-white mb-8 overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardHeader className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">Termos de Aceite de Contratação</CardTitle>
                <p className="text-pink-100 text-sm">Gestão completa de TACs e documentos contratuais</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white/90 text-sm font-medium">{filteredTacs.length} TACs</p>
                <p className="text-pink-200 text-xs">encontrados</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Modern Search and Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Search className="h-5 w-5 text-pink-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Pesquisa Avançada</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Pesquisar por empresa, processo ou criador..."
                className="w-full pl-10 pr-4 py-3 border-slate-200 focus:border-pink-500 focus:ring-pink-500/20 rounded-xl transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-slate-200 min-w-[120px]">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-pink-600" />
                <span className="text-sm font-medium text-slate-700">Resultados</span>
              </div>
              <p className="text-lg font-bold text-pink-600">{filteredTacs.length}</p>
              <p className="text-xs text-slate-500">TACs encontrados</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Ultra-Modern TAC Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="h-12 w-12 text-pink-600 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Carregando TACs...</h3>
          <p className="text-slate-500">Aguarde enquanto buscamos os dados</p>
        </div>
      ) : isError ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Erro ao carregar dados</h3>
          <p className="text-slate-500 mb-4">
            {error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'}
          </p>
        </div>
      ) : filteredTacs.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum TAC encontrado</h3>
          <p className="text-slate-500 mb-6">
            {searchQuery 
              ? "Tente ajustar os termos de pesquisa para encontrar os TACs desejados."
              : "Ainda não há Termos de Aceite de Contratação cadastrados no sistema."
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTacs.map(tac => (
            <Card key={tac.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="text-white bg-gradient-to-r from-pink-600 to-purple-700 relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg truncate max-w-[200px]" title={tac.nome_empresa}>
                        {tac.nome_empresa}
                      </div>
                      <div className="text-xs opacity-90 font-normal">
                        TAC #{tac.id.slice(-8)}
                      </div>
                    </div>
                  </CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 relative z-10">
                <div className="space-y-4">
                  {/* Processo e Data */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Processo</span>
                      </div>
                      <p className="text-sm font-semibold text-blue-800 truncate" title={tac.numero_processo}>
                        {tac.numero_processo}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Data Entrada</span>
                      </div>
                      <p className="text-sm font-semibold text-green-800">
                        {new Date(tac.data_entrada + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-100">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valor do TAC
                      </span>
                      <span className="font-bold text-xl text-emerald-800">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tac.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Assunto/Objeto */}
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <div className="text-sm text-amber-800">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Assunto/Objeto
                      </div>
                      <p className="text-amber-700 leading-relaxed line-clamp-2" title={tac.assunto_objeto}>
                        {tac.assunto_objeto}
                      </p>
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-600 font-medium">Nº Notas:</span>
                      <p className="text-slate-800 font-semibold">{tac.n_notas}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Unidade:</span>
                      <p className="text-slate-800 font-semibold truncate" title={tac.unidade_beneficiada}>
                        {tac.unidade_beneficiada}
                      </p>
                    </div>
                  </div>

                  {/* Criado por */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-600">Criado por:</span>
                        <p className="text-slate-800 font-medium">{tac.profiles?.nome || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-600">Em:</span>
                        <p className="text-slate-800 font-medium">
                          {new Date(tac.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-pink-600 to-purple-700 hover:shadow-lg text-white border-0 transition-all duration-300"
                      onClick={() => handleView(tac)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(tac)}
                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                        title="Editar TAC"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(tac.arquivo_url)}
                        className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(tac.id, tac.arquivo_url)}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                        title="Excluir TAC"
                        disabled={deleteTacMutation.isPending}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <EditTACDialog
        tac={selectedTacToEdit}
        isOpen={isEditDialogOpen}
        onClose={closeEditDialog}
      />
      
      <ViewTACDialog
        tac={selectedTacToView}
        isOpen={isViewDialogOpen}
        onClose={closeViewDialog}
      />
    </div>
  );
};

export default TACTable;
