
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ATA } from '@/hooks/useAtas';

interface ExpirationAlertsProps {
  atas: ATA[];
}

const ExpirationAlerts: React.FC<ExpirationAlertsProps> = ({ atas }) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const expiringAtas = atas.filter(ata => {
    if (!ata.vencimento) return false;
    const vencimento = new Date(ata.vencimento);
    return vencimento <= thirtyDaysFromNow && vencimento >= today;
  });

  const expiredAtas = atas.filter(ata => {
    if (!ata.vencimento) return false;
    const vencimento = new Date(ata.vencimento);
    return vencimento < today;
  });

  if (expiringAtas.length === 0 && expiredAtas.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {expiredAtas.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>ATAs Vencidas:</strong> {expiredAtas.length} contrato(s) vencido(s) - 
            {expiredAtas.map(ata => ` ${ata.n_ata}`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {expiringAtas.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Alerta de Vencimento:</strong> {expiringAtas.length} contrato(s) vencendo em 30 dias - 
            {expiringAtas.map(ata => ` ${ata.n_ata}`).join(', ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExpirationAlerts;
