import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, User, Database, Bug } from 'lucide-react';

const DebugATACreation: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testData, setTestData] = useState({
    n_ata: `TEST-${Date.now()}`,
    pregao: 'PE TEST/2025',
    objeto: 'Teste de criação de ATA',
    valor: 1000
  });
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testATACreation = async () => {
    setIsLoading(true);
    setDebugInfo(null);

    try {
      console.log('=== INICIANDO TESTE DE CRIAÇÃO DE ATA ===');
      console.log('Usuário atual:', user);
      
      const debug: any = {
        user: user,
        timestamp: new Date().toISOString(),
        steps: []
      };

      // Passo 1: Verificar autenticação
      debug.steps.push({
        step: 1,
        name: 'Verificação de Autenticação',
        status: user ? 'success' : 'error',
        data: { userId: user?.id, email: user?.email }
      });

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Passo 2: Testar conexão com Supabase
      const { data: testConnection, error: connectionError } = await supabase
        .from('atas')
        .select('count')
        .limit(1);

      debug.steps.push({
        step: 2,
        name: 'Teste de Conexão',
        status: connectionError ? 'error' : 'success',
        data: { error: connectionError, result: testConnection }
      });

      if (connectionError) {
        throw new Error(`Erro de conexão: ${connectionError.message}`);
      }

      // Passo 3: Verificar permissões de INSERT
      const testInsertData = {
        n_ata: testData.n_ata,
        pregao: testData.pregao,
        objeto: testData.objeto,
        processo_adm: 'TESTE',
        processo_emp_afo: 'TESTE',
        favorecido: 'Empresa Teste',
        valor: testData.valor,
        vencimento: null,
        informacoes: 'Teste de criação',
        saldo_disponivel: testData.valor,
        category: 'normal',
        data_validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        data_inicio: new Date().toISOString().split('T')[0],
        is_deleted: false
      };

      console.log('Dados para inserção:', testInsertData);

      const { data: insertResult, error: insertError } = await supabase
        .from('atas')
        .insert(testInsertData)
        .select()
        .single();

      debug.steps.push({
        step: 3,
        name: 'Teste de Inserção',
        status: insertError ? 'error' : 'success',
        data: { 
          error: insertError, 
          result: insertResult,
          insertData: testInsertData
        }
      });

      if (insertError) {
        throw new Error(`Erro na inserção: ${insertError.message}`);
      }

      // Passo 4: Verificar se a ATA foi criada
      const { data: verifyResult, error: verifyError } = await supabase
        .from('atas')
        .select('*')
        .eq('id', insertResult.id)
        .single();

      debug.steps.push({
        step: 4,
        name: 'Verificação da ATA Criada',
        status: verifyError ? 'error' : 'success',
        data: { error: verifyError, result: verifyResult }
      });

      // Passo 5: Limpar dados de teste
      if (insertResult?.id) {
        await supabase
          .from('atas')
          .delete()
          .eq('id', insertResult.id);
        
        debug.steps.push({
          step: 5,
          name: 'Limpeza de Dados de Teste',
          status: 'success',
          data: { deletedId: insertResult.id }
        });
      }

      setDebugInfo(debug);
      
      toast({
        title: "✅ Teste Concluído com Sucesso!",
        description: "A criação de ATAs está funcionando corretamente para este usuário.",
      });

    } catch (error) {
      console.error('Erro no teste:', error);
      
      const errorDebug = {
        user: user,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        steps: debugInfo?.steps || []
      };
      
      setDebugInfo(errorDebug);
      
      toast({
        title: "❌ Erro no Teste",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testUserPermissions = async () => {
    try {
      const { data: userInfo } = await supabase.auth.getUser();
      const { data: session } = await supabase.auth.getSession();
      
      console.log('Informações do usuário:', userInfo);
      console.log('Sessão atual:', session);
      
      toast({
        title: "Informações do Usuário",
        description: `Email: ${userInfo.user?.email} | ID: ${userInfo.user?.id?.slice(0, 8)}...`,
      });
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    }
  };

  return (
    <Card className="mb-6 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <Bug className="h-5 w-5" />
          Debug - Teste de Criação de ATAs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações do usuário */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Usuário Atual</span>
            </div>
            <p className="text-sm text-gray-600">
              Email: {user?.email || 'Não logado'}
            </p>
            <p className="text-sm text-gray-600">
              ID: {user?.id || 'N/A'}
            </p>
          </div>

          {/* Dados de teste */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test_n_ata">Número ATA (Teste)</Label>
              <Input
                id="test_n_ata"
                value={testData.n_ata}
                onChange={(e) => setTestData(prev => ({ ...prev, n_ata: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="test_valor">Valor (Teste)</Label>
              <Input
                id="test_valor"
                type="number"
                value={testData.valor}
                onChange={(e) => setTestData(prev => ({ ...prev, valor: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Botões de teste */}
          <div className="flex gap-3">
            <Button
              onClick={testATACreation}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Testando...' : 'Testar Criação de ATA'}
            </Button>
            
            <Button
              onClick={testUserPermissions}
              variant="outline"
            >
              Verificar Permissões
            </Button>
          </div>

          {/* Resultados do debug */}
          {debugInfo && (
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Resultados do Teste
              </h4>
              
              <div className="space-y-2">
                {debugInfo.steps?.map((step: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {step.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={step.status === 'success' ? 'text-green-700' : 'text-red-700'}>
                      Passo {step.step}: {step.name}
                    </span>
                  </div>
                ))}
              </div>

              {debugInfo.error && (
                <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                  <p className="text-red-800 font-medium">Erro:</p>
                  <p className="text-red-700 text-sm">{debugInfo.error}</p>
                </div>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium">Ver detalhes técnicos</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugATACreation;