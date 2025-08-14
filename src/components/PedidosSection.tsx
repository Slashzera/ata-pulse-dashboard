import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Filter, Eye, Edit, CheckCircle, Plus, Trash, ArrowLeft, TrendingUp, Calendar, Building2, DollarSign, FileText, Users, BarChart3, Activity, Sparkles, Target, Zap, Star, Search, SlidersHorizontal, Wallet, CreditCard, ShoppingCart, Package } from 'lucide-react';
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

      {/* Modern Header with Back Button */}
      {onBack && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <Button
              onClick={onBack}
              variant="ghost"
              className="flex items-center gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-transparent hover:border-blue-200 text-slate-600 hover:text-blue-700 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Voltar ao Menu Principal</span>
            </Button>
            <div className="flex items-center gap-3 text-slate-500">
              <Package className="h-5 w-5" />
              <span className="text-lg font-semibold">Gestão de Pedidos</span>
            </div>
          </div>
        </div>
      )}

      {/* Ultra-Modern Premium Summary Cards */}
      {!hideSummaryCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-blue-100">Nova ATA</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold mb-3">
                {calculateTotalByCategory('normal') === 0 ? (
                  <span className="text-red-300 text-lg">SALDO ZERADO</span>
                ) : (
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {formatCurrency(calculateTotalByCategory('normal'))}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-blue-200 font-medium">{categorizedAtas.normal.length} ATAs ativas</p>
                <Button 
                  size="sm" 
                  onClick={() => handleCreatePedidoForCategory('normal')}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-emerald-100">Nova Adesão</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold mb-3">
                {calculateTotalByCategory('adesao') === 0 ? (
                  <span className="text-red-300 text-lg">SALDO ZERADO</span>
                ) : (
                  <span className="bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                    {formatCurrency(calculateTotalByCategory('adesao'))}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-emerald-200 font-medium">{categorizedAtas.adesao.length} ATAs ativas</p>
                <Button 
                  size="sm" 
                  onClick={() => handleCreatePedidoForCategory('adesao')}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-700 to-red-800 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-amber-100">Contratos Antigos</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold mb-3">
                {calculateTotalByCategory('antigo') === 0 ? (
                  <span className="text-red-300 text-lg">SALDO ZERADO</span>
                ) : (
                  <span className="bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">
                    {formatCurrency(calculateTotalByCategory('antigo'))}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-amber-200 font-medium">{categorizedAtas.antigo.length} ATAs ativas</p>
                <Button 
                  size="sm" 
                  onClick={() => handleCreatePedidoForCategory('antigo')}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 text-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-purple-100">Aquisição Global</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Target className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold mb-3">
                {calculateTotalByCategory('aquisicao') === 0 ? (
                  <span className="text-red-300 text-lg">SALDO ZERADO</span>
                ) : (
                  <span className="bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    {formatCurrency(calculateTotalByCategory('aquisicao'))}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-purple-200 font-medium">{categorizedAtas.aquisicao.length} ATAs ativas</p>
                <Button 
                  size="sm" 
                  onClick={() => handleCreatePedidoForCategory('aquisicao')}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Novo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modern Enhanced Filters */}
      {!selectedAtaId && (
        <div className="mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <SlidersHorizontal className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Filtros Avançados</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="categoryFilter" className="text-sm font-medium text-slate-600">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          Todas as Categorias
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Nova ATA
                        </div>
                      </SelectItem>
                      <SelectItem value="adesao">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          Nova Adesão
                        </div>
                      </SelectItem>
                      <SelectItem value="antigo">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          Contratos Antigos
                        </div>
                      </SelectItem>
                      <SelectItem value="aquisicao">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Aquisição Global
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statusFilter" className="text-sm font-medium text-slate-600">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          Todos os Status
                        </div>
                      </SelectItem>
                      <SelectItem value="pendente">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Pendente
                        </div>
                      </SelectItem>
                      <SelectItem value="aprovado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Aprovado
                        </div>
                      </SelectItem>
                      <SelectItem value="rejeitado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Rejeitado
                        </div>
                      </SelectItem>
                      <SelectItem value="finalizado">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Finalizado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ataFilter" className="text-sm font-medium text-slate-600">ATA Específica</Label>
                  <Select value={selectedAtaFilter} onValueChange={setSelectedAtaFilter}>
                    <SelectTrigger className="w-full border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Selecione uma ATA" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                          Todos os Pedidos
                        </div>
                      </SelectItem>
                      {atas.map((record) => (
                        <SelectItem key={record.id} value={record.id}>
                          <div className="flex justify-between items-center w-full">
                            <span className="truncate">{record.n_ata} - {record.favorecido}</span>
                            <span className="ml-2 text-xs">
                              {renderSaldoDisplay(record.saldo_disponivel)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(selectedAtaFilter !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedAtaFilter('all');
                      setSelectedCategory('all');
                      setSelectedStatus('all');
                    }}
                    className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                  >
                    <Trash className="h-3 w-3" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modern Stats Info */}
      <div className="mb-8">
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-800">
                      {filteredPedidos.length} pedidos encontrados
                    </p>
                    <p className="text-sm text-slate-600">
                      {pedidos.length} total na base • {atas.length} ATAs ativas
                    </p>
                  </div>
                </div>
                
                {filteredPedidos.length > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-slate-600">
                        {filteredPedidos.filter(p => p.status === 'finalizado').length} finalizados
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-slate-600">
                        {filteredPedidos.filter(p => p.status === 'pendente').length} pendentes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-slate-600">
                        {filteredPedidos.filter(p => p.status === 'aprovado').length} aprovados
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {filteredPedidos.length === 0 && pedidos.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-lg">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-amber-700 font-medium">
                    Nenhum pedido encontrado com os filtros atuais
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ultra-Modern Pedidos Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPedidos.map((pedido) => {
          const ata = getAtaById(pedido.ata_id);
          const ataCategory = pedido.ata_category || ata?.category || 'normal';
          
          const getCategoryGradient = (category: string) => {
            switch (category) {
              case 'normal': return 'from-blue-600 to-indigo-700';
              case 'adesao': return 'from-emerald-600 to-teal-700';
              case 'antigo': return 'from-amber-600 to-orange-700';
              case 'aquisicao': return 'from-purple-600 to-violet-700';
              default: return 'from-slate-600 to-gray-700';
            }
          };

          const getCategoryIcon = (category: string) => {
            switch (category) {
              case 'normal': return <Wallet className="h-4 w-4" />;
              case 'adesao': return <CreditCard className="h-4 w-4" />;
              case 'antigo': return <FileText className="h-4 w-4" />;
              case 'aquisicao': return <Target className="h-4 w-4" />;
              default: return <Package className="h-4 w-4" />;
            }
          };
          
          return (
            <Card key={pedido.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className={`text-white bg-gradient-to-r ${getCategoryGradient(ataCategory)} relative z-10`}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg">{pedido.departamento}</div>
                      <div className="text-xs opacity-90 font-normal">
                        Pedido #{pedido.id.slice(-8)}
                      </div>
                    </div>
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                    {getCategoryIcon(ataCategory)}
                    <span>{getCategoryName(ataCategory)}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 relative z-10">
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Status</span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(pedido.status)} shadow-sm`}>
                      {getStatusLabel(pedido.status)}
                    </span>
                  </div>

                  {/* ATA Info */}
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">ATA</span>
                      <span className="font-semibold text-slate-800">{ata?.n_ata || pedido.ata_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 text-sm">Favorecido</span>
                      <span className="font-medium text-slate-700 text-sm truncate max-w-[200px]" title={ata?.favorecido || 'N/A'}>
                        {ata?.favorecido || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valor do Pedido
                      </span>
                      <span className="font-bold text-xl text-green-800">
                        {formatCurrency(pedido.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="text-sm text-blue-800">
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Descrição
                      </div>
                      <p className="text-blue-700 leading-relaxed">{pedido.descricao}</p>
                    </div>
                  </div>

                  {/* Observações */}
                  {pedido.observacoes && (
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <div className="text-sm text-amber-800">
                        <div className="font-semibold mb-2">Observações</div>
                        <p className="text-amber-700">{pedido.observacoes}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Button 
                      className={`flex-1 bg-gradient-to-r ${getCategoryGradient(ataCategory)} hover:shadow-lg text-white border-0 transition-all duration-300`}
                      onClick={() => handleViewPedidoDetails(pedido)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditPedido(pedido)}
                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                        title="Editar Pedido"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeletePedido(pedido)}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                        title="Excluir Pedido"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      
                      {pedido.status !== 'finalizado' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleFinalizarPedido(pedido)}
                          className="hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors"
                          title="Finalizar Pedido"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPedidos.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
            <ShoppingCart className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-slate-500 mb-6">
            {pedidos.length === 0 
              ? "Ainda não há pedidos cadastrados no sistema."
              : "Tente ajustar os filtros para encontrar os pedidos desejados."
            }
          </p>
          {pedidos.length === 0 && (
            <Button 
              onClick={() => setIsCreatePedidoDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Pedido
            </Button>
          )}
        </div>
      )}

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
