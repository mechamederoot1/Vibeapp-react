import React, { useState, useEffect } from 'react'
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react'
import { friendshipsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import useWebSocket from '../hooks/useWebSocket'

const FriendshipButton = ({ userId, username, onStatusChange, className = '' }) => {
  const { user: currentUser } = useAuth()
  const [status, setStatus] = useState('none') // none, request_sent, request_received, friends, self
  const [loading, setLoading] = useState(false)
  const { lastMessage } = useWebSocket()

  useEffect(() => {
    if (userId && currentUser?.id) {
      loadFriendshipStatus()
    }
  }, [userId, currentUser?.id])

  const loadFriendshipStatus = async () => {
    try {
      const response = await friendshipsAPI.getFriendshipStatus(userId)
      setStatus(response.data.status)
    } catch (error) {
      console.error('Erro ao carregar status de amizade:', error)
      setStatus('none')
    }
  }

  const handleSendFriendRequest = async () => {
    if (loading) return
    setLoading(true)
    const prev = status
    // Optimistic update
    setStatus('request_sent')
    onStatusChange?.(userId, 'request_sent')
    try {
      await friendshipsAPI.sendFriendRequest(userId)
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
    onStatusChange?.(userId, 'none')
    try {
      await friendshipsAPI.removeFriend(userId)
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
    onStatusChange?.(userId, 'none')
    try {
      await friendshipsAPI.cancelFriendRequest(userId)
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
    // Notifications for friendship
    if (lastMessage.type === 'notification') {
      const n = lastMessage.data || {}
      if (n.type === 'friend_request' && n.related_user_id === userId) {
        setStatus('request_received')
        onStatusChange?.(userId, 'request_received')
      }
      if (n.type === 'friend_accepted' && n.related_user_id === userId) {
        setStatus('friends')
        onStatusChange?.(userId, 'friends')
      }
    }
    if (lastMessage.type === 'friendship_update') {
      const d = lastMessage.data || {}
      const a = d.userA, b = d.userB
      if ((a === currentUser.id && b === userId) || (b === currentUser.id && a === userId)) {
        const map = { 'request_sent': 'request_received', 'friends': 'friends', 'none': 'none' }
        let next = d.status
        if (d.status === 'request_sent' && d.userA === currentUser.id) next = 'request_sent'
        else if (d.status === 'request_sent') next = 'request_received'
        setStatus(next)
        onStatusChange?.(userId, next)
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
