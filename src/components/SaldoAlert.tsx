
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, XCircle } from 'lucide-react';

interface SaldoAlertProps {
  message: string;
  show: boolean;
  type?: 'warning' | 'error';
}

const SaldoAlert: React.FC<SaldoAlertProps> = ({ message, show, type = 'error' }) => {
  if (!show) return null;

  const Icon = type === 'error' ? XCircle : AlertTriangle;
  const iconColor = type === 'error' ? 'text-red-500' : 'text-yellow-500';
  const textColor = type === 'error' ? 'text-red-700' : 'text-yellow-700';
  const bgColor = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = type === 'error' ? 'border-red-200' : 'border-yellow-200';

  return (
    <Alert 
      variant="destructive" 
      className={`mt-2 ${bgColor} ${borderColor} border-2 shadow-md`}
    >
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <AlertDescription className={`${textColor} font-semibold text-sm`}>
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default SaldoAlert;
