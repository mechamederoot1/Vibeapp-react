import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, MessageCircle, Bell, Plus, LogOut, User, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { VibeArc } from './VibeLogoSimple'
import AvatarDropdown from './AvatarDropdown'
import { api, usersAPI } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'
import { getPublicProfileId } from '../utils/profileId'
import { shouldRefreshNotifications } from '../utils/notifications'

const Header = ({ onOpenPostModal }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    notifications: 0
  })
  const { lastMessage } = useWebSocket()

  // Inline search state
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef(null)

  const handleEditPhoto = () => {
    try {
      const pubId = getPublicProfileId(user)
      navigate(`/profile/id/${pubId}`)
    } catch (e) {
      const fallback = user?.publicProfileId || user?.public_profile_id || user?.id
      if (fallback) navigate(`/profile/id/${fallback}`)
      else navigate('/profile')
    }
    setShowAvatarDropdown(false)
  }

  const handleViewPhoto = () => {
    console.log('Visualizar foto do perfil')
    setShowAvatarDropdown(false)
  }

  const handleViewStory = () => {
    console.log('Visualizar story')
    setShowAvatarDropdown(false)
  }

  // Carregar contadores de mensagens e notificações não lidas
  const loadUnreadCounts = useCallback(async () => {
    try {
      const [messagesRes, notificationsRes] = await Promise.all([
        api.get('/messages/unread-count'),
        api.get('/notifications/unread-count')
      ])

      setUnreadCounts({
        messages: messagesRes.data.unreadCount,
        notifications: notificationsRes.data.unreadCount
      })
    } catch (error) {
      console.error('Erro ao carregar contadores:', error)
      setUnreadCounts({ messages: 0, notifications: 0 })
    }
  }, [])

  // Atualizar contadores quando receber mensagens WebSocket
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'new_message') {
      setUnreadCounts(prev => ({ ...prev, messages: prev.messages + 1 }))
      return
    }

    if (lastMessage.type === 'notification') {
      setUnreadCounts(prev => ({ ...prev, notifications: prev.notifications + 1 }))
      return
    }

    if (lastMessage.type === 'call_attention') {
      // Open messages and provide feedback (vibration + sound)
      (async () => {
        try {
          const senderId = lastMessage.data?.senderId;
          if (senderId) {
            // navigate to messages with sender query
            try { navigate(`/messages?userId=${senderId}`); } catch(e){}
          }
        } catch(e){}

        try { if (navigator.vibrate) navigator.vibrate([300,150,300,150,300,150,300,150,300,150,300]); } catch(e){}
        try { const mod = await import('../utils/notificationSound'); mod.playNotification(); } catch(e){}
      })();
      return
    }

    if (shouldRefreshNotifications(lastMessage.type)) {
      loadUnreadCounts()
    }
  }, [lastMessage, loadUnreadCounts])

  // Carregar contadores ao montar
  useEffect(() => {
    loadUnreadCounts()
  }, [loadUnreadCounts])

  // Handle outside click/touch to close search
  useEffect(() => {
    const onOutside = (e) => {
      if (!showSearch) return
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false)
        setSearchQuery('')
        setSearchResults([])
      }
    }
    document.addEventListener('click', onOutside, true)
    document.addEventListener('touchstart', onOutside, true)
    return () => {
      document.removeEventListener('click', onOutside, true)
      document.removeEventListener('touchstart', onOutside, true)
    }
  }, [showSearch])

  // Debounced search
  useEffect(() => {
    if (!showSearch) return
    const q = searchQuery.trim()
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setSearchResults([])
        setSearchLoading(false)
        return
      }
      setSearchLoading(true)
      try {
        const res = await usersAPI.searchUsers(q, 10)
        setSearchResults(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery, showSearch])

  const handleChooseUser = (u) => {
    const publicId = u?.publicProfileId || u?.public_profile_id
    const id = u?.id
    if (publicId) {
      navigate(`/profile/id/${publicId}`)
    } else if (id) {
      navigate(`/profile/id/${id}`)
    }
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-3 safe-area-top sticky top-0 z-30 w-full max-w-full overflow-visible">
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

        <div className={`${showSearch ? 'opacity-0 pointer-events-none' : ''} flex items-center space-x-3 flex-shrink-0 relative`}>
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

          {/* Pesquisar inline */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setShowSearch((v) => !v)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Pesquisar pessoas"
            >
              <Search size={24} className="text-gray-600" />
            </button>

          </div>

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

      {showSearch && (
        <div className="absolute inset-x-0 top-0 z-50 px-4 py-3 bg-white shadow-sm" ref={searchRef}>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pessoas..."
              className="w-full pl-10 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
            />
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Fechar busca"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-2 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl">
            {searchLoading ? (
              <div className="p-4 text-sm text-gray-500">Buscando...</div>
            ) : searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Nenhum resultado</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {searchResults.map((u) => (
                  <li key={u.id} className="py-2 first:pt-0 last:pb-0">
                    <button
                      onClick={() => handleChooseUser(u)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-left"
                    >
                      {u.avatar_url || u.avatar ? (
                        <img
                          src={u.avatar_url || u.avatar}
                          alt={u.fullName || `${u.firstName || ''} ${u.lastName || ''}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-semibold">
                          {(u.firstName?.[0] || u.fullName?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim()}
                        </div>
                        {u.username && (
                          <div className="text-xs text-gray-500 truncate">@{u.username}</div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

    </header>
  )
}

export default Header
