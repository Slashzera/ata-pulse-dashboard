
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { ATA } from '@/hooks/useAtas';
import { Pedido } from '@/hooks/usePedidos';
import { useToast } from '@/hooks/use-toast';

interface ExportCategoryReportProps {
  atas: ATA[];
  pedidos: Pedido[];
}

const ExportCategoryReport: React.FC<ExportCategoryReportProps> = ({ atas, pedidos }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFavorecido, setSelectedFavorecido] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'normal', label: 'ATAs' },
    { value: 'adesao', label: 'Adesões' },
    { value: 'aquisicao', label: 'Aquisição Global' },
    { value: 'antigo', label: 'Saldo de ATAs' }
  ];

  // Get unique favorecidos for the selected category, filtering out empty strings
  const getUniqueFavorecidos = () => {
    if (!selectedCategory) return [];
    
    console.log('Buscando favorecidos para categoria:', selectedCategory);
    console.log('Total ATAs disponíveis:', atas.length);
    
    const categoryAtas = atas.filter(ata => ata.category === selectedCategory);
    console.log('ATAs filtradas por categoria:', categoryAtas.length);
    
    const uniqueFavorecidos = [...new Set(categoryAtas.map(ata => ata.favorecido))]
      .filter(favorecido => favorecido && favorecido.trim() !== '')
      .sort();
    
    console.log('Favorecidos únicos encontrados:', uniqueFavorecidos);
    return uniqueFavorecidos;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const generateCategoryReport = async () => {
    console.log('=== INICIANDO GERAÇÃO DO RELATÓRIO ===');
    console.log('Categoria selecionada:', selectedCategory);
    console.log('Favorecido selecionado:', selectedFavorecido);
    console.log('Total de ATAs disponíveis:', atas.length);
    console.log('Total de pedidos disponíveis:', pedidos.length);
    
    if (!selectedCategory) {
      console.log('Erro: Categoria não selecionada');
      toast({
        title: "Erro",
        description: "Por favor, selecione uma categoria antes de gerar o relatório.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Filter ATAs by category and favorecido if selected
      let filteredAtas = atas.filter(ata => {
        console.log(`Verificando ATA ${ata.n_ata} - Categoria: ${ata.category}`);
        return ata.category === selectedCategory;
      });
      
      console.log('ATAs após filtro de categoria:', filteredAtas.length);

      if (selectedFavorecido && selectedFavorecido !== 'all' && selectedFavorecido !== '') {
        filteredAtas = filteredAtas.filter(ata => {
          console.log(`Verificando favorecido ${ata.favorecido} vs ${selectedFavorecido}`);
          return ata.favorecido === selectedFavorecido;
        });
        console.log('ATAs após filtro de favorecido:', filteredAtas.length);
      }

      if (filteredAtas.length === 0) {
        console.log('Nenhuma ATA encontrada para os filtros');
        toast({
          title: "Aviso",
          description: "Nenhuma ATA encontrada para os filtros selecionados.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      console.log('Gerando relatório para', filteredAtas.length, 'ATAs');

      // Create HTML report
      const categoryLabel = categories.find(cat => cat.value === selectedCategory)?.label || selectedCategory;
      let reportTitle = `Categoria: ${categoryLabel}`;
      if (selectedFavorecido && selectedFavorecido !== 'all' && selectedFavorecido !== '') {
        reportTitle += ` - Favorecido: ${selectedFavorecido}`;
      }

      // Calculate totals
      const totalValue = filteredAtas.reduce((sum, ata) => sum + (ata.valor || 0), 0);
      const totalSaldo = filteredAtas.reduce((sum, ata) => sum + (ata.saldo_disponivel || 0), 0);
      const totalPedidosValue = pedidos
        .filter(p => filteredAtas.some(ata => ata.id === p.ata_id))
        .reduce((sum, p) => sum + p.valor, 0);

      console.log('Totais calculados:', { totalValue, totalSaldo, totalPedidosValue });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Relatório por Categoria - ${categoryLabel}</title>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 20px; 
                color: #333;
                line-height: 1.4;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #4f46e5;
                padding-bottom: 20px;
              }
              .header h1 { 
                color: #4f46e5; 
                margin: 0;
                font-size: 24px;
              }
              .header p { 
                margin: 5px 0; 
                color: #666;
              }
              .filters {
                background-color: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .filters h3 {
                margin-top: 0;
                color: #374151;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 30px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                font-size: 12px;
              }
              th, td { 
                border: 1px solid #e5e7eb; 
                padding: 8px 6px; 
                text-align: left;
              }
              th { 
                background-color: #4f46e5; 
                color: white;
                font-weight: bold;
                font-size: 11px;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              .currency { 
                text-align: right; 
                font-weight: 500;
              }
              .saldo-zerado { 
                text-align: right; 
                font-weight: bold; 
                color: #dc2626; 
                background-color: #fef2f2; 
              }
              .summary {
                background-color: #f0f9ff;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                border: 2px solid #0ea5e9;
              }
              .summary h3 {
                margin-top: 0;
                color: #1e40af;
                text-align: center;
              }
              .summary-item {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e0e7ff;
                font-size: 14px;
              }
              .summary-item:last-child {
                border-bottom: none;
                font-weight: bold;
                font-size: 16px;
                color: #1e40af;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
              }
              .objeto-cell {
                max-width: 200px;
                word-wrap: break-word;
                overflow-wrap: break-word;
              }
              @media print {
                body { margin: 0; font-size: 11px; }
                .no-print { display: none; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>SisGecon Saúde - Relatório de Saldos por Categoria</h1>
              <p><strong>${reportTitle}</strong></p>
              <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            </div>

            <div class="filters">
              <h3>Filtros Aplicados:</h3>
              <p><strong>Categoria:</strong> ${categoryLabel}</p>
              ${selectedFavorecido && selectedFavorecido !== 'all' && selectedFavorecido !== '' ? 
                `<p><strong>Favorecido:</strong> ${selectedFavorecido}</p>` : 
                '<p><strong>Favorecido:</strong> Todos</p>'
              }
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 70px;">N° ATA</th>
                  <th style="width: 120px;">Processo Adm.</th>
                  <th style="width: 70px;">Pregão</th>
                  <th style="width: 130px;">Favorecido</th>
                  <th style="width: 180px;">Objeto</th>
                  <th style="width: 90px;">Valor Total</th>
                  <th style="width: 90px;">Saldo Disponível</th>
                  <th style="width: 70px;">Validade</th>
                  <th style="width: 50px;">Pedidos</th>
                  <th style="width: 90px;">Total Pedidos</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAtas.map(ata => {
                  const pedidosAta = pedidos.filter(p => p.ata_id === ata.id);
                  const totalPedidos = pedidosAta.reduce((sum, p) => sum + p.valor, 0);
                  const saldoStatus = (ata.saldo_disponivel || 0) <= 0 ? 'SALDO ZERADO' : formatCurrency(ata.saldo_disponivel || 0);
                  
                  return `
                    <tr>
                      <td>${ata.n_ata || ''}</td>
                      <td style="background-color: #eff6ff; font-weight: bold; color: #1e40af; text-align: center;">${ata.processo_adm || 'N/A'}</td>
                      <td>${ata.pregao || ''}</td>
                      <td>${ata.favorecido || ''}</td>
                      <td class="objeto-cell">${ata.objeto || ''}</td>
                      <td class="currency">${formatCurrency(ata.valor || 0)}</td>
                      <td class="${(ata.saldo_disponivel || 0) <= 0 ? 'saldo-zerado' : 'currency'}">${saldoStatus}</td>
                      <td>${formatDate(ata.vencimento)}</td>
                      <td style="text-align: center;">${pedidosAta.length}</td>
                      <td class="currency">${formatCurrency(totalPedidos)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="summary">
              <h3>RESUMO DO RELATÓRIO DE SALDOS</h3>
              <div class="summary-item">
                <span><strong>Total de ATAs:</strong></span>
                <span>${filteredAtas.length}</span>
              </div>
              <div class="summary-item">
                <span><strong>Valor Total das ATAs:</strong></span>
                <span>${formatCurrency(totalValue)}</span>
              </div>
              <div class="summary-item">
                <span><strong>Total em Pedidos Realizados:</strong></span>
                <span>${formatCurrency(totalPedidosValue)}</span>
              </div>
              <div class="summary-item">
                <span><strong>SALDO TOTAL DISPONÍVEL:</strong></span>
                <span>${totalSaldo <= 0 ? 'SALDO ZERADO' : formatCurrency(totalSaldo)}</span>
              </div>
            </div>

            <div class="footer">
              <p><strong>Sistema de Gestão e Contratos - SisGecon Saúde</strong></p>
              <p>Secretaria Municipal de Saúde de Duque de Caxias</p>
              <p>Relatório de Saldos por Categoria e Favorecido</p>
            </div>
          </body>
        </html>
      `;

      console.log('Abrindo janela para impressão...');

      // Open in new window for printing
      const printWindow = window.open('', '_blank', 'width=1024,height=768');
      if (!printWindow) {
        console.log('Erro: Não foi possível abrir janela');
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Auto print after a short delay
      setTimeout(() => {
        console.log('Executando impressão...');
        printWindow.print();
      }, 1000);

      toast({
        title: "Sucesso",
        description: `Relatório gerado com sucesso! ${filteredAtas.length} ATAs encontradas.`,
      });

      setIsDialogOpen(false);
      console.log('=== RELATÓRIO GERADO COM SUCESSO ===');
      
    } catch (error) {
      console.error('=== ERRO AO GERAR RELATÓRIO ===', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const uniqueFavorecidos = getUniqueFavorecidos();

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/20 bg-green-600/50 backdrop-blur-sm font-medium shadow-md">
          <FileText className="h-4 w-4 mr-2" />
          Relatório por Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Saldos por Categoria</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={selectedCategory} onValueChange={(value) => {
              console.log('Categoria selecionada:', value);
              setSelectedCategory(value);
              setSelectedFavorecido(''); // Reset favorecido when category changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && uniqueFavorecidos.length > 0 && (
            <div>
              <Label htmlFor="favorecido">Favorecido (Opcional)</Label>
              <Select value={selectedFavorecido} onValueChange={(value) => {
                console.log('Favorecido selecionado:', value);
                setSelectedFavorecido(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os favorecidos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os favorecidos</SelectItem>
                  {uniqueFavorecidos.map((favorecido) => (
                    <SelectItem key={favorecido} value={favorecido}>
                      {favorecido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={generateCategoryReport}
              disabled={!selectedCategory || isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportCategoryReport;
