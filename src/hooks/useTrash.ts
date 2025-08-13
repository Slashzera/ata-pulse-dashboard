import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTrash = () => {
  const [loading, setLoading] = useState(false);

  const moveToTrash = async (tableName: string, recordId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('move_to_trash', {
        p_table_name: tableName,
        p_record_id: recordId
      });

      if (error) throw error;

      if (data) {
        toast.success('Item movido para a lixeira');
        return true;
      } else {
        toast.error('Não foi possível mover o item para a lixeira');
        return false;
      }
    } catch (error) {
      console.error('Erro ao mover para lixeira:', error);
      toast.error('Erro ao mover item para a lixeira');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const restoreFromTrash = async (tableName: string, recordId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('restore_from_trash', {
        p_table_name: tableName,
        p_record_id: recordId
      });

      if (error) throw error;

      if (data) {
        toast.success('Item restaurado com sucesso');
        return true;
      } else {
        toast.error('Não foi possível restaurar o item');
        return false;
      }
    } catch (error) {
      console.error('Erro ao restaurar da lixeira:', error);
      toast.error('Erro ao restaurar item');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const permanentlyDelete = async (tableName: string, recordId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('permanently_delete', {
        p_table_name: tableName,
        p_record_id: recordId
      });

      if (error) throw error;

      if (data) {
        toast.success('Item excluído permanentemente');
        return true;
      } else {
        toast.error('Não foi possível excluir o item permanentemente');
        return false;
      }
    } catch (error) {
      console.error('Erro ao excluir permanentemente:', error);
      toast.error('Erro ao excluir item permanentemente');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete,
    loading
  };
};