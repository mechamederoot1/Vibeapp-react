import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, PlusCircle, Bell, User, MessageCircle } from 'lucide-react'
import { api } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'

const BottomNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { lastMessage } = useWebSocket()
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0
  })

  // Carregar contadores de mensagens e notificações não lidas
  const loadUnreadCounts = async () => {
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

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/explore', icon: Search, label: 'Explorar' },
    { path: '/create', icon: PlusCircle, label: 'Criar' },
    {
      path: '/messages',
      icon: MessageCircle,
      label: 'Mensagens',
      badge: unreadCounts.messages
    },
    {
      path: '/notifications',
      icon: Bell,
      label: 'Notificações',
      badge: unreadCounts.notifications
    },
    { path: '/profile', icon: User, label: 'Perfil' },
  ]

  return (
    <nav className="bg-white border-t border-gray-200 safe-area-bottom w-full max-w-full overflow-hidden">
      <div className="flex justify-around py-2 w-full max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-vibe-blue' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon 
                size={24} 
                className={isActive ? 'fill-current' : ''}
              />
              <span className="text-xs mt-1 font-medium">
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
