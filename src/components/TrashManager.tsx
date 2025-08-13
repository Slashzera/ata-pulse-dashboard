import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2, RotateCcw, AlertTriangle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrashItem {
  table_name: string;
  id: string;
  title: string;
  description: string;
  deleted_at: string;
  deleted_by: string;
  created_at: string;
}

const TrashManager: React.FC = () => {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTrashItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trash_items')
        .select('*')
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setTrashItems(data || []);
    } catch (error) {
      console.error('Erro ao carregar lixeira:', error);
      toast.error('Erro ao carregar itens da lixeira');
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (tableName: string, itemId: string) => {
    try {
      setActionLoading(itemId);
      const { data, error } = await supabase.rpc('restore_from_trash', {
        p_table_name: tableName,
        p_record_id: itemId
      });

      if (error) throw error;

      if (data) {
        toast.success('Item restaurado com sucesso!');
        loadTrashItems();
      } else {
        toast.error('Não foi possível restaurar o item');
      }
    } catch (error) {
      console.error('Erro ao restaurar item:', error);
      toast.error('Erro ao restaurar item');
    } finally {
      setActionLoading(null);
    }
  };

  const permanentlyDelete = async (tableName: string, itemId: string) => {
    try {
      setActionLoading(itemId);
      const { data, error } = await supabase.rpc('permanently_delete', {
        p_table_name: tableName,
        p_record_id: itemId
      });

      if (error) throw error;

      if (data) {
        toast.success('Item excluído permanentemente');
        loadTrashItems();
      } else {
        toast.error('Não foi possível excluir o item');
      }
    } catch (error) {
      console.error('Erro ao excluir permanentemente:', error);
      toast.error('Erro ao excluir item permanentemente');
    } finally {
      setActionLoading(null);
    }
  };

  const cleanupTrash = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('cleanup_trash');

      if (error) throw error;

      toast.success(`${data || 0} itens antigos foram removidos automaticamente`);
      loadTrashItems();
    } catch (error) {
      console.error('Erro na limpeza automática:', error);
      toast.error('Erro na limpeza automática da lixeira');
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const names = {
      'atas': 'ATA/Contrato',
      'pedidos': 'Pedido',
      'tac': 'TAC'
    };
    return names[tableName as keyof typeof names] || tableName;
  };

  const getTableColor = (tableName: string) => {
    const colors = {
      'atas': 'bg-blue-100 text-blue-800',
      'pedidos': 'bg-green-100 text-green-800',
      'tac': 'bg-purple-100 text-purple-800'
    };
    return colors[tableName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadTrashItems();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lixeira</h2>
          <p className="text-muted-foreground">
            Gerencie itens excluídos - restaure ou exclua permanentemente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadTrashItems}
            disabled={loading}
          >
            Atualizar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Limpeza Automática
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpeza Automática da Lixeira</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá excluir permanentemente todos os itens na lixeira que foram deletados há mais de 30 dias. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={cleanupTrash}>
                  Executar Limpeza
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {trashItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lixeira vazia</h3>
            <p className="text-muted-foreground text-center">
              Não há itens na lixeira no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trashItems.map((item) => (
            <Card key={`${item.table_name}-${item.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getTableColor(item.table_name)}>
                      {getTableDisplayName(item.table_name)}
                    </Badge>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreItem(item.table_name, item.id)}
                      disabled={actionLoading === item.id}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading === item.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Permanentemente
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Permanentemente</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir permanentemente este item? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => permanentlyDelete(item.table_name, item.id)}
                          >
                            Excluir Permanentemente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  {item.description}
                </CardDescription>
                <Separator className="my-3" />
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Excluído em: {format(new Date(item.deleted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Criado em: {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashManager;