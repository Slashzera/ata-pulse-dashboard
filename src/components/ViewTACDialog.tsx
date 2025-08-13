import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, Download, FileText } from 'lucide-react';
import { TAC } from '@/hooks/useTacs';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TacAttachmentsManager from '@/components/TacAttachmentsManager';

interface ViewTACDialogProps {
  tac: TAC | null;
  isOpen: boolean;
  onClose: () => void;
}

const ViewTACDialog: React.FC<ViewTACDialogProps> = ({ tac, isOpen, onClose }) => {
  if (!tac) return null;

  const handleDownload = () => {
    const { data } = supabase.storage.from('tacs').getPublicUrl(tac.arquivo_url);
    if (data.publicUrl) {
      window.open(data.publicUrl, '_blank');
    } else {
      alert('Não foi possível obter a URL do arquivo.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-pink-600" />
            Visualizar TAC
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nome da Empresa</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">{tac.nome_empresa}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Número do Processo</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">{tac.numero_processo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Data de Entrada</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">{formatDate(tac.data_entrada)}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Valor</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm font-semibold text-green-600">{formatCurrency(tac.valor)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Assunto/Objeto</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <p className="text-sm">{tac.assunto_objeto}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nº da(s) Nota(s)</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">{tac.n_notas}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Unidade Beneficiada</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">{tac.unidade_beneficiada}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Criado Por</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">{tac.profiles?.nome || 'N/A'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Data de Criação</Label>
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm">{formatDateTime(tac.created_at)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Arquivo Anexado</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Documento PDF</span>
                </div>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Gerenciador de anexos adicionais */}
        <div className="mt-6">
          <TacAttachmentsManager
            tacId={tac.id}
            mode="manage"
          />
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTACDialog;