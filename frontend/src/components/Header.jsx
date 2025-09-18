import React, { useState, useEffect } from 'react'
import { Search, MessageCircle, Bell, Plus, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { VibeArc } from './VibeLogoSimple'
import AvatarDropdown from './AvatarDropdown'
import { api } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'

const Header = ({ onOpenPostModal }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0
  })
  const { lastMessage } = useWebSocket()

  const handleEditPhoto = () => {
    try {
      const { getPublicProfileId } = require('../utils/profileId')
      const pubId = getPublicProfileId(user)
      navigate(`/profile/${pubId}`)
    } catch (e) {
      navigate('/profile')
    }
    setShowAvatarDropdown(false)
  }

  const handleViewPhoto = () => {
    // Para implementar: modal de visualização da foto
    console.log('Visualizar foto do perfil')
    setShowAvatarDropdown(false)
  }

  const handleViewStory = () => {
    // Para implementar: visualizar story
    console.log('Visualizar story')
    setShowAvatarDropdown(false)
  }

  // Carregar contadores de mensagens e notificações não lidas
  const loadUnreadCounts = async () => {
    // Modo offline/demo - não fazer chamadas de API
    if (import.meta.env.DEV) {
      console.log('🔧 Modo demo - usando valores padrão para contadores')
      setUnreadCounts({
        messages: 0,
        notifications: 0
      })
      return
    }

    try {
      const [messagesRes, notificationsRes] = await Promise.all([
        api.get('/api/messages/unread-count'),
        api.get('/api/notifications/unread-count')
      ])

      setUnreadCounts({
        messages: messagesRes.data.unreadCount,
        notifications: notificationsRes.data.unreadCount
      })
    } catch (error) {
      console.error('Erro ao carregar contadores:', error)
      // Fallback: definir valores padrão para não quebrar a interface
      setUnreadCounts({
        messages: 0,
        notifications: 0
      })
    }
  }

  // Atualizar contadores quando receber mensagens WebSocket
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'new_message') {
      setUnreadCounts(prev => ({
        ...prev,
        messages: prev.messages + 1
      }))
    }

    if (lastMessage.type === 'notification') {
      setUnreadCounts(prev => ({
        ...prev,
        notifications: prev.notifications + 1
      }))
    }
  }, [lastMessage])

  // Carregar contadores ao montar
  useEffect(() => {
    loadUnreadCounts()
  }, [])

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 safe-area-top sticky top-0 z-10 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between w-full max-w-full">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <div className="text-vibe-blue">
              <VibeArc size="sm" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent whitespace-nowrap">
              Vibe
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={onOpenPostModal}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Criar post"
          >
            <Plus size={24} className="text-gray-600" />
          </button>

          {/* Notificações */}
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            title="Notificações"
          >
            <Bell size={24} className="text-gray-600" />
            {unreadCounts.notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCounts.notifications > 99 ? '99+' : unreadCounts.notifications}
              </span>
            )}
          </button>

          {/* Pesquisar */}
          <button
            onClick={() => navigate('/search')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Pesquisar amigos"
          >
            <Search size={24} className="text-gray-600" />
          </button>

          {/* User Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-blue-200 transition-all"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-vibe-blue to-vibe-blue-dark flex items-center justify-center ring-2 ring-transparent hover:ring-blue-200 transition-all">
                  <span className="text-white text-sm font-bold">
                    {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </button>

            <AvatarDropdown
              isOpen={showAvatarDropdown}
              onClose={() => setShowAvatarDropdown(false)}
              user={user}
              hasRecentStory={false}
              onEditPhoto={handleEditPhoto}
              onViewStory={handleViewStory}
              onViewPhoto={handleViewPhoto}
            />
          </div>
        </div>
      </div>

    </header>
  )
}

export default Header
