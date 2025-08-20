import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  user_id: string;
  data?: Record<string, any>;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Calcular notificações não lidas
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Buscar notificações
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true }
            : n
        )
      );
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) throw updateError;

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
    }
  }, [user]);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (deleteError) throw deleteError;

      // Remover do estado local
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
    }
  }, []);

  // Obter tempo relativo
  const getRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Agora mesmo';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min atrás`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h atrás`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  }, []);

  // Obter ícone da notificação (retorna string emoji)
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'card_created':
        return '📝';
      case 'card_updated':
        return '✏️';
      case 'card_moved':
        return '🔄';
      case 'board_created':
        return '📋';
      case 'board_deleted':
        return '🗑️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'reminder':
        return '⏰';
      case 'system':
        return '⚙️';
      default:
        return '🔔';
    }
  }, []);

  // Criar nova notificação
  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: string = 'info',
    data?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      const { data: result, error: insertError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          type,
          user_id: user.id,
          data,
          is_read: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Adicionar ao estado local
      setNotifications(prev => [result, ...prev]);

      return result;
    } catch (err) {
      console.error('Erro ao criar notificação:', err);
      throw err;
    }
  }, [user]);

  // Configurar subscription para notificações em tempo real
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => 
              n.id === updatedNotification.id 
                ? updatedNotification 
                : n
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const deletedNotification = payload.old as Notification;
          setNotifications(prev => 
            prev.filter(n => n.id !== deletedNotification.id)
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Buscar notificações quando o usuário mudar
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getRelativeTime,
    getNotificationIcon,
    createNotification,
    refetch: fetchNotifications
  };
};