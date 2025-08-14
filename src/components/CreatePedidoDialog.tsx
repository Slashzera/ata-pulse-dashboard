
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePedido } from '@/hooks/usePedidos';
import { ATA } from '@/hooks/useAtas';
import CurrencyInput from '@/components/CurrencyInput';

interface CreatePedidoDialogProps {
  atas: ATA[];
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
}

const CreatePedidoDialog: React.FC<CreatePedidoDialogProps> = ({
  atas,
  isOpen,
  onClose,
  categoryName
}) => {
  const [departamento, setDepartamento] = useState('');
  const [ataId, setAtaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [dataSolicitacao, setDataSolicitacao] = useState('');

  const createPedidoMutation = useCreatePedido();

  // Filtrar ATAs com saldo disponível
  const atasComSaldo = atas.filter(ata => (ata.saldo_disponivel || 0) > 0);

  useEffect(() => {
    if (isOpen) {
      // Resetar formulário quando o dialog abrir
      setDepartamento('');
      setAtaId('');
      setDescricao('');
      setValor(0);
      setObservacoes('');
      setDataSolicitacao(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!departamento || !ataId || !descricao || valor <= 0) {
      return;
    }

    createPedidoMutation.mutate({
      departamento,
      ata_id: ataId,
      descricao,
      valor,
      observacoes,
      data_solicitacao: dataSolicitacao
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const selectedAta = atas.find(ata => ata.id === ataId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Novo Pedido {categoryName ? `- ${categoryName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ata">ATA</Label>
            <Select value={ataId} onValueChange={setAtaId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma ATA" />
              </SelectTrigger>
              <SelectContent>
                {atasComSaldo.map((ata) => (
                  <SelectItem key={ata.id} value={ata.id}>
                    ATA {ata.n_ata} - Proc. {ata.processo_adm || 'N/A'} - {ata.favorecido} (Saldo: {formatCurrency(ata.saldo_disponivel || 0)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAta && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm"><strong>Número da ATA:</strong> {selectedAta.n_ata}</p>
                <p className="text-sm"><strong>Processo Administrativo:</strong> {selectedAta.processo_adm || 'N/A'}</p>
                <p className="text-sm"><strong>Favorecido:</strong> {selectedAta.favorecido}</p>
                <p className="text-sm"><strong>Saldo Disponível:</strong> {formatCurrency(selectedAta.saldo_disponivel || 0)}</p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="departamento">Setor Demandante</Label>
            <Input
              id="departamento"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
              placeholder="Nome do setor/departamento"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do pedido"
              required
            />
          </div>

          <div>
            <Label htmlFor="valor">Valor</Label>
            <CurrencyInput
              id="valor"
              value={valor}
              onChange={setValor}
              placeholder="R$ 0,00"
            />
            {selectedAta && valor > (selectedAta.saldo_disponivel || 0) && (
              <p className="text-red-500 text-sm mt-1">
                ⚠️ Valor excede o saldo disponível da ATA!
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="data-solicitacao">Data da Solicitação</Label>
            <Input
              id="data-solicitacao"
              type="date"
              value={dataSolicitacao}
              onChange={(e) => setDataSolicitacao(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações (opcional)"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createPedidoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createPedidoMutation.isPending || !departamento || !ataId || !descricao || valor <= 0}
            >
              {createPedidoMutation.isPending ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePedidoDialog;
