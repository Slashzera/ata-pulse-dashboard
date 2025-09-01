
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download } from 'lucide-react';
import { ATA } from '@/hooks/useAtas';
import { Pedido } from '@/hooks/usePedidos';

interface ExportToPDFProps {
  atas: ATA[];
  pedidos: Pedido[];
}

const ExportToPDF: React.FC<ExportToPDFProps> = ({ atas, pedidos }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    favorecido: 'all',
    startDate: '',
    endDate: '',
    includeAtas: true,
    includePedidos: true,
    status: 'all'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'normal': return 'Nova ATA';
      case 'adesao': return 'Nova Adesão';
      case 'aquisicao': return 'Aquisição Global';
      case 'antigo': return 'Saldo de ATAs (Contratos Antigos)';
      default: return 'Todas as Categorias';
    }
  };

  const formatSaldo = (saldo: number) => {
    if (saldo <= 0) {
      return 'SALDO ZERADO';
    }
    return formatCurrency(saldo);
  };

  const getUniqueFavorecidos = () => {
    return atas
      .map(ata => ata.favorecido)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
  };

  const getAtasCountByFavorecido = (favorecido: string) => {
    return atas.filter(ata => ata.favorecido === favorecido).length;
  };

  const applyFilters = () => {
    let filteredAtas = atas;
    let filteredPedidos = pedidos;

    // Filtrar por categoria
    if (filters.category !== 'all') {
      filteredAtas = atas.filter(ata => ata.category === filters.category);
      filteredPedidos = pedidos.filter(pedido => 
        filteredAtas.some(ata => ata.id === pedido.ata_id)
      );
    }

    // Filtrar por favorecido
    if (filters.favorecido !== 'all') {
      filteredAtas = filteredAtas.filter(ata => ata.favorecido === filters.favorecido);
      filteredPedidos = filteredPedidos.filter(pedido => 
        filteredAtas.some(ata => ata.id === pedido.ata_id)
      );
    }

    // Filtrar por data
    if (filters.startDate || filters.endDate) {
      const startDate = filters.startDate ? new Date(filters.startDate) : new Date('1900-01-01');
      const endDate = filters.endDate ? new Date(filters.endDate) : new Date('2100-12-31');
      
      filteredAtas = filteredAtas.filter(ata => {
        const ataDate = new Date(ata.created_at);
        return ataDate >= startDate && ataDate <= endDate;
      });

      filteredPedidos = filteredPedidos.filter(pedido => {
        const pedidoDate = new Date(pedido.created_at);
        return pedidoDate >= startDate && pedidoDate <= endDate;
      });
    }

    // Filtrar por status (apenas pedidos)
    if (filters.status !== 'all') {
      filteredPedidos = filteredPedidos.filter(pedido => pedido.status === filters.status);
    }

    return { filteredAtas, filteredPedidos };
  };

  const exportToPDF = () => {
    const { filteredAtas, filteredPedidos } = applyFilters();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalSaldoDisponivel = filteredAtas.reduce((total, ata) => total + (ata.saldo_disponivel || 0), 0);
    const categoryName = getCategoryDisplayName(filters.category);
    const favorecidoName = filters.favorecido !== 'all' ? ` - ${filters.favorecido}` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Contratos - ${categoryName}${favorecidoName}</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; font-size: 11px; }
            h1 { color: #1f2937; text-align: center; margin-bottom: 20px; font-size: 18px; }
            h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; font-size: 16px; margin-bottom: 15px; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
              font-size: 10px;
              table-layout: fixed;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 4px; 
              text-align: left; 
              vertical-align: top;
              word-wrap: break-word;
            }
            th { 
              background-color: #f3f4f6; 
              font-weight: bold; 
              font-size: 9px;
              text-align: center;
            }
            .currency { text-align: right; }
            .currency { text-align: right; }
            .saldo-zerado { text-align: right; font-weight: bold; color: #dc2626; background-color: #fef2f2; }
            .status { padding: 4px 8px; border-radius: 4px; color: white; }
            .status.pendente { background-color: #f59e0b; }
            .status.aprovado { background-color: #10b981; }
            .status.rejeitado { background-color: #ef4444; }
            .status.finalizado { background-color: #10b981; }
            .total-summary { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .filter-info { background-color: #f9fafb; padding: 10px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Relatório de Contratos - ${categoryName}${favorecidoName}</h1>
          <p><strong>Data de Geração:</strong> ${getCurrentDateTime()}</p>
          
          <div class="filter-info">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Categoria:</strong> ${categoryName}</p>
            ${filters.favorecido !== 'all' ? `<p><strong>Favorecido:</strong> ${filters.favorecido}</p>` : ''}
            ${filters.startDate ? `<p><strong>Data Inicial:</strong> ${formatDate(filters.startDate)}</p>` : ''}
            ${filters.endDate ? `<p><strong>Data Final:</strong> ${formatDate(filters.endDate)}</p>` : ''}
            ${filters.status !== 'all' ? `<p><strong>Status:</strong> ${filters.status.toUpperCase()}</p>` : ''}
            <p><strong>Incluir ATAs:</strong> ${filters.includeAtas ? 'Sim' : 'Não'}</p>
            <p><strong>Incluir Pedidos:</strong> ${filters.includePedidos ? 'Sim' : 'Não'}</p>
          </div>

          ${filters.includeAtas ? `
            <h2>ATAs de Registro de Preços</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 10%; background-color: #f3f4f6; border: 1px solid #000;">Nº ATA</th>
                  <th style="width: 15%; background-color: #f3f4f6; border: 1px solid #000; font-weight: bold;">PROCESSO ADM</th>
                  <th style="width: 10%; background-color: #f3f4f6; border: 1px solid #000;">Pregão</th>
                  <th style="width: 20%; background-color: #f3f4f6; border: 1px solid #000;">Objeto</th>
                  <th style="width: 15%; background-color: #f3f4f6; border: 1px solid #000;">Favorecido</th>
                  <th style="width: 10%; background-color: #f3f4f6; border: 1px solid #000;">Valor</th>
                  <th style="width: 10%; background-color: #f3f4f6; border: 1px solid #000;">Saldo</th>
                  <th style="width: 10%; background-color: #f3f4f6; border: 1px solid #000;">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAtas.map(ata => {
                  console.log('ATA Debug - Processo ADM:', ata.processo_adm);
                  return `
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px;">${ata.n_ata || 'N/A'}</td>
                    <td style="border: 1px solid #000; padding: 4px; background-color: #eff6ff; font-weight: bold; color: #1e40af; text-align: center;">${ata.processo_adm || 'SEM PROCESSO'}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${ata.pregao || 'N/A'}</td>
                    <td style="border: 1px solid #000; padding: 4px; font-size: 8px;">${ata.objeto || 'N/A'}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${ata.favorecido || 'N/A'}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: right;">${formatCurrency(ata.valor || 0)}</td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: right; ${(ata.saldo_disponivel || 0) <= 0 ? 'font-weight: bold; color: #dc2626; background-color: #fef2f2;' : ''}">${formatSaldo(ata.saldo_disponivel || 0)}</td>
                    <td style="border: 1px solid #000; padding: 4px;">${formatDate(ata.vencimento)}</td>
                  </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="total-summary">
              <h3>Total de Saldo Disponível: ${totalSaldoDisponivel <= 0 ? 'SALDO ZERADO' : formatCurrency(totalSaldoDisponivel)}</h3>
              <p>Total de ATAs: ${filteredAtas.length}</p>
            </div>
          ` : ''}

          ${filters.includePedidos ? `
            <h2>Pedidos</h2>
            <table>
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPedidos.map(pedido => `
                  <tr>
                    <td>${pedido.departamento}</td>
                    <td>${pedido.descricao}</td>
                    <td class="currency">${formatCurrency(pedido.valor)}</td>
                    <td><span class="status ${pedido.status}">${pedido.status.toUpperCase()}</span></td>
                    <td>${formatDateTime(pedido.created_at)}</td>
                    <td>${pedido.observacoes || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-summary">
              <p>Total de Pedidos: ${filteredPedidos.length}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>Secretaria Municipal de Saúde de Duque de Caxias</p>
            ${filters.includeAtas ? `<p><strong>Total de Saldo Disponível: ${totalSaldoDisponivel <= 0 ? 'SALDO ZERADO' : formatCurrency(totalSaldoDisponivel)}</strong></p>` : ''}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        variant="outline" 
        size="sm"
        className="text-white border-white/30 hover:bg-white/20 bg-blue-700/50 backdrop-blur-sm font-medium shadow-md"
      >
        <Download className="h-4 w-4 mr-2" />
        Exportar PDF
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-600" />
              Exportar PDF com Filtros
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              💡 <strong>Dica:</strong> Selecione uma empresa específica para gerar relatório apenas das ATAs dela (ex: todas as 6 ATAs da Especifarma)
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="normal">Nova ATA</SelectItem>
                    <SelectItem value="adesao">Nova Adesão</SelectItem>
                    <SelectItem value="aquisicao">Aquisição Global</SelectItem>
                    <SelectItem value="antigo">Saldo de ATAs (Contratos Antigos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="favorecido" className="text-sm font-semibold">
                  Favorecido/Empresa 
                  <span className="text-blue-600 ml-1">📊 Filtrar por empresa específica</span>
                </Label>
                <Select value={filters.favorecido} onValueChange={(value) => setFilters({...filters, favorecido: value})}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Selecione uma empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-medium">
                      📋 Todos os Favorecidos ({getUniqueFavorecidos().length} empresas)
                    </SelectItem>
                    {getUniqueFavorecidos().map((favorecido) => {
                      const atasCount = getAtasCountByFavorecido(favorecido);
                      return (
                        <SelectItem key={favorecido} value={favorecido} className="py-2">
                          <span className="flex items-center justify-between w-full">
                            <span>{favorecido}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                              {atasCount} ATA{atasCount !== 1 ? 's' : ''}
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status dos Pedidos</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="end-date">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-atas" 
                  checked={filters.includeAtas}
                  onCheckedChange={(checked) => setFilters({...filters, includeAtas: !!checked})}
                />
                <Label htmlFor="include-atas">Incluir ATAs no relatório</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-pedidos" 
                  checked={filters.includePedidos}
                  onCheckedChange={(checked) => setFilters({...filters, includePedidos: !!checked})}
                />
                <Label htmlFor="include-pedidos">Incluir Pedidos no relatório</Label>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={exportToPDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportToPDF;
