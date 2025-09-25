import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, UserPlus, Users, Share2, Bell } from 'lucide-react';
import { api } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();

  // Carregar notificações
  const loadNotifications = async () => {
    // Modo offline/demo - não fazer chamadas de API
    if (import.meta.env.DEV) {
      console.log('🔧 Modo demo - usando notificações vazias')
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/api/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setNotifications([]) // Set empty array as fallback
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
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Processar notificações WebSocket
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'notification') {
      const newNotification = lastMessage.data;
      setNotifications(prev => [newNotification, ...prev]);
      
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

  const getIcon = (type) => {
    switch (type) {
      case 'reaction':
        return <Heart size={20} className="text-red-500 fill-current" />;
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={20} className="text-vibe-blue" />;
      case 'share':
        return <Share2 size={20} className="text-green-500" />;
      case 'message':
        return <MessageCircle size={20} className="text-purple-500" />;
      case 'friend_suggestion':
        return <Users size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

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

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="bg-white min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold">Notificações</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 p-3 text-center font-medium ${
            activeTab === 'all'
              ? 'border-b-2 border-vibe-blue text-vibe-blue'
              : 'text-gray-500'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 p-3 text-center font-medium ${
            activeTab === 'new'
              ? 'border-b-2 border-vibe-blue text-vibe-blue'
              : 'text-gray-500'
          }`}
        >
          Não lidas ({unreadCount})
        </button>
      </div>

      {/* Lista de Notificações */}
      <div className="divide-y divide-gray-100">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors cursor-pointer ${
              !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
            }`}
            onClick={() => !notification.isRead && markAsRead(notification.id)}
          >
            {/* Ícone */}
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>

            {/* Avatar */}
            {notification.relatedUser ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const u = notification.relatedUser || {};
                  const publicId = u.publicProfileId || u.public_profile_id;
                  if (publicId) navigate(`/profile/id/${publicId}`);
                  else if (u.id) navigate(`/profile/${u.id}`);
                  else if (u.username) navigate(`/profile/${u.username}`);
                }}
                className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-90"
                aria-label="Ver perfil"
              >
                <span className="text-white font-semibold">
                  {notification.relatedUser.firstName?.charAt(0)}
                </span>
              </button>
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                {getIcon(notification.type)}
              </div>
            )}

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                {notification.title}
              </p>
              
              {notification.message && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                {formatTimeAgo(notification.createdAt)}
              </p>
            </div>

            {/* Indicador de não lida */}
            {!notification.isRead && (
              <div className="w-2 h-2 bg-vibe-blue rounded-full flex-shrink-0"></div>
            )}
          </div>
        ))}
      </div>

      {/* Mensagem quando não há notificações */}
      {filteredNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Bell size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            {activeTab === 'new' ? 'Nenhuma notificação nova' : 'Nenhuma notificação'}
          </h3>
          <p className="text-gray-500 text-center">
            {activeTab === 'new' 
              ? 'Quando alguém interagir com você, aparecerá aqui.'
              : 'Você ainda não tem notificações.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
