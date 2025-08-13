
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Trash2, Archive } from 'lucide-react';
import { ATA } from '@/hooks/useAtas';
import { useTrash } from '@/hooks/useTrash';

interface DeleteATADialogProps {
  ata: ATA | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => void;
}

const DeleteATADialog: React.FC<DeleteATADialogProps> = ({
  ata,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [justification, setJustification] = useState('');
  const [confirmStep, setConfirmStep] = useState(1);
  const [deleteType, setDeleteType] = useState<'trash' | 'permanent'>('trash');
  const { moveToTrash, loading } = useTrash();

  const handleMoveToTrash = async () => {
    if (!ata) return;
    
    const success = await moveToTrash('atas', ata.id);
    if (success) {
      handleClose();
      // Trigger refresh of the parent component
      onConfirm('Movido para lixeira');
    }
  };

  const handleFirstConfirm = () => {
    if (deleteType === 'permanent' && !justification.trim()) {
      alert('Por favor, forneça uma justificativa para a exclusão permanente.');
      return;
    }
    
    if (deleteType === 'trash') {
      handleMoveToTrash();
      return;
    }
    
    setConfirmStep(2);
  };

  const handleFinalConfirm = () => {
    onConfirm(justification);
    setConfirmStep(1);
    setJustification('');
    onClose();
  };

  const handleClose = () => {
    setConfirmStep(1);
    setJustification('');
    setDeleteType('trash');
    onClose();
  };

  if (!ata) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {confirmStep === 1 ? 'Confirmar Exclusão' : 'Confirmação Final'}
          </DialogTitle>
        </DialogHeader>
        
        {confirmStep === 1 ? (
          <div className="space-y-4">
            <p className="text-gray-700">
              Escolha como deseja excluir a ATA <strong>{ata.n_ata}</strong>:
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
                      A ATA será movida para a lixeira e poderá ser restaurada posteriormente
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
                      A ATA será excluída permanentemente e não poderá ser recuperada
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {deleteType === 'permanent' && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="justification">Justificativa para exclusão permanente *</Label>
                  <Input
                    id="justification"
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="Digite o motivo da exclusão permanente..."
                    required
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                variant={deleteType === 'trash' ? 'default' : 'destructive'}
                onClick={handleFirstConfirm}
                disabled={loading || (deleteType === 'permanent' && !justification.trim())}
              >
                {loading ? (
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
                  'Continuar'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-red-800 font-medium mb-2">
                ATENÇÃO: Esta é sua última chance!
              </p>
              <p className="text-red-700">
                Tem certeza ABSOLUTA que deseja excluir a ATA <strong>{ata.n_ata}</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2">
                Justificativa: {justification}
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmStep(1)}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleFinalConfirm}>
                SIM, EXCLUIR DEFINITIVAMENTE
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteATADialog;
