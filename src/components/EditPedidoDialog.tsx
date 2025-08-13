
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { Pedido, useUpdatePedido } from '@/hooks/usePedidos';
import CurrencyInput from '@/components/CurrencyInput';

interface EditPedidoDialogProps {
  pedido: Pedido | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditPedidoDialog: React.FC<EditPedidoDialogProps> = ({
  pedido,
  isOpen,
  onClose
}) => {
  const [editedPedido, setEditedPedido] = useState<Partial<Pedido>>({});
  const updatePedidoMutation = useUpdatePedido();

  useEffect(() => {
    if (pedido) {
      setEditedPedido({ ...pedido });
    }
  }, [pedido]);

  const handleSave = async () => {
    if (editedPedido && pedido) {
      const updatedPedido: Pedido = {
        ...pedido,
        ...editedPedido,
        valor: editedPedido.valor || 0
      };
      
      console.log('Salvando pedido editado:', updatedPedido);
      
      try {
        await updatePedidoMutation.mutateAsync(updatedPedido);
        onClose();
      } catch (error) {
        console.error('Erro ao salvar:', error);
      }
    }
  };

  if (!pedido) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Pedido
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="edit-departamento">Departamento *</Label>
            <Input
              id="edit-departamento"
              value={editedPedido.departamento || ''}
              onChange={(e) => setEditedPedido({...editedPedido, departamento: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="edit-descricao">Descrição *</Label>
            <Input
              id="edit-descricao"
              value={editedPedido.descricao || ''}
              onChange={(e) => setEditedPedido({...editedPedido, descricao: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="edit-valor">Valor *</Label>
            <CurrencyInput
              id="edit-valor"
              value={editedPedido.valor || 0}
              onChange={(value) => setEditedPedido({...editedPedido, valor: value})}
            />
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select 
              value={editedPedido.status || ''} 
              onValueChange={(value) => setEditedPedido({...editedPedido, status: value as Pedido['status']})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-observacoes">Observações</Label>
            <Input
              id="edit-observacoes"
              value={editedPedido.observacoes || ''}
              onChange={(e) => setEditedPedido({...editedPedido, observacoes: e.target.value})}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={updatePedidoMutation.isPending}
          >
            {updatePedidoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPedidoDialog;
