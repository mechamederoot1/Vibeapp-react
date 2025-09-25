import React, { useState, useEffect, useRef } from 'react'
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react'
import { friendshipsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import useWebSocket from '../hooks/useWebSocket'

const FriendshipButton = ({ userId, username, onStatusChange, className = '' }) => {
  const { user: currentUser } = useAuth()
  const [status, setStatus] = useState('none') // none, request_sent, request_received, friends, self
  const [loading, setLoading] = useState(false)
  const { lastMessage } = useWebSocket()
  const actionIdRef = useRef(0)
  // Guard window to avoid immediate server/WS overwriting optimistic state
  const optimisticGuardRef = useRef({ until: 0, preferred: null })

  useEffect(() => {
    if (userId && currentUser?.id) {
      loadFriendshipStatus()
    }
  }, [userId, currentUser?.id])

  const withinGuard = () => Date.now() < optimisticGuardRef.current.until
  const setGuard = (preferredStatus, ms = 1200) => {
    optimisticGuardRef.current = { until: Date.now() + ms, preferred: preferredStatus }
  }

  const loadFriendshipStatus = async () => {
    try {
      const response = await friendshipsAPI.getFriendshipStatus(userId)
      const serverStatus = response.data.status
      if (withinGuard() && optimisticGuardRef.current.preferred && serverStatus !== optimisticGuardRef.current.preferred) {
        // ignore transient mismatch during guard window
        return
      }
      setStatus(serverStatus)
    } catch (error) {
      console.error('Erro ao carregar status de amizade:', error)
      setStatus('none')
    }
  }

  const refreshStatusSafe = async (delayMs = 0) => {
    const id = ++actionIdRef.current
    const doFetch = async () => {
      try {
        const response = await friendshipsAPI.getFriendshipStatus(userId)
        if (id === actionIdRef.current) {
          const serverStatus = response.data.status
          if (withinGuard() && optimisticGuardRef.current.preferred && serverStatus !== optimisticGuardRef.current.preferred) {
            return // keep optimistic state during guard
          }
          setStatus(serverStatus)
        }
      } catch (error) {
        // Keep optimistic status if refresh fails
      }
    }
    if (delayMs > 0) setTimeout(doFetch, delayMs)
    else doFetch()
  }

  const handleSendFriendRequest = async () => {
    if (loading) return
    setLoading(true)
    const prev = status
    // Optimistic update
    setStatus('request_sent')
    setGuard('request_sent')
    onStatusChange?.(userId, 'request_sent')
    try {
      await friendshipsAPI.sendFriendRequest(userId)
      await refreshStatusSafe(400)
    } catch (error) {
      console.error('Erro ao enviar pedido:', error)
      // rollback
      setStatus(prev)
      onStatusChange?.(userId, prev)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (loading) return
    setLoading(true)
    const prev = status
    // Optimistic update
    setStatus('none')
    setGuard('none')
    onStatusChange?.(userId, 'none')
    try {
      await friendshipsAPI.removeFriend(userId)
      await refreshStatusSafe(400)
    } catch (error) {
      console.error('Erro ao remover amigo:', error)
      // rollback
      setStatus(prev)
      onStatusChange?.(userId, prev)
    } finally {
      setLoading(false)
    }
  }

  // Não mostrar botão para si mesmo
  if (status === 'self' || userId === currentUser?.id) {
    return null
  }

  const handleCancelFriendRequest = async () => {
    if (loading) return
    setLoading(true)
    const prev = status
    // Optimistic update
    setStatus('none')
    setGuard('none')
    onStatusChange?.(userId, 'none')
    try {
      await friendshipsAPI.cancelFriendRequest(userId)
      await refreshStatusSafe(400)
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      // rollback
      setStatus(prev)
      onStatusChange?.(userId, prev)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!lastMessage || !userId || !currentUser?.id) return
    const apply = (next) => {
      if (withinGuard() && optimisticGuardRef.current.preferred && next !== optimisticGuardRef.current.preferred) {
        return
      }
      setStatus(next)
      onStatusChange?.(userId, next)
    }

    // Notifications for friendship
    if (lastMessage.type === 'notification') {
      const n = lastMessage.data || {}
      if (n.type === 'friend_request' && n.related_user_id === userId) {
        apply('request_received')
      }
      if (n.type === 'friend_accepted' && n.related_user_id === userId) {
        apply('friends')
      }
    }
    if (lastMessage.type === 'friendship_update') {
      const d = lastMessage.data || {}
      const a = d.userA, b = d.userB
      if ((a === currentUser.id && b === userId) || (b === currentUser.id && a === userId)) {
        let next = d.status
        if (d.status === 'request_sent' && d.userA === currentUser.id) next = 'request_sent'
        else if (d.status === 'request_sent') next = 'request_received'
        apply(next)
      }
    }
  }, [lastMessage, userId, currentUser?.id])

  const getButtonConfig = () => {
    switch (status) {
      case 'none':
        return {
          text: 'Adicionar',
          icon: UserPlus,
          className: 'bg-vibe-blue text-white hover:bg-vibe-blue-dark',
          onClick: handleSendFriendRequest
        }
      case 'request_sent':
        return {
          text: 'Cancelar',
          icon: UserX,
          className: 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600',
          onClick: handleCancelFriendRequest
        }
      case 'request_received':
        return {
          text: 'Responder',
          icon: UserPlus,
          className: 'bg-vibe-blue text-white hover:bg-vibe-blue-dark',
          onClick: () => {
            // Abrir modal de pedidos ou navegar para página de pedidos
            // Por agora, só indicamos que tem pedido
          }
        }
      case 'friends':
        return {
          text: 'Amigos',
          icon: UserCheck,
          className: 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600',
          onClick: handleRemoveFriend,
          hoverText: 'Remover'
        }
      default:
        return null
    }
  }

  const config = getButtonConfig()
  if (!config) return null

  const Icon = config.icon

  return (
    <button
      onClick={config.onClick}
      disabled={loading || !config.onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${config.className} ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${!config.onClick ? 'cursor-default' : ''} ${className}`}
      title={config.hoverText}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <Icon size={16} />
      )}
      <span>{config.text}</span>
    </button>
  )
}

export default FriendshipButton
