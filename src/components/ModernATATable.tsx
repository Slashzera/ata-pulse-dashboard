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
  TrendingUp,
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Zap,
  Star,
  Target
} from 'lucide-react';
import { ATA, useDeleteAta } from '@/hooks/useAtas';
import { usePedidos } from '@/hooks/usePedidos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditATADialog from '@/components/EditATADialog';
import DeleteATADialog from '@/components/DeleteATADialog';
import ModernCreateATADialog from '@/components/ModernCreateATADialog';
import ModernCreateAdesaoDialog from '@/components/ModernCreateAdesaoDialog';
import ModernCreateContratoAntigoDialog from '@/components/ModernCreateContratoAntigoDialog';
import ModernCreateAquisicaoGlobalDialog from '@/components/ModernCreateAquisicaoGlobalDialog';

interface ModernATATableProps {
  atas: ATA[];
  category: string;
  title: string;
  headerColor: string;
  onBack?: () => void;
}

const ModernATATable: React.FC<ModernATATableProps> = ({ atas, category, title, headerColor, onBack }) => {
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const deleteATAMutation = useDeleteAta();
  
  // Filtrar ATAs apenas para a categoria específica
  const categoryAtas = useMemo(() => {
    const filtered = atas.filter(ata => ata.category === category);
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

  const getStatusInfo = (ata: ATA) => {
    const isExpired = ata.vencimento && new Date(ata.vencimento) < new Date();
    const hasLowBalance = (ata.saldo_disponivel || 0) < (ata.valor || 0) * 0.1;
    const isZeroBalance = (ata.saldo_disponivel || 0) === 0;
    
    if (isZeroBalance) {
      return { 
        status: 'Saldo Zerado', 
        color: 'bg-red-500', 
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: AlertTriangle 
      };
    } else if (isExpired) {
      return { 
        status: 'Vencida', 
        color: 'bg-gray-500', 
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: Clock 
      };
    } else if (hasLowBalance) {
      return { 
        status: 'Saldo Baixo', 
        color: 'bg-yellow-500', 
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: AlertTriangle 
      };
    } else {
      return { 
        status: 'Ativa', 
        color: 'bg-green-500', 
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle 
      };
    }
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'normal':
        return { 
          name: 'ATAs Normais', 
          color: 'from-blue-600 to-indigo-600',
          icon: FileText,
          description: 'Contratos de fornecimento padrão'
        };
      case 'adesao':
        return { 
          name: 'Adesões', 
          color: 'from-green-600 to-emerald-600',
          icon: Target,
          description: 'Adesões a atas de registro de preços'
        };
      case 'antigo':
        return { 
          name: 'Saldo de ATAs', 
          color: 'from-orange-600 to-amber-600',
          icon: Star,
          description: 'Contratos antigos com saldo remanescente'
        };
      case 'aquisicao':
        return { 
          name: 'Aquisição Global', 
          color: 'from-purple-600 to-violet-600',
          icon: Zap,
          description: 'Aquisições de escala global'
        };
      default:
        return { 
          name: 'Contratos', 
          color: 'from-gray-600 to-gray-600',
          icon: FileText,
          description: 'Contratos diversos'
        };
    }
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

  const filteredAtasByStatus = selectedStatus === 'all' ? filteredAtas : filteredAtas.filter(ata => {
    const statusInfo = getStatusInfo(ata);
    return selectedStatus === statusInfo.status.toLowerCase().replace(' ', '-');
  });

  // Calcular estatísticas
  const totalSaldoDisponivel = filteredAtasByStatus.reduce((total, ata) => total + (ata.saldo_disponivel || 0), 0);
  const totalValor = filteredAtasByStatus.reduce((total, ata) => total + (ata.valor || 0), 0);
  const totalPedidos = filteredAtasByStatus.reduce((total, ata) => total + (pedidosPorAta[ata.id] || 0), 0);

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

  const categoryInfo = getCategoryInfo(category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header moderno */}
        <div className="mb-8">
          {/* Botão voltar */}
          {onBack && (
            <div className="mb-6">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center gap-2 hover:bg-white hover:shadow-md transition-all duration-300 border-gray-200 text-gray-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Menu Principal
              </Button>
            </div>
          )}

          {/* Header principal */}
          <div className={`bg-gradient-to-r ${categoryInfo.color} rounded-2xl shadow-xl p-8 text-white relative overflow-hidden`}>
            {/* Padrão de fundo */}
            <div className="absolute inset-0 bg-white/10 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
                backgroundSize: '100px 100px'
              }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                    <categoryInfo.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{categoryInfo.name}</h1>
                    <p className="text-blue-100 text-lg">{categoryInfo.description}</p>
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  
                  {category === 'normal' && (
                    <Button 
                      onClick={() => setIsCreateATADialogOpen(true)} 
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova ATA
                    </Button>
                  )}
                  {category === 'adesao' && (
                    <Button 
                      onClick={() => setIsCreateAdesaoDialogOpen(true)} 
                      className="bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Adesão
                    </Button>
                  )}
                  {category === 'antigo' && (
                    <Button 
                      onClick={() => setIsCreateContratoAntigoDialogOpen(true)} 
                      className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Contrato
                    </Button>
                  )}
                  {category === 'aquisicao' && (
                    <Button 
                      onClick={() => setIsCreateAquisicaoGlobalDialogOpen(true)} 
                      className="bg-white text-purple-600 hover:bg-purple-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Aquisição
                    </Button>
                  )}
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-white" />
                    <div>
                      <p className="text-blue-100 text-sm">Total de Contratos</p>
                      <p className="text-2xl font-bold text-white">{filteredAtasByStatus.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-white" />
                    <div>
                      <p className="text-blue-100 text-sm">Saldo Disponível</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(totalSaldoDisponivel)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-white" />
                    <div>
                      <p className="text-blue-100 text-sm">Valor Total</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(totalValor)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-6 w-6 text-white" />
                    <div>
                      <p className="text-blue-100 text-sm">Total de Pedidos</p>
                      <p className="text-2xl font-bold text-white">{totalPedidos}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de filtro e busca */}
        <div className="mb-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="search"
                      placeholder="Pesquisar por ATA, favorecido ou objeto..."
                      className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                  </div>
                  
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48 bg-white border-gray-200">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="ativa">Ativas</SelectItem>
                      <SelectItem value="saldo-baixo">Saldo Baixo</SelectItem>
                      <SelectItem value="vencida">Vencidas</SelectItem>
                      <SelectItem value="saldo-zerado">Saldo Zerado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="flex items-center gap-2"
                  >
                    <div className="grid grid-cols-2 gap-0.5 h-3 w-3">
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                      <div className="bg-current rounded-sm"></div>
                    </div>
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="flex items-center gap-2"
                  >
                    <div className="flex flex-col gap-0.5 h-3 w-3">
                      <div className="bg-current h-0.5 w-full rounded"></div>
                      <div className="bg-current h-0.5 w-full rounded"></div>
                      <div className="bg-current h-0.5 w-full rounded"></div>
                    </div>
                    Tabela
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo principal */}
        {viewMode === 'cards' ? (
          /* Visualização em Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAtasByStatus.map(ata => {
              const statusInfo = getStatusInfo(ata);
              const quantidadePedidos = pedidosPorAta[ata.id] || 0;
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={ata.id} className={`group hover:shadow-xl transition-all duration-300 hover:scale-105 border-l-4 ${statusInfo.borderColor} bg-white/90 backdrop-blur-sm`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                          <StatusIcon className={`h-5 w-5 ${statusInfo.textColor}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900">{ata.n_ata}</CardTitle>
                          <Badge className={`${statusInfo.color} text-white text-xs mt-1`}>
                            {statusInfo.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditAta(ata)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteAta(ata)}
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Favorecido</p>
                      <p className="text-sm text-gray-900 font-medium">{ata.favorecido}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Objeto</p>
                      <p className="text-sm text-gray-700 line-clamp-2" title={ata.objeto}>
                        {ata.objeto}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Valor Total</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(ata.valor)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Saldo Disponível</p>
                        <p className={`text-sm font-bold ${(ata.saldo_disponivel || 0) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(ata.saldo_disponivel)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {ata.vencimento ? formatDate(new Date(ata.vencimento)) : 'N/A'}
                        </span>
                      </div>
                      
                      {quantidadePedidos > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {quantidadePedidos} pedido{quantidadePedidos > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Visualização em Tabela */
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        ATA
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Favorecido
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Saldo Disponível
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vencimento
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pedidos
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredAtasByStatus.map(ata => {
                      const statusInfo = getStatusInfo(ata);
                      const quantidadePedidos = pedidosPorAta[ata.id] || 0;
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <tr key={ata.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-bold text-gray-900">{ata.n_ata}</div>
                              <div className="text-xs text-gray-500">{ata.processo_adm}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${statusInfo.textColor}`} />
                              <Badge className={`${statusInfo.color} text-white text-xs`}>
                                {statusInfo.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={ata.favorecido}>
                              {ata.favorecido}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(ata.valor)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-semibold ${(ata.saldo_disponivel || 0) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(ata.saldo_disponivel)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ata.vencimento ? formatDate(new Date(ata.vencimento)) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {quantidadePedidos > 0 ? (
                              <Badge variant="outline" className="text-xs">
                                {quantidadePedidos}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditAta(ata)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-600"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteAta(ata)}
                                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                              >
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
        )}

        {/* Mensagem quando não há resultados */}
        {filteredAtasByStatus.length === 0 && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-gray-100 p-6 rounded-full">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum contrato encontrado
                  </h3>
                  <p className="text-gray-600">
                    Não há contratos que correspondam aos filtros aplicados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogos */}
      {isEditATADialogOpen && selectedAtaToEdit && (
        <EditATADialog
          ata={selectedAtaToEdit}
          isOpen={isEditATADialogOpen}
          onClose={closeEditATADialog}
        />
      )}

      {isDeleteConfirmationOpen && selectedAtaToDelete && (
        <DeleteATADialog
          ata={selectedAtaToDelete}
          isOpen={isDeleteConfirmationOpen}
          onConfirm={confirmDeleteAta}
          onCancel={cancelDeleteAta}
        />
      )}

      <ModernCreateATADialog
        isOpen={isCreateATADialogOpen}
        onClose={() => setIsCreateATADialogOpen(false)}
        category="normal"
      />

      <ModernCreateAdesaoDialog
        isOpen={isCreateAdesaoDialogOpen}
        onClose={() => setIsCreateAdesaoDialogOpen(false)}
      />

      <ModernCreateContratoAntigoDialog
        isOpen={isCreateContratoAntigoDialogOpen}
        onClose={() => setIsCreateContratoAntigoDialogOpen(false)}
      />

      <ModernCreateAquisicaoGlobalDialog
        isOpen={isCreateAquisicaoGlobalDialogOpen}
        onClose={() => setIsCreateAquisicaoGlobalDialogOpen(false)}
      />
    </div>
  );
};

export default ModernATATable;