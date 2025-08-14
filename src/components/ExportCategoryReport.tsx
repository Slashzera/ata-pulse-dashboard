
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

interface VencimentoFilter {
  value: string;
  label: string;
  filterFunction: (ata: ATA, currentDate: Date) => boolean;
}

const ExportCategoryReport: React.FC<ExportCategoryReportProps> = ({ atas, pedidos }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFavorecido, setSelectedFavorecido] = useState<string>('');
  const [selectedVencimento, setSelectedVencimento] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: 'normal', label: 'ATAs' },
    { value: 'adesao', label: 'Adesões' },
    { value: 'aquisicao', label: 'Aquisição Global' },
    { value: 'antigo', label: 'Saldo de ATAs' }
  ];

  const vencimentoOptions: VencimentoFilter[] = [
    {
      value: 'all',
      label: 'Todos os vencimentos',
      filterFunction: () => true
    },
    {
      value: 'vencidas',
      label: 'ATAs Vencidas',
      filterFunction: (ata, currentDate) => {
        if (!ata.vencimento) return false;
        return new Date(ata.vencimento) < currentDate;
      }
    },
    {
      value: 'vencendo_30',
      label: 'Vencendo em 30 dias',
      filterFunction: (ata, currentDate) => {
        if (!ata.vencimento) return false;
        const vencimento = new Date(ata.vencimento);
        const limite = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        return vencimento >= currentDate && vencimento <= limite;
      }
    },
    {
      value: 'vencendo_60',
      label: 'Vencendo em 60 dias',
      filterFunction: (ata, currentDate) => {
        if (!ata.vencimento) return false;
        const vencimento = new Date(ata.vencimento);
        const limite = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000);
        return vencimento >= currentDate && vencimento <= limite;
      }
    },
    {
      value: 'vencendo_90',
      label: 'Vencendo em 90 dias',
      filterFunction: (ata, currentDate) => {
        if (!ata.vencimento) return false;
        const vencimento = new Date(ata.vencimento);
        const limite = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        return vencimento >= currentDate && vencimento <= limite;
      }
    },
    {
      value: 'vigentes',
      label: 'ATAs Vigentes',
      filterFunction: (ata, currentDate) => {
        if (!ata.vencimento) return false;
        return new Date(ata.vencimento) > currentDate;
      }
    },
    {
      value: 'sem_vencimento',
      label: 'Sem data de vencimento',
      filterFunction: (ata) => !ata.vencimento || ata.vencimento.trim() === ''
    }
  ];

  // Utility functions for date validation and filtering
  const isDateValid = (dateString: string): boolean => {
    if (!dateString || dateString.trim() === '') return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const filterAtasByVencimento = (atas: ATA[], vencimentoFilter: string): ATA[] => {
    if (vencimentoFilter === 'all') return atas;

    const currentDate = new Date();
    const filterOption = vencimentoOptions.find(option => option.value === vencimentoFilter);

    if (!filterOption) return atas;

    return atas.filter(ata => filterOption.filterFunction(ata, currentDate));
  };

  interface VencimentoStats {
    vencidas: { count: number; valor: number };
    vencendo30: { count: number; valor: number };
    vigentes: { count: number; valor: number };
    semVencimento: { count: number; valor: number };
  }

  const calculateVencimentoStats = (atas: ATA[]): VencimentoStats => {
    const currentDate = new Date();
    const stats: VencimentoStats = {
      vencidas: { count: 0, valor: 0 },
      vencendo30: { count: 0, valor: 0 },
      vigentes: { count: 0, valor: 0 },
      semVencimento: { count: 0, valor: 0 }
    };

    atas.forEach(ata => {
      const valor = ata.valor || 0;

      if (!ata.vencimento || ata.vencimento.trim() === '') {
        stats.semVencimento.count++;
        stats.semVencimento.valor += valor;
      } else if (isDateValid(ata.vencimento)) {
        const vencimento = new Date(ata.vencimento);
        const limite30 = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        if (vencimento < currentDate) {
          stats.vencidas.count++;
          stats.vencidas.valor += valor;
        } else if (vencimento <= limite30) {
          stats.vencendo30.count++;
          stats.vencendo30.valor += valor;
        } else {
          stats.vigentes.count++;
          stats.vigentes.valor += valor;
        }
      } else {
        // Data inválida, tratar como sem vencimento
        stats.semVencimento.count++;
        stats.semVencimento.valor += valor;
      }
    });

    return stats;
  };

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
    console.log('Filtro de vencimento selecionado:', selectedVencimento);
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

      // Apply vencimento filter
      if (selectedVencimento && selectedVencimento !== 'all') {
        filteredAtas = filterAtasByVencimento(filteredAtas, selectedVencimento);
        console.log('ATAs após filtro de vencimento:', filteredAtas.length);
      }

      // Filter out ATAs with zero balance (saldo zerado)
      filteredAtas = filteredAtas.filter(ata => {
        const saldo = ata.saldo_disponivel || 0;
        return saldo > 0;
      });
      console.log('ATAs após filtro de saldo zerado:', filteredAtas.length);

      console.log('Gerando relatório para', filteredAtas.length, 'ATAs');

      // Create HTML report - Define labels first
      const categoryLabel = categories.find(cat => cat.value === selectedCategory)?.label || selectedCategory;
      const vencimentoLabel = vencimentoOptions.find(opt => opt.value === selectedVencimento)?.label || 'Todos os vencimentos';

      if (filteredAtas.length === 0) {
        console.log('Nenhuma ATA encontrada para os filtros');
        const filterDescription = [
          `Categoria: ${categoryLabel}`,
          selectedFavorecido && selectedFavorecido !== 'all' ? `Favorecido: ${selectedFavorecido}` : null,
          selectedVencimento && selectedVencimento !== 'all' ? `Vencimento: ${vencimentoLabel}` : null
        ].filter(Boolean).join(', ');

        toast({
          title: "Nenhuma ATA encontrada",
          description: `Não foram encontradas ATAs para os filtros: ${filterDescription}. Tente ajustar os filtros.`,
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      let reportTitle = `Categoria: ${categoryLabel}`;
      if (selectedFavorecido && selectedFavorecido !== 'all' && selectedFavorecido !== '') {
        reportTitle += ` - Favorecido: ${selectedFavorecido}`;
      }
      if (selectedVencimento && selectedVencimento !== 'all') {
        reportTitle += ` - Vencimento: ${vencimentoLabel}`;
      }

      // Calculate totals
      const totalValue = filteredAtas.reduce((sum, ata) => sum + (ata.valor || 0), 0);
      const totalSaldo = filteredAtas.reduce((sum, ata) => sum + (ata.saldo_disponivel || 0), 0);
      const totalPedidosValue = pedidos
        .filter(p => filteredAtas.some(ata => ata.id === p.ata_id))
        .reduce((sum, p) => sum + p.valor, 0);

      // Calculate vencimento statistics
      const vencimentoStats = calculateVencimentoStats(filteredAtas);

      console.log('Totais calculados:', { totalValue, totalSaldo, totalPedidosValue });
      console.log('Estatísticas de vencimento:', vencimentoStats);

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
              .vencida {
                background-color: #fef2f2 !important;
                color: #dc2626 !important;
                font-weight: bold;
              }
              .vencendo-30 {
                background-color: #fef3c7 !important;
                color: #d97706 !important;
                font-weight: 500;
              }
              .vencendo-60 {
                background-color: #fef3c7 !important;
                color: #d97706 !important;
              }
              .vencendo-90 {
                background-color: #fef3c7 !important;
                color: #d97706 !important;
              }
              .vigente {
                background-color: #f0fdf4 !important;
                color: #16a34a !important;
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
              .vencimento-stats {
                background-color: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border: 1px solid #e2e8f0;
              }
              .vencimento-stats h4 {
                margin-top: 0;
                color: #374151;
                text-align: center;
                margin-bottom: 15px;
              }
              .stat-item {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                padding: 6px 0;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
              }
              .stat-item.vencidas {
                color: #dc2626;
                font-weight: bold;
                background-color: #fef2f2;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #fecaca;
              }
              .stat-item.vencendo {
                color: #d97706;
                font-weight: 500;
                background-color: #fef3c7;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #fed7aa;
              }
              .stat-item.vigentes {
                color: #16a34a;
                background-color: #f0fdf4;
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #bbf7d0;
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
              <p><strong>Filtro de Vencimento:</strong> ${vencimentoLabel}</p>
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

          // Determine vencimento status for styling
          let vencimentoClass = '';
          let vencimentoText = formatDate(ata.vencimento);

          if (ata.vencimento && isDateValid(ata.vencimento)) {
            const currentDate = new Date();
            const vencimento = new Date(ata.vencimento);
            const limite30 = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            const limite60 = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000);
            const limite90 = new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000);

            if (vencimento < currentDate) {
              vencimentoClass = 'vencida';
              vencimentoText = `${formatDate(ata.vencimento)} (VENCIDA)`;
            } else if (vencimento <= limite30) {
              vencimentoClass = 'vencendo-30';
              vencimentoText = `${formatDate(ata.vencimento)} (30 dias)`;
            } else if (vencimento <= limite60) {
              vencimentoClass = 'vencendo-60';
              vencimentoText = `${formatDate(ata.vencimento)} (60 dias)`;
            } else if (vencimento <= limite90) {
              vencimentoClass = 'vencendo-90';
              vencimentoText = `${formatDate(ata.vencimento)} (90 dias)`;
            } else {
              vencimentoClass = 'vigente';
            }
          } else if (!ata.vencimento || ata.vencimento.trim() === '') {
            vencimentoText = 'Sem vencimento';
          }

          return `
                    <tr>
                      <td>${ata.n_ata || ''}</td>
                      <td style="background-color: #eff6ff; font-weight: bold; color: #1e40af; text-align: center;">${ata.processo_adm || 'N/A'}</td>
                      <td>${ata.pregao || ''}</td>
                      <td>${ata.favorecido || ''}</td>
                      <td class="objeto-cell">${ata.objeto || ''}</td>
                      <td class="currency">${formatCurrency(ata.valor || 0)}</td>
                      <td class="${(ata.saldo_disponivel || 0) <= 0 ? 'saldo-zerado' : 'currency'}">${saldoStatus}</td>
                      <td class="${vencimentoClass}" style="text-align: center;">${vencimentoText}</td>
                      <td style="text-align: center;">${pedidosAta.length}</td>
                      <td class="currency">${formatCurrency(totalPedidos)}</td>
                    </tr>
                  `;
        }).join('')}
              </tbody>
            </table>

            ${vencimentoStats.vencidas.count > 0 || vencimentoStats.vencendo30.count > 0 ? `
            <div class="vencimento-stats">
              <h4>📊 ESTATÍSTICAS DE VENCIMENTO</h4>
              ${vencimentoStats.vencidas.count > 0 ? `
              <div class="stat-item vencidas">
                <span><strong>⚠️ ATAs VENCIDAS:</strong></span>
                <span>${vencimentoStats.vencidas.count} ATAs (${formatCurrency(vencimentoStats.vencidas.valor)})</span>
              </div>` : ''}
              ${vencimentoStats.vencendo30.count > 0 ? `
              <div class="stat-item vencendo">
                <span><strong>🔔 Vencendo em 30 dias:</strong></span>
                <span>${vencimentoStats.vencendo30.count} ATAs (${formatCurrency(vencimentoStats.vencendo30.valor)})</span>
              </div>` : ''}
              ${vencimentoStats.vigentes.count > 0 ? `
              <div class="stat-item vigentes">
                <span><strong>✅ ATAs Vigentes:</strong></span>
                <span>${vencimentoStats.vigentes.count} ATAs (${formatCurrency(vencimentoStats.vigentes.valor)})</span>
              </div>` : ''}
              ${vencimentoStats.semVencimento.count > 0 ? `
              <div class="stat-item">
                <span><strong>📅 Sem data de vencimento:</strong></span>
                <span>${vencimentoStats.semVencimento.count} ATAs (${formatCurrency(vencimentoStats.semVencimento.valor)})</span>
              </div>` : ''}
              ${vencimentoStats.vencidas.count > 0 ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #dc2626; font-weight: bold; text-align: center;">
                ⚠️ ATENÇÃO: Existem ${vencimentoStats.vencidas.count} ATA(s) vencida(s) que necessitam de renovação urgente!
              </div>` : ''}
              ${vencimentoStats.vencendo30.count > 0 ? `
              <div style="margin-top: 10px; padding: 10px; background-color: #fef3c7; border: 1px solid #fed7aa; border-radius: 6px; color: #d97706; font-weight: 500; text-align: center;">
                🔔 AVISO: ${vencimentoStats.vencendo30.count} ATA(s) vencendo em breve. Considere iniciar processo de renovação.
              </div>` : ''}
            </div>` : ''}

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

      let errorMessage = "Ocorreu um erro ao gerar o relatório. Tente novamente.";

      if (error instanceof Error) {
        if (error.message.includes('date') || error.message.includes('Date')) {
          errorMessage = "Erro ao processar datas de vencimento. Verifique se as datas estão em formato válido.";
        } else if (error.message.includes('filter')) {
          errorMessage = "Erro ao aplicar filtros. Verifique os filtros selecionados.";
        }
      }

      toast({
        title: "Erro",
        description: errorMessage,
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

          <div>
            <Label htmlFor="vencimento">Filtrar por Vencimento</Label>
            <Select value={selectedVencimento} onValueChange={(value) => {
              console.log('Filtro de vencimento selecionado:', value);
              setSelectedVencimento(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os vencimentos" />
              </SelectTrigger>
              <SelectContent>
                {vencimentoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
