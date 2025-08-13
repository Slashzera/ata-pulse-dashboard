
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CurrencyInput from '@/components/CurrencyInput';
import { useCreateAfoControle } from '@/hooks/useAfoControle';

interface CreateAfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
}

const CreateAfoDialog: React.FC<CreateAfoDialogProps> = ({ isOpen, onClose, selectedYear }) => {
  const [formData, setFormData] = useState({
    numero_afo: '',
    favorecido: '',
    adesao_ata: '',
    numero_processo: '',
    arp_numero: '',
    tipo_pregao: '',
    numero_pregao: '',
    data_emissao: null as Date | null,
    valor_total: 0,
    feito_por: '',
    ano: selectedYear
  });

  const createAfoMutation = useCreateAfoControle();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campo obrigatório
    if (!formData.feito_por.trim()) {
      alert('O campo "Feito Por" é obrigatório!');
      return;
    }
    
    try {
      let dataFormatada = null;
      if (formData.data_emissao) {
        // Garantir que usamos a data local sem conversão de timezone
        const year = formData.data_emissao.getFullYear();
        const month = String(formData.data_emissao.getMonth() + 1).padStart(2, '0');
        const day = String(formData.data_emissao.getDate()).padStart(2, '0');
        dataFormatada = `${year}-${month}-${day}`;
      }

      const dataToSubmit = {
        ...formData,
        data_emissao: dataFormatada
      };
      
      console.log('Dados a serem enviados:', dataToSubmit);
      
      await createAfoMutation.mutateAsync(dataToSubmit);
      onClose();
      
      // Reset form data
      setFormData({
        numero_afo: '',
        favorecido: '',
        adesao_ata: '',
        numero_processo: '',
        arp_numero: '',
        tipo_pregao: '',
        numero_pregao: '',
        data_emissao: null,
        valor_total: 0,
        feito_por: '',
        ano: selectedYear
      });
    } catch (error) {
      console.error('Erro ao criar AFO:', error);
    }
  };

  const tiposPregao = [
    'Pregão Eletrônico',
    'Pregão Presencial',
    'Concorrência',
    'Tomada de Preços',
    'Convite',
    'Inexigibilidade',
    'Dispensa'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Autorização de Fornecimento - {selectedYear}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_afo">Nº AFO *</Label>
              <Input
                id="numero_afo"
                value={formData.numero_afo}
                onChange={(e) => setFormData({ ...formData, numero_afo: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="favorecido">Favorecido *</Label>
              <Input
                id="favorecido"
                value={formData.favorecido}
                onChange={(e) => setFormData({ ...formData, favorecido: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="adesao_ata">Adesão à ATA</Label>
              <Input
                id="adesao_ata"
                value={formData.adesao_ata}
                onChange={(e) => setFormData({ ...formData, adesao_ata: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="numero_processo">Nº Processo</Label>
              <Input
                id="numero_processo"
                value={formData.numero_processo}
                onChange={(e) => setFormData({ ...formData, numero_processo: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="arp_numero">ARP Nº</Label>
              <Input
                id="arp_numero"
                value={formData.arp_numero}
                onChange={(e) => setFormData({ ...formData, arp_numero: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="tipo_pregao">Tipo de Pregão</Label>
              <Select value={formData.tipo_pregao} onValueChange={(value) => setFormData({ ...formData, tipo_pregao: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPregao.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numero_pregao">Número do Pregão</Label>
              <Input
                id="numero_pregao"
                value={formData.numero_pregao}
                onChange={(e) => setFormData({ ...formData, numero_pregao: e.target.value })}
                placeholder="Ex: 001/2025"
              />
            </div>

            <div>
              <Label>Data de Emissão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_emissao ? format(formData.data_emissao, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data_emissao || undefined}
                    onSelect={(date) => {
                      console.log('Data selecionada:', date);
                      setFormData({ ...formData, data_emissao: date || null });
                    }}
                    locale={ptBR}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="valor_total">Valor Total</Label>
              <CurrencyInput
                value={formData.valor_total}
                onChange={(value) => setFormData({ ...formData, valor_total: value })}
                placeholder="R$ 0,00"
              />
            </div>

            <div>
              <Label htmlFor="feito_por">Feito Por *</Label>
              <Input
                id="feito_por"
                value={formData.feito_por}
                onChange={(e) => setFormData({ ...formData, feito_por: e.target.value })}
                required
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                min="2020"
                max="2030"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createAfoMutation.isPending}
            >
              {createAfoMutation.isPending ? 'Criando...' : 'Criar AFO'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAfoDialog;
