import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Trash2, Heart, MessageCircle, Share2, UserPlus } from 'lucide-react';
import { api } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';

const NotificationsList = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();

  // Carregar notificações
  const loadNotifications = async () => {
    try {
      const response = await api.get('/api/notifications/');
      setNotifications(response.data);
      
      const unread = response.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Excluir notificação
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== notificationId);
        const newUnreadCount = filtered.filter(n => !n.isRead).length;
        setUnreadCount(newUnreadCount);
        return filtered;
      });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  // Obter ícone da notificação
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reaction':
        return <Heart className="text-red-500" size={16} />;
      case 'comment':
        return <MessageCircle className="text-blue-500" size={16} />;
      case 'share':
        return <Share2 className="text-green-500" size={16} />;
      case 'message':
        return <MessageCircle className="text-purple-500" size={16} />;
      case 'follow':
        return <UserPlus className="text-indigo-500" size={16} />;
      default:
        return <Bell className="text-gray-500" size={16} />;
    }
  };

  // Processar notificações WebSocket
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'notification') {
      const newNotification = lastMessage.data;
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Mostrar notificação do browser se permitido
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico'
        });
      }
    }
  }, [lastMessage]);

  // Carregar notificações ao montar
  useEffect(() => {
    loadNotifications();
    
    // Solicitar permissão para notificações
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Formatação de tempo relativo
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell size={20} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Marcar todas como lidas
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Lista de Notificações */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                  }`}
                  onClick={async () => {
                    try { await markAsRead(notification.id); } catch(e){}

                    const action = notification.actionUrl || notification.action_url || notification.action;
                    if (action) {
                      if (typeof action === 'string' && action.startsWith('http')) {
                        window.location.href = action;
                        return;
                      }
                      try { navigate(action); return; } catch(e) {}
                    }

                    const publicId = notification.relatedPostPublicId || notification.related_post_public_id || (notification.relatedPost && notification.relatedPost.publicId);
                    const relatedPostId = notification.relatedPostId || notification.related_post || notification.related_post_id;
                    if (publicId) {
                      navigate(`/posts/id/${publicId}`);
                      return;
                    }
                    if (relatedPostId) {
                      // try to navigate to post by id route if available
                      navigate(`/posts/id/${relatedPostId}`);
                      return;
                    }

                    if (notification.type === 'message' && notification.relatedUser) {
                      const u = notification.relatedUser;
                      const qp = `?user=${encodeURIComponent(u.username||'')}&userId=${u.id||''}`;
                      navigate(`/messages${qp}`);
                      return;
                    }

                    if (notification.relatedUser) {
                      const u = notification.relatedUser || {};
                      const pub = u.publicProfileId || u.public_profile_id;
                      if (pub) navigate(`/profile/id/${pub}`);
                      else if (u.id) navigate(`/profile/${u.id}`);
                      else if (u.username) navigate(`/profile/${u.username}`);
                    }
                  } }
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar ou ícone */}
                    <div className="flex-shrink-0">
                      {notification.relatedUser ? (
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {notification.relatedUser.firstName?.charAt(0)}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                            {notification.title}
                          </p>
                          
                          {notification.message && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                              title="Marcar como lida"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
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
      </div>
    </div>
  );
};

export default NotificationsList;
