import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Edit, 
  Trash, 
  Plus, 
  ArrowLeft,
  Eye,
  Calculator,
  TrendingUp
} from 'lucide-react';
import { ATA, useDeleteAta } from '@/hooks/useAtas';
import { usePedidos } from '@/hooks/usePedidos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditATADialog from '@/components/EditATADialog';
import DeleteATADialog from '@/components/DeleteATADialog';
import CreateATADialog from '@/components/CreateATADialog';
import CreateAdesaoDialog from '@/components/CreateAdesaoDialog';
import CreateContratoAntigoDialog from '@/components/CreateContratoAntigoDialog';
import CreateAquisicaoGlobalDialog from '@/components/CreateAquisicaoGlobalDialog';
import PedidosSection from '@/components/PedidosSection';

interface ATATableProps {
  atas: ATA[];
  category: string;
  title: string;
  headerColor: string;
  onBack?: () => void;
}

const ATATable: React.FC<ATATableProps> = ({ atas, category, title, headerColor, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAtas, setFilteredAtas] = useState(atas);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAtaToDelete, setSelectedAtaToDelete] = useState<ATA | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [isEditATADialogOpen, setIsEditATADialogOpen] = useState(false);
  const [selectedAtaToEdit, setSelectedAtaToEdit] = useState<ATA | null>(null);
  const [isCreateATADialogOpen, setIsCreateATADialogOpen] = useState(false);
  const [isCreateAdesaoDialogOpen, setIsCreateAdesaoDialogOpen] = useState(false);
  const [isCreateContratoAntigoDialogOpen, setIsCreateContratoAntigoDialogOpen] = useState(false);
  const [isCreateAquisicaoGlobalDialogOpen, setIsCreateAquisicaoGlobalDialogOpen] = useState(false);
  const [showObjeto, setShowObjeto] = useState(true);
  const [showPedidosSection, setShowPedidosSection] = useState(false);
  const [selectedPedidosAta, setSelectedPedidosAta] = useState<ATA | null>(null);

  const deleteATAMutation = useDeleteAta();
  
  // Filtrar ATAs apenas para a categoria específica
  const categoryAtas = useMemo(() => {
    console.log('Filtrando ATAs para categoria:', category);
    console.log('ATAs recebidas:', atas);
    
    const filtered = atas.filter(ata => {
      console.log(`ATA ${ata.n_ata} tem categoria: ${ata.category}`);
      return ata.category === category;
    });
    
    console.log('ATAs filtradas:', filtered);
    return filtered;
  }, [atas, category]);
  
  // Buscar pedidos apenas para a categoria específica
  const { data: pedidos = [] } = usePedidos(category);

  // Contar pedidos por ATA
  const pedidosPorAta = useMemo(() => {
    const contagem: { [key: string]: number } = {};
    pedidos.forEach(pedido => {
      if (pedido.ata_category === category) {
        contagem[pedido.ata_id] = (contagem[pedido.ata_id] || 0) + 1;
      }
    });
    console.log('Contagem de pedidos por ATA:', contagem);
    return contagem;
  }, [pedidos, category]);

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCurrency = (value: number | null): string => {
    if (!value) return 'R$ 0,00';
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const renderSaldoDisplay = (saldo: number | null): JSX.Element => {
    if (!saldo || saldo === 0) {
      return <span className="text-red-600 font-bold">SALDO ZERADO</span>;
    }
    return <span className="text-green-600 font-medium">{formatCurrency(saldo)}</span>;
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    const filtered = categoryAtas.filter(ata =>
      ata.n_ata.toLowerCase().includes(query.toLowerCase()) ||
      ata.favorecido?.toLowerCase().includes(query.toLowerCase()) ||
      ata.objeto.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredAtas(filtered);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
  };

  const handleDeleteAta = (ata: ATA) => {
    setSelectedAtaToDelete(ata);
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDeleteAta = (justification: string) => {
    if (selectedAtaToDelete) {
      deleteATAMutation.mutate({
        id: selectedAtaToDelete.id,
        justification
      }, {
        onSuccess: () => {
          console.log('ATA deleted successfully');
          setIsDeleteConfirmationOpen(false);
          setSelectedAtaToDelete(null);
        },
        onError: (error) => {
          console.error('Error deleting ATA:', error);
          setIsDeleteConfirmationOpen(false);
          setSelectedAtaToDelete(null);
        }
      });
    }
  };

  const cancelDeleteAta = () => {
    setIsDeleteConfirmationOpen(false);
    setSelectedAtaToDelete(null);
  };

  const handleEditAta = (ata: ATA) => {
    setSelectedAtaToEdit(ata);
    setIsEditATADialogOpen(true);
  };

  const closeEditATADialog = () => {
    setIsEditATADialogOpen(false);
    setSelectedAtaToEdit(null);
  };

  const getStatusBadge = (ata: ATA) => {
    const isExpired = ata.vencimento && new Date(ata.vencimento) < new Date();
    const hasLowBalance = (ata.saldo_disponivel || 0) < (ata.valor || 0) * 0.1;
    
    if (isExpired) {
      return <Badge className="bg-red-100 text-red-800 text-xs px-1 py-0.5">Vencida</Badge>;
    } else if (hasLowBalance) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs px-1 py-0.5">Saldo Baixo</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 text-xs px-1 py-0.5">Ativa</Badge>;
    }
  };

  const filteredAtasByStatus = selectedStatus === 'all' ? filteredAtas : filteredAtas.filter(ata => {
    const isExpired = ata.vencimento && new Date(ata.vencimento) < new Date();
    const hasLowBalance = (ata.saldo_disponivel || 0) < (ata.valor || 0) * 0.1;
    
    if (selectedStatus === 'ativo' && !isExpired && !hasLowBalance) return true;
    if (selectedStatus === 'inativo' && isExpired) return true;
    if (selectedStatus === 'pendente' && hasLowBalance && !isExpired) return true;
    
    return false;
  });

  // Calcular total dos saldos disponíveis
  const getTotalSaldoDisponivel = (): number => {
    return filteredAtasByStatus.reduce((total, ata) => total + (ata.saldo_disponivel || 0), 0);
  };

  // Atualizar lista filtrada quando categoryAtas mudar
  React.useEffect(() => {
    if (searchQuery) {
      const filtered = categoryAtas.filter(ata =>
        ata.n_ata.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ata.favorecido?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ata.objeto.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAtas(filtered);
    } else {
      setFilteredAtas(categoryAtas);
    }
  }, [categoryAtas, searchQuery]);

  return (
    <div className="container mx-auto px-3 py-3">
      {/* Back to Main Menu Button */}
      {onBack && (
        <div className="mb-3">
          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 hover:bg-blue-50 border-blue-200 text-blue-600 text-xs px-2 py-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar ao Menu Principal
          </Button>
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader className={`${headerColor} text-white p-2`}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">{title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Pesquisar ATA..."
                className="w-48 h-7 text-xs rounded-md bg-white/10 text-white placeholder:text-blue-100 border-none shadow-inner focus:ring-blue-400 focus:ring-offset-0"
                value={searchQuery}
                onChange={handleSearch}
              />
              <Button
                size="sm"
                className={
                  `text-xs px-2 py-1 transition-colors duration-200 ` +
                  (showObjeto
                    ? 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200'
                    : 'bg-blue-600 text-white border border-blue-700 hover:bg-blue-700')
                }
                style={{ minWidth: 110 }}
                onClick={() => setShowObjeto((prev) => !prev)}
              >
                {showObjeto ? 'Ocultar Objeto' : 'Mostrar Objeto'}
              </Button>
              {category === 'normal' && (
                <Button onClick={() => setIsCreateATADialogOpen(true)} size="sm" className="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-md text-xs px-2 py-1">
                  <Plus className="h-3 w-3 mr-1" />
                  Nova ATA
                </Button>
              )}
              {category === 'adesao' && (
                <Button onClick={() => setIsCreateAdesaoDialogOpen(true)} size="sm" className="bg-green-500 hover:bg-green-700 text-white font-bold rounded-md text-xs px-2 py-1">
                  <Plus className="h-3 w-3 mr-1" />
                  Nova Adesão
                </Button>
              )}
              {category === 'antigo' && (
                <Button onClick={() => setIsCreateContratoAntigoDialogOpen(true)} size="sm" className="bg-orange-500 hover:bg-orange-700 text-white font-bold rounded-md text-xs px-2 py-1">
                  <Plus className="h-3 w-3 mr-1" />
                  Novo Contrato
                </Button>
              )}
              {category === 'aquisicao' && (
                <Button onClick={() => setIsCreateAquisicaoGlobalDialogOpen(true)} size="sm" className="bg-purple-500 hover:bg-purple-700 text-white font-bold rounded-md text-xs px-2 py-1">
                  <Plus className="h-3 w-3 mr-1" />
                  Nova Aquisição
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nº ATA
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Processo Adm.
                  </th>
                  {showObjeto && (
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Objeto
                    </th>
                  )}
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Favorecido
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Disponível
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAtasByStatus.map(ata => {
                  const quantidadePedidos = pedidosPorAta[ata.id] || 0;
                  return (
                    <tr key={ata.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditAta(ata)}
                            className="text-blue-600 hover:text-blue-800 p-0.5 h-5 w-5"
                            title="Editar ATA"
                          >
                            <Edit className="h-2.5 w-2.5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-gray-600 hover:text-gray-800 p-0.5 h-5 w-5"
                            title="Visualizar ATA"
                          >
                            <Eye className="h-2.5 w-2.5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteAta(ata)}
                            className="text-red-600 hover:text-red-800 p-0.5 h-5 w-5"
                            title="Excluir ATA"
                          >
                            <Trash className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-blue-600">{ata.n_ata}</div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{ata.processo_adm}</div>
                      </td>
                      {showObjeto && (
                        <td className="px-2 py-1.5">
                          <div className="text-xs text-gray-900 max-w-xs truncate" title={ata.objeto}>
                            {ata.objeto}
                          </div>
                        </td>
                      )}
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{ata.favorecido || 'N/A'}</div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-blue-600">
                          {formatCurrency(ata.valor)}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs">
                          {renderSaldoDisplay(ata.saldo_disponivel)}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {formatDate(ata.vencimento ? new Date(ata.vencimento) : null)}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div
                          className="text-xs text-blue-600 cursor-pointer hover:underline"
                          onClick={() => {
                            setSelectedPedidosAta(ata);
                            setShowPedidosSection(true);
                          }}
                        >
                          {quantidadePedidos} pedidos
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Seção de Totais - Redesign Moderno */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-t-4 border-gradient-to-r from-emerald-400 to-green-400 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    RESUMO FINANCEIRO
                  </h3>
                  <p className="text-sm text-gray-600">
                    Total de {filteredAtasByStatus.length} ATA{filteredAtasByStatus.length !== 1 ? 's' : ''} listada{filteredAtasByStatus.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Saldo Total Disponível
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {formatCurrency(getTotalSaldoDisponivel())}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Recursos disponíveis para utilização
                </div>
              </div>
            </div>
            
            {/* Barra de progresso visual */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Distribuição de Saldos</span>
                  <span>{filteredAtasByStatus.filter(ata => (ata.saldo_disponivel || 0) > 0).length} com saldo ativo</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${filteredAtasByStatus.length > 0 ? (filteredAtasByStatus.filter(ata => (ata.saldo_disponivel || 0) > 0).length / filteredAtasByStatus.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteATADialog
        ata={selectedAtaToDelete}
        isOpen={isDeleteConfirmationOpen}
        onClose={cancelDeleteAta}
        onConfirm={confirmDeleteAta}
      />

      {/* Edit ATA Dialog */}
      <EditATADialog
        record={selectedAtaToEdit}
        isOpen={isEditATADialogOpen}
        onClose={closeEditATADialog}
        onSave={() => {}}
      />

      {/* Create ATA Dialog */}
      <CreateATADialog
        isOpen={isCreateATADialogOpen}
        onClose={() => setIsCreateATADialogOpen(false)}
      />

      {/* Create Adesao Dialog */}
      <CreateAdesaoDialog
        isOpen={isCreateAdesaoDialogOpen}
        onClose={() => setIsCreateAdesaoDialogOpen(false)}
      />

      {/* Create Contrato Antigo Dialog */}
      <CreateContratoAntigoDialog
        isOpen={isCreateContratoAntigoDialogOpen}
        onClose={() => setIsCreateContratoAntigoDialogOpen(false)}
      />

      {/* Create Aquisicao Global Dialog */}
      <CreateAquisicaoGlobalDialog
        isOpen={isCreateAquisicaoGlobalDialogOpen}
        onClose={() => setIsCreateAquisicaoGlobalDialogOpen(false)}
      />

      {/* PedidosSection Modal */}
      {showPedidosSection && selectedPedidosAta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
              onClick={() => setShowPedidosSection(false)}
              aria-label="Fechar"
            >
              ×
            </button>
            <PedidosSection
              atas={atas}
              pedidos={pedidos}
              selectedAtaId={selectedPedidosAta.id}
              onBack={() => setShowPedidosSection(false)}
              hideSummaryCards={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ATATable;
