import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';
import { TAC, useUpdateTac } from '@/hooks/useTacs';
import CurrencyInput from '@/components/CurrencyInput';
import { useToast } from '@/hooks/use-toast';

interface EditTACDialogProps {
  tac: TAC | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditTACDialog: React.FC<EditTACDialogProps> = ({ tac, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nome_empresa: '',
    numero_processo: '',
    data_entrada: '',
    assunto_objeto: '',
    n_notas: 0,
    valor: 0,
    unidade_beneficiada: ''
  });
  
  const updateTacMutation = useUpdateTac();
  const { toast } = useToast();

  useEffect(() => {
    if (tac) {
      setFormData({
        nome_empresa: tac.nome_empresa,
        numero_processo: tac.numero_processo,
        data_entrada: tac.data_entrada,
        assunto_objeto: tac.assunto_objeto,
        n_notas: tac.n_notas,
        valor: tac.valor,
        unidade_beneficiada: tac.unidade_beneficiada
      });
    }
  }, [tac]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tac) return;

    try {
      await updateTacMutation.mutateAsync({
        id: tac.id,
        ...formData
      });
      
      toast({
        title: "TAC atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar TAC:', error);
      toast({
        title: "Erro ao atualizar TAC",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-pink-600" />
            Editar TAC
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_empresa">Nome da Empresa</Label>
            <Input
              id="nome_empresa"
              value={formData.nome_empresa}
              onChange={(e) => handleInputChange('nome_empresa', e.target.value)}
              disabled={updateTacMutation.isPending}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numero_processo">Número do Processo</Label>
            <Input
              id="numero_processo"
              value={formData.numero_processo}
              onChange={(e) => handleInputChange('numero_processo', e.target.value)}
              disabled={updateTacMutation.isPending}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_entrada">Data de Entrada</Label>
              <Input
                id="data_entrada"
                type="date"
                value={formData.data_entrada}
                onChange={(e) => handleInputChange('data_entrada', e.target.value)}
                disabled={updateTacMutation.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <CurrencyInput
                id="valor"
                value={formData.valor}
                onChange={(value) => handleInputChange('valor', value)}
                disabled={updateTacMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assunto_objeto">Assunto/Objeto</Label>
            <Input
              id="assunto_objeto"
              value={formData.assunto_objeto}
              onChange={(e) => handleInputChange('assunto_objeto', e.target.value)}
              disabled={updateTacMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="n_notas">Nº da(s) Nota(s)</Label>
            <Input
              id="n_notas"
              type="number"
              value={formData.n_notas}
              onChange={(e) => handleInputChange('n_notas', parseInt(e.target.value) || 0)}
              disabled={updateTacMutation.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unidade_beneficiada">Unidade Beneficiada</Label>
            <Input
              id="unidade_beneficiada"
              value={formData.unidade_beneficiada}
              onChange={(e) => handleInputChange('unidade_beneficiada', e.target.value)}
              disabled={updateTacMutation.isPending}
              required
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateTacMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-pink-600 hover:bg-pink-700"
              disabled={updateTacMutation.isPending}
            >
              {updateTacMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTACDialog;