import React, { useState, useEffect } from 'react'
import { X, Users, UserPlus, Search, MoreHorizontal } from 'lucide-react'
import { usersAPI, followsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const ConnectionsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('friends')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [connections, setConnections] = useState({
    friends: [],
    followers: [],
    following: []
  })

  useEffect(() => {
    if (isOpen && user?.id) {
      loadConnections()
    }
  }, [isOpen, user?.id, activeTab])

  const loadConnections = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // Simulando dados até ter API real
      const mockData = {
        friends: [
          {
            id: 1,
            username: 'ana_silva',
            fullName: 'Ana Silva',
            avatar: '/api/placeholder/40/40',
            isOnline: true,
            mutualFriends: 12
          },
          {
            id: 2,
            username: 'carlos_santos',
            fullName: 'Carlos Santos',
            avatar: '/api/placeholder/40/40',
            isOnline: false,
            mutualFriends: 8
          },
          {
            id: 3,
            username: 'maria_oliveira',
            fullName: 'Maria Oliveira',
            avatar: '/api/placeholder/40/40',
            isOnline: true,
            mutualFriends: 15
          }
        ],
        followers: [
          {
            id: 4,
            username: 'joao_costa',
            fullName: 'João Costa',
            avatar: '/api/placeholder/40/40',
            isFollowing: false
          },
          {
            id: 5,
            username: 'lucia_ferreira',
            fullName: 'Lúcia Ferreira',
            avatar: '/api/placeholder/40/40',
            isFollowing: true
          }
        ],
        following: [
          {
            id: 6,
            username: 'pedro_alves',
            fullName: 'Pedro Alves',
            avatar: '/api/placeholder/40/40',
            isFollowingBack: true
          },
          {
            id: 7,
            username: 'sofia_ribeiro',
            fullName: 'Sofia Ribeiro',
            avatar: '/api/placeholder/40/40',
            isFollowingBack: false
          }
        ]
      }
      
      setConnections(mockData)
    } catch (error) {
      console.error('Erro ao carregar conexões:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterConnections = (list) => {
    if (!searchTerm) return list
    return list.filter(person => 
      person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleFollow = async (userId) => {
    try {
      // Optimistic UI
      setConnections(prev => {
        const copy = { ...prev }
        if (activeTab === 'followers') {
          copy.followers = copy.followers.map(p => p.id === userId ? { ...p, isFollowing: !p.isFollowing } : p)
        } else if (activeTab === 'following') {
          copy.following = copy.following.filter(p => p.id !== userId)
        }
        return copy
      })
      // Commit
      if (activeTab === 'followers') {
        const person = connections.followers.find(p => p.id === userId)
        if (person?.isFollowing) {
          await followsAPI.unfollow(userId)
        } else {
          await followsAPI.follow(userId)
        }
      } else if (activeTab === 'following') {
        await followsAPI.unfollow(userId)
      }
    } catch (error) {
      console.error('Erro ao seguir/deixar de seguir:', error)
      // Note: could reload connections on failure
    }
  }

  const tabs = [
    { id: 'friends', label: 'Amigos', count: connections.friends.length },
    { id: 'followers', label: 'Seguidores', count: connections.followers.length },
    { id: 'following', label: 'Seguindo', count: connections.following.length }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Conexões</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-vibe-blue border-b-2 border-vibe-blue'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-vibe-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {filterConnections(connections[activeTab]).map((person) => (
                <div key={person.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {person.avatar ? (
                        <img
                          src={person.avatar}
                          alt={person.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-vibe-blue text-white font-bold">
                          {person.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Status online para amigos */}
                    {activeTab === 'friends' && person.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 ml-3">
                    <h4 className="font-medium text-gray-900">{person.fullName}</h4>
                    <p className="text-sm text-gray-500">@{person.username}</p>
                    {/* Info adicional baseada na aba */}
                    {activeTab === 'friends' && person.mutualFriends && (
                      <p className="text-xs text-gray-400">{person.mutualFriends} amigos em comum</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {activeTab === 'followers' && (
                      <button
                        onClick={() => handleFollow(person.id)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          person.isFollowing
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-vibe-blue text-white hover:bg-vibe-blue-dark'
                        }`}
                      >
                        {person.isFollowing ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}
                    
                    {activeTab === 'following' && (
                      <button
                        onClick={() => handleFollow(person.id)}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        Deixar de seguir
                      </button>
                    )}

                    <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}

              {filterConnections(connections[activeTab]).length === 0 && (
                <div className="text-center py-8">
                  <Users size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Nenhum resultado encontrado' : `Nenhum ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm 
                      ? 'Tente buscar com outros termos'
                      : `Você ainda não tem ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectionsModal
