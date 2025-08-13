import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Archive } from 'lucide-react';
import { useTrash } from '@/hooks/useTrash';

interface TrashConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  recordId: string;
  itemTitle: string;
  itemType: string;
  onSuccess?: () => void;
}

const TrashConfirmDialog: React.FC<TrashConfirmDialogProps> = ({
  open,
  onOpenChange,
  tableName,
  recordId,
  itemTitle,
  itemType,
  onSuccess
}) => {
  const { moveToTrash, loading } = useTrash();

  const handleMoveToTrash = async () => {
    const success = await moveToTrash(tableName, recordId);
    if (success) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-orange-500" />
            <AlertDialogTitle>Mover para Lixeira</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja mover <strong>"{itemTitle}"</strong> para a lixeira?
            </p>
            <p className="text-sm text-muted-foreground">
              Este {itemType} será movido para a lixeira e poderá ser restaurado posteriormente. 
              Para excluir permanentemente, acesse a seção de lixeira.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleMoveToTrash}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Movendo...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Mover para Lixeira
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TrashConfirmDialog;