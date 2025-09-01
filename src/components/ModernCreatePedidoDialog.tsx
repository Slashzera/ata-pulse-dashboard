import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCreatePedido } from '@/hooks/usePedidos';
import { ATA } from '@/hooks/useAtas';
import CurrencyInput from '@/components/CurrencyInput';
import { 
  FileText, 
  Building, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  MessageSquare,
  Sparkles,
  Target,
  Star,
  Zap
} from 'lucide-react';

interface ModernCreatePedidoDialogProps {
  atas: ATA[];
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
  category?: string;
}

const ModernCreatePedidoDialog: React.FC<ModernCreatePedidoDialogProps> = ({
  atas,
  isOpen,
  onClose,
  categoryName,
  category = 'normal'
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

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'normal':
        return { 
          name: 'Atas de Registro de Preços', 
          color: 'from-blue-600 to-indigo-600',
          icon: FileText,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'adesao':
        return { 
          name: 'Adesões', 
          color: 'from-green-600 to-emerald-600',
          icon: Target,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'antigo':
        return { 
          name: 'Saldo de ATAs', 
          color: 'from-orange-600 to-amber-600',
          icon: Star,
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200'
        };
      case 'aquisicao':
        return { 
          name: 'Aquisição Global', 
          color: 'from-purple-600 to-violet-600',
          icon: Zap,
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        };
      default:
        return { 
          name: 'Contratos', 
          color: 'from-gray-600 to-gray-600',
          icon: FileText,
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const categoryInfo = getCategoryInfo(category);
  const CategoryIcon = categoryInfo.icon;

  const isFormValid = departamento && ataId && descricao && valor > 0;
  const isValueExceeded = selectedAta && valor > (selectedAta.saldo_disponivel || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
        {/* Header moderno */}
        <DialogHeader className="relative overflow-hidden">
          <div className={`bg-gradient-to-r ${categoryInfo.color} rounded-xl p-6 text-white relative`}>
            {/* Padrão de fundo */}
            <div className="absolute inset-0 bg-white/10 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}></div>
            </div>
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <CategoryIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  Novo Pedido
                </DialogTitle>
                <p className="text-blue-100 text-lg">
                  {categoryInfo.name}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-1">
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            {/* Seleção de ATA */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${categoryInfo.bgColor}`}>
                    <FileText className={`h-5 w-5 ${categoryInfo.textColor}`} />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-900">Contrato Vinculado</Label>
                    <p className="text-sm text-gray-600">Selecione o contrato para este pedido</p>
                  </div>
                </div>

                <Select value={ataId} onValueChange={setAtaId} required>
                  <SelectTrigger className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione uma ATA com saldo disponível" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {atasComSaldo.map((ata) => (
                      <SelectItem key={ata.id} value={ata.id} className="py-3">
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">ATA {ata.n_ata} - {ata.favorecido}</div>
                          <div className="text-sm text-gray-500">
                            Proc. {ata.processo_adm || 'N/A'} • Saldo: {formatCurrency(ata.saldo_disponivel || 0)}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAta && (
                  <Card className={`mt-4 border-l-4 ${categoryInfo.borderColor} ${categoryInfo.bgColor}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={`h-5 w-5 ${categoryInfo.textColor}`} />
                          <span className="font-semibold text-gray-900">Contrato Selecionado</span>
                        </div>
                        <Badge className={`${categoryInfo.color.replace('from-', 'bg-').replace(' to-violet-600', '').replace(' to-indigo-600', '').replace(' to-emerald-600', '').replace(' to-amber-600', '')} text-white`}>
                          {categoryInfo.name}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Número da ATA:</span>
                          <p className="text-gray-900 font-semibold">{selectedAta.n_ata}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Processo:</span>
                          <p className="text-gray-900">{selectedAta.processo_adm || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Favorecido:</span>
                          <p className="text-gray-900">{selectedAta.favorecido}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Saldo Disponível:</span>
                          <p className="text-green-600 font-bold">{formatCurrency(selectedAta.saldo_disponivel || 0)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Informações do Pedido */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <Building className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-900">Informações do Pedido</Label>
                    <p className="text-sm text-gray-600">Dados do setor e descrição da solicitação</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="departamento" className="text-sm font-medium text-gray-700 mb-2 block">
                      Setor Demandante *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="departamento"
                        value={departamento}
                        onChange={(e) => setDepartamento(e.target.value)}
                        placeholder="Nome do setor/departamento"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="descricao" className="text-sm font-medium text-gray-700 mb-2 block">
                      Descrição do Pedido *
                    </Label>
                    <Textarea
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva detalhadamente o que está sendo solicitado..."
                      className="min-h-[100px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valor e Data */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-green-50">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-900">Valor e Cronograma</Label>
                    <p className="text-sm text-gray-600">Valor solicitado e data da solicitação</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="valor" className="text-sm font-medium text-gray-700 mb-2 block">
                      Valor Solicitado *
                    </Label>
                    <CurrencyInput
                      id="valor"
                      value={valor}
                      onChange={setValor}
                      placeholder="R$ 0,00"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {isValueExceeded && (
                      <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="text-red-700 text-sm font-medium">
                          Valor excede o saldo disponível da ATA!
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="data-solicitacao" className="text-sm font-medium text-gray-700 mb-2 block">
                      Data da Solicitação *
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="data-solicitacao"
                        type="date"
                        value={dataSolicitacao}
                        onChange={(e) => setDataSolicitacao(e.target.value)}
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <Label htmlFor="observacoes" className="text-lg font-semibold text-gray-900">Observações</Label>
                    <p className="text-sm text-gray-600">Informações adicionais (opcional)</p>
                  </div>
                </div>

                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações, justificativas ou informações complementares..."
                  className="min-h-[80px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </CardContent>
            </Card>

            {/* Botões de ação */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createPedidoMutation.isPending}
                className="px-8 py-3 h-auto font-semibold border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createPedidoMutation.isPending || !isFormValid || isValueExceeded}
                className={`px-8 py-3 h-auto font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${categoryInfo.color} hover:scale-105`}
              >
                {createPedidoMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Criando Pedido...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Criar Pedido
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModernCreatePedidoDialog;