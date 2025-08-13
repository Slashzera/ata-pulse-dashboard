
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, processNumber: string) => void;
  folderName: string;
  processNumber: string;
  isLoading: boolean;
}

const EditFolderDialog: React.FC<EditFolderDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  folderName,
  processNumber,
  isLoading
}) => {
  const [newFolderName, setNewFolderName] = useState(folderName);
  const [newProcessNumber, setNewProcessNumber] = useState(processNumber || '');

  React.useEffect(() => {
    setNewFolderName(folderName);
    setNewProcessNumber(processNumber || '');
  }, [folderName, processNumber]);

  const handleSave = () => {
    if (newFolderName.trim()) {
      onSave(newFolderName.trim(), newProcessNumber.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Pasta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editFolderName">Nome da Pasta *</Label>
            <Input
              id="editFolderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Digite o novo nome da pasta"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="editProcessNumber">Número do Processo</Label>
            <Input
              id="editProcessNumber"
              value={newProcessNumber}
              onChange={(e) => setNewProcessNumber(e.target.value)}
              placeholder="Digite o número do processo (opcional)"
              className="mt-1"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isLoading || !newFolderName.trim()}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditFolderDialog;
