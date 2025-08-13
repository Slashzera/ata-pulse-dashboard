
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2 } from 'lucide-react';
import { ATA, useUpdateAta, useDeleteAta } from '@/hooks/useAtas';
import CurrencyInput from '@/components/CurrencyInput';
import DeleteATADialog from '@/components/DeleteATADialog';
import { useToast } from '@/hooks/use-toast';

interface EditATADialogProps {
  record: ATA | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: ATA) => void;
  categoryName?: string;
}

const EditATADialog: React.FC<EditATADialogProps> = ({
  record,
  isOpen,
  onClose,
  onSave,
  categoryName
}) => {
  const [editedRecord, setEditedRecord] = useState<Partial<ATA>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const updateAtaMutation = useUpdateAta();
  const deleteAtaMutation = useDeleteAta();
  const { toast } = useToast();

  useEffect(() => {
    if (record) {
      setEditedRecord({ ...record });
    }
  }, [record]);

  const handleSave = () => {
    if (editedRecord && record) {
      const updatedRecord: ATA = {
        ...record,
        ...editedRecord,
        valor: editedRecord.valor || 0,
        saldo_disponivel: editedRecord.saldo_disponivel || 0
      };
      
      updateAtaMutation.mutate(updatedRecord, {
        onSuccess: () => {
          // Mensagem específica por categoria
          const categoryDisplayName = categoryName || 'ATA';
          toast({
            title: `${categoryDisplayName} alterada com sucesso!`,
            description: `As informações da ${categoryDisplayName} foram atualizadas.`,
          });
          onSave(updatedRecord);
          onClose();
        }
      });
    }
  };

  const handleDelete = (justification: string) => {
    if (record) {
      deleteAtaMutation.mutate({ 
        id: record.id, 
        justification 
      });
      setIsDeleteDialogOpen(false);
      onClose();
    }
  };

  if (!record) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar {categoryName || 'ATA'} - {record.n_ata}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-nAta">Nº ATA *</Label>
              <Input
                id="edit-nAta"
                value={editedRecord.n_ata || ''}
                onChange={(e) => setEditedRecord({...editedRecord, n_ata: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-pregao">Pregão *</Label>
              <Input
                id="edit-pregao"
                value={editedRecord.pregao || ''}
                onChange={(e) => setEditedRecord({...editedRecord, pregao: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-processoAdm">Processo Administrativo</Label>
              <Input
                id="edit-processoAdm"
                value={editedRecord.processo_adm || ''}
                onChange={(e) => setEditedRecord({...editedRecord, processo_adm: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-processoEmpAfo">Processo Empenho e AFO</Label>
              <Input
                id="edit-processoEmpAfo"
                value={editedRecord.processo_emp_afo || ''}
                onChange={(e) => setEditedRecord({...editedRecord, processo_emp_afo: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-objeto">Objeto *</Label>
              <Input
                id="edit-objeto"
                value={editedRecord.objeto || ''}
                onChange={(e) => setEditedRecord({...editedRecord, objeto: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-favorecido">Favorecido</Label>
              <Input
                id="edit-favorecido"
                value={editedRecord.favorecido || ''}
                onChange={(e) => setEditedRecord({...editedRecord, favorecido: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-valor">Valor</Label>
              <CurrencyInput
                id="edit-valor"
                value={editedRecord.valor || 0}
                onChange={(value) => setEditedRecord({...editedRecord, valor: value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-vencimento">Vencimento</Label>
              <Input
                id="edit-vencimento"
                type="date"
                value={editedRecord.vencimento || ''}
                onChange={(e) => setEditedRecord({...editedRecord, vencimento: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-saldoDisponivel">Saldo Disponível</Label>
              <CurrencyInput
                id="edit-saldoDisponivel"
                value={editedRecord.saldo_disponivel || 0}
                onChange={(value) => setEditedRecord({...editedRecord, saldo_disponivel: value})}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-informacoes">Informações</Label>
              <Input
                id="edit-informacoes"
                value={editedRecord.informacoes || ''}
                onChange={(e) => setEditedRecord({...editedRecord, informacoes: e.target.value})}
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir {categoryName || 'ATA'}
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateAtaMutation.isPending}
              >
                {updateAtaMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteATADialog
        ata={record}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default EditATADialog;
