import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Paperclip } from 'lucide-react';
import { TAC } from '@/hooks/useTacs';
import TacAttachmentsManager from '@/components/TacAttachmentsManager';

interface ManageTacAttachmentsDialogProps {
  tac: TAC | null;
  isOpen: boolean;
  onClose: () => void;
}

const ManageTacAttachmentsDialog: React.FC<ManageTacAttachmentsDialogProps> = ({ tac, isOpen, onClose }) => {
  if (!tac) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-blue-600" />
            Gerenciar Anexos - {tac.nome_empresa}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Processo: {tac.numero_processo}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações do arquivo principal */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Arquivo Principal (TAC)
            </h3>
            <p className="text-sm text-gray-600">
              Este é o arquivo principal do TAC que foi enviado durante a criação.
            </p>
          </div>

          {/* Gerenciador de anexos adicionais */}
          <TacAttachmentsManager
            tacId={tac.id}
            mode="manage"
          />
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTacAttachmentsDialog;