import React, { useState, useEffect } from 'react';
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
import { useUpdateAfoControle } from '@/hooks/useAfoControle';
import { useCreateAuditLog } from '@/hooks/useAuditLogs';

interface EditAfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  afo: any;
}

const EditAfoDialog: React.FC<EditAfoDialogProps> = ({ isOpen, onClose, afo }) => {
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
    ano: new Date().getFullYear()
  });

  const updateAfoMutation = useUpdateAfoControle();
  const createAuditLog = useCreateAuditLog();

  useEffect(() => {
    if (afo) {
      console.log('AFO recebido para edição:', afo);
      console.log('Data original da AFO:', afo.data_emissao);
      
      // Parse da data de emissão corrigindo problema de timezone
      let dataEmissao = null;
      if (afo.data_emissao) {
        try {
          if (typeof afo.data_emissao === 'string') {
            // Para datas no formato YYYY-MM-DD, criar Date local sem timezone
            const dateParts = afo.data_emissao.split('T')[0].split('-');
            if (dateParts.length === 3) {
              const year = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
              const day = parseInt(dateParts[2]);
              dataEmissao = new Date(year, month, day);
            }
          } else if (afo.data_emissao instanceof Date) {
            dataEmissao = afo.data_emissao;
          }
        } catch (error) {
          console.error('Erro ao processar data de emissão:', error);
        }
      }
      
      console.log('Data de emissão processada:', dataEmissao);
      
      setFormData({
        numero_afo: afo.numero_afo || '',
        favorecido: afo.favorecido || '',
        adesao_ata: afo.adesao_ata || '',
        numero_processo: afo.numero_processo || '',
        arp_numero: afo.arp_numero || '',
        tipo_pregao: afo.tipo_pregao || '',
        numero_pregao: afo.numero_pregao || '',
        data_emissao: dataEmissao,
        valor_total: afo.valor_total || 0,
        feito_por: afo.feito_por || '',
        ano: afo.ano || new Date().getFullYear()
      });
    }
  }, [afo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!afo?.id) return;

    try {
      // Formatação correta da data para envio ao Supabase
      let dataFormatada = null;
      if (formData.data_emissao) {
        // Garantir que usamos a data local sem conversão de timezone
        const year = formData.data_emissao.getFullYear();
        const month = String(formData.data_emissao.getMonth() + 1).padStart(2, '0');
        const day = String(formData.data_emissao.getDate()).padStart(2, '0');
        dataFormatada = `${year}-${month}-${day}`;
      }

      const updatedData = {
        ...formData,
        data_emissao: dataFormatada
      };

      console.log('Dados a serem atualizados:', updatedData);
      console.log('Data formatada para envio:', dataFormatada);

      await updateAfoMutation.mutateAsync({
        id: afo.id,
        ...updatedData
      });

      // Criar log de auditoria
      createAuditLog.mutate({
        action: 'UPDATE',
        table_name: 'afo_controle',
        record_id: afo.id,
        old_data: afo,
        new_data: updatedData,
        justification: 'Edição de dados da AFO'
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar AFO:', error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    console.log('Data selecionada no calendário:', date);
    setFormData(prev => ({ 
      ...prev, 
      data_emissao: date || null 
    }));
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
          <DialogTitle>Editar Autorização de Fornecimento</DialogTitle>
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
                    onSelect={handleDateSelect}
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
              <Label htmlFor="feito_por">Feito Por</Label>
              <Input
                id="feito_por"
                value={formData.feito_por}
                onChange={(e) => setFormData({ ...formData, feito_por: e.target.value })}
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
              disabled={updateAfoMutation.isPending}
            >
              {updateAfoMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAfoDialog;
