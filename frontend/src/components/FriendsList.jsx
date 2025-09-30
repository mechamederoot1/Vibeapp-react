import React, { useState, useEffect } from 'react'
import { X, UserCheck, UserPlus, MessageCircle, Search, Users, UserX, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { friendshipsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const FriendsList = ({ onClose, userId = null }) => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [friends, setFriends] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [error, setError] = useState('')

  const targetUserId = userId || currentUser?.id

  useEffect(() => {
    if (targetUserId) {
      loadData()
    }
  }, [targetUserId, activeTab])

  const loadData = async () => {
    setLoading(true)
    setError('')

    try {
      if (activeTab === 'friends') {
        await loadFriends()
      } else if (activeTab === 'requests' && targetUserId === currentUser?.id) {
        await loadRequests()
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    try {
      const response = await friendshipsAPI.getUserFriends(targetUserId)
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
      // Recarregar dados
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

  const handleSendMessage = (username) => {
    navigate(`/messages?user=${encodeURIComponent(username)}&userId=${targetUserId || ''}`)
    onClose()
  }

  const handleProfileClick = (username) => {
    navigate(`/profile/${username}`)
    onClose()
  }

  const tabs = [
    { 
      key: 'friends', 
      label: 'Amigos', 
      count: friends.length,
      show: true
    },
    { 
      key: 'requests', 
      label: 'Pedidos', 
      count: receivedRequests.length + sentRequests.length,
      show: targetUserId === currentUser?.id // Só mostra para o próprio usuário
    }
  ].filter(tab => tab.show)

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
      // Combinar pedidos recebidos e enviados
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
    }

    // Filtrar por busca
    if (searchQuery) {
      data = data.filter(item => 
        (item.display_name || item.username).toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.username.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleSendMessage(item.username)}
            className="p-2 text-vibe-blue hover:bg-vibe-blue hover:text-white rounded-full transition-colors"
          >
            <MessageCircle size={18} />
          </button>
          <button 
            onClick={() => handleRemoveFriend(item.id)}
            className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
          >
            <UserX size={16} className="mr-1" />
            Remover
          </button>
        </div>
      )
    } else if (item.type === 'received') {
      return (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleRejectRequest(item.friendship.id)}
            className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Rejeitar
          </button>
          <button 
            onClick={() => handleAcceptRequest(item.friendship.id)}
            className="bg-vibe-blue text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-vibe-blue-dark transition-colors"
          >
            <UserPlus size={16} className="mr-1" />
            Aceitar
          </button>
        </div>
      )
    } else if (item.type === 'sent') {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-sm">Pendente</span>
          <Clock size={16} className="text-gray-400" />
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold">
              {targetUserId === currentUser?.id ? 'Suas Conexões' : 'Conexões'}
            </h2>
            <p className="text-gray-500 text-sm">
              {targetUserId === currentUser?.id 
                ? 'Gerencie seus amigos e pedidos'
                : 'Amigos e conexões'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pessoas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 p-3 text-center font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-vibe-blue text-vibe-blue'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-1">
                <span>{tab.label}</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Erro */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Lista */}
        <div className="overflow-y-auto max-h-[calc(85vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue"></div>
            </div>
          ) : getFilteredData().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchQuery ? 'Nenhum resultado encontrado' : 
                 activeTab === 'friends' ? 'Nenhum amigo ainda' : 'Nenhum pedido'}
              </h3>
              <p className="text-gray-500 text-center">
                {searchQuery 
                  ? `Não encontramos ninguém com "${searchQuery}"`
                  : activeTab === 'friends' 
                    ? 'Comece adicionando pessoas para criar sua rede!'
                    : 'Não há pedidos de amizade pendentes'
                }
              </p>
            </div>
          ) : (
            getFilteredData().map((item) => (
              <div key={`${item.id}-${item.type}`} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <img
                      src={item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.display_name || item.username)}&background=2563eb&color=fff`}
                      alt={item.display_name || item.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleProfileClick(item.username)}
                          className="font-semibold truncate hover:text-vibe-blue transition-colors text-left"
                        >
                          {item.display_name || item.username}
                        </button>
                        {item.type === 'received' && (
                          <span className="text-vibe-blue text-xs bg-vibe-blue/10 px-2 py-1 rounded-full">
                            Novo pedido
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">@{item.username}</p>
                      <div className="flex items-center space-x-4 text-gray-500 text-xs mt-1">
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
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendsList
