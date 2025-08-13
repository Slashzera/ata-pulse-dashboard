import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Filter, Eye, Edit, CheckCircle, Plus, Trash, ArrowLeft } from 'lucide-react';
import { ATA } from '@/hooks/useAtas';
import { Pedido, useUpdatePedido } from '@/hooks/usePedidos';
import PedidoDetailsDialog from '@/components/PedidoDetailsDialog';
import EditPedidoDialog from '@/components/EditPedidoDialog';
import CreatePedidoDialog from '@/components/CreatePedidoDialog';
import DeletePedidoDialog from '@/components/DeletePedidoDialog';
import SaldoAlert from '@/components/SaldoAlert';

interface PedidosSectionProps {
  atas: ATA[];
  pedidos: Pedido[];
  selectedAtaId?: string;
  onBack?: () => void;
  hideSummaryCards?: boolean;
}

const PedidosSection: React.FC<PedidosSectionProps> = ({ atas, pedidos, selectedAtaId, onBack, hideSummaryCards }) => {
  const [selectedAtaFilter, setSelectedAtaFilter] = useState<string>(selectedAtaId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [deletingPedido, setDeletingPedido] = useState<Pedido | null>(null);
  const [isPedidoDetailsOpen, setIsPedidoDetailsOpen] = useState(false);
  const [isEditPedidoDialogOpen, setIsEditPedidoDialogOpen] = useState(false);
  const [isCreatePedidoDialogOpen, setIsCreatePedidoDialogOpen] = useState(false);
  const [isDeletePedidoDialogOpen, setIsDeletePedidoDialogOpen] = useState(false);
  const [selectedCategoryForNewPedido, setSelectedCategoryForNewPedido] = useState<string>('');
  const [showNoSaldoAlert, setShowNoSaldoAlert] = useState(false);
  const [alertCategory, setAlertCategory] = useState<string>('');
  
  const updatePedidoMutation = useUpdatePedido();

  console.log('Todos os pedidos recebidos:', pedidos);
  console.log('ATAs disponíveis:', atas);

  // Categorize ATAs by category field from database
  const categorizeAtas = () => {
    return {
      normal: atas.filter(ata => ata.category === 'normal'),
      adesao: atas.filter(ata => ata.category === 'adesao'),
      antigo: atas.filter(ata => ata.category === 'antigo'),
      aquisicao: atas.filter(ata => ata.category === 'aquisicao')
    };
  };

  const categorizedAtas = categorizeAtas();

  // Calculate totals by category using real ATA categories
  const calculateTotalByCategory = (category: string) => {
    const categoryAtas = categorizedAtas[category as keyof typeof categorizedAtas] || [];
    return categoryAtas.reduce((total, ata) => total + ata.saldo_disponivel, 0);
  };

  // Filter pedidos based on selected filters
  const filteredPedidos = pedidos.filter(pedido => {
    const ata = atas.find(a => a.id === pedido.ata_id);
    
    console.log(`Filtrando pedido ${pedido.id}:`, {
      pedido_ata_id: pedido.ata_id,
      ata_encontrada: ata ? ata.n_ata : 'não encontrada',
      selectedAtaId,
      selectedAtaFilter,
      selectedCategory,
      selectedStatus,
      pedido_status: pedido.status,
      pedido_category: pedido.ata_category || ata?.category
    });

    // Filter by specific ATA if selected from props
    if (selectedAtaId && pedido.ata_id !== selectedAtaId) {
      console.log(`Pedido ${pedido.id} filtrado por selectedAtaId`);
      return false;
    }
    
    // Filter by ATA selection dropdown
    if (!selectedAtaId && selectedAtaFilter !== 'all' && pedido.ata_id !== selectedAtaFilter) {
      console.log(`Pedido ${pedido.id} filtrado por selectedAtaFilter`);
      return false;
    }
    
    // Filter by category using the pedido's ata_category or fallback to ATA category
    if (selectedCategory !== 'all') {
      const pedidoCategory = pedido.ata_category || ata?.category;
      if (pedidoCategory !== selectedCategory) {
        console.log(`Pedido ${pedido.id} filtrado por categoria`);
        return false;
      }
    }

    // Filter by status
    if (selectedStatus !== 'all' && pedido.status !== selectedStatus) {
      console.log(`Pedido ${pedido.id} filtrado por status`);
      return false;
    }

    console.log(`Pedido ${pedido.id} passou pelos filtros`);
    return true;
  });

  console.log('Pedidos após filtros:', filteredPedidos);

  const getAtaById = (ataId: string) => {
    return atas.find(record => record.id === ataId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'aprovado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'finalizado': return 'FINALIZADO';
      case 'rejeitado': return 'REJEITADO';
      case 'aprovado': return 'APROVADO';
      default: return 'PENDENTE';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleFinalizarPedido = (pedido: Pedido) => {
    updatePedidoMutation.mutate({
      ...pedido,
      status: 'finalizado'
    });
  };

  const handleViewPedidoDetails = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setIsPedidoDetailsOpen(true);
  };

  const handleEditPedido = (pedido: Pedido) => {
    setEditingPedido(pedido);
    setIsEditPedidoDialogOpen(true);
  };

  const handleDeletePedido = (pedido: Pedido) => {
    setDeletingPedido(pedido);
    setIsDeletePedidoDialogOpen(true);
  };

  const handleCreatePedidoForCategory = (category: string) => {
    const categoryAtasWithSaldo = getCategoryAtasForPedido(category).filter(ata => ata.saldo_disponivel > 0);
    
    if (categoryAtasWithSaldo.length === 0) {
      setAlertCategory(getCategoryName(category));
      setShowNoSaldoAlert(true);
      setTimeout(() => setShowNoSaldoAlert(false), 5000);
      return;
    }
    
    setSelectedCategoryForNewPedido(category);
    setIsCreatePedidoDialogOpen(true);
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'normal': return 'Nova ATA';
      case 'adesao': return 'Nova Adesão';
      case 'antigo': return 'Saldo de ATAs (Contratos Antigos)';
      case 'aquisicao': return 'Aquisição Global';
      default: return category;
    }
  };

  const getCategoryAtasForPedido = (category: string) => {
    return categorizedAtas[category as keyof typeof categorizedAtas] || [];
  };

  const renderSaldoDisplay = (value: number) => {
    if (value === 0) {
      return <span className="text-red-600 font-bold">SALDO ZERADO</span>;
    }
    return <span className="text-green-600 font-semibold">{formatCurrency(value)}</span>;
  };

  return (
    <>
      <SaldoAlert 
        message={`❌ Não há ATAs de ${alertCategory} com saldo disponível para criar pedidos!`}
        show={showNoSaldoAlert}
      />

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

      {/* Summary Cards by Category */}
      {!hideSummaryCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total - Nova ATA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateTotalByCategory('normal') === 0 ? (
                  <span className="text-red-200">SALDO ZERADO</span>
                ) : (
                  formatCurrency(calculateTotalByCategory('normal'))
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs opacity-90">{categorizedAtas.normal.length} ATAs</p>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleCreatePedidoForCategory('normal')}
                  className="text-blue-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo Pedido
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total - Nova Adesão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateTotalByCategory('adesao') === 0 ? (
                  <span className="text-red-200">SALDO ZERADO</span>
                ) : (
                  formatCurrency(calculateTotalByCategory('adesao'))
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs opacity-90">{categorizedAtas.adesao.length} ATAs</p>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleCreatePedidoForCategory('adesao')}
                  className="text-green-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo Pedido
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total - Contratos Antigos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateTotalByCategory('antigo') === 0 ? (
                  <span className="text-red-200">SALDO ZERADO</span>
                ) : (
                  formatCurrency(calculateTotalByCategory('antigo'))
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs opacity-90">{categorizedAtas.antigo.length} ATAs</p>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleCreatePedidoForCategory('antigo')}
                  className="text-orange-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo Pedido
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total - Aquisição Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {calculateTotalByCategory('aquisicao') === 0 ? (
                  <span className="text-red-200">SALDO ZERADO</span>
                ) : (
                  formatCurrency(calculateTotalByCategory('aquisicao'))
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs opacity-90">{categorizedAtas.aquisicao.length} ATAs</p>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleCreatePedidoForCategory('aquisicao')}
                  className="text-purple-600"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters */}
      {!selectedAtaId && (
        <div className="mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="h-5 w-5 text-gray-600" />
            
            <div className="flex items-center gap-2">
              <Label htmlFor="categoryFilter">Filtrar por Categoria:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="normal">Nova ATA</SelectItem>
                  <SelectItem value="adesao">Nova Adesão</SelectItem>
                  <SelectItem value="antigo">Contratos Antigos</SelectItem>
                  <SelectItem value="aquisicao">Aquisição Global</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="statusFilter">Filtrar por Status:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="ataFilter">Filtrar por ATA:</Label>
              <Select value={selectedAtaFilter} onValueChange={setSelectedAtaFilter}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Selecione uma ATA para filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Pedidos</SelectItem>
                  {atas.map((record) => (
                    <SelectItem key={record.id} value={record.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{record.n_ata} - {record.favorecido}</span>
                        <span className="ml-2">
                          {renderSaldoDisplay(record.saldo_disponivel)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedAtaFilter !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSelectedAtaFilter('all');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Informações sobre os pedidos */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800">
              <strong>Total de pedidos encontrados:</strong> {filteredPedidos.length}
            </p>
            <p className="text-sm text-blue-600">
              Pedidos na base de dados: {pedidos.length} | ATAs cadastradas: {atas.length}
            </p>
          </div>
          {filteredPedidos.length === 0 && pedidos.length > 0 && (
            <p className="text-sm text-orange-600">
              ⚠️ Pedidos não aparecem? Verifique os filtros acima
            </p>
          )}
        </div>
      </div>

      {/* Cards dos Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPedidos.map((pedido) => {
          const ata = getAtaById(pedido.ata_id);
          const ataCategory = pedido.ata_category || ata?.category || 'normal';
          
          return (
            <Card key={pedido.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className={`text-white ${
                ataCategory === 'normal' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                ataCategory === 'adesao' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                ataCategory === 'antigo' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                'bg-gradient-to-r from-purple-500 to-purple-600'
              }`}>
                <CardTitle className="flex items-center gap-2">
                  {pedido.departamento}
                  <span className="text-xs bg-white/20 px-2 py-1 rounded">
                    {getCategoryName(ataCategory)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(pedido.status)}`}>
                      {getStatusLabel(pedido.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">ATA:</span>
                    <span className="font-medium text-sm">{ata?.n_ata || pedido.ata_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Favorecido:</span>
                    <span className="font-medium text-sm">{ata?.favorecido || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor do Pedido:</span>
                    <span className={`font-bold text-lg ${
                      ataCategory === 'normal' ? 'text-blue-600' :
                      ataCategory === 'adesao' ? 'text-green-600' :
                      ataCategory === 'antigo' ? 'text-orange-600' :
                      'text-purple-600'
                    }`}>
                      {formatCurrency(pedido.valor)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <strong>Descrição:</strong> {pedido.descricao}
                  </div>
                  {pedido.observacoes && (
                    <div className="text-sm text-gray-600">
                      <strong>Observações:</strong> {pedido.observacoes}
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      className={`flex-1 ${
                        ataCategory === 'normal' ? 'bg-blue-600 hover:bg-blue-700' :
                        ataCategory === 'adesao' ? 'bg-green-600 hover:bg-green-700' :
                        ataCategory === 'antigo' ? 'bg-orange-600 hover:bg-orange-700' :
                        'bg-purple-600 hover:bg-purple-700'
                      }`}
                      onClick={() => handleViewPedidoDetails(pedido)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPedido(pedido)}
                      title="Editar Pedido"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePedido(pedido)}
                      className="text-red-600 hover:text-red-700"
                      title="Excluir Pedido"
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                    {pedido.status !== 'finalizado' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleFinalizarPedido(pedido)}
                        className="text-green-600 hover:text-green-700"
                        title="Finalizar Pedido"
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialogs */}
      <PedidoDetailsDialog
        pedido={selectedPedido}
        ata={selectedPedido ? getAtaById(selectedPedido.ata_id) : null}
        isOpen={isPedidoDetailsOpen}
        onClose={() => {
          setIsPedidoDetailsOpen(false);
          setSelectedPedido(null);
        }}
      />

      <EditPedidoDialog
        pedido={editingPedido}
        isOpen={isEditPedidoDialogOpen}
        onClose={() => {
          setIsEditPedidoDialogOpen(false);
          setEditingPedido(null);
        }}
      />

      <DeletePedidoDialog
        pedido={deletingPedido}
        isOpen={isDeletePedidoDialogOpen}
        onClose={() => {
          setIsDeletePedidoDialogOpen(false);
          setDeletingPedido(null);
        }}
      />

      <CreatePedidoDialog
        atas={getCategoryAtasForPedido(selectedCategoryForNewPedido)}
        isOpen={isCreatePedidoDialogOpen}
        onClose={() => {
          setIsCreatePedidoDialogOpen(false);
          setSelectedCategoryForNewPedido('');
        }}
        categoryName={getCategoryName(selectedCategoryForNewPedido)}
      />
    </>
  );
};

export default PedidosSection;
