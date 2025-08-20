import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Search, Filter, Eye, Edit, Trash, Plus, CheckCircle,
  Clock, AlertTriangle, XCircle, DollarSign, Calendar, FileText,
  Building2, Package, Users, Activity, TrendingUp, BarChart3,
  Target, Zap, Star, Sparkles, CreditCard, Wallet, ShoppingCart
} from 'lucide-react';
import { ATA } from '@/hooks/useAtas';
import { Pedido } from '@/hooks/usePedidos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModernPedidosViewProps {
  onBack?: () => void;
  atas: ATA[];
  pedidos: Pedido[];
  selectedAtaId?: string;
  onCreatePedido?: () => void;
  onEditPedido?: (pedido: Pedido) => void;
  onViewPedido?: (pedido: Pedido) => void;
  onDeletePedido?: (pedido: Pedido) => void;
}

const ModernPedidosView: React.FC<ModernPedidosViewProps> = ({
  onBack,
  atas,
  pedidos,
  selectedAtaId,
  onCreatePedido,
  onEditPedido,
  onViewPedido,
  onDeletePedido
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ataFilter, setAtaFilter] = useState(selectedAtaId || 'all');
  const [sortBy, setSortBy] = useState('created_at');

  // Filtrar pedidos
  const filteredPedidos = useMemo(() => {
    let filtered = pedidos;

    // Filtro por ATA específica
    if (ataFilter !== 'all') {
      filtered = filtered.filter(pedido => pedido.ata_id === ataFilter);
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(pedido => {
        const ata = atas.find(a => a.id === pedido.ata_id);
        return ata?.category === categoryFilter;
      });
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(pedido => pedido.status === statusFilter);
    }

    // Filtro por pesquisa
    if (searchQuery) {
      filtered = filtered.filter(pedido =>
        pedido.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pedido.empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pedido.numero_pedido.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'valor':
          return b.valor - a.valor;
        case 'data_entrega':
          return new Date(a.data_entrega || '').getTime() - new Date(b.data_entrega || '').getTime();
        case 'empresa':
          return a.empresa.localeCompare(b.empresa);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [pedidos, ataFilter, categoryFilter, statusFilter, searchQuery, sortBy, atas]);

  // Estatísticas dos pedidos
  const pedidosStats = useMemo(() => {
    const stats = {
      total: pedidos.length,
      pendente: pedidos.filter(p => p.status === 'pendente').length,
      aprovado: pedidos.filter(p => p.status === 'aprovado').length,
      rejeitado: pedidos.filter(p => p.status === 'rejeitado').length,
      entregue: pedidos.filter(p => p.status === 'entregue').length,
      totalValue: pedidos.reduce((sum, p) => sum + p.valor, 0),
      approvedValue: pedidos.filter(p => p.status === 'aprovado').reduce((sum, p) => sum + p.valor, 0)
    };

    return stats;
  }, [pedidos]);

  const getStatusConfig = (status: string) => {
    const configs = {
      pendente: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'Pendente'
      },
      aprovado: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Aprovado'
      },
      rejeitado: {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'Rejeitado'
      },
      entregue: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Package,
        label: 'Entregue'
      }
    };
    return configs[status as keyof typeof configs] || configs.pendente;
  };

  const getCategoryConfig = (category: string) => {
    const configs = {
      normal: {
        name: 'ATAs Normais',
        color: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        icon: FileText
      },
      adesao: {
        name: 'Adesões',
        color: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        icon: Users
      },
      antigo: {
        name: 'Contratos Antigos',
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        icon: Clock
      },
      aquisicao: {
        name: 'Aquisição Global',
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        icon: Package
      }
    };
    return configs[category as keyof typeof configs] || configs.normal;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {onBack && (
              <Button
                onClick={onBack}
                className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Voltar</span>
              </Button>
            )}
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Gestão de Pedidos
                </h1>
                <p className="text-slate-600">Controle completo de pedidos por ATA</p>
              </div>
              
              {onCreatePedido && (
                <Button
                  onClick={onCreatePedido}
                  className="bg-gradient-to-r from-blue-600 to-purple-700 hover:shadow-lg text-white border-0 transition-all duration-300 px-6 py-3 rounded-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Pedido
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Pedidos */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Total
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Total de Pedidos</h3>
              <p className="text-2xl font-bold">{pedidosStats.total}</p>
            </CardContent>
          </Card>

          {/* Pedidos Aprovados */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Aprovados
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Aprovados</h3>
              <p className="text-2xl font-bold">{pedidosStats.aprovado}</p>
            </CardContent>
          </Card>

          {/* Pedidos Pendentes */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Clock className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Pendentes
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Pendentes</h3>
              <p className="text-2xl font-bold">{pedidosStats.pendente}</p>
            </CardContent>
          </Card>

          {/* Valor Total */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Valor
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Valor Total</h3>
              <p className="text-xl font-bold">{formatCurrency(pedidosStats.totalValue)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Controles de Pesquisa e Filtros */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Pesquisa */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Pesquisar por descrição, empresa ou número do pedido..."
                  className="pl-10 pr-4 py-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-slate-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 border-slate-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="normal">ATAs Normais</SelectItem>
                    <SelectItem value="adesao">Adesões</SelectItem>
                    <SelectItem value="antigo">Contratos Antigos</SelectItem>
                    <SelectItem value="aquisicao">Aquisição Global</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 border-slate-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data Criação</SelectItem>
                    <SelectItem value="valor">Valor</SelectItem>
                    <SelectItem value="data_entrega">Data Entrega</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contador de Resultados */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Activity className="h-4 w-4" />
                <span className="text-sm">
                  {filteredPedidos.length} pedido{filteredPedidos.length !== 1 ? 's' : ''} encontrado{filteredPedidos.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPedidos.map((pedido) => {
            const ata = atas.find(a => a.id === pedido.ata_id);
            const categoryConfig = getCategoryConfig(ata?.category || 'normal');
            const statusConfig = getStatusConfig(pedido.status);
            const StatusIcon = statusConfig.icon;
            const CategoryIcon = categoryConfig.icon;

            return (
              <Card 
                key={pedido.id}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white overflow-hidden"
              >
                {/* Header do Card */}
                <div className={`bg-gradient-to-r ${categoryConfig.color} text-white p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Pedido #{pedido.numero_pedido}</h3>
                        <p className="text-sm opacity-90">{categoryConfig.name}</p>
                      </div>
                    </div>
                    <Badge className={`${statusConfig.color} border-0`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Descrição */}
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Descrição
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2" title={pedido.descricao}>
                        {pedido.descricao}
                      </p>
                    </div>

                    {/* Empresa */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Empresa</span>
                      </div>
                      <p className="text-slate-800 font-semibold truncate" title={pedido.empresa}>
                        {pedido.empresa}
                      </p>
                    </div>

                    {/* ATA Vinculada */}
                    {ata && (
                      <div className={`${categoryConfig.bgColor} rounded-lg p-3 border ${categoryConfig.textColor.replace('text-', 'border-').replace('700', '200')}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4" />
                          <span className={`text-sm font-medium ${categoryConfig.textColor}`}>ATA Vinculada</span>
                        </div>
                        <p className={`${categoryConfig.textColor} font-semibold text-sm`}>
                          ATA {ata.n_ata}
                        </p>
                      </div>
                    )}

                    {/* Valor e Data */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-700">Valor</span>
                        </div>
                        <p className="text-green-800 font-bold text-sm">
                          {formatCurrency(pedido.valor)}
                        </p>
                      </div>
                      
                      {pedido.data_entrega && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">Entrega</span>
                          </div>
                          <p className="text-blue-800 font-bold text-sm">
                            {format(new Date(pedido.data_entrega), 'dd/MM/yy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Data de Criação */}
                    <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                      Criado em {format(new Date(pedido.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <Button 
                        className={`flex-1 bg-gradient-to-r ${categoryConfig.color} hover:shadow-lg text-white border-0 transition-all duration-300`}
                        onClick={() => onViewPedido?.(pedido)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onEditPedido?.(pedido)}
                          className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                          title="Editar Pedido"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onDeletePedido?.(pedido)}
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                          title="Excluir Pedido"
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

        {/* Estado Vazio */}
        {filteredPedidos.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum pedido encontrado</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery 
                ? "Tente ajustar os termos de pesquisa para encontrar os pedidos desejados."
                : "Ainda não há pedidos cadastrados no sistema."
              }
            </p>
            {onCreatePedido && (
              <Button
                onClick={onCreatePedido}
                className="bg-gradient-to-r from-blue-600 to-purple-700 hover:shadow-lg text-white border-0 transition-all duration-300 px-6 py-3 rounded-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar Primeiro Pedido
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernPedidosView;