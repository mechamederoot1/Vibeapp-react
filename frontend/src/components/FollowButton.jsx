import React, { useEffect, useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { followsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import useWebSocket from '../hooks/useWebSocket'

const FollowButton = ({ userId, className = '', onChange }) => {
  const { user: currentUser } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { lastMessage } = useWebSocket()

  useEffect(() => {
    if (!userId || !currentUser?.id || userId === currentUser.id) return
    let mounted = true
    followsAPI.getStatus(userId).then(res => {
      if (mounted) setIsFollowing(!!res.data?.isFollowing)
    }).catch(() => setIsFollowing(false))
    return () => { mounted = false }
  }, [userId, currentUser?.id])

  useEffect(() => {
    if (!lastMessage || !userId || !currentUser?.id) return
    if (lastMessage.type === 'follow_update') {
      const { followerId, followingId, isFollowing: f } = lastMessage.data || {}
      if (followerId === currentUser.id && followingId === userId) {
        setIsFollowing(!!f)
      }
    }
  }, [lastMessage, userId, currentUser?.id])

  if (!userId || userId === currentUser?.id) return null

  const toggleFollow = async () => {
    if (loading) return
    setLoading(true)
    const prev = isFollowing
    // optimistic
    setIsFollowing(!prev)
    onChange?.(!prev)
    try {
      if (!prev) {
        await followsAPI.follow(userId)
      } else {
        await followsAPI.unfollow(userId)
      }
    } catch (e) {
      // rollback
      setIsFollowing(prev)
      onChange?.(prev)
    } finally {
      setLoading(false)
    }
  }

  const Icon = isFollowing ? UserCheck : UserPlus

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
        isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-vibe-blue text-white hover:bg-vibe-blue-dark'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <Icon size={16} />
      )}
      <span>{isFollowing ? 'Seguindo' : 'Seguir'}</span>
    </button>
  )
}

export default FollowButton
