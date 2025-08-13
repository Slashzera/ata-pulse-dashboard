import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, Copy, Trash2, Database, AlertTriangle } from 'lucide-react';

const SQLEditor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predefinedQueries = [
    {
      name: 'Listar itens na lixeira',
      query: 'SELECT * FROM trash_items ORDER BY deleted_at DESC;',
      description: 'Visualiza todos os itens atualmente na lixeira'
    },
    {
      name: 'Log de auditoria da lixeira',
      query: 'SELECT * FROM trash_log ORDER BY created_at DESC LIMIT 20;',
      description: 'Mostra as últimas 20 operações de lixeira'
    },
    {
      name: 'Verificar estrutura das tabelas',
      query: `-- Verificar se as colunas de lixeira foram adicionadas
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('atas', 'pedidos', 'tac') 
  AND column_name IN ('deleted_at', 'deleted_by', 'is_deleted')
ORDER BY table_name, column_name;`,
      description: 'Verifica se as colunas de lixeira foram criadas corretamente'
    },
    {
      name: 'Estatísticas por tabela',
      query: `-- Contar itens ativos vs deletados
SELECT 
  'atas' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN is_deleted = true THEN 1 END) as na_lixeira,
  COUNT(CASE WHEN is_deleted = false OR is_deleted IS NULL THEN 1 END) as ativos
FROM atas
UNION ALL
SELECT 
  'pedidos' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN is_deleted = true THEN 1 END) as na_lixeira,
  COUNT(CASE WHEN is_deleted = false OR is_deleted IS NULL THEN 1 END) as ativos
FROM pedidos;`,
      description: 'Estatísticas de itens ativos vs deletados por tabela'
    },
    {
      name: 'Funções disponíveis',
      query: `-- Verificar se as funções foram criadas
SELECT 
  routine_name as funcao,
  routine_type as tipo
FROM information_schema.routines 
WHERE routine_name IN (
  'move_to_trash', 
  'restore_from_trash', 
  'permanently_delete', 
  'cleanup_trash'
)
ORDER BY routine_name;`,
      description: 'Lista as funções de lixeira disponíveis'
    },
    {
      name: 'Exemplo de uso das funções',
      query: `-- ATENÇÃO: Substitua 'uuid-do-item' por um UUID real antes de executar!

-- Para mover um item para a lixeira:
-- SELECT move_to_trash('atas', 'uuid-do-item');

-- Para restaurar um item da lixeira:
-- SELECT restore_from_trash('atas', 'uuid-do-item');

-- Para excluir permanentemente:
-- SELECT permanently_delete('atas', 'uuid-do-item');

-- Para limpeza automática (itens > 30 dias):
-- SELECT cleanup_trash();

SELECT 'Descomente e edite uma das linhas acima para testar' as instrucoes;`,
      description: 'Exemplos práticos de uso das funções de lixeira'
    }
  ];

  const executeQuery = async () => {
    if (!query.trim()) {
      toast.error('Digite uma consulta SQL');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      // Detectar tipo de consulta e executar via Supabase client
      const lowerQuery = query.toLowerCase().trim();
      
      if (lowerQuery.includes('select * from trash_items')) {
        const { data, error } = await supabase.from('trash_items').select('*').order('deleted_at', { ascending: false });
        if (error) throw error;
        setResults(data);
        toast.success(`${data?.length || 0} registros encontrados`);
        
      } else if (lowerQuery.includes('select * from trash_log')) {
        const { data, error } = await supabase.from('trash_log').select('*').order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        setResults(data);
        toast.success(`${data?.length || 0} registros encontrados`);
        
      } else if (lowerQuery.includes('move_to_trash')) {
        // Extrair parâmetros da consulta (exemplo básico)
        const match = lowerQuery.match(/move_to_trash\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/);
        if (match) {
          const [, tableName, recordId] = match;
          const { data, error } = await supabase.rpc('move_to_trash', {
            p_table_name: tableName,
            p_record_id: recordId
          });
          if (error) throw error;
          setResults({ success: data, message: `Item ${data ? 'movido para' : 'não pôde ser movido para'} a lixeira` });
          toast.success(data ? 'Item movido para a lixeira' : 'Falha ao mover item');
        } else {
          throw new Error('Formato inválido. Use: SELECT move_to_trash(\'tabela\', \'uuid\');');
        }
        
      } else if (lowerQuery.includes('restore_from_trash')) {
        const match = lowerQuery.match(/restore_from_trash\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/);
        if (match) {
          const [, tableName, recordId] = match;
          const { data, error } = await supabase.rpc('restore_from_trash', {
            p_table_name: tableName,
            p_record_id: recordId
          });
          if (error) throw error;
          setResults({ success: data, message: `Item ${data ? 'restaurado' : 'não pôde ser restaurado'}` });
          toast.success(data ? 'Item restaurado com sucesso' : 'Falha ao restaurar item');
        } else {
          throw new Error('Formato inválido. Use: SELECT restore_from_trash(\'tabela\', \'uuid\');');
        }
        
      } else if (lowerQuery.includes('cleanup_trash')) {
        const { data, error } = await supabase.rpc('cleanup_trash');
        if (error) throw error;
        setResults({ deleted_count: data, message: `${data} itens foram removidos da lixeira` });
        toast.success(`Limpeza concluída: ${data} itens removidos`);
        
      } else {
        // Para outras consultas, mostrar instruções
        setResults({
          message: 'Esta consulta deve ser executada diretamente no SQL Editor do Supabase Dashboard.',
          instructions: [
            '1. Acesse o Supabase Dashboard',
            '2. Vá para SQL Editor',
            '3. Cole a consulta e execute',
            '4. Use este editor apenas para consultas suportadas:'
          ],
          supported_queries: [
            'SELECT * FROM trash_items',
            'SELECT * FROM trash_log',
            'SELECT move_to_trash(\'tabela\', \'uuid\')',
            'SELECT restore_from_trash(\'tabela\', \'uuid\')',
            'SELECT cleanup_trash()'
          ]
        });
        toast.info('Consulta deve ser executada no Supabase Dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
      toast.error('Erro ao executar consulta');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const clearEditor = () => {
    setQuery('');
    setResults(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SQL Editor</h2>
          <p className="text-muted-foreground">
            Execute consultas SQL diretamente no banco de dados
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Supabase
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultas Predefinidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Consultas Predefinidas</CardTitle>
            <CardDescription>
              Clique em uma consulta para carregá-la no editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predefinedQueries.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setQuery(item.query)}
                >
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor SQL */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Editor SQL</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(query)}
                  disabled={!query.trim()}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearEditor}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={executeQuery}
                  disabled={loading || !query.trim()}
                  size="sm"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Executando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Executar
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite sua consulta SQL aqui..."
              className="min-h-[200px] font-mono text-sm"
            />
            
            {error && (
              <>
                <Separator className="my-4" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Erro na consulta</span>
                  </div>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap">
                    {error}
                  </pre>
                </div>
              </>
            )}

            {results && (
              <>
                <Separator className="my-4" />
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Resultados</span>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-sm text-green-700 whitespace-pre-wrap">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aviso de Segurança */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 mb-1">
                Aviso de Segurança
              </p>
              <p className="text-sm text-yellow-700">
                Este editor executa consultas diretamente no banco de dados. Use com cuidado e sempre faça backup antes de executar comandos que modificam dados. 
                Comandos DELETE, UPDATE e DROP podem causar perda permanente de dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SQLEditor;