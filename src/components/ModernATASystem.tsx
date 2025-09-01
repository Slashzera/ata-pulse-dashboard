import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Users, Clock, Package, DollarSign, BarChart3,
  TrendingUp, Activity, Eye, Plus, ArrowRight, Sparkles,
  Target, Zap, Star, Building2, Calendar, CreditCard,
  Wallet, ShoppingCart, PieChart, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAtas } from '@/hooks/useAtas';
import { usePedidos } from '@/hooks/usePedidos';
import ModernATAsView from './ModernATAsView';
import ModernSaldoDashboard from './ModernSaldoDashboard';
import ModernPedidosView from './ModernPedidosView';

type ViewMode = 'dashboard' | 'atas' | 'saldos' | 'pedidos';

interface ModernATASystemProps {
  onBack?: () => void;
}

const ModernATASystem: React.FC<ModernATASystemProps> = ({ onBack }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAtaId, setSelectedAtaId] = useState<string>('');

  const { data: atas = [], isLoading: atasLoading } = useAtas();
  const { data: pedidos = [], isLoading: pedidosLoading } = usePedidos();

  // Estatísticas por categoria
  const categoryStats = React.useMemo(() => {
    const stats = {
      normal: { atas: 0, total: 0, saldo: 0, pedidos: 0 },
      adesao: { atas: 0, total: 0, saldo: 0, pedidos: 0 },
      antigo: { atas: 0, total: 0, saldo: 0, pedidos: 0 },
      aquisicao: { atas: 0, total: 0, saldo: 0, pedidos: 0 }
    };

    atas.forEach(ata => {
      const category = ata.category as keyof typeof stats;
      if (stats[category]) {
        stats[category].atas += 1;
        stats[category].total += ata.valor;
        stats[category].saldo += ata.saldo_disponivel;
        
        // Contar pedidos desta ATA
        const ataPedidos = pedidos.filter(p => p.ata_id === ata.id);
        stats[category].pedidos += ataPedidos.length;
      }
    });

    return stats;
  }, [atas, pedidos]);

  // Estatísticas gerais
  const generalStats = React.useMemo(() => {
    const totalValue = atas.reduce((sum, ata) => sum + ata.valor, 0);
    const totalSaldo = atas.reduce((sum, ata) => sum + ata.saldo_disponivel, 0);
    const totalUtilizado = totalValue - totalSaldo;
    const utilizationRate = totalValue > 0 ? (totalUtilizado / totalValue) * 100 : 0;

    const pedidosAprovados = pedidos.filter(p => p.status === 'aprovado').length;
    const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;

    return {
      totalValue,
      totalSaldo,
      totalUtilizado,
      utilizationRate,
      totalAtas: atas.length,
      totalPedidos: pedidos.length,
      pedidosAprovados,
      pedidosPendentes
    };
  }, [atas, pedidos]);

  const getCategoryConfig = (category: string) => {
    const configs = {
      normal: {
        name: 'Atas de Registro de Preços',
        color: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        icon: FileText,
        description: 'Contratos padrão de fornecimento'
      },
      adesao: {
        name: 'Adesões',
        color: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: Users,
        description: 'Adesões a contratos existentes'
      },
      antigo: {
        name: 'Contratos Antigos',
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        icon: Clock,
        description: 'Contratos legados do sistema'
      },
      aquisicao: {
        name: 'Aquisição Global',
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        icon: Package,
        description: 'Contratos de aquisição global'
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

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setCurrentView('atas');
  };

  const handleViewSaldos = () => {
    setCurrentView('saldos');
  };

  const handleViewPedidos = (ataId?: string) => {
    if (ataId) {
      setSelectedAtaId(ataId);
    }
    setCurrentView('pedidos');
  };

  // Renderizar views específicas
  if (currentView === 'atas') {
    return (
      <ModernATAsView
        onBack={() => setCurrentView('dashboard')}
        selectedCategory={selectedCategory}
        onSelectATA={(ata) => handleViewPedidos(ata.id)}
      />
    );
  }

  if (currentView === 'saldos') {
    return (
      <ModernSaldoDashboard
        onBack={() => setCurrentView('dashboard')}
        atas={atas}
        pedidos={pedidos}
      />
    );
  }

  if (currentView === 'pedidos') {
    return (
      <ModernPedidosView
        onBack={() => setCurrentView('dashboard')}
        atas={atas}
        pedidos={pedidos}
        selectedAtaId={selectedAtaId}
      />
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header Ultra Moderno */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            {onBack && (
              <Button
                onClick={onBack}
                className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <ArrowRight className="h-5 w-5 rotate-180" />
                <span className="font-medium">Voltar ao Menu</span>
              </Button>
            )}
            
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Sistema de ATAs & Contratos
              </h1>
              <p className="text-slate-600 text-lg">
                Gestão completa de ATAs, Adesões, Saldos e Aquisições Globais
              </p>
            </div>
          </div>

          {/* Cards de Estatísticas Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total de ATAs */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FileText className="h-6 w-6" />
                  </div>
                  <Sparkles className="h-5 w-5 opacity-70" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Total de ATAs</h3>
                <p className="text-3xl font-bold">{generalStats.totalAtas}</p>
                <p className="text-blue-100 text-sm mt-2">Contratos ativos</p>
              </CardContent>
            </Card>

            {/* Valor Total */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <TrendingUp className="h-5 w-5 opacity-70" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Valor Total</h3>
                <p className="text-2xl font-bold">{formatCurrency(generalStats.totalValue)}</p>
                <p className="text-green-100 text-sm mt-2">Em contratos</p>
              </CardContent>
            </Card>

            {/* Saldo Disponível */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <Star className="h-5 w-5 opacity-70" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Saldo Disponível</h3>
                <p className="text-2xl font-bold">{formatCurrency(generalStats.totalSaldo)}</p>
                <p className="text-purple-100 text-sm mt-2">Para utilização</p>
              </CardContent>
            </Card>

            {/* Total de Pedidos */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white overflow-hidden group hover:scale-105 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <Activity className="h-5 w-5 opacity-70" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Total de Pedidos</h3>
                <p className="text-3xl font-bold">{generalStats.totalPedidos}</p>
                <p className="text-orange-100 text-sm mt-2">
                  {generalStats.pedidosPendentes} pendentes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seções Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ATAs por Categoria */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                ATAs por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(categoryStats).map(([category, stats]) => {
                  const config = getCategoryConfig(category);
                  const Icon = config.icon;
                  const utilizationRate = stats.total > 0 ? ((stats.total - stats.saldo) / stats.total) * 100 : 0;

                  return (
                    <Card 
                      key={category}
                      className={`${config.bgColor} ${config.borderColor} border hover:shadow-lg transition-all duration-300 cursor-pointer group`}
                      onClick={() => handleCategoryClick(category)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 bg-gradient-to-r ${config.color} rounded-lg`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className={`font-semibold ${config.textColor}`}>
                                {config.name}
                              </h3>
                              <p className="text-slate-600 text-sm">
                                {stats.atas} ATA{stats.atas !== 1 ? 's' : ''} • {stats.pedidos} Pedido{stats.pedidos !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`font-bold ${config.textColor}`}>
                              {formatCurrency(stats.saldo)}
                            </p>
                            <p className="text-slate-500 text-xs">
                              de {formatCurrency(stats.total)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <Badge className={`${config.textColor} ${config.bgColor} border-0`}>
                            {utilizationRate.toFixed(1)}% utilizado
                          </Badge>
                          <ArrowRight className={`h-4 w-4 ${config.textColor} group-hover:translate-x-1 transition-transform`} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <Zap className="h-6 w-6 text-purple-600" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Ver Saldos */}
                <Button
                  onClick={handleViewSaldos}
                  className="w-full justify-between bg-gradient-to-r from-blue-500 to-cyan-600 hover:shadow-lg text-white border-0 transition-all duration-300 p-6 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <PieChart className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Dashboard de Saldos</h3>
                      <p className="text-blue-100 text-sm">Visão completa dos saldos disponíveis</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </Button>

                {/* Ver Todos os Pedidos */}
                <Button
                  onClick={() => handleViewPedidos()}
                  className="w-full justify-between bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg text-white border-0 transition-all duration-300 p-6 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Gestão de Pedidos</h3>
                      <p className="text-green-100 text-sm">Controle completo de todos os pedidos</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </Button>

                {/* Relatórios */}
                <Button
                  variant="outline"
                  className="w-full justify-between border-slate-200 hover:bg-slate-50 transition-all duration-300 p-6 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-700">Relatórios</h3>
                      <p className="text-slate-500 text-sm">Análises e exportações</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </Button>

                {/* Nova ATA */}
                <Button
                  variant="outline"
                  className="w-full justify-between border-purple-200 hover:bg-purple-50 text-purple-700 hover:text-purple-800 transition-all duration-300 p-6 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Plus className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Nova ATA</h3>
                      <p className="text-purple-500 text-sm">Cadastrar novo contrato</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Indicadores de Performance */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{generalStats.utilizationRate.toFixed(1)}%</h3>
                <p className="text-slate-300">Taxa de Utilização</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{generalStats.pedidosAprovados}</h3>
                <p className="text-slate-300">Pedidos Aprovados</p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{formatCurrency(generalStats.totalUtilizado)}</h3>
                <p className="text-slate-300">Valor Utilizado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernATASystem;