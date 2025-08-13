
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Trash2, Archive } from 'lucide-react';
import { Pedido, useDeletePedido } from '@/hooks/usePedidos';
import { useTrash } from '@/hooks/useTrash';

interface DeletePedidoDialogProps {
  pedido: Pedido | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void; // Callback para quando o pedido for excluído com sucesso
}

const DeletePedidoDialog: React.FC<DeletePedidoDialogProps> = ({
  pedido,
  isOpen,
  onClose,
  onDeleted
}) => {
  const [justification, setJustification] = useState('');
  const [deleteType, setDeleteType] = useState<'trash' | 'permanent'>('trash');
  const deletePedidoMutation = useDeletePedido();
  const { moveToTrash, loading } = useTrash();

  const handleMoveToTrash = async () => {
    if (!pedido) return;
    
    const success = await moveToTrash('pedidos', pedido.id);
    if (success) {
      handleClose();
      if (onDeleted) {
        onDeleted();
      }
    }
  };

  const handleConfirm = async () => {
    if (deleteType === 'trash') {
      await handleMoveToTrash();
      return;
    }

    if (pedido && justification.trim()) {
      try {
        await deletePedidoMutation.mutateAsync({
          id: pedido.id,
          justification: justification.trim()
        });
        setJustification('');
        onClose();
        if (onDeleted) {
          onDeleted();
        }
      } catch (error) {
        console.error('Erro ao excluir pedido:', error);
      }
    }
  };

  const handleClose = () => {
    setJustification('');
    setDeleteType('trash');
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!pedido) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Departamento:</strong> {pedido.departamento}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Descrição:</strong> {pedido.descricao}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Valor:</strong> {formatCurrency(pedido.valor)}
            </p>
          </div>
          
          <p className="text-gray-700">
            Escolha como deseja excluir este pedido:
          </p>
          
          <div className="space-y-3">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                deleteType === 'trash' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setDeleteType('trash')}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="deleteType"
                  value="trash"
                  checked={deleteType === 'trash'}
                  onChange={() => setDeleteType('trash')}
                  className="text-orange-600"
                />
                <Archive className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Mover para Lixeira (Recomendado)</p>
                  <p className="text-sm text-orange-600">
                    O pedido será movido para a lixeira e poderá ser restaurado posteriormente
                  </p>
                </div>
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                deleteType === 'permanent' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setDeleteType('permanent')}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="deleteType"
                  value="permanent"
                  checked={deleteType === 'permanent'}
                  onChange={() => setDeleteType('permanent')}
                  className="text-red-600"
                />
                <Trash2 className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Exclusão Permanente</p>
                  <p className="text-sm text-red-600">
                    O pedido será excluído permanentemente e o valor devolvido ao saldo da ATA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {deleteType === 'permanent' && (
            <>
              <Separator />
              <div>
                <Label htmlFor="justification">Justificativa da exclusão permanente *</Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Digite o motivo da exclusão permanente..."
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant={deleteType === 'trash' ? 'default' : 'destructive'}
              onClick={handleConfirm}
              disabled={loading || deletePedidoMutation.isPending || (deleteType === 'permanent' && !justification.trim())}
            >
              {(loading || deletePedidoMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processando...
                </div>
              ) : deleteType === 'trash' ? (
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Mover para Lixeira
                </div>
              ) : (
                'Confirmar Exclusão Permanente'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePedidoDialog;
