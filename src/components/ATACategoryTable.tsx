import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Eye, Trash2, ArrowRight, Trash, Calculator, TrendingUp, BarChart3 } from 'lucide-react';
import { ATA } from '@/hooks/useAtas';
import { Pedido } from '@/hooks/usePedidos';
import EditATADialog from '@/components/EditATADialog';
import CreatePedidoDialog from '@/components/CreatePedidoDialog';
import PedidoDetailsDialog from '@/components/PedidoDetailsDialog';
import DeleteATADialog from '@/components/DeleteATADialog';
import MoveATADialog from '@/components/MoveATADialog';
import DeletePedidoDialog from '@/components/DeletePedidoDialog';
import SaldoAlert from '@/components/SaldoAlert';

interface ATACategoryTableProps {
  atas: ATA[];
  pedidos: Pedido[];
  category: 'normal' | 'adesao' | 'aquisicao' | 'antigo';
  categoryName: string;
  categoryColor: string;
}

const ATACategoryTable: React.FC<ATACategoryTableProps> = ({
  atas,
  pedidos,
  category,
  categoryName,
  categoryColor
}) => {
  const [editingRecord, setEditingRecord] = useState<ATA | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ATA | null>(null);
  const [deletingPedido, setDeletingPedido] = useState<Pedido | null>(null);
  const [movingRecord, setMovingRecord] = useState<ATA | null>(null);
  const [isCreatePedidoDialogOpen, setIsCreatePedidoDialogOpen] = useState(false);
  const [showNoSaldoAlert, setShowNoSaldoAlert] = useState(false);

  // Filtrar ATAs por categoria específica
  const filteredAtas = atas.filter(ata => ata.category === category);
  
  // Filtrar pedidos relacionados às ATAs desta categoria específica
  const filteredPedidos = pedidos.filter(pedido => 
    filteredAtas.some(ata => ata.id === pedido.ata_id)
  );

  console.log(`Categoria: ${category}, ATAs filtradas:`, filteredAtas);
  console.log(`Pedidos filtrados para ${category}:`, filteredPedidos);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditSuccess = (updatedRecord: ATA) => {
    setEditingRecord(null);
  };

  const getTotalSaldo = () => {
    return filteredAtas.reduce((total, ata) => total + (ata.saldo_disponivel || 0), 0);
  };

  const getAtaForPedido = (pedido: Pedido) => {
    return filteredAtas.find(ata => ata.id === pedido.ata_id);
  };

  const handleCreatePedido = () => {
    console.log(`Abrindo dialog para criar pedido na categoria: ${category}`);
    
    // Verificar se há ATAs com saldo disponível
    const atasWithSaldo = filteredAtas.filter(ata => ata.saldo_disponivel > 0);
    
    if (atasWithSaldo.length === 0) {
      setShowNoSaldoAlert(true);
      setTimeout(() => setShowNoSaldoAlert(false), 5000); // Remove o alerta após 5 segundos
      return;
    }
    
    setIsCreatePedidoDialogOpen(true);
  };

  const renderSaldoDisplay = (saldo: number) => {
    if (saldo === 0) {
      return <span className="text-red-600 font-bold">SALDO ZERADO</span>;
    }
    return <span className="text-green-600 font-semibold">{formatCurrency(saldo)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <Card>
        <CardHeader className={`${categoryColor} text-white`}>
          <CardTitle className="text-2xl font-bold">{categoryName}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredAtas.length}</p>
              <p className="text-gray-600">Total de ATAs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalSaldo())}</p>
              <p className="text-gray-600">Saldo Total Disponível</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{filteredPedidos.length}</p>
              <p className="text-gray-600">Pedidos Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de saldo insuficiente */}
      <SaldoAlert 
        message={`❌ Não há ATAs de ${categoryName} com saldo disponível para criar pedidos!`}
        show={showNoSaldoAlert}
      />

      {/* Seção de ATAs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>ATAs de {categoryName}</CardTitle>
            <Button 
              onClick={handleCreatePedido}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAtas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma ATA de {categoryName} encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Nº ATA</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Pregão</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Objeto</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Favorecido</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Valor</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Saldo Disponível</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Vencimento</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Criado em</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAtas.map((ata) => (
                    <tr key={ata.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{ata.n_ata}</td>
                      <td className="border border-gray-300 px-4 py-2">{ata.pregao}</td>
                      <td className="border border-gray-300 px-4 py-2">{ata.objeto}</td>
                      <td className="border border-gray-300 px-4 py-2">{ata.favorecido || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatCurrency(ata.valor || 0)}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {renderSaldoDisplay(ata.saldo_disponivel || 0)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{formatDate(ata.vencimento)}</td>
                      <td className="border border-gray-300 px-4 py-2">{formatDateTime(ata.created_at)}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRecord(ata)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMovingRecord(ata)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingRecord(ata)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Seção de Totais - Design Moderno */}
          {filteredAtas.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      RESUMO - {categoryName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filteredAtas.length} ATA{filteredAtas.length !== 1 ? 's' : ''} de {categoryName}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                    Saldo Total Disponível
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {formatCurrency(getTotalSaldo())}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Recursos disponíveis para utilização
                  </div>
                </div>
              </div>
              
              {/* Informações adicionais */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/70 rounded-lg p-3 border border-emerald-100">
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">ATAs Ativas</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {filteredAtas.filter(ata => (ata.saldo_disponivel || 0) > 0).length}
                  </div>
                  <div className="text-xs text-gray-500">Com saldo disponível</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-emerald-100">
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">ATAs Zeradas</div>
                  <div className="text-lg font-bold text-red-600">
                    {filteredAtas.filter(ata => (ata.saldo_disponivel || 0) === 0).length}
                  </div>
                  <div className="text-xs text-gray-500">Sem saldo disponível</div>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-emerald-100">
                  <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">% Utilização</div>
                  <div className="text-lg font-bold text-orange-600">
                    {filteredAtas.length > 0 ? Math.round((filteredAtas.filter(ata => (ata.saldo_disponivel || 0) === 0).length / filteredAtas.length) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500">Saldos utilizados</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos de {categoryName}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pedido encontrado para {categoryName}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Departamento</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">ATA Vinculada</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Descrição</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Valor</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Data</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPedidos.map((pedido) => {
                    const ata = getAtaForPedido(pedido);
                    return (
                      <tr key={pedido.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">{pedido.departamento}</td>
                        <td className="border border-gray-300 px-4 py-2">{ata?.n_ata || '-'}</td>
                        <td className="border border-gray-300 px-4 py-2">{pedido.descricao}</td>
                        <td className="border border-gray-300 px-4 py-2">{formatCurrency(pedido.valor)}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            pedido.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                            pedido.status === 'aprovado' ? 'bg-green-100 text-green-800' :
                            pedido.status === 'rejeitado' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {pedido.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{formatDateTime(pedido.created_at)}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPedido(pedido)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeletingPedido(pedido)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditATADialog
        record={editingRecord}
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleEditSuccess}
        categoryName={categoryName}
      />

      <CreatePedidoDialog
        atas={filteredAtas}
        isOpen={isCreatePedidoDialogOpen}
        onClose={() => setIsCreatePedidoDialogOpen(false)}
        categoryName={categoryName}
      />

      <PedidoDetailsDialog
        pedido={selectedPedido}
        ata={selectedPedido ? getAtaForPedido(selectedPedido) : null}
        isOpen={!!selectedPedido}
        onClose={() => setSelectedPedido(null)}
      />

      <DeleteATADialog
        ata={deletingRecord}
        isOpen={!!deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onConfirm={() => setDeletingRecord(null)}
      />

      <DeletePedidoDialog
        pedido={deletingPedido}
        isOpen={!!deletingPedido}
        onClose={() => setDeletingPedido(null)}
      />

      <MoveATADialog
        ata={movingRecord}
        isOpen={!!movingRecord}
        onClose={() => setMovingRecord(null)}
        currentCategoryName={categoryName}
      />
    </div>
  );
};

export default ATACategoryTable;
