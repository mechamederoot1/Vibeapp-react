import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, Users, Eye, User, MessageCircle } from 'lucide-react'
import { api, usersAPI, friendshipsAPI } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'
import { useAuth } from '../contexts/AuthContext'
import { getPublicProfileId } from '../utils/profileId'

const BottomNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { lastMessage } = useWebSocket()
  const { user } = useAuth()
  const myProfilePath = (() => {
    try {
      const pub = getPublicProfileId(user)
      if (pub) return `/profile/id/${pub}`
    } catch (e) {}
    const fallback = user?.publicProfileId || user?.public_profile_id || user?.id
    return fallback ? `/profile/id/${fallback}` : '/profile'
  })()
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    visits: 0
  })
  const [friendBadge, setFriendBadge] = useState(0)

  // Carregar contadores de mensagens e notificações não lidas
  const loadUnreadCounts = async () => {
    // Mantém contadores zerados inicialmente; mensagens/visitas serão atualizadas por WS
    setUnreadCounts({ messages: 0, visits: 0 })
  }

  // Carregar contadores relacionados a amigos (pendentes)
  const loadFriendCounts = async () => {
    try {
      if (!user?.id) return
      // Use the friendships endpoints to compute pending requests
      const [receivedRes, sentRes, statsRes] = await Promise.all([
        friendshipsAPI.getReceivedRequests().catch(() => ({ data: [] })),
        friendshipsAPI.getSentRequests().catch(() => ({ data: [] })),
        usersAPI.getUserStats(user.id).catch(() => ({ data: null }))
      ])

      const pending = (receivedRes.data || []).length
      const sent = (sentRes.data || []).length
      setFriendBadge(pending + sent)

      // Optionally you could store friendsCount elsewhere if needed
    } catch (e) {
      console.error('Erro ao carregar contadores de amigos:', e)
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

    if (lastMessage.type === 'profile_view') {
      setUnreadCounts(prev => ({
        ...prev,
        visits: prev.visits + 1
      }))
    }

    // Update friend badge when receiving friendship updates or friend notifications
    if (lastMessage.type === 'friendship_update' || lastMessage.type === 'notification' || lastMessage.normalizedType === 'friendship_update') {
      // Reload friend counts
      loadFriendCounts()
    }
  }, [lastMessage])

  // Carregar contadores ao montar e fazer polling para robustez mesmo sem WS
  useEffect(() => {
    loadUnreadCounts()
    loadFriendCounts()

    const iv = setInterval(() => {
      loadFriendCounts()
    }, 15000)
    return () => clearInterval(iv)
  }, [user?.id])

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/friends', icon: Users, label: 'Amigos', badge: friendBadge },
    {
      path: '/messages',
      icon: MessageCircle,
      label: 'Mensagens',
      badge: unreadCounts.messages
    },
    {
      path: '/visits',
      icon: Eye,
      label: 'Visitas',
      badge: unreadCounts.visits
    },
    { path: myProfilePath, icon: User, label: 'Perfil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-bottom w-full max-w-full overflow-visible">
      <div className="flex justify-around py-2 w-full max-w-full">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.path.startsWith('/profile') ? location.pathname.startsWith('/profile') : location.pathname === item.path
          
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                // Limpar badge quando navegar para a página
                if (item.path === '/messages') {
                  setUnreadCounts(prev => ({ ...prev, messages: 0 }))
                }
                if (item.path === '/visits') {
                  setUnreadCounts(prev => ({ ...prev, visits: 0 }))
                }
              }}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${
                isActive
                  ? 'text-vibe-blue'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={isActive ? 'fill-current' : ''}
                />
                {/* Badge de notificação */}
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-lg z-30">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
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
