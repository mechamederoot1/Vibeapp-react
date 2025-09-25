import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Search, PlusCircle, Eye, User, MessageCircle } from 'lucide-react'
import { api } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'

const BottomNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { lastMessage } = useWebSocket()
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    visits: 0
  })

  // Carregar contadores de mensagens e notificações não lidas
  const loadUnreadCounts = async () => {
    // Mantém contadores zerados inicialmente; mensagens/visitas serão atualizadas por WS
    setUnreadCounts({ messages: 0, visits: 0 })
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
  }, [lastMessage])

  // Carregar contadores ao montar
  useEffect(() => {
    loadUnreadCounts()
  }, [])

  const navItems = [
    { path: '/', icon: Home, label: 'Feed' },
    { path: '/create', icon: PlusCircle, label: 'Criar' },
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
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
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
