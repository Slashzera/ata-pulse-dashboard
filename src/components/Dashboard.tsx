
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Users, DollarSign, TrendingUp, AlertTriangle, ClipboardList, Building, ShoppingCart, Receipt, FileSignature, Clock, UserPlus, Globe, Archive, CheckCircle, FolderOpen, FileCheck, Trash2, Database, Kanban } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAtas } from '@/hooks/useAtas';
import { usePedidos } from '@/hooks/usePedidos';
import ATATable from '@/components/ATATable';
import PedidosSection from '@/components/PedidosSection';
import CreateContratoAntigoDialog from '@/components/CreateContratoAntigoDialog';
import CreateAdesaoDialog from '@/components/CreateAdesaoDialog';
import CreateAquisicaoGlobalDialog from '@/components/CreateAquisicaoGlobalDialog';
import AfoControle from '@/components/AfoControle';
import AfoAssinadas from '@/components/AfoAssinadas';
import ProcessosAdministrativos from '@/components/ProcessosAdministrativos';
import TACTable from './TACTable';
import TrashManager from '@/components/TrashManager';
import SQLEditor from '@/components/SQLEditor';
import { Trellinho } from '@/components/Trellinho';


interface DashboardProps {
  atas?: any[];
  pedidos?: any[];
  currentView?: string;
  onViewChange?: (view: string) => void;

}

const Dashboard: React.FC<DashboardProps> = ({
  atas: propAtas,
  pedidos: propPedidos,
  currentView = 'dashboard',
  onViewChange,

}) => {
  const [activeTab, setActiveTab] = useState(currentView);
  const [showContratoDialog, setShowContratoDialog] = useState(false);
  const [showAdesaoDialog, setShowAdesaoDialog] = useState(false);
  const [showAquisicaoDialog, setShowAquisicaoDialog] = useState(false);

  // Sincronizar activeTab com currentView quando currentView mudar
  useEffect(() => {
    setActiveTab(currentView);
  }, [currentView]);

  const { data: fetchedAtas = [] } = useAtas();
  const { data: fetchedPedidos = [] } = usePedidos();

  // Use props if provided, otherwise use fetched data
  const atas = propAtas || fetchedAtas;
  const pedidos = propPedidos || fetchedPedidos;

  const totalAtas = atas.length;
  
  // Separar ATAs por categoria usando a categoria real do banco
  const atasNormais = atas.filter(ata => ata.category === 'normal');
  const atasAdesao = atas.filter(ata => ata.category === 'adesao');
  const atasAquisicaoGlobal = atas.filter(ata => ata.category === 'aquisicao');
  const atasContratosAntigos = atas.filter(ata => ata.category === 'antigo');
  
  // Calcular saldos por categoria
  const saldoATAsNormais = atasNormais.reduce((acc, ata) => acc + (ata.saldo_disponivel || 0), 0);
  const saldoAdesao = atasAdesao.reduce((acc, ata) => acc + (ata.saldo_disponivel || 0), 0);
  const saldoAquisicaoGlobal = atasAquisicaoGlobal.reduce((acc, ata) => acc + (ata.saldo_disponivel || 0), 0);
  const saldoContratosAntigos = atasContratosAntigos.reduce((acc, ata) => acc + (ata.saldo_disponivel || 0), 0);
  
  const totalSaldoDisponivel = saldoATAsNormais + saldoAdesao + saldoAquisicaoGlobal + saldoContratosAntigos;
  
  // Separar pedidos por categoria usando a categoria da ATA vinculada
  const pedidosNormais = pedidos.filter(p => p.ata_category === 'normal');
  const pedidosAdesao = pedidos.filter(p => p.ata_category === 'adesao');
  const pedidosAquisicao = pedidos.filter(p => p.ata_category === 'aquisicao');
  const pedidosAntigos = pedidos.filter(p => p.ata_category === 'antigo');
  
  const totalPedidos = pedidos.length;
  const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;
  const pedidosFinalizados = pedidos.filter(p => p.status === 'finalizado').length;
  const pedidosAprovados = pedidos.filter(p => p.status === 'aprovado').length;

  // ATAs próximas do vencimento (120 dias)
  const today = new Date();
  const fourMonthsFromNow = new Date();
  fourMonthsFromNow.setMonth(today.getMonth() + 4);
  
  const atasVencendo = atas.filter(ata => {
    if (!ata.vencimento) return false;
    const vencimento = new Date(ata.vencimento);
    return vencimento <= fourMonthsFromNow && vencimento >= today;
  }).length;

  const statusData = [
    { name: 'Pendentes', value: pedidosPendentes, color: '#f97316' },
    { name: 'Aprovados', value: pedidosAprovados, color: '#3b82f6' },
    { name: 'Finalizados', value: pedidosFinalizados, color: '#10b981' },
  ];

  // Dados por tipo de ATA para gráfico - nomes simplificados
  const tipoATAData = [
    { name: 'ATAs', value: saldoATAsNormais / 1000000, count: atasNormais.length, color: '#3b82f6' },
    { name: 'Adesões', value: saldoAdesao / 1000000, count: atasAdesao.length, color: '#10b981' },
    { name: 'Saldo ATAs', value: saldoContratosAntigos / 1000000, count: atasContratosAntigos.length, color: '#f97316' },
    { name: 'Aquisição', value: saldoAquisicaoGlobal / 1000000, count: atasAquisicaoGlobal.length, color: '#8b5cf6' },
  ];

  // Dados por mês para gráficos
  const ataPorMes = atas.reduce((acc, ata) => {
    const mes = new Date(ata.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    acc[mes] = (acc[mes] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(ataPorMes).map(([mes, quantidade]) => ({
    mes,
    quantidade
  })).slice(-6); // Últimos 6 meses

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCurrencyMillions = (value: number) => {
    return `R$ ${value.toFixed(1)}M`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente' },
      aprovado: { color: 'bg-green-100 text-green-800', text: 'Aprovado' },
      rejeitado: { color: 'bg-red-100 text-red-800', text: 'Rejeitado' },
      finalizado: { color: 'bg-blue-100 text-blue-800', text: 'Finalizado' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const handleBackToMain = () => {
    setActiveTab('dashboard');
    if (onViewChange) {
      onViewChange('dashboard');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onViewChange) {
      onViewChange(tab);
    }
  };

  if (activeTab === 'atas') {
    return (
      <ATATable 
        atas={atas} 
        category="normal"
        title="Registro de Contratos de Fornecimento - ATAs"
        headerColor="bg-gradient-to-r from-blue-600 to-indigo-600"
        onBack={handleBackToMain}
      />
    );
  }

  if (activeTab === 'adesoes') {
    return (
      <ATATable 
        atas={atas} 
        category="adesao"
        title="Registro de Contratos de Fornecimento - Adesões"
        headerColor="bg-gradient-to-r from-green-600 to-emerald-600"
        onBack={handleBackToMain}
      />
    );
  }

  if (activeTab === 'saldo-atas') {
    return (
      <ATATable 
        atas={atas} 
        category="antigo"
        title="Registro de Contratos de Fornecimento - Saldo de ATAs (Contratos Antigos)"
        headerColor="bg-gradient-to-r from-orange-600 to-amber-600"
        onBack={handleBackToMain}
      />
    );
  }

  if (activeTab === 'aquisicao-global') {
    return (
      <ATATable 
        atas={atas} 
        category="aquisicao"
        title="Registro de Contratos de Fornecimento - Aquisição Global"
        headerColor="bg-gradient-to-r from-purple-600 to-violet-600"
        onBack={handleBackToMain}
      />
    );
  }

  if (activeTab === 'pedidos') {
    return <PedidosSection atas={atas} pedidos={pedidos} onBack={handleBackToMain} />;
  }

  if (activeTab === 'afo-controle') {
    return <AfoControle onBack={handleBackToMain} />;
  }

  if (activeTab === 'afo-assinadas') {
    return <AfoAssinadas onBack={handleBackToMain} />;
  }

  if (activeTab === 'processos-administrativos') {
    return <ProcessosAdministrativos onBack={handleBackToMain} />;
  }



  if (activeTab === 'tac') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Termo de Aceite de Contratação (TAC)</h1>
          <Button onClick={() => {
            // Dispara o evento personalizado para abrir o modal do TAC
            window.dispatchEvent(new CustomEvent('openTACModal'));
          }} className="bg-pink-600 hover:bg-pink-700">
            <FileCheck className="h-4 w-4 mr-2" />
            Novo TAC
          </Button>
        </div>
        
        <TACTable onBack={handleBackToMain} />
      </div>
    );
  }





  if (activeTab === 'trellinho') {
    return <Trellinho onBack={handleBackToMain} />;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Navigation Menu - Menu Principal */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Menu Principal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-12 gap-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => handleTabChange('dashboard')}
              className="h-20 flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <TrendingUp className="h-6 w-6" />
              <span>Dashboard</span>
            </Button>
            
            <Button
              variant={activeTab === 'atas' ? 'default' : 'outline'}
              onClick={() => handleTabChange('atas')}
              className="h-20 flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <FileText className="h-6 w-6" />
              <span>ATAs</span>
            </Button>

            <Button
              variant={activeTab === 'adesoes' ? 'default' : 'outline'}
              onClick={() => handleTabChange('adesoes')}
              className="h-20 flex-col gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <UserPlus className="h-6 w-6" />
              <span>Adesões</span>
            </Button>

            <Button
              variant={activeTab === 'saldo-atas' ? 'default' : 'outline'}
              onClick={() => handleTabChange('saldo-atas')}
              className="h-20 flex-col gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
            >
              <Archive className="h-6 w-6" />
              <span>Saldo de ATAs</span>
            </Button>

            <Button
              variant={activeTab === 'aquisicao-global' ? 'default' : 'outline'}
              onClick={() => handleTabChange('aquisicao-global')}
              className="h-20 flex-col gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              <Globe className="h-6 w-6" />
              <span>Aquisição Global</span>
            </Button>

            <Button
              variant={activeTab === 'pedidos' ? 'default' : 'outline'}
              onClick={() => handleTabChange('pedidos')}
              className="h-20 flex-col gap-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
            >
              <Receipt className="h-6 w-6" />
              <span>Pedidos</span>
            </Button>

            <Button
              variant={activeTab === 'afo-controle' ? 'default' : 'outline'}
              onClick={() => handleTabChange('afo-controle')}
              className="h-20 flex-col gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            >
              <FileSignature className="h-6 w-6" />
              <span>Controle AFO</span>
            </Button>

            <Button
              variant={activeTab === 'afo-assinadas' ? 'default' : 'outline'}
              onClick={() => handleTabChange('afo-assinadas')}
              className="h-20 flex-col gap-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"
            >
              <FileText className="h-6 w-6" />
              <span>AFO Assinadas</span>
            </Button>

            <Button
              variant={activeTab === 'processos-administrativos' ? 'default' : 'outline'}
              onClick={() => handleTabChange('processos-administrativos')}
              className="h-20 flex-col gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 px-2"
            >
              <FolderOpen className="h-6 w-6" />
              <span className="text-xs text-center leading-tight">Processos<br />Administrativos</span>
            </Button>

            <Button
              variant={activeTab === 'tac' ? 'default' : 'outline'}
              onClick={() => handleTabChange('tac')}
              className="h-20 flex-col gap-2 bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200"
            >
              <FileCheck className="h-6 w-6" />
              <span>TAC</span>
            </Button>






            <Button
              variant={activeTab === 'trellinho' ? 'default' : 'outline'}
              onClick={() => handleTabChange('trellinho')}
              className="h-20 flex-col gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
            >
              <Kanban className="h-6 w-6" />
              <span className="text-xs text-center leading-tight">Trellinho</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema de gestão de contratos</p>
        </div>

        {/* Cards de resumo principais - reduzindo espaçamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-700/90 to-blue-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Total de ATAs</CardTitle>
              <FileText className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalAtas}</div>
              <p className="text-xs text-cyan-100 font-medium">Contratos ativos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800 font-semibold">Saldo Total Geral</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totalSaldoDisponivel)}</div>
              <p className="text-xs text-green-600 font-medium">Todas as categorias</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-700/90 to-orange-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pedidosPendentes}</div>
              <p className="text-xs text-amber-100 font-medium">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-700/90 to-red-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">ATAs Vencendo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{atasVencendo}</div>
              <p className="text-xs text-rose-100 font-medium">Próximos 120 dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de saldo por categoria - reduzindo espaçamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-700/90 to-blue-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo ATAs Normais</CardTitle>
              <FileText className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoATAsNormais)}</div>
              <p className="text-xs text-cyan-100 font-medium">{atasNormais.length} ATAs • {pedidosNormais.length} pedidos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-700/90 to-green-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Adesões</CardTitle>
              <UserPlus className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoAdesao)}</div>
              <p className="text-xs text-emerald-100 font-medium">{atasAdesao.length} Adesões • {pedidosAdesao.length} pedidos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-700/90 to-orange-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Contratos Antigos</CardTitle>
              <Archive className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoContratosAntigos)}</div>
              <p className="text-xs text-amber-100 font-medium">{atasContratosAntigos.length} Contratos • {pedidosAntigos.length} pedidos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-700/90 to-purple-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Aquisição Global</CardTitle>
              <Globe className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoAquisicaoGlobal)}</div>
              <p className="text-xs text-violet-100 font-medium">{atasAquisicaoGlobal.length} Aquisições • {pedidosAquisicao.length} pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards secundários - reduzindo espaçamento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-700/90 to-blue-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Pedidos Aprovados</CardTitle>
              <TrendingUp className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pedidosAprovados}</div>
              <p className="text-xs text-sky-100 font-medium">Em andamento</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-700/90 to-green-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Pedidos Finalizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pedidosFinalizados}</div>
              <p className="text-xs text-emerald-100 font-medium">Concluídos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-slate-500 bg-gradient-to-br from-slate-700/90 to-gray-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Total de Pedidos</CardTitle>
              <FileText className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPedidos}</div>
              <p className="text-xs text-slate-100 font-medium">Todos os pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos lado a lado - Status dos Pedidos e Distribuição por Tipo - reduzindo espaçamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-white font-semibold">Status dos Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="bg-white/80 backdrop-blur-sm">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={30}
                    dataKey="value"
                    label={false}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${value} pedidos`, 
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {statusData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-medium">{entry.name}</span>
                    <span className="text-sm text-gray-500">
                      {entry.value} ({entry.value > 0 ? ((entry.value / totalPedidos) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-emerald-50 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-white font-semibold">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="bg-white/80 backdrop-blur-sm">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tipoATAData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={30}
                    dataKey="value"
                    label={false}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {tipoATAData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      formatCurrencyMillions(value), 
                      `${props.payload.name}: ${formatCurrencyMillions(value)} (${props.payload.count} contratos)`
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {tipoATAData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs font-medium">{entry.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrencyMillions(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de saldo por tipo de ATA */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-gradient-to-br from-slate-50 to-violet-50 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-slate-600 to-violet-600 text-white rounded-t-lg">
              <CardTitle className="text-white font-semibold">Saldo por Tipo de ATA (em Milhões)</CardTitle>
            </CardHeader>
            <CardContent className="bg-white/80 backdrop-blur-sm">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tipoATAData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    angle={0} 
                    textAnchor="middle" 
                    height={60}
                    fontSize={12}
                    interval={0}
                    stroke="#64748b"
                    fontWeight={500}
                  />
                  <YAxis 
                    tickFormatter={formatCurrencyMillions} 
                    stroke="#64748b"
                    fontWeight={500}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      formatCurrencyMillions(value), 
                      `Saldo (${props.payload.count} ${name.includes('ATAs') ? 'ATAs' : name.includes('Adesões') ? 'Adesões' : name.includes('Aquisição') ? 'Aquisições' : 'Contratos'})`
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                    {tipoATAData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <CreateContratoAntigoDialog
        isOpen={showContratoDialog}
        onClose={() => setShowContratoDialog(false)}
      />

      <CreateAdesaoDialog
        isOpen={showAdesaoDialog}
        onClose={() => setShowAdesaoDialog(false)}
      />

      <CreateAquisicaoGlobalDialog
        isOpen={showAquisicaoDialog}
        onClose={() => setShowAquisicaoDialog(false)}
      />


    </div>
  );
};

export default Dashboard;
