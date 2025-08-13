import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, UserCheck, Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PendingApproval: React.FC = () => {
  const { signOut } = useAuth();

  const getCurrentDateTime = () => {
    return new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBackToLogin = () => {
    window.location.href = '/auth';
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 123, 191, 0.7), rgba(0, 123, 191, 0.7)), url('/lovable-uploads/1a5507c1-31ce-49b2-b5b1-3a1e8960d42a.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="flex flex-col items-center w-full max-w-lg">
        <Card className="w-full bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Clock className="h-16 w-16 text-orange-500 animate-pulse" />
                <UserCheck className="h-8 w-8 text-blue-600 absolute -bottom-1 -right-1 bg-white rounded-full p-1" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              Aguardando Aprovação
            </CardTitle>
            <p className="text-sm text-gray-600">
              {getCurrentDateTime()}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-800 mb-1">
                    Solicitação Pendente
                  </h3>
                  <p className="text-sm text-orange-700">
                    Sua solicitação de acesso foi enviada com sucesso e está aguardando 
                    aprovação do administrador do sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <UserCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">
                    Processo de Aprovação
                  </h3>
                  <p className="text-sm text-blue-700 mb-2">
                    O administrador Felipe Rodrigues irá revisar sua solicitação e você será 
                    notificado quando o acesso for aprovado.
                  </p>
                  <ul className="text-xs text-blue-600 space-y-1">
                    <li>• Tempo médio de aprovação: 1-2 dias úteis</li>
                    <li>• Você receberá uma notificação por email</li>
                    <li>• Após aprovação, poderá fazer login normalmente</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Contato para Dúvidas
                  </h3>
                  <p className="text-sm text-gray-700">
                    Em caso de urgência, entre em contato com o administrador através do email:
                  </p>
                  <p className="text-sm font-mono text-blue-600 mt-1">
                    drfeliperodrigues@outlook.com
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
              
              <Button 
                onClick={handleBackToLogin} 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <div className="mt-8 text-center">
          <div className="text-white text-xs bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 max-w-sm">
            <p className="font-medium">Sistema de Gestão e Contratos</p>
            <p>Secretaria Municipal de Saúde de Duque de Caxias</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval; 