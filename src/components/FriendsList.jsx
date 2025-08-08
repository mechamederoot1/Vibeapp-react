import React from 'react'
import { UserCheck, UserPlus, MessageCircle } from 'lucide-react'

const FriendsList = ({ friends, onClose }) => {
  const mockFriends = [
    {
      id: 1,
      username: 'ana_costa',
      name: 'Ana Costa',
      avatar: 'https://picsum.photos/100/100?random=friend1',
      mutualFriends: 12,
      isFollowing: true
    },
    {
      id: 2,
      username: 'joao_silva',
      name: 'João Silva',
      avatar: 'https://picsum.photos/100/100?random=friend2',
      mutualFriends: 8,
      isFollowing: true
    },
    {
      id: 3,
      username: 'maria_santos',
      name: 'Maria Santos',
      avatar: 'https://picsum.photos/100/100?random=friend3',
      mutualFriends: 15,
      isFollowing: false
    },
    {
      id: 4,
      username: 'pedro_oliveira',
      name: 'Pedro Oliveira',
      avatar: 'https://picsum.photos/100/100?random=friend4',
      mutualFriends: 6,
      isFollowing: true
    },
    {
      id: 5,
      username: 'sofia_lima',
      name: 'Sofia Lima',
      avatar: 'https://picsum.photos/100/100?random=friend5',
      mutualFriends: 23,
      isFollowing: true
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold">Amigos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Lista de Amigos */}
        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          {mockFriends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{friend.name}</p>
                  <p className="text-gray-600 text-sm">@{friend.username}</p>
                  <p className="text-gray-500 text-xs">
                    {friend.mutualFriends} amigos em comum
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-vibe-blue hover:bg-vibe-blue hover:text-white rounded-full transition-colors">
                  <MessageCircle size={20} />
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    friend.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-vibe-blue text-white hover:bg-vibe-blue-dark'
                  }`}
                >
                  {friend.isFollowing ? (
                    <div className="flex items-center space-x-1">
                      <UserCheck size={16} />
                      <span>Seguindo</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <UserPlus size={16} />
                      <span>Seguir</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FriendsList
