import React, { useState, useEffect } from 'react'
import { Search, Users, UserPlus, Bell, ChevronLeft, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { friendshipsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import FriendshipButton from '../components/FriendshipButton'
import useWebSocket from '../hooks/useWebSocket'

const Friends = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { lastMessage } = useWebSocket()
  const [activeTab, setActiveTab] = useState('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [friends, setFriends] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentUser?.id) {
      loadData()
    }
  }, [currentUser?.id])

  // Listen for global friend changes and refresh when needed
  useEffect(() => {
    const onFriendsChanged = () => {
      // Re-load all relevant data so tabs and counts stay in sync
      if (currentUser?.id) {
        loadData()
        // Also refresh friends list explicitly in case UI relies on it
        loadFriends()
        loadRequests()
      }
    }
    window.addEventListener('vibe:friends:changed', onFriendsChanged)
    return () => window.removeEventListener('vibe:friends:changed', onFriendsChanged)
  }, [activeTab, currentUser?.id])

  // Real-time updates for requests via WebSocket
  useEffect(() => {
    if (!lastMessage) return
    const t = lastMessage.type || lastMessage.normalizedType
    if (t === 'friendship_update' || t === 'notification') {
      loadRequests()
    }
  }, [lastMessage])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      await Promise.all([loadFriends(), loadRequests()])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    try {
      const response = await friendshipsAPI.getUserFriends(currentUser.id)
      setFriends(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar amigos:', error)
      setFriends([])
    }
  }

  const loadRequests = async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        friendshipsAPI.getReceivedRequests(),
        friendshipsAPI.getSentRequests()
      ])
      setReceivedRequests(receivedRes.data || [])
      setSentRequests(sentRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      setReceivedRequests([])
      setSentRequests([])
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendshipsAPI.acceptFriendRequest(friendshipId)
      await loadRequests()
      await loadFriends()
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error)
      setError('Erro ao aceitar pedido de amizade.')
    }
  }

  const handleRejectRequest = async (friendshipId) => {
    try {
      await friendshipsAPI.rejectFriendRequest(friendshipId)
      await loadRequests()
    } catch (error) {
      console.error('Erro ao rejeitar pedido:', error)
      setError('Erro ao rejeitar pedido de amizade.')
    }
  }

  const handleRemoveFriend = async (friendUserId) => {
    try {
      await friendshipsAPI.removeFriend(friendUserId)
      await loadFriends()
    } catch (error) {
      console.error('Erro ao remover amigo:', error)
      setError('Erro ao remover amigo.')
    }
  }

  const handleProfileClick = (username) => {
    navigate(`/profile/id/${username}`)
  }

  const tabs = [
    {
      key: 'friends',
      label: 'Amigos',
      count: friends.length,
      icon: Users
    },
    {
      key: 'requests',
      label: 'Pedidos',
      count: receivedRequests.length + sentRequests.length,
      icon: Bell
    },
    {
      key: 'suggestions',
      label: 'Sugestões',
      count: 0,
      icon: Search
    }
  ]

  const getFilteredData = () => {
    let data = []

    if (activeTab === 'friends') {
      data = friends.map(item => ({
        ...item.user_info,
        friendship: item.friendship,
        mutual_friends_count: item.mutual_friends_count,
        type: 'friend'
      }))
    } else if (activeTab === 'requests') {
      const received = receivedRequests.map(item => ({
        ...item.user_info,
        friendship: item.friendship,
        mutual_friends_count: item.mutual_friends_count,
        type: 'received'
      }))
      const sent = sentRequests.map(item => ({
        ...item.user_info,
        friendship: item.friendship,
        mutual_friends_count: item.mutual_friends_count,
        type: 'sent'
      }))
      data = [...received, ...sent]
    } else if (activeTab === 'suggestions') {
      // For suggestions we provide a CTA to the Explore page and leave the list to the Explore flow
      data = [{
        id: 'suggestions-cta',
        username: 'explore',
        display_name: 'Encontrar pessoas',
        avatar_url: null,
        type: 'suggestion'
      }]
    }

    // Filtrar por busca
    if (searchQuery) {
      data = data.filter(item =>
        ((item.display_name || item.username) + '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.username + '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return data
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'agora'
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)}min`
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)}d`
    return `há ${Math.floor(diffInSeconds / 604800)}sem`
  }

  const renderActionButtons = (item) => {
    if (item.type === 'friend') {
      return (
        <button
          onClick={() => handleRemoveFriend(item.id)}
          className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm transition-colors"
        >
          Remover
        </button>
      )
    } else if (item.type === 'received') {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleRejectRequest(item.friendship.id)}
            className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            Rejeitar
          </button>
          <button
            onClick={() => handleAcceptRequest(item.friendship.id)}
            className="bg-vibe-blue text-white px-3 py-1 rounded text-sm hover:bg-vibe-blue-dark transition-colors"
          >
            Aceitar
          </button>
        </div>
      )
    } else if (item.type === 'sent') {
      return (
        <span className="text-gray-500 text-sm">Pendente</span>
      )
    } else if (item.type === 'suggestion') {
      return (
        <button
          onClick={() => navigate('/explore')}
          className="bg-vibe-blue text-white px-3 py-1 rounded text-sm hover:bg-vibe-blue-dark"
        >
          Ver sugestões
        </button>
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Amigos</h1>
              <p className="text-gray-500 text-sm">Gerencie suas conexões</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Filter size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Busca */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar amigos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 p-3 text-center font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-vibe-blue text-vibe-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 mx-4 mt-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Conteúdo */}
      <div className="bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue"></div>
          </div>
        ) : getFilteredData().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? 'Nenhum resultado encontrado' : 
               activeTab === 'friends' ? 'Nenhum amigo ainda' : 'Nenhum pedido'}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {searchQuery 
                ? `Não encontramos ninguém com "${searchQuery}"`
                : activeTab === 'friends' 
                  ? 'Comece adicionando pessoas para criar sua rede!'
                  : 'Não há pedidos de amizade pendentes'
              }
            </p>
            {activeTab === 'friends' && !searchQuery && (
              <button
                onClick={() => navigate('/explore')}
                className="bg-vibe-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-vibe-blue-dark transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <UserPlus size={20} />
                  <span>Encontrar Pessoas</span>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {getFilteredData().map((item) => (
              <div key={`${item.id}-${item.type}`} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <img
                      src={item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.display_name || item.username)}&background=2563eb&color=fff`}
                      alt={item.display_name || item.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleProfileClick(item.username)}
                          className="font-semibold text-lg truncate hover:text-vibe-blue transition-colors text-left"
                        >
                          {item.display_name || item.username}
                        </button>
                        {item.type === 'received' && (
                          <span className="text-vibe-blue text-xs bg-vibe-blue/10 px-2 py-1 rounded-full">
                            Novo
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">@{item.username}</p>
                      <div className="flex items-center space-x-4 text-gray-500 text-sm mt-1">
                        {item.mutual_friends_count > 0 && (
                          <span>{item.mutual_friends_count} amigos em comum</span>
                        )}
                        {item.friendship?.created_at && (
                          <span>{formatTimeAgo(item.friendship.created_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botões de Ação */}
                  <div className="ml-3">
                    {renderActionButtons(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Friends
