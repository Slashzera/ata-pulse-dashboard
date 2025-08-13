
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAta } from '@/hooks/useAtas';
import CurrencyInput from '@/components/CurrencyInput';

interface CreateATADialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateATADialog: React.FC<CreateATADialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    n_ata: '',
    pregao: '',
    objeto: '',
    processo_adm: '',
    processo_emp_afo: '',
    favorecido: '',
    valor: 0,
    vencimento: '',
    informacoes: '',
    saldo_disponivel: 0
  });

  const createAtaMutation = useCreateAta();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createAtaMutation.mutate({
      ...formData,
      category: 'normal'
    });

    if (!createAtaMutation.isError) {
      onClose();
      setFormData({
        n_ata: '',
        pregao: '',
        objeto: '',
        processo_adm: '',
        processo_emp_afo: '',
        favorecido: '',
        valor: 0,
        vencimento: '',
        informacoes: '',
        saldo_disponivel: 0
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova ATA</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="n_ata">Número da ATA *</Label>
              <Input
                id="n_ata"
                value={formData.n_ata}
                onChange={(e) => setFormData(prev => ({ ...prev, n_ata: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="pregao">Pregão *</Label>
              <Input
                id="pregao"
                value={formData.pregao}
                onChange={(e) => setFormData(prev => ({ ...prev, pregao: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="objeto">Objeto *</Label>
            <Textarea
              id="objeto"
              value={formData.objeto}
              onChange={(e) => setFormData(prev => ({ ...prev, objeto: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="processo_adm">Processo Administrativo</Label>
              <Input
                id="processo_adm"
                value={formData.processo_adm}
                onChange={(e) => setFormData(prev => ({ ...prev, processo_adm: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="processo_emp_afo">Processo Empenho/AFO</Label>
              <Input
                id="processo_emp_afo"
                value={formData.processo_emp_afo}
                onChange={(e) => setFormData(prev => ({ ...prev, processo_emp_afo: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="favorecido">Favorecido</Label>
            <Input
              id="favorecido"
              value={formData.favorecido}
              onChange={(e) => setFormData(prev => ({ ...prev, favorecido: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Total</Label>
              <CurrencyInput
                value={formData.valor}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  valor: value,
                  saldo_disponivel: value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="vencimento">Data de Vencimento</Label>
              <Input
                id="vencimento"
                type="date"
                value={formData.vencimento}
                onChange={(e) => setFormData(prev => ({ ...prev, vencimento: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="informacoes">Informações Adicionais</Label>
            <Textarea
              id="informacoes"
              value={formData.informacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, informacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createAtaMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createAtaMutation.isPending ? 'Salvando...' : 'Criar ATA'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateATADialog;
