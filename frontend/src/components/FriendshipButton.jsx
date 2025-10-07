import React, { useState, useEffect, useRef } from 'react'
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react'
import { friendshipsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import useWebSocket from '../hooks/useWebSocket'
import { useNavigate } from 'react-router-dom'

const FriendshipButton = ({ userId, username, onStatusChange, className = '', showDecisionButtons = true }) => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
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
      // notify other parts of the app to refresh friends list
      try { window.dispatchEvent(new CustomEvent('vibe:friends:changed')) } catch(e){}
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
          onClick: async () => {
            if (loading) return
            setLoading(true)
            const prev = status
            setStatus('friends')
            setGuard('friends')
            onStatusChange?.(userId, 'friends')
            try {
              // Enviar pedido inverso para acionar auto-aceite no backend
              await friendshipsAPI.sendFriendRequest(userId)
              // after responding we may now be friends — notify listeners
              try { window.dispatchEvent(new CustomEvent('vibe:friends:changed')) } catch(e){}
              await refreshStatusSafe(400)
            } catch (e) {
              console.error('Erro ao aceitar pedido:', e)
              setStatus(prev)
              onStatusChange?.(userId, prev)
            } finally {
              setLoading(false)
            }
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

  // Helpers to accept/reject when we only know userId
  const findReceivedRequestId = async () => {
    try {
      const res = await friendshipsAPI.getReceivedRequests()
      const list = res.data || []
      const f = list.find((it) => it?.user_info?.id === userId)
      return f?.friendship?.id || null
    } catch (_) {
      return null
    }
  }

  const handleAccept = async () => {
    if (loading) return
    setLoading(true)
    const prev = status
    setStatus('friends')
    setGuard('friends')
    onStatusChange?.(userId, 'friends')
    try {
      let fid = await findReceivedRequestId()
      if (fid) {
        await friendshipsAPI.acceptFriendRequest(fid)
      } else {
        // Fallback ao auto-aceite via envio inverso
        await friendshipsAPI.sendFriendRequest(userId)
      }
      // notify other parts of the app to refresh friends list
      try { window.dispatchEvent(new CustomEvent('vibe:friends:changed')) } catch(e){}
      await refreshStatusSafe(300)
    } catch (e) {
      console.error('Erro ao aceitar pedido:', e)
      setStatus(prev)
      onStatusChange?.(userId, prev)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (loading) return
    setLoading(true)
    const prev = status
    setStatus('none')
    setGuard('none')
    onStatusChange?.(userId, 'none')
    try {
      const fid = await findReceivedRequestId()
      if (fid) {
        await friendshipsAPI.rejectFriendRequest(fid)
      } else {
        // Se não localizar, apenas força refresh
      }
      await refreshStatusSafe(300)
    } catch (e) {
      console.error('Erro ao rejeitar pedido:', e)
      setStatus(prev)
      onStatusChange?.(userId, prev)
    } finally {
      setLoading(false)
    }
  }

  const config = getButtonConfig()
  if (!config) return null

  const Icon = config.icon

  if (status === 'request_received') {
    if (!showDecisionButtons) {
      return (
        <button
          onClick={() => navigate('/friends')}
          className={`px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 ${className}`}
        >
          Pedido pendente
        </button>
      )
    }
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handleAccept}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 bg-green-600 text-white hover:bg-green-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <UserCheck size={16} />}
          <span>Aceitar</span>
        </button>
        <button
          onClick={handleReject}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 bg-gray-100 text-gray-700 hover:bg-gray-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <UserX size={16} />}
          <span>Recusar</span>
        </button>
      </div>
    )
  }

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
