import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateAta } from '@/hooks/useAtas';
import CurrencyInput from '@/components/CurrencyInput';
import { 
  FileText, 
  Building, 
  Calendar, 
  DollarSign, 
  User, 
  MessageSquare,
  Sparkles,
  Hash,
  Gavel,
  Target,
  Star,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ModernCreateATADialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

const ModernCreateATADialog: React.FC<ModernCreateATADialogProps> = ({ 
  isOpen, 
  onClose, 
  category = 'normal' 
}) => {
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
    
    console.log('Iniciando criação de ATA:', { ...formData, category });
    
    createAtaMutation.mutate({
      ...formData,
      category: category
    }, {
      onSuccess: (data) => {
        console.log('ATA criada com sucesso:', data);
        // Limpar formulário
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
        // Fechar modal
        onClose();
      },
      onError: (error) => {
        console.error('Erro ao criar ATA:', error);
        // Modal permanece aberto para o usuário tentar novamente
      }
    });
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'normal':
        return { 
          name: 'Nova Ata de Registro de Preços', 
          description: 'Contrato de fornecimento padrão',
          color: 'from-blue-600 to-indigo-600',
          icon: FileText,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'adesao':
        return { 
          name: 'Nova Adesão', 
          description: 'Adesão a ata de registro de preços',
          color: 'from-green-600 to-emerald-600',
          icon: Target,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'antigo':
        return { 
          name: 'Novo Saldo de ATA', 
          description: 'Contrato antigo com saldo remanescente',
          color: 'from-orange-600 to-amber-600',
          icon: Star,
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200'
        };
      case 'aquisicao':
        return { 
          name: 'Nova Aquisição Global', 
          description: 'Aquisição de escala global',
          color: 'from-purple-600 to-violet-600',
          icon: Zap,
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        };
      default:
        return { 
          name: 'Novo Contrato', 
          description: 'Contrato de fornecimento',
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

  const isFormValid = formData.n_ata && formData.pregao && formData.objeto;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20">
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
                  {categoryInfo.name}
                </DialogTitle>
                <p className="text-blue-100 text-lg">
                  {categoryInfo.description}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-1">
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            {/* Identificação */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${categoryInfo.bgColor}`}>
                    <Hash className={`h-5 w-5 ${categoryInfo.textColor}`} />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-900">Identificação</Label>
                    <p className="text-sm text-gray-600">Números e códigos de identificação</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="n_ata" className="text-sm font-medium text-gray-700 mb-2 block">
                      Número da ATA *
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="n_ata"
                        value={formData.n_ata}
                        onChange={(e) => setFormData(prev => ({ ...prev, n_ata: e.target.value }))}
                        placeholder="Ex: 001/2024"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pregao" className="text-sm font-medium text-gray-700 mb-2 block">
                      Pregão *
                    </Label>
                    <div className="relative">
                      <Gavel className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="pregao"
                        value={formData.pregao}
                        onChange={(e) => setFormData(prev => ({ ...prev, pregao: e.target.value }))}
                        placeholder="Ex: PE 001/2024"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processos */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-900">Processos</Label>
                    <p className="text-sm text-gray-600">Números dos processos administrativos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="processo_adm" className="text-sm font-medium text-gray-700 mb-2 block">
                      Processo Administrativo
                    </Label>
                    <Input
                      id="processo_adm"
                      value={formData.processo_adm}
                      onChange={(e) => setFormData(prev => ({ ...prev, processo_adm: e.target.value }))}
                      placeholder="Ex: 2024.001.001"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="processo_emp_afo" className="text-sm font-medium text-gray-700 mb-2 block">
                      Processo Empenho/AFO
                    </Label>
                    <Input
                      id="processo_emp_afo"
                      value={formData.processo_emp_afo}
                      onChange={(e) => setFormData(prev => ({ ...prev, processo_emp_afo: e.target.value }))}
                      placeholder="Ex: AFO 001/2024"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Objeto e Favorecido */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-900">Objeto e Fornecedor</Label>
                    <p className="text-sm text-gray-600">Descrição do objeto e empresa favorecida</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="objeto" className="text-sm font-medium text-gray-700 mb-2 block">
                      Objeto *
                    </Label>
                    <Textarea
                      id="objeto"
                      value={formData.objeto}
                      onChange={(e) => setFormData(prev => ({ ...prev, objeto: e.target.value }))}
                      placeholder="Descreva detalhadamente o objeto do contrato..."
                      className="min-h-[100px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="favorecido" className="text-sm font-medium text-gray-700 mb-2 block">
                      Favorecido
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="favorecido"
                        value={formData.favorecido}
                        onChange={(e) => setFormData(prev => ({ ...prev, favorecido: e.target.value }))}
                        placeholder="Nome da empresa favorecida"
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valores e Datas */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-yellow-50">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <Label className="text-lg font-semibold text-gray-900">Valores e Vigência</Label>
                    <p className="text-sm text-gray-600">Valor total e data de vencimento</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Valor Total
                    </Label>
                    <CurrencyInput
                      value={formData.valor}
                      onChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        valor: value,
                        saldo_disponivel: value
                      }))}
                      placeholder="R$ 0,00"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {formData.valor > 0 && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <p className="text-green-700 text-sm">
                          Saldo inicial: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="vencimento" className="text-sm font-medium text-gray-700 mb-2 block">
                      Data de Vencimento
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="vencimento"
                        type="date"
                        value={formData.vencimento}
                        onChange={(e) => setFormData(prev => ({ ...prev, vencimento: e.target.value }))}
                        className="pl-10 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gray-50">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <Label htmlFor="informacoes" className="text-lg font-semibold text-gray-900">Informações Adicionais</Label>
                    <p className="text-sm text-gray-600">Observações e detalhes complementares</p>
                  </div>
                </div>

                <Textarea
                  id="informacoes"
                  value={formData.informacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, informacoes: e.target.value }))}
                  placeholder="Adicione informações complementares, observações ou detalhes importantes..."
                  className="min-h-[80px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </CardContent>
            </Card>

            {/* Resumo */}
            {isFormValid && (
              <Card className={`border-l-4 ${categoryInfo.borderColor} ${categoryInfo.bgColor} shadow-lg`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className={`h-5 w-5 ${categoryInfo.textColor}`} />
                    <Label className="text-lg font-semibold text-gray-900">Resumo do Contrato</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">ATA:</span>
                      <p className="text-gray-900 font-semibold">{formData.n_ata}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Pregão:</span>
                      <p className="text-gray-900">{formData.pregao}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Valor:</span>
                      <p className="text-green-600 font-bold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.valor)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões de ação */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createAtaMutation.isPending}
                className="px-8 py-3 h-auto font-semibold border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createAtaMutation.isPending || !isFormValid}
                className={`px-8 py-3 h-auto font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r ${categoryInfo.color} hover:scale-105`}
              >
                {createAtaMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Criar {categoryInfo.name.split(' ')[1]}
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

export default ModernCreateATADialog;