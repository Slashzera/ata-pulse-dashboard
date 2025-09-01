
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Calendar } from 'lucide-react';
import { ATA } from '@/hooks/useAtas';
import { Pedido } from '@/hooks/usePedidos';

interface BackupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  atas: ATA[];
  pedidos: Pedido[];
}

const BackupDialog: React.FC<BackupDialogProps> = ({
  isOpen,
  onClose,
  atas,
  pedidos
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generateBackupPDF = () => {
    const filteredAtas = atas.filter(ata => {
      if (!startDate && !endDate) return true;
      const ataDate = new Date(ata.created_at);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      return ataDate >= start && ataDate <= end;
    });

    const filteredPedidos = pedidos.filter(pedido => {
      if (!startDate && !endDate) return true;
      const pedidoDate = new Date(pedido.created_at);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      return pedidoDate >= start && pedidoDate <= end;
    });

    const totalSaldoDisponivel = filteredAtas.reduce((total, ata) => total + (ata.saldo_disponivel || 0), 0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Backup do Sistema - ${new Date().toLocaleDateString('pt-BR')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; text-align: center; margin-bottom: 30px; }
            h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .currency { text-align: right; }
            .status { padding: 4px 8px; border-radius: 4px; color: white; }
            .status.pendente { background-color: #f59e0b; }
            .status.aprovado { background-color: #10b981; }
            .status.rejeitado { background-color: #ef4444; }
            .status.finalizado { background-color: #10b981; }
            .summary { background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 50px; text-align: center; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Backup Completo do Sistema</h1>
          <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          ${startDate || endDate ? `<p><strong>Período:</strong> ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Atual'}</p>` : ''}
          
          <div class="summary">
            <h3>Resumo</h3>
            <p><strong>Total de ATAs:</strong> ${filteredAtas.length}</p>
            <p><strong>Total de Pedidos:</strong> ${filteredPedidos.length}</p>
            <p><strong>Saldo Total Disponível:</strong> ${formatCurrency(totalSaldoDisponivel)}</p>
          </div>

          <h2>ATAs de Registro de Preços</h2>
          <table>
            <thead>
              <tr>
                <th>Nº ATA</th>
                <th>Pregão</th>
                <th>Objeto</th>
                <th>Favorecido</th>
                <th>Valor</th>
                <th>Saldo Disponível</th>
                <th>Vencimento</th>
                <th>Data Criação</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAtas.map(ata => `
                <tr>
                  <td>${ata.n_ata}</td>
                  <td>${ata.pregao}</td>
                  <td>${ata.objeto}</td>
                  <td>${ata.favorecido || ''}</td>
                  <td class="currency">${formatCurrency(ata.valor || 0)}</td>
                  <td class="currency">${formatCurrency(ata.saldo_disponivel || 0)}</td>
                  <td>${formatDate(ata.vencimento)}</td>
                  <td>${formatDate(ata.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Pedidos</h2>
          <table>
            <thead>
              <tr>
                <th>Departamento</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data Criação</th>
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
                  <td>${formatDate(pedido.created_at)}</td>
                  <td>${pedido.observacoes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Backup Completo</p>
            <p>Total de Saldo Disponível: <strong>${formatCurrency(totalSaldoDisponivel)}</strong></p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Backup do Sistema
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="start-date">Data Inicial (opcional)</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="end-date">Data Final (opcional)</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={generateBackupPDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackupDialog;
