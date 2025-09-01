
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Users, DollarSign, TrendingUp, AlertTriangle, ClipboardList, Building, ShoppingCart, Receipt, FileSignature, Clock, UserPlus, Globe, Archive, CheckCircle, FolderOpen, FileCheck, Trash2, Database, Kanban, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAtas } from '@/hooks/useAtas';
import { usePedidos } from '@/hooks/usePedidos';
import ModernATATable from '@/components/ModernATATable';
import PedidosSection from '@/components/PedidosSection';
import CreateContratoAntigoDialog from '@/components/CreateContratoAntigoDialog';
import CreateAdesaoDialog from '@/components/CreateAdesaoDialog';
import CreateAquisicaoGlobalDialog from '@/components/CreateAquisicaoGlobalDialog';
import AfoControle from '@/components/AfoControle';
import AfoAssinadas from '@/components/AfoAssinadas';
import ModernProcessosAdministrativos from '@/components/ModernProcessosAdministrativos';
import TACTable from './TACTable';
import TrashManager from '@/components/TrashManager';
import SQLEditor from '@/components/SQLEditor';
import { KazuFlow } from '@/components/KazuFlow';


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
    console.log('handleBackToMain chamado - voltando para dashboard');
    console.log('activeTab atual:', activeTab);
    console.log('onViewChange existe?', !!onViewChange);

    try {
      setActiveTab('dashboard');
      console.log('setActiveTab("dashboard") executado');

      if (onViewChange) {
        onViewChange('dashboard');
        console.log('onViewChange("dashboard") executado');
      }

      console.log('handleBackToMain concluído com sucesso');
    } catch (error) {
      console.error('Erro em handleBackToMain:', error);
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
      <ModernATATable
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
      <ModernATATable
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
      <ModernATATable
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
      <ModernATATable
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
    return <ModernProcessosAdministrativos onBack={handleBackToMain} />;
  }



  if (activeTab === 'tac') {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Termo de Aceite de Contratação (TAC)</h1>
          <button
            onClick={() => {
              console.log('NOVO TAC CLICADO - FORÇANDO EXECUÇÃO');
              try {
                window.dispatchEvent(new CustomEvent('openTACModal'));
                console.log('Evento disparado com sucesso');
              } catch (error) {
                console.error('Erro:', error);
              }
            }}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            style={{ zIndex: 9999, position: 'relative' }}
          >
            <FileCheck className="h-5 w-5 mr-2 inline" />
            Novo TAC
          </button>
        </div>

        <TACTable onBack={handleBackToMain} />
      </div>
    );
  }





  if (activeTab === 'kazuflow') {
    return <KazuFlow onBack={handleBackToMain} />;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Modern Navigation Menu */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-white via-blue-50/30 to-white rounded-2xl shadow-xl border border-blue-100/50 p-6 backdrop-blur-sm">
          {/* Header do Menu */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#203A8A] to-[#203A8A]/80 p-3 rounded-xl shadow-lg">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#203A8A] to-blue-600 bg-clip-text text-transparent">
                  Menu Principal
                </h2>
                <p className="text-sm text-gray-600 font-medium">Navegue pelas funcionalidades do sistema</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-700">Sistema Online</span>
            </div>
          </div>

          {/* Grid de Botões Modernos */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-4">

            {/* Dashboard */}
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'dashboard'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-700 border border-gray-200 hover:border-blue-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'dashboard' ? 'bg-white/20' : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                  <TrendingUp className={`h-6 w-6 ${activeTab === 'dashboard' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <span className="text-sm font-semibold">Dashboard</span>
              </div>
            </button>

            {/* ATAs */}
            <button
              onClick={() => handleTabChange('atas')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'atas'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-700 border border-gray-200 hover:border-blue-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'atas' ? 'bg-white/20' : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                  <FileText className={`h-6 w-6 ${activeTab === 'atas' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <span className="text-sm font-semibold">ATAs</span>
              </div>
            </button>

            {/* Adesões */}
            <button
              onClick={() => handleTabChange('adesoes')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'adesoes'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 text-gray-700 border border-gray-200 hover:border-emerald-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'adesoes' ? 'bg-white/20' : 'bg-emerald-100 group-hover:bg-emerald-200'
                  }`}>
                  <UserPlus className={`h-6 w-6 ${activeTab === 'adesoes' ? 'text-white' : 'text-emerald-600'}`} />
                </div>
                <span className="text-sm font-semibold">Adesões</span>
              </div>
            </button>

            {/* Saldo de ATAs */}
            <button
              onClick={() => handleTabChange('saldo-atas')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'saldo-atas'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 text-gray-700 border border-gray-200 hover:border-amber-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'saldo-atas' ? 'bg-white/20' : 'bg-amber-100 group-hover:bg-amber-200'
                  }`}>
                  <Archive className={`h-6 w-6 ${activeTab === 'saldo-atas' ? 'text-white' : 'text-amber-600'}`} />
                </div>
                <span className="text-sm font-semibold text-center leading-tight">Saldo de ATAs</span>
              </div>
            </button>

            {/* Aquisição Global */}
            <button
              onClick={() => handleTabChange('aquisicao-global')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'aquisicao-global'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 text-gray-700 border border-gray-200 hover:border-purple-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'aquisicao-global' ? 'bg-white/20' : 'bg-purple-100 group-hover:bg-purple-200'
                  }`}>
                  <Globe className={`h-6 w-6 ${activeTab === 'aquisicao-global' ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <span className="text-sm font-semibold text-center leading-tight">Aquisição Global</span>
              </div>
            </button>

            {/* Pedidos */}
            <button
              onClick={() => handleTabChange('pedidos')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'pedidos'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-yellow-50 hover:to-amber-50 text-gray-700 border border-gray-200 hover:border-yellow-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'pedidos' ? 'bg-white/20' : 'bg-yellow-100 group-hover:bg-yellow-200'
                  }`}>
                  <Receipt className={`h-6 w-6 ${activeTab === 'pedidos' ? 'text-white' : 'text-yellow-600'}`} />
                </div>
                <span className="text-sm font-semibold">Pedidos</span>
              </div>
            </button>

            {/* Controle AFO */}
            <button
              onClick={() => handleTabChange('afo-controle')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'afo-controle'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 text-gray-700 border border-gray-200 hover:border-red-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'afo-controle' ? 'bg-white/20' : 'bg-red-100 group-hover:bg-red-200'
                  }`}>
                  <FileSignature className={`h-6 w-6 ${activeTab === 'afo-controle' ? 'text-white' : 'text-red-600'}`} />
                </div>
                <span className="text-sm font-semibold text-center leading-tight">Controle AFO</span>
              </div>
            </button>

            {/* AFO Assinadas */}
            <button
              onClick={() => handleTabChange('afo-assinadas')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'afo-assinadas'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-cyan-50 hover:to-teal-50 text-gray-700 border border-gray-200 hover:border-cyan-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'afo-assinadas' ? 'bg-white/20' : 'bg-cyan-100 group-hover:bg-cyan-200'
                  }`}>
                  <FileText className={`h-6 w-6 ${activeTab === 'afo-assinadas' ? 'text-white' : 'text-cyan-600'}`} />
                </div>
                <span className="text-sm font-semibold text-center leading-tight">AFO Assinadas</span>
              </div>
            </button>

            {/* Processos Administrativos */}
            <button
              onClick={() => handleTabChange('processos-administrativos')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'processos-administrativos'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-teal-50 hover:to-emerald-50 text-gray-700 border border-gray-200 hover:border-teal-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'processos-administrativos' ? 'bg-white/20' : 'bg-teal-100 group-hover:bg-teal-200'
                  }`}>
                  <FolderOpen className={`h-6 w-6 ${activeTab === 'processos-administrativos' ? 'text-white' : 'text-teal-600'}`} />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">Processos<br />Administrativos</span>
              </div>
            </button>

            {/* TAC */}
            <button
              onClick={() => handleTabChange('tac')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'tac'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 text-gray-700 border border-gray-200 hover:border-pink-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-rose-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'tac' ? 'bg-white/20' : 'bg-pink-100 group-hover:bg-pink-200'
                  }`}>
                  <FileCheck className={`h-6 w-6 ${activeTab === 'tac' ? 'text-white' : 'text-pink-600'}`} />
                </div>
                <span className="text-sm font-semibold">TAC</span>
              </div>
            </button>

            {/* KazuFlow */}
            <button
              onClick={() => handleTabChange('kazuflow')}
              className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl ${activeTab === 'kazuflow'
                ? 'bg-gradient-to-br from-[#203A8A] to-[#203A8A]/80 text-white shadow-lg'
                : 'bg-white hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 text-gray-700 border border-gray-200 hover:border-violet-300'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors duration-300 ${activeTab === 'kazuflow' ? 'bg-white/20' : 'bg-violet-100 group-hover:bg-violet-200'
                  }`}>
                  <Kanban className={`h-6 w-6 ${activeTab === 'kazuflow' ? 'text-white' : 'text-violet-600'}`} />
                </div>
                <span className="text-sm font-semibold">KazuFlow</span>
              </div>
            </button>

          </div>

          {/* Indicador de Navegação */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
              <div className="flex gap-1">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === ['dashboard', 'atas', 'adesoes', 'saldo-atas', 'aquisicao-global', 'pedidos', 'afo-controle', 'afo-assinadas', 'processos-administrativos', 'tac', 'kazuflow'].indexOf(activeTab)
                      ? 'bg-[#203A8A] w-6'
                      : 'bg-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-gray-600 ml-2">
                {['Dashboard', 'ATAs', 'Adesões', 'Saldo de ATAs', 'Aquisição Global', 'Pedidos', 'Controle AFO', 'AFO Assinadas', 'Processos Administrativos', 'TAC', 'KazuFlow'][
                  ['dashboard', 'atas', 'adesoes', 'saldo-atas', 'aquisicao-global', 'pedidos', 'afo-controle', 'afo-assinadas', 'processos-administrativos', 'tac', 'kazuflow'].indexOf(activeTab)
                ] || 'Dashboard'}
              </span>
            </div>
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
          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Total de ATAs</CardTitle>
              <FileText className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalAtas}</div>
              <p className="text-xs text-blue-100 font-medium">Contratos ativos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Total Geral</CardTitle>
              <DollarSign className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(totalSaldoDisponivel)}</div>
              <p className="text-xs text-blue-100 font-medium">Todas as categorias</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pedidosPendentes}</div>
              <p className="text-xs text-blue-100 font-medium">Aguardando aprovação</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">ATAs Vencendo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{atasVencendo}</div>
              <p className="text-xs text-blue-100 font-medium">Próximos 120 dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de saldo por categoria - reduzindo espaçamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Atas de Registro de Preços</CardTitle>
              <FileText className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoATAsNormais)}</div>
              <p className="text-xs text-blue-100 font-medium">{atasNormais.length} ATAs • {pedidosNormais.length} pedidos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Adesões</CardTitle>
              <UserPlus className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoAdesao)}</div>
              <p className="text-xs text-blue-100 font-medium">{atasAdesao.length} Adesões • {pedidosAdesao.length} pedidos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Contratos Antigos</CardTitle>
              <Archive className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoContratosAntigos)}</div>
              <p className="text-xs text-blue-100 font-medium">{atasContratosAntigos.length} Contratos • {pedidosAntigos.length} pedidos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Saldo Aquisição Global</CardTitle>
              <Globe className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-white">{formatCurrency(saldoAquisicaoGlobal)}</div>
              <p className="text-xs text-blue-100 font-medium">{atasAquisicaoGlobal.length} Aquisições • {pedidosAquisicao.length} pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards secundários - reduzindo espaçamento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Pedidos Aprovados</CardTitle>
              <TrendingUp className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pedidosAprovados}</div>
              <p className="text-xs text-blue-100 font-medium">Em andamento</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Pedidos Finalizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pedidosFinalizados}</div>
              <p className="text-xs text-blue-100 font-medium">Concluídos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#203A8A] bg-gradient-to-br from-[#203A8A]/90 to-[#203A8A]/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white font-semibold">Total de Pedidos</CardTitle>
              <FileText className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPedidos}</div>
              <p className="text-xs text-blue-100 font-medium">Todos os pedidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Modernos - Layout Redesenhado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Status dos Pedidos - Design Moderno */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Card className="relative bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden backdrop-blur-sm">

              {/* Header Moderno */}
              <div className="relative bg-gradient-to-r from-[#203A8A] via-blue-600 to-indigo-600 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Status dos Pedidos</h3>
                      <p className="text-blue-100 text-sm font-medium">Distribuição atual</p>
                    </div>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="text-white font-semibold text-sm">{totalPedidos} Total</span>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Gráfico */}
              <CardContent className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.1)" />
                        </filter>
                      </defs>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                        dataKey="value"
                        label={false}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={3}
                        filter="url(#shadow)"
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{
                              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          `${value} pedidos`,
                          name
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda Moderna */}
                <div className="grid grid-cols-1 gap-3">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl border border-gray-100/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full shadow-lg"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="font-semibold text-gray-800">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{entry.value}</span>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {entry.value > 0 ? ((entry.value / totalPedidos) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição por Tipo - Design Moderno */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Card className="relative bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/50 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden backdrop-blur-sm">

              {/* Header Moderno */}
              <div className="relative bg-gradient-to-r from-[#203A8A] via-emerald-600 to-teal-600 p-6">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Distribuição por Tipo</h3>
                      <p className="text-emerald-100 text-sm font-medium">Saldos por categoria</p>
                    </div>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="text-white font-semibold text-sm">{formatCurrencyMillions(totalSaldoDisponivel / 1000000)}</span>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Gráfico */}
              <CardContent className="p-6 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <defs>
                        <filter id="shadow2" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.1)" />
                        </filter>
                      </defs>
                      <Pie
                        data={tipoATAData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={45}
                        dataKey="value"
                        label={false}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth={3}
                        filter="url(#shadow2)"
                      >
                        {tipoATAData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            style={{
                              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: string, props: any) => [
                          formatCurrencyMillions(value),
                          `${props.payload.name}: ${formatCurrencyMillions(value)} (${props.payload.count} contratos)`
                        ]}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda Moderna em Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {tipoATAData.map((entry, index) => (
                    <div key={index} className="flex flex-col p-3 bg-gradient-to-br from-gray-50 to-emerald-50/30 rounded-2xl border border-gray-100/50 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-lg"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm font-semibold text-gray-800">{entry.name}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">{formatCurrencyMillions(entry.value)}</span>
                        <span className="text-xs text-gray-500">{entry.count} contratos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráfico de Barras Moderno - Saldo por Tipo */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Card className="relative bg-gradient-to-br from-white via-violet-50/30 to-purple-50/50 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-3xl overflow-hidden backdrop-blur-sm">

            {/* Header Ultra Moderno */}
            <div className="relative bg-gradient-to-r from-[#203A8A] via-violet-600 to-purple-600 p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-purple-600/20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm shadow-xl">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Saldo por Tipo de ATA</h3>
                    <p className="text-violet-100 text-sm font-medium">Valores em milhões de reais</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-violet-200 text-xs">Dados atualizados em tempo real</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/20">
                    <div className="text-white/80 text-sm font-medium">Total Geral</div>
                    <div className="text-2xl font-bold text-white">{formatCurrencyMillions(totalSaldoDisponivel / 1000000)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conteúdo do Gráfico de Barras */}
            <CardContent className="p-8 bg-white/90 backdrop-blur-sm">

              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {tipoATAData.map((entry, index) => (
                  <div key={index} className="text-center p-4 bg-gradient-to-br from-gray-50 to-violet-50/30 rounded-2xl border border-gray-100/50 hover:shadow-lg transition-all duration-300">
                    <div
                      className="w-4 h-4 rounded-full mx-auto mb-2 shadow-lg"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="text-xs font-medium text-gray-600 mb-1">{entry.name}</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrencyMillions(entry.value)}</div>
                    <div className="text-xs text-gray-500">{entry.count} contratos</div>
                  </div>
                ))}
              </div>

              {/* Gráfico de Barras Moderno */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-3xl p-6 border border-gray-100/50 shadow-inner">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={tipoATAData}
                    margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
                    barCategoryGap="20%"
                  >
                    <defs>
                      {tipoATAData.map((entry, index) => (
                        <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                        </linearGradient>
                      ))}
                      <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="rgba(0,0,0,0.1)" />
                      </filter>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      opacity={0.3}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      angle={0}
                      textAnchor="middle"
                      height={80}
                      fontSize={12}
                      interval={0}
                      stroke="#64748b"
                      fontWeight={600}
                      tick={{ fill: '#64748b' }}
                    />

                    <YAxis
                      tickFormatter={formatCurrencyMillions}
                      stroke="#64748b"
                      fontWeight={500}
                      fontSize={12}
                      tick={{ fill: '#64748b' }}
                    />

                    <Tooltip
                      formatter={(value: any, name: string, props: any) => [
                        formatCurrencyMillions(value),
                        `Saldo disponível`
                      ]}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: 'none',
                        borderRadius: '20px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        backdropFilter: 'blur(10px)',
                        padding: '16px'
                      }}
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    />

                    <Bar
                      dataKey="value"
                      radius={[12, 12, 0, 0]}
                      filter="url(#barShadow)"
                    >
                      {tipoATAData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#gradient-${index})`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Insights e Métricas */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-xl">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-800">Maior Saldo</div>
                      <div className="text-lg font-bold text-blue-900">
                        {tipoATAData.reduce((max, item) => item.value > max.value ? item : max, tipoATAData[0])?.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-xl">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-800">Total Contratos</div>
                      <div className="text-lg font-bold text-emerald-900">
                        {tipoATAData.reduce((sum, item) => sum + item.count, 0)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-2xl border border-violet-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-violet-500 p-2 rounded-xl">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-violet-800">Média por Tipo</div>
                      <div className="text-lg font-bold text-violet-900">
                        {formatCurrencyMillions(totalSaldoDisponivel / 1000000 / tipoATAData.length)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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