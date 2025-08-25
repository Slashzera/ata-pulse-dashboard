import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Search, Filter, Eye, Edit, Trash, Download, Plus,
  Building2, DollarSign, Calendar, FileText, Users, Activity,
  TrendingUp, BarChart3, Sparkles, Star, Package, CreditCard,
  Wallet, ShoppingCart, Target, Zap, Clock, AlertCircle
} from 'lucide-react';
import { ATA, useAtas } from '@/hooks/useAtas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditATADialog from '@/components/EditATADialog';
import DeleteATADialog from '@/components/DeleteATADialog';
import DebugATAs from '@/components/DebugATAs';

interface ModernATAsViewProps {
  onBack?: () => void;
  onSelectATA?: (ata: ATA) => void;
  selectedCategory?: string;
}

const ModernATAsView: React.FC<ModernATAsViewProps> = ({ 
  onBack, 
  onSelectATA, 
  selectedCategory = 'all' 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory);
  const [sortBy, setSortBy] = useState('n_ata');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [editingATA, setEditingATA] = useState<ATA | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingATA, setDeletingATA] = useState<ATA | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: atas = [], isLoading } = useAtas();

  // Categorizar ATAs
  const categorizedAtas = useMemo(() => {
    return {
      normal: atas.filter(ata => ata.category === 'normal'),
      adesao: atas.filter(ata => ata.category === 'adesao'),
      antigo: atas.filter(ata => ata.category === 'antigo'),
      aquisicao: atas.filter(ata => ata.category === 'aquisicao')
    };
  }, [atas]);

  // Filtrar e ordenar ATAs
  const filteredAtas = useMemo(() => {
    let filtered = atas;

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ata => ata.category === categoryFilter);
    }

    // Filtro por pesquisa
    if (searchQuery) {
      filtered = filtered.filter(ata =>
        ata.n_ata.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ata.objeto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ata.favorecido.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ata.processo_adm.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'valor':
          return b.valor - a.valor;
        case 'saldo':
          return b.saldo_disponivel - a.saldo_disponivel;
        case 'vencimento':
          return new Date(a.vencimento || '').getTime() - new Date(b.vencimento || '').getTime();
        default:
          return a.n_ata.localeCompare(b.n_ata);
      }
    });

    return filtered;
  }, [atas, categoryFilter, searchQuery, sortBy]);

  // Estatísticas por categoria
  const categoryStats = useMemo(() => {
    return {
      normal: {
        count: categorizedAtas.normal.length,
        total: categorizedAtas.normal.reduce((sum, ata) => sum + ata.valor, 0),
        saldo: categorizedAtas.normal.reduce((sum, ata) => sum + ata.saldo_disponivel, 0)
      },
      adesao: {
        count: categorizedAtas.adesao.length,
        total: categorizedAtas.adesao.reduce((sum, ata) => sum + ata.valor, 0),
        saldo: categorizedAtas.adesao.reduce((sum, ata) => sum + ata.saldo_disponivel, 0)
      },
      antigo: {
        count: categorizedAtas.antigo.length,
        total: categorizedAtas.antigo.reduce((sum, ata) => sum + ata.valor, 0),
        saldo: categorizedAtas.antigo.reduce((sum, ata) => sum + ata.saldo_disponivel, 0)
      },
      aquisicao: {
        count: categorizedAtas.aquisicao.length,
        total: categorizedAtas.aquisicao.reduce((sum, ata) => sum + ata.valor, 0),
        saldo: categorizedAtas.aquisicao.reduce((sum, ata) => sum + ata.saldo_disponivel, 0)
      }
    };
  }, [categorizedAtas]);

  const getCategoryConfig = (category: string) => {
    const configs = {
      normal: {
        name: 'ATAs Normais',
        color: 'from-emerald-500 to-green-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-200',
        icon: FileText
      },
      adesao: {
        name: 'Adesões',
        color: 'from-blue-500 to-cyan-600',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
        icon: Users
      },
      antigo: {
        name: 'Contratos Antigos',
        color: 'from-amber-500 to-orange-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
        icon: Clock
      },
      aquisicao: {
        name: 'Aquisição Global',
        color: 'from-purple-500 to-violet-600',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200',
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

  const getSaldoStatus = (saldo: number, valor: number) => {
    const percentage = (saldo / valor) * 100;
    if (percentage > 70) return { color: 'text-green-600', bg: 'bg-green-100', label: 'Excelente' };
    if (percentage > 30) return { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Atenção' };
    return { color: 'text-red-600', bg: 'bg-red-100', label: 'Crítico' };
  };

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
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Voltar</span>
              </Button>
            )}
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Sistema de ATAs
                </h1>
                <p className="text-slate-600">Gestão completa de contratos e adesões</p>
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas por Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Object.entries(categoryStats).map(([category, stats]) => {
              const config = getCategoryConfig(category);
              const Icon = config.icon;
              
              return (
                <Card 
                  key={category}
                  className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${config.bgColor} ${config.borderColor} border`}
                  onClick={() => setCategoryFilter(category)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${config.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className={`${config.textColor} ${config.bgColor}`}>
                        {stats.count} ATAs
                      </Badge>
                    </div>
                    
                    <h3 className={`font-semibold text-lg ${config.textColor} mb-2`}>
                      {config.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Valor Total:</span>
                        <span className={`font-bold ${config.textColor}`}>
                          {formatCurrency(stats.total)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Saldo:</span>
                        <span className={`font-bold ${config.textColor}`}>
                          {formatCurrency(stats.saldo)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Debug Component - Temporário */}
        <DebugATAs />

        {/* Controles de Pesquisa e Filtros */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Pesquisa */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Pesquisar por ATA, objeto, favorecido ou processo..."
                  className="pl-10 pr-4 py-3 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtros */}
              <div className="flex gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 border-slate-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
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
                    <SelectItem value="n_ata">Nº ATA</SelectItem>
                    <SelectItem value="valor">Valor</SelectItem>
                    <SelectItem value="saldo">Saldo</SelectItem>
                    <SelectItem value="vencimento">Vencimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contador de Resultados */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Activity className="h-4 w-4" />
                <span className="text-sm">
                  {filteredAtas.length} ATA{filteredAtas.length !== 1 ? 's' : ''} encontrada{filteredAtas.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de ATAs em Cards Modernos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAtas.map((ata) => {
            const config = getCategoryConfig(ata.category);
            const Icon = config.icon;
            const saldoStatus = getSaldoStatus(ata.saldo_disponivel, ata.valor);
            
            return (
              <Card 
                key={ata.id}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-white overflow-hidden"
              >
                {/* Header do Card */}
                <div className={`bg-gradient-to-r ${config.color} text-white p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">ATA {ata.n_ata}</h3>
                        <p className="text-sm opacity-90">{config.name}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                      {ata.category}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Objeto */}
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Objeto
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-2" title={ata.objeto}>
                        {ata.objeto}
                      </p>
                    </div>

                    {/* Favorecido */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Favorecido</span>
                      </div>
                      <p className="text-slate-800 font-semibold truncate" title={ata.favorecido}>
                        {ata.favorecido}
                      </p>
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Valor Total</span>
                        </div>
                        <p className="text-blue-800 font-bold text-sm">
                          {formatCurrency(ata.valor)}
                        </p>
                      </div>
                      
                      <div className={`${saldoStatus.bg} rounded-lg p-3 border ${saldoStatus.bg.replace('bg-', 'border-').replace('100', '200')}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Wallet className="h-4 w-4" />
                          <span className={`text-xs font-medium ${saldoStatus.color}`}>Saldo</span>
                        </div>
                        <p className={`${saldoStatus.color} font-bold text-sm`}>
                          {formatCurrency(ata.saldo_disponivel)}
                        </p>
                      </div>
                    </div>

                    {/* Informações Adicionais */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-600 font-medium">Pregão:</span>
                        <p className="text-slate-800 font-semibold truncate" title={ata.pregao}>
                          {ata.pregao}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-600 font-medium">Processo:</span>
                        <p className="text-slate-800 font-semibold truncate" title={ata.processo_adm}>
                          {ata.processo_adm}
                        </p>
                      </div>
                    </div>

                    {/* Vencimento */}
                    {ata.vencimento && (
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">Vencimento</span>
                          </div>
                          <span className="text-amber-800 font-semibold text-sm">
                            {format(new Date(ata.vencimento), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <Button 
                        className={`flex-1 bg-gradient-to-r ${config.color} hover:shadow-lg text-white border-0 transition-all duration-300`}
                        onClick={() => onSelectATA?.(ata)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      
                      <div className="flex gap-1">
                        <Button 
                          size="sm"
                          variant="outline"
                          className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                          title="Editar ATA"
                          onClick={() => {
                            setEditingATA(ata);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          size="sm"
                          variant="outline"
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                          title="Excluir ATA"
                          onClick={() => {
                            setDeletingATA(ata);
                            setIsDeleteDialogOpen(true);
                          }}
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
        {filteredAtas.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhuma ATA encontrada</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery 
                ? "Tente ajustar os termos de pesquisa para encontrar as ATAs desejadas."
                : "Ainda não há ATAs cadastradas no sistema."
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingATA && (
        <EditATADialog
          record={editingATA}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingATA(null);
          }}
          onSave={(updatedATA) => {
            // A atualização será refletida automaticamente via React Query
            setIsEditDialogOpen(false);
            setEditingATA(null);
          }}
          categoryName={getCategoryConfig(editingATA.category).name}
        />
      )}

      {/* Modal de Exclusão */}
      {deletingATA && (
        <DeleteATADialog
          ata={deletingATA}
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeletingATA(null);
          }}
          onConfirm={(justification) => {
            // A exclusão será refletida automaticamente via React Query
            setIsDeleteDialogOpen(false);
            setDeletingATA(null);
          }}
        />
      )}
    </div>
  );
};

export default ModernATAsView;