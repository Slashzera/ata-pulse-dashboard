import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Trash, Download, Search, FileText, AlertTriangle, Loader2, Edit, Eye, Paperclip } from 'lucide-react';
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
    <div className="container mx-auto px-3 py-3">
      {onBack && (
        <div className="mb-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 hover:bg-pink-50 border-pink-200 text-pink-600 text-xs px-2 py-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao Menu Principal
          </Button>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white p-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Termos de Aceite de Contratação (TACs)
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-pink-100" />
              <Input
                type="search"
                placeholder="Pesquisar por empresa, processo..."
                className="w-64 h-7 text-xs rounded-md bg-white/10 text-white placeholder:text-pink-100 border-none pl-8 shadow-inner focus:ring-fuchsia-400 focus:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome da Empresa
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nº do Processo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Entrada
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assunto/Objeto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nº Nota's
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidade Beneficiada
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado Por
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10">
                      <div className="flex justify-center items-center gap-2 text-gray-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Carregando TACs...</span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10">
                      <div className="flex flex-col justify-center items-center gap-2 text-red-500">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          <span>Erro ao carregar os dados.</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTacs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-500">
                      Nenhum Termo de Aceite de Contratação encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredTacs.map(tac => (
                    <tr key={tac.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleView(tac)} 
                            className="text-blue-600 hover:text-blue-800 p-1 h-6 w-6"
                            title="Visualizar"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(tac)} 
                            className="text-green-600 hover:text-green-800 p-1 h-6 w-6"
                            title="Editar"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownload(tac.arquivo_url)} 
                            className="text-purple-600 hover:text-purple-800 p-1 h-6 w-6"
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(tac.id, tac.arquivo_url)} 
                            className="text-red-600 hover:text-red-800 p-1 h-6 w-6" 
                            disabled={deleteTacMutation.isPending}
                            title="Excluir"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tac.nome_empresa}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tac.numero_processo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(tac.data_entrada + 'T00:00:00').toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tac.assunto_objeto}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tac.n_notas}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tac.valor)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tac.unidade_beneficiada}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tac.profiles?.nome || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(tac.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
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
