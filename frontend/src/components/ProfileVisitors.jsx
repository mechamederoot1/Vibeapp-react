import React, { useEffect, useMemo, useState } from 'react'
import { X, Eye, MessageCircle, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FriendshipButton from './FriendshipButton'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'

const ProfileVisitors = ({ onClose }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { lastMessage } = useWebSocket()
  const [filter, setFilter] = useState('all') // all, today, week, month
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(false)

  const loadVisitors = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await usersAPI.getProfileVisitors(user.id, 50)
      const list = (res.data || []).map((v) => ({
        id: v.user?.id,
        username: v.user?.username,
        name: v.user?.displayName || v.user?.display_name || v.user?.username,
        avatar: v.user?.avatar || v.user?.avatar_url,
        viewedAt: v.viewedAt || v.viewed_at || v.createdAt || v.created_at,
        isFriend: false,
        isMutualFriend: false
      }))
      setVisitors(list)
    } catch (e) {
      setVisitors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVisitors() }, [user?.id])

  useEffect(() => {
    if (!lastMessage || !user?.id) return
    if (lastMessage.type === 'profile_view') {
      const d = lastMessage.data || {}
      if (d.profileOwnerId === user.id) {
        // Prepend latest view
        setVisitors((prev) => [
          {
            id: d.viewerId,
            username: undefined,
            name: 'Visitante',
            avatar: undefined,
            viewedAt: d.createdAt || new Date().toISOString(),
            isFriend: false,
            isMutualFriend: false
          },
          ...prev
        ])
      }
    }
  }, [lastMessage, user?.id])

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mês' }
  ]

  const formatTimeAgo = (iso) => {
    if (!iso) return ''
    const date = new Date(iso)
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return 'agora'
    if (diff < 3600) return `${Math.floor(diff/60)} min`
    if (diff < 86400) return `${Math.floor(diff/3600)} h`
    if (diff < 604800) return `${Math.floor(diff/86400)} d`
    return date.toLocaleDateString('pt-BR')
  }

  const filteredVisitors = useMemo(() => {
    const now = new Date()
    return visitors.filter((v) => {
      if (filter === 'all') return true
      const d = new Date(v.viewedAt)
      const diffDays = (now - d) / (1000*60*60*24)
      if (filter === 'today') return diffDays < 1
      if (filter === 'week') return diffDays < 7
      if (filter === 'month') return diffDays < 30
      return true
    })
  }, [visitors, filter])

  const handleProfileClick = (username, id) => {
    if (username) navigate(`/profile/${username}`)
    else if (id) navigate(`/profile/${id}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold">Visitantes do Perfil</h2>
            <p className="text-gray-500 text-sm">{visitors.length} pessoas visualizaram</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-2 overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-vibe-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Visitantes */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {filteredVisitors.map((visitor) => (
            <div key={visitor.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <img
                      src={visitor.avatar}
                      alt={visitor.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {visitor.isMutualFriend && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-vibe-blue rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleProfileClick(visitor.username, visitor.id)}
                        className="font-semibold truncate hover:text-vibe-blue transition-colors text-left"
                      >
                        {visitor.name}
                      </button>
                      {visitor.isMutualFriend && (
                        <span className="text-vibe-blue text-xs bg-vibe-blue/10 px-2 py-1 rounded-full">
                          Amigos
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">@{visitor.username}</p>
                    <div className="flex items-center space-x-1 text-gray-500 text-xs mt-1">
                      <Clock size={12} />
                      <span>{formatTimeAgo(visitor.viewedAt)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex items-center space-x-2 ml-3">
                  <button className="p-2 text-vibe-blue hover:bg-vibe-blue hover:text-white rounded-full transition-colors">
                    <MessageCircle size={18} />
                  </button>

                  <FriendshipButton
                    userId={visitor.id}
                    username={visitor.username}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Configurações de Privacidade */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Configurações de Privacidade</p>
              <p className="text-gray-500 text-xs">Controle quem pode ver seus visitantes</p>
            </div>
            <button className="text-vibe-blue text-sm font-medium">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileVisitors
