import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getRelativeTime,
    getNotificationIcon
  } = useNotifications();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notificações"
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge com contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificações
              {unreadCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">
                  ({unreadCount} não lidas)
                </span>
              )}
            </h3>
            
            <div className="flex items-center space-x-2">
              {/* Marcar todas como lidas */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              
              {/* Fechar */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando...</span>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-600">
                <p>Erro ao carregar notificações</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">Nenhuma notificação</p>
                <p className="text-sm">Você está em dia! 🎉</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                    className={`
                      p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 group
                      ${!notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Ícone */}
                      <div className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                        ${!notification.is_read 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`
                              text-sm font-medium
                              ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}
                            `}>
                              {notification.title}
                            </p>
                            <p className={`
                              text-sm mt-1 line-clamp-2
                              ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}
                            `}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {getRelativeTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Marcar como lida"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Deletar notificação"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};