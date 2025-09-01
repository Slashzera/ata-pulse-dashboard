import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, TrendingUp, TrendingDown, DollarSign, Wallet, 
  CreditCard, PieChart, BarChart3, Activity, AlertTriangle,
  CheckCircle, Clock, Target, Zap, Star, Package, Building2,
  FileText, Users, Calendar, Filter, Eye, RefreshCw
} from 'lucide-react';
import { ATA, useAtas, useAtasStats } from '@/hooks/useAtas';
import { Pedido } from '@/hooks/usePedidos';

interface ModernSaldoDashboardProps {
  onBack?: () => void;
  atas: ATA[];
  pedidos: Pedido[];
}

const ModernSaldoDashboard: React.FC<ModernSaldoDashboardProps> = ({ 
  onBack, 
  atas, 
  pedidos 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const { data: statsData } = useAtasStats();

  // Calcular estatísticas por categoria
  const categoryStats = useMemo(() => {
    const stats = {
      normal: { atas: [] as ATA[], total: 0, saldo: 0, utilizado: 0, pedidos: 0 },
      adesao: { atas: [] as ATA[], total: 0, saldo: 0, utilizado: 0, pedidos: 0 },
      antigo: { atas: [] as ATA[], total: 0, saldo: 0, utilizado: 0, pedidos: 0 },
      aquisicao: { atas: [] as ATA[], total: 0, saldo: 0, utilizado: 0, pedidos: 0 }
    };

    atas.forEach(ata => {
      const category = ata.category as keyof typeof stats;
      if (stats[category]) {
        stats[category].atas.push(ata);
        stats[category].total += ata.valor;
        stats[category].saldo += ata.saldo_disponivel;
        stats[category].utilizado += (ata.valor - ata.saldo_disponivel);
        
        // Contar pedidos desta ATA
        const ataPedidos = pedidos.filter(p => p.ata_id === ata.id);
        stats[category].pedidos += ataPedidos.length;
      }
    });

    return stats;
  }, [atas, pedidos]);

  // Estatísticas gerais
  const generalStats = useMemo(() => {
    const totalValue = atas.reduce((sum, ata) => sum + ata.valor, 0);
    const totalSaldo = atas.reduce((sum, ata) => sum + ata.saldo_disponivel, 0);
    const totalUtilizado = totalValue - totalSaldo;
    const utilizationRate = totalValue > 0 ? (totalUtilizado / totalValue) * 100 : 0;

    return {
      totalValue,
      totalSaldo,
      totalUtilizado,
      utilizationRate,
      totalAtas: atas.length,
      totalPedidos: pedidos.length
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
        lightColor: 'emerald'
      },
      adesao: {
        name: 'Adesões',
        color: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: Users,
        lightColor: 'blue'
      },
      antigo: {
        name: 'Contratos Antigos',
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        icon: Clock,
        lightColor: 'amber'
      },
      aquisicao: {
        name: 'Aquisição Global',
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
        icon: Package,
        lightColor: 'purple'
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

  const getUtilizationStatus = (percentage: number) => {
    if (percentage < 30) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Baixa', icon: CheckCircle };
    if (percentage < 70) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Moderada', icon: Clock };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Alta', icon: AlertTriangle };
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
            
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Dashboard de Saldos
              </h1>
              <p className="text-slate-600">Visão completa dos saldos disponíveis por categoria</p>
            </div>
          </div>
        </div>

        {/* Cards de Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Valor Total */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {generalStats.totalAtas} ATAs
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Valor Total</h3>
              <p className="text-2xl font-bold">{formatCurrency(generalStats.totalValue)}</p>
            </CardContent>
          </Card>

          {/* Saldo Disponível */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Wallet className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Disponível
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Saldo Total</h3>
              <p className="text-2xl font-bold">{formatCurrency(generalStats.totalSaldo)}</p>
            </CardContent>
          </Card>

          {/* Valor Utilizado */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CreditCard className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  Utilizado
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Valor Utilizado</h3>
              <p className="text-2xl font-bold">{formatCurrency(generalStats.totalUtilizado)}</p>
            </CardContent>
          </Card>

          {/* Taxa de Utilização */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {generalStats.totalPedidos} Pedidos
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Taxa de Utilização</h3>
              <p className="text-2xl font-bold">{generalStats.utilizationRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Saldos por Categoria */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <PieChart className="h-6 w-6 text-blue-600" />
                Saldos por Categoria
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(categoryStats).map(([category, stats]) => {
                const config = getCategoryConfig(category);
                const Icon = config.icon;
                const utilizationRate = stats.total > 0 ? ((stats.total - stats.saldo) / stats.total) * 100 : 0;
                const utilizationStatus = getUtilizationStatus(utilizationRate);
                const StatusIcon = utilizationStatus.icon;

                return (
                  <Card key={category} className={`border ${config.borderColor} ${config.bgColor} hover:shadow-lg transition-all duration-300`}>
                    <CardContent className="p-6">
                      {/* Header da Categoria */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 bg-gradient-to-r ${config.color} rounded-xl`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg ${config.textColor}`}>
                              {config.name}
                            </h3>
                            <p className="text-slate-600 text-sm">
                              {stats.atas.length} ATA{stats.atas.length !== 1 ? 's' : ''} • {stats.pedidos} Pedido{stats.pedidos !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${utilizationStatus.bg} ${utilizationStatus.color} border-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {utilizationStatus.label}
                        </Badge>
                      </div>

                      {/* Valores */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-xs text-slate-600 mb-1">Valor Total</p>
                            <p className={`font-bold text-sm ${config.textColor}`}>
                              {formatCurrency(stats.total)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-600 mb-1">Saldo</p>
                            <p className="font-bold text-sm text-green-600">
                              {formatCurrency(stats.saldo)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-600 mb-1">Utilizado</p>
                            <p className="font-bold text-sm text-red-600">
                              {formatCurrency(stats.utilizado)}
                            </p>
                          </div>
                        </div>

                        {/* Barra de Progresso */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-600">Utilização</span>
                            <span className={`text-xs font-semibold ${utilizationStatus.color}`}>
                              {utilizationRate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={utilizationRate} 
                            className="h-2"
                          />
                        </div>

                        {/* ATAs com Menor Saldo */}
                        {stats.atas.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-slate-600 mb-2">ATAs com menor saldo:</p>
                            <div className="space-y-1">
                              {stats.atas
                                .sort((a, b) => a.saldo_disponivel - b.saldo_disponivel)
                                .slice(0, 2)
                                .map(ata => (
                                  <div key={ata.id} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-700 truncate max-w-[120px]" title={`ATA ${ata.n_ata}`}>
                                      ATA {ata.n_ata}
                                    </span>
                                    <span className={`font-semibold ${ata.saldo_disponivel < ata.valor * 0.1 ? 'text-red-600' : 'text-slate-700'}`}>
                                      {formatCurrency(ata.saldo_disponivel)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ATAs com Saldo Crítico */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              ATAs com Saldo Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atas
                .filter(ata => {
                  const percentage = (ata.saldo_disponivel / ata.valor) * 100;
                  return percentage < 20;
                })
                .sort((a, b) => (a.saldo_disponivel / a.valor) - (b.saldo_disponivel / b.valor))
                .slice(0, 5)
                .map(ata => {
                  const config = getCategoryConfig(ata.category);
                  const Icon = config.icon;
                  const percentage = (ata.saldo_disponivel / ata.valor) * 100;
                  
                  return (
                    <div key={ata.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gradient-to-r ${config.color} rounded-lg`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">ATA {ata.n_ata}</h4>
                          <p className="text-sm text-slate-600 truncate max-w-[300px]" title={ata.objeto}>
                            {ata.objeto}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-600 font-semibold">
                          {formatCurrency(ata.saldo_disponivel)} ({percentage.toFixed(1)}%)
                        </p>
                        <p className="text-xs text-slate-500">
                          de {formatCurrency(ata.valor)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              
              {atas.filter(ata => (ata.saldo_disponivel / ata.valor) * 100 < 20).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma ATA com saldo crítico</h3>
                  <p className="text-slate-500">Todas as ATAs estão com saldos adequados.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernSaldoDashboard;