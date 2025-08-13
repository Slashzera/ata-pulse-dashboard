
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAta } from '@/hooks/useAtas';
import CurrencyInput from '@/components/CurrencyInput';
import { useToast } from '@/hooks/use-toast';

interface CreateContratoAntigoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateContratoAntigoDialog: React.FC<CreateContratoAntigoDialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    n_ata: '',
    numero_termo: '',
    pregao: '',
    objeto: '',
    processo_adm: '',
    processo_emp_afo: '',
    favorecido: '',
    valor: 0,
    saldo_disponivel: 0,
    vencimento: '',
    informacoes: ''
  });

  const createAtaMutation = useCreateAta();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Dados do formulário antes do envio:', formData);
      
      // Validações básicas mais flexíveis
      if (!formData.n_ata || formData.n_ata.trim() === '') {
        toast({
          title: "Erro",
          description: "Número da ATA é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!formData.pregao || formData.pregao.trim() === '') {
        toast({
          title: "Erro",
          description: "Pregão é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!formData.objeto || formData.objeto.trim() === '') {
        toast({
          title: "Erro",
          description: "Objeto é obrigatório",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para criação da ATA de forma mais robusta
      const ataData = {
        n_ata: formData.n_ata.trim(),
        numero_termo: formData.numero_termo?.trim() || undefined,
        pregao: formData.pregao.trim(),
        objeto: formData.objeto.trim(),
        processo_adm: formData.processo_adm?.trim() || undefined,
        processo_emp_afo: formData.processo_emp_afo?.trim() || undefined,
        favorecido: formData.favorecido?.trim() || undefined,
        valor: Number(formData.valor) || 0,
        saldo_disponivel: Number(formData.saldo_disponivel) || 0,
        vencimento: formData.vencimento || undefined,
        informacoes: formData.informacoes?.trim() || undefined,
        category: 'antigo' as const
      };

      console.log('Dados preparados para envio:', ataData);

      await createAtaMutation.mutateAsync(ataData);

      toast({
        title: "Sucesso",
        description: "Saldo de ATA (Contrato Antigo) criado com sucesso!",
      });

      // Resetar formulário
      setFormData({
        n_ata: '',
        numero_termo: '',
        pregao: '',
        objeto: '',
        processo_adm: '',
        processo_emp_afo: '',
        favorecido: '',
        valor: 0,
        saldo_disponivel: 0,
        vencimento: '',
        informacoes: ''
      });

      onClose();
    } catch (error) {
      console.error('Erro detalhado ao criar contrato antigo:', error);
      
      let errorMessage = "Erro ao criar saldo de ATA. Verifique os dados e tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleValorChange = (value: number) => {
    setFormData(prev => ({ 
      ...prev, 
      valor: value
    }));
  };

  const handleSaldoChange = (value: number) => {
    setFormData(prev => ({ 
      ...prev, 
      saldo_disponivel: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saldo de ATAs (Contratos Antigos)</DialogTitle>
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
                placeholder="Ex: ATA 001/2024"
              />
            </div>
            <div>
              <Label htmlFor="numero_termo">Número de Termo</Label>
              <Input
                id="numero_termo"
                value={formData.numero_termo}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_termo: e.target.value }))}
                placeholder="Ex: Termo 001/2024"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pregao">Pregão *</Label>
              <Input
                id="pregao"
                value={formData.pregao}
                onChange={(e) => setFormData(prev => ({ ...prev, pregao: e.target.value }))}
                required
                placeholder="Ex: Pregão Eletrônico 001/2024"
              />
            </div>
            <div>
              <Label htmlFor="favorecido">Favorecido</Label>
              <Input
                id="favorecido"
                value={formData.favorecido}
                onChange={(e) => setFormData(prev => ({ ...prev, favorecido: e.target.value }))}
                placeholder="Nome da empresa"
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
              placeholder="Descrição do objeto da ATA"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="processo_adm">Processo Administrativo</Label>
              <Input
                id="processo_adm"
                value={formData.processo_adm}
                onChange={(e) => setFormData(prev => ({ ...prev, processo_adm: e.target.value }))}
                placeholder="Ex: 2024.001.001"
              />
            </div>
            <div>
              <Label htmlFor="processo_emp_afo">Processo Empenho/AFO</Label>
              <Input
                id="processo_emp_afo"
                value={formData.processo_emp_afo}
                onChange={(e) => setFormData(prev => ({ ...prev, processo_emp_afo: e.target.value }))}
                placeholder="Ex: 2024.002.001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor_total">Valor Total da ATA</Label>
              <CurrencyInput
                value={formData.valor}
                onChange={handleValorChange}
                placeholder="R$ 0,00"
                id="valor_total"
              />
              <p className="text-xs text-gray-600 mt-1">
                Valor total original da ATA
              </p>
            </div>
            <div>
              <Label htmlFor="saldo_disponivel">Saldo Disponível</Label>
              <CurrencyInput
                value={formData.saldo_disponivel}
                onChange={handleSaldoChange}
                placeholder="R$ 0,00"
                id="saldo_disponivel"
              />
              <p className="text-xs text-gray-600 mt-1">
                Valor atual disponível para uso
              </p>
            </div>
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

          <div>
            <Label htmlFor="informacoes">Informações Adicionais</Label>
            <Textarea
              id="informacoes"
              value={formData.informacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, informacoes: e.target.value }))}
              rows={3}
              placeholder="Observações ou informações relevantes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createAtaMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createAtaMutation.isPending ? 'Salvando...' : 'Criar Contrato Antigo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContratoAntigoDialog;
