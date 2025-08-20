import React, { useState, useEffect } from 'react'
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react'
import { friendshipsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const FriendshipButton = ({ userId, username, onStatusChange }) => {
  const { user: currentUser } = useAuth()
  const [status, setStatus] = useState('none') // none, request_sent, request_received, friends, self
  const [loading, setLoading] = useState(false)

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
    setLoading(true)
    try {
      await friendshipsAPI.sendFriendRequest(userId)
      setStatus('request_sent')
      onStatusChange?.(userId, 'request_sent')
    } catch (error) {
      console.error('Erro ao enviar pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFriend = async () => {
    setLoading(true)
    try {
      await friendshipsAPI.removeFriend(userId)
      setStatus('none')
      onStatusChange?.(userId, 'none')
    } catch (error) {
      console.error('Erro ao remover amigo:', error)
    } finally {
      setLoading(false)
    }
  }

  // Não mostrar botão para si mesmo
  if (status === 'self' || userId === currentUser?.id) {
    return null
  }

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
          text: 'Pendente',
          icon: Clock,
          className: 'bg-gray-100 text-gray-600',
          onClick: null // Não clicável
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
      } ${!config.onClick ? 'cursor-default' : ''}`}
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
