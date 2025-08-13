
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, User, Database, Edit, Trash2, Plus } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';

interface AuditLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  isOpen,
  onClose
}) => {
  const { data: logs, isLoading } = useAuditLogs();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Plus className="h-4 w-4" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'APPROVE_USER':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
      case 'REJECT_USER':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const exportLogs = () => {
    if (!logs) return;
    
    const csvContent = [
      'Data/Hora,Usuário,Ação,Tabela,Registro ID,Justificativa,IP,User Agent',
      ...logs.map(log => 
        `"${formatDate(log.created_at)}","${log.user_email || 'N/A'}","${log.action}","${log.table_name}","${log.record_id || 'N/A'}","${log.justification || ''}","${log.ip_address || 'N/A'}","${log.user_agent || 'N/A'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs de Auditoria do Sistema
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {logs ? `${logs.length} registros encontrados` : 'Carregando...'}
            </p>
            <Button onClick={exportLogs} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>

          {isLoading ? (
            <p className="text-center py-8">Carregando logs de auditoria...</p>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{log.user_email || 'Sistema'}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Tabela:</strong> 
                        <span className="ml-1 px-2 py-1 bg-gray-100 rounded text-xs">
                          {log.table_name}
                        </span>
                      </div>
                      
                      {log.record_id && (
                        <div>
                          <strong>Registro ID:</strong> 
                          <span className="ml-1 font-mono text-xs">
                            {log.record_id.substring(0, 8)}...
                          </span>
                        </div>
                      )}

                      {log.justification && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <strong>Justificativa:</strong> 
                          <p className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            {log.justification}
                          </p>
                        </div>
                      )}

                      {(log.old_data || log.new_data) && (
                        <div className="md:col-span-2 lg:col-span-3">
                          <strong>Dados alterados:</strong>
                          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {log.old_data && (
                              <div>
                                <span className="text-xs text-red-600 font-medium">Dados anteriores:</span>
                                <pre className="text-xs bg-red-50 p-2 rounded border border-red-200 overflow-x-auto">
                                  {JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_data && (
                              <div>
                                <span className="text-xs text-green-600 font-medium">Dados novos:</span>
                                <pre className="text-xs bg-green-50 p-2 rounded border border-green-200 overflow-x-auto">
                                  {JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">Nenhum log de auditoria encontrado.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogViewer;
