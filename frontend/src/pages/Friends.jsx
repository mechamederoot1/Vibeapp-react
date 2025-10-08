import React, { useEffect, useState, useCallback } from 'react'
import { Search, Users, Bell, ChevronLeft, Filter, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { friendshipsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import useWebSocket from '../hooks/useWebSocket'
import FriendshipButton from '../components/FriendshipButton'

const TABS = [
  { key: 'friends', label: 'Amigos' },
  { key: 'requests', label: 'Pedidos' },
  { key: 'suggestions', label: 'Sugestões' }
]

const Friends = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { lastMessage } = useWebSocket()

  const [activeTab, setActiveTab] = useState('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [friends, setFriends] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])

  const loadFriends = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const res = await friendshipsAPI.getUserFriends(currentUser.id)
      setFriends(res.data || [])
    } catch (e) {
      console.error('Erro loadFriends:', e)
      // keep previous state if error, but log
    }
  }, [currentUser?.id])

  const loadRequests = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const [receivedRes, sentRes] = await Promise.all([
        friendshipsAPI.getReceivedRequests(),
        friendshipsAPI.getSentRequests()
      ])
      console.log('DEBUG: getReceivedRequests response:', receivedRes?.data)
      console.log('DEBUG: getSentRequests response:', sentRes?.data)
      setReceivedRequests(receivedRes.data || [])
      setSentRequests(sentRes.data || [])
    } catch (e) {
      console.error('Erro loadRequests:', e)
      setReceivedRequests([])
      setSentRequests([])
  useEffect(() => {
    if (currentUser?.id) {
      loadRequests()
      loadFriends()
    }
  }, [currentUser?.id])

  useEffect(() => {
    const onFriendsChanged = () => {
      if (currentUser?.id) {
        loadData()
        loadFriends()
        loadRequests()
      }
    }
  }, [currentUser?.id])

  const loadAllData = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    setError('')
    try {
      const results = await Promise.allSettled([loadFriends(), loadRequests()])
      // If both failed, show an error
      if (results.every(r => r.status === 'rejected')) {
        setError('Erro ao carregar conexões. Tente novamente mais tarde.')
      }
    } catch (e) {
      console.error('Erro loadAllData:', e)
      setError('Erro ao carregar conexões. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, loadFriends, loadRequests])

  // Initial load
  useEffect(() => {
    console.log('DEBUG: Inicializando Friends.loadAllData')
    loadAllData()
  }, [loadAllData])

  // Listen to global events (optimistic updates elsewhere)
  useEffect(() => {
    const onFriendsChanged = () => {
      if (currentUser?.id) loadAllData()
    }
    window.addEventListener('vibe:friends:changed', onFriendsChanged)
    return () => window.removeEventListener('vibe:friends:changed', onFriendsChanged)
  }, [currentUser?.id, loadAllData])

  // React to websocket events that affect friendship state
  useEffect(() => {
    if (!lastMessage) return
    console.log('DEBUG: Friends received WS message:', lastMessage)

    const isFriendEvent = lastMessage.type === 'friendship_update' ||
      (lastMessage.type === 'notification' && (lastMessage.data?.type === 'friend_request' || lastMessage.data?.type === 'friend_accepted')) ||
      (lastMessage.normalizedType === 'friendship_update')

    if (isFriendEvent) {
      console.log('DEBUG: Friends - WS indicates friend event, reloading')
      // refresh both lists so counters remain correct
      loadAllData()
    }
  }, [lastMessage, loadAllData])

  // Polling fallback to keep counters updated even if WS fails
  useEffect(() => {
    if (!currentUser?.id) return
    const iv = setInterval(() => {
      console.log('DEBUG: Polling: Iniciando loadAllData')
      loadAllData()
    }, 15000)
    return () => clearInterval(iv)
  }, [currentUser?.id, loadAllData])

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendshipsAPI.acceptFriendRequest(friendshipId)
      await loadAllData()
      try { window.dispatchEvent(new CustomEvent('vibe:friends:changed')) } catch (e) {}
    } catch (e) {
      console.error('Erro ao aceitar pedido:', e)
      setError('Erro ao aceitar pedido de amizade.')
    }
  }

  const handleRejectRequest = async (friendshipId) => {
    try {
      await friendshipsAPI.rejectFriendRequest(friendshipId)
      await loadAllData()
    } catch (e) {
      console.error('Erro ao rejeitar pedido:', e)
      setError('Erro ao rejeitar pedido de amizade.')
    }
  }

  const handleRemoveFriend = async (friendUserId) => {
    try {
      await friendshipsAPI.removeFriend(friendUserId)
      await loadAllData()
      try { window.dispatchEvent(new CustomEvent('vibe:friends:changed')) } catch (e) {}
    } catch (e) {
      console.error('Erro ao remover amigo:', e)
      setError('Erro ao remover amigo.')
    }
  }

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
      const received = (receivedRequests || []).map(item => ({
        ...item.user_info,
        friendship: item.friendship,
        mutual_friends_count: item.mutual_friends_count,
        type: 'received'
      }))
      const sent = (sentRequests || []).map(item => ({
        ...item.user_info,
        friendship: item.friendship,
        mutual_friends_count: item.mutual_friends_count,
        type: 'sent'
      }))
      data = [...received, ...sent]
    } else if (activeTab === 'suggestions') {
      data = [{ id: 'suggestions-cta', username: 'explore', display_name: 'Encontrar pessoas', avatar_url: null, type: 'suggestion' }]
      data = [{
        id: 'suggestions-cta',
        username: 'explore',
        display_name: 'Encontrar pessoas',
        avatar_url: null,
        type: 'suggestion'
      }]
    }

    if (searchQuery) {
      data = data.filter(item => ((item.display_name || item.username) + '').toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return data
  }

  const friendsCount = (friends || []).length
  const requestsCount = (receivedRequests || []).length + (sentRequests || []).length

  // Debug: log data arrays when they change
  useEffect(() => {
    console.log('DEBUG: receivedRequests:', receivedRequests)
    console.log('DEBUG: sentRequests:', sentRequests)
    console.log('DEBUG: friends:', friends)
    console.log('DEBUG: activeTab:', activeTab)
  }, [receivedRequests, sentRequests, friends, activeTab])

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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

        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { console.log('DEBUG: Selecionando aba:', tab.key); setActiveTab(tab.key); }}
              className={`flex-1 p-3 text-center font-medium transition-colors ${activeTab === tab.key ? 'border-b-2 border-vibe-blue text-vibe-blue' : 'text-gray-500 hover:text-gray-700'}`}>
              <div className="flex items-center justify-center space-x-2">
                <span>{tab.label}</span>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{tab.key === 'friends' ? friendsCount : tab.key === 'requests' ? requestsCount : 0}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 mx-4 mt-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibe-blue"></div>
          </div>
        ) : getFilteredData().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users size={64} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{searchQuery ? 'Nenhum resultado encontrado' : activeTab === 'friends' ? 'Nenhum amigo ainda' : 'Nenhum pedido'}</h3>
            <p className="text-gray-500 text-center mb-6">{searchQuery ? `Não encontramos ninguém com "${searchQuery}"` : activeTab === 'friends' ? 'Comece adicionando pessoas para criar sua rede!' : 'Não há pedidos de amizade pendentes'}</p>
            {activeTab === 'friends' && !searchQuery && (
              <button onClick={() => navigate('/explore')} className="bg-vibe-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-vibe-blue-dark transition-colors">
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
                    <img src={item.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.display_name || item.username)}&background=2563eb&color=fff`} alt={item.display_name || item.username} className="w-14 h-14 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => navigate(`/profile/id/${item.username}`)} className="font-semibold text-lg truncate hover:text-vibe-blue transition-colors text-left">{item.display_name || item.username}</button>
                        {item.type === 'received' && <span className="text-vibe-blue text-xs bg-vibe-blue/10 px-2 py-1 rounded-full">Novo pedido</span>}
                      </div>
                      <p className="text-gray-600 text-sm">@{item.username}</p>
                      <div className="flex items-center space-x-4 text-gray-500 text-xs mt-1">
                        {item.mutual_friends_count > 0 && <span>{item.mutual_friends_count} amigos em comum</span>}
                        {item.friendship?.created_at && <span>{new Date(item.friendship.created_at).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="ml-3">
                    {item.type === 'friend' && (
                      <div className="flex items-center space-x-2">
                        <button onClick={() => navigate(`/messages?user=${encodeURIComponent(item.username)}&userId=${item.id}`)} className="p-2 text-vibe-blue hover:bg-vibe-blue hover:text-white rounded-full transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={() => handleRemoveFriend(item.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors">Remover</button>
                      </div>
                    )}

                    {item.type === 'received' && (
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleRejectRequest(item.friendship.id)} className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors">Rejeitar</button>
                        <button onClick={() => handleAcceptRequest(item.friendship.id)} className="bg-vibe-blue text-white px-3 py-1 rounded text-sm hover:bg-vibe-blue-dark transition-colors">Aceitar</button>
                      </div>
                    )}

                    {item.type === 'sent' && (
                      <span className="text-gray-500 text-sm">Pendente</span>
                    )}

                    {item.type === 'suggestion' && (
                      <button onClick={() => navigate('/explore')} className="bg-vibe-blue text-white px-3 py-1 rounded text-sm hover:bg-vibe-blue-dark">Ver sugestões</button>
                    )}
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
