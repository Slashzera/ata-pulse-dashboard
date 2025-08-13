import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Building, FileText, DollarSign, User, MessageSquare, Trash } from 'lucide-react';
import { Pedido } from '@/hooks/usePedidos';
import { ATA } from '@/hooks/useAtas';
import DeletePedidoDialog from '@/components/DeletePedidoDialog';

interface PedidoDetailsDialogProps {
  pedido: Pedido | null;
  ata: ATA | null;
  isOpen: boolean;
  onClose: () => void;
}

const PedidoDetailsDialog: React.FC<PedidoDetailsDialogProps> = ({
  pedido,
  ata,
  isOpen,
  onClose
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!pedido || !ata) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'finalizado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes do Pedido - {pedido.departamento}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Excluir Pedido"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge className={`px-4 py-2 text-sm font-medium ${getStatusColor(pedido.status)}`}>
                {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
              </Badge>
            </div>

            {/* Informações do Pedido */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Informações do Pedido
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Departamento:</span>
                  <span className="font-medium">{pedido.departamento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(pedido.valor)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-600">Descrição:</span>
                  <p className="bg-white p-2 rounded border text-sm">{pedido.descricao}</p>
                </div>
                {pedido.observacoes && (
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600">Observações:</span>
                    <p className="bg-white p-2 rounded border text-sm">{pedido.observacoes}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de Criação:</span>
                  <span className="font-medium">{formatDate(pedido.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Informações da ATA */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ATA Vinculada
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nº ATA:</span>
                  <span className="font-medium">{ata.n_ata}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pregão:</span>
                  <span className="font-medium">{ata.pregao}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Favorecido:</span>
                  <span className="font-medium">{ata.favorecido}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Total da ATA:</span>
                  <span className="font-bold text-green-600">{formatCurrency(ata.valor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saldo Disponível:</span>
                  <span className="font-bold text-green-600">{formatCurrency(ata.saldo_disponivel)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vencimento:</span>
                  <span className="font-medium">{formatDate(ata.vencimento)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-600">Objeto:</span>
                  <p className="bg-white p-2 rounded border text-sm">{ata.objeto}</p>
                </div>
              </div>
            </div>

            {/* Botão de Fechar */}
            <div className="flex justify-end">
              <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeletePedidoDialog
        pedido={pedido}
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
      />
    </>
  );
};

export default PedidoDetailsDialog;
