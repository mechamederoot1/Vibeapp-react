import React, { useState } from 'react'
import { X, UserCheck, UserPlus, MessageCircle, Search, Users, UserX } from 'lucide-react'

const FriendsList = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('friends') // friends, followers, following
  const [searchQuery, setSearchQuery] = useState('')

  const mockFriends = [
    {
      id: 1,
      username: 'ana_costa',
      name: 'Ana Costa',
      avatar: 'https://picsum.photos/100/100?random=friend1',
      mutualFriends: 12,
      isFollowing: true,
      isFollowingBack: true,
      lastActive: '2h',
      location: 'São Paulo, SP'
    },
    {
      id: 2,
      username: 'joao_silva',
      name: 'João Silva',
      avatar: 'https://picsum.photos/100/100?random=friend2',
      mutualFriends: 8,
      isFollowing: true,
      isFollowingBack: true,
      lastActive: '1d',
      location: 'Rio de Janeiro, RJ'
    },
    {
      id: 3,
      username: 'maria_santos',
      name: 'Maria Santos',
      avatar: 'https://picsum.photos/100/100?random=friend3',
      mutualFriends: 15,
      isFollowing: false,
      isFollowingBack: true,
      lastActive: '3h',
      location: 'Belo Horizonte, MG'
    },
    {
      id: 4,
      username: 'pedro_oliveira',
      name: 'Pedro Oliveira',
      avatar: 'https://picsum.photos/100/100?random=friend4',
      mutualFriends: 6,
      isFollowing: true,
      isFollowingBack: false,
      lastActive: '5h',
      location: 'Salvador, BA'
    },
    {
      id: 5,
      username: 'sofia_lima',
      name: 'Sofia Lima',
      avatar: 'https://picsum.photos/100/100?random=friend5',
      mutualFriends: 23,
      isFollowing: true,
      isFollowingBack: true,
      lastActive: '30min',
      location: 'Brasília, DF'
    },
    {
      id: 6,
      username: 'carlos_pereira',
      name: 'Carlos Pereira',
      avatar: 'https://picsum.photos/100/100?random=friend6',
      mutualFriends: 9,
      isFollowing: true,
      isFollowingBack: true,
      lastActive: '1w',
      location: 'Porto Alegre, RS'
    },
    {
      id: 7,
      username: 'lucia_martins',
      name: 'Lúcia Martins',
      avatar: 'https://picsum.photos/100/100?random=friend7',
      mutualFriends: 18,
      isFollowing: true,
      isFollowingBack: true,
      lastActive: '2d',
      location: 'Recife, PE'
    }
  ]

  const tabs = [
    { key: 'friends', label: 'Amigos', count: mockFriends.filter(f => f.isFollowing && f.isFollowingBack).length },
    { key: 'followers', label: 'Seguidores', count: mockFriends.filter(f => f.isFollowingBack).length },
    { key: 'following', label: 'Seguindo', count: mockFriends.filter(f => f.isFollowing).length }
  ]

  const getFilteredFriends = () => {
    let filtered = mockFriends

    // Filtrar por tab
    switch (activeTab) {
      case 'friends':
        filtered = filtered.filter(f => f.isFollowing && f.isFollowingBack)
        break
      case 'followers':
        filtered = filtered.filter(f => f.isFollowingBack)
        break
      case 'following':
        filtered = filtered.filter(f => f.isFollowing)
        break
    }

    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  const getStatusText = (friend) => {
    if (friend.isFollowing && friend.isFollowingBack) {
      return { text: 'Amigo', color: 'text-green-600' }
    } else if (friend.isFollowingBack && !friend.isFollowing) {
      return { text: 'Te segue', color: 'text-blue-600' }
    } else if (friend.isFollowing && !friend.isFollowingBack) {
      return { text: 'Você segue', color: 'text-orange-600' }
    }
    return { text: '', color: '' }
  }

  const handleFollowToggle = (friendId) => {
    // Aqui você implementaria a lógica real de seguir/desseguir
    console.log('Toggle follow for:', friendId)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold">Conexões</h2>
            <p className="text-gray-500 text-sm">Gerencie seus amigos e seguidores</p>
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

        {/* Lista de Amigos */}
        <div className="overflow-y-auto max-h-[calc(85vh-200px)]">
          {getFilteredFriends().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum amigo ainda'}
              </h3>
              <p className="text-gray-500 text-center">
                {searchQuery 
                  ? `Não encontramos ninguém com "${searchQuery}"`
                  : 'Comece seguindo pessoas para criar sua rede!'
                }
              </p>
            </div>
          ) : (
            getFilteredFriends().map((friend) => {
              const status = getStatusText(friend)
              
              return (
                <div key={friend.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {friend.lastActive === '30min' && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold truncate">{friend.name}</p>
                          {status.text && (
                            <span className={`text-xs ${status.color} bg-gray-100 px-2 py-1 rounded-full`}>
                              {status.text}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">@{friend.username}</p>
                        <div className="flex items-center space-x-4 text-gray-500 text-xs mt-1">
                          <span>{friend.mutualFriends} amigos em comum</span>
                          <span>Ativo {friend.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Botões de Ação */}
                    <div className="flex items-center space-x-2 ml-3">
                      <button className="p-2 text-vibe-blue hover:bg-vibe-blue hover:text-white rounded-full transition-colors">
                        <MessageCircle size={18} />
                      </button>
                      
                      {activeTab === 'following' && !friend.isFollowingBack ? (
                        <button 
                          onClick={() => handleFollowToggle(friend.id)}
                          className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <UserX size={16} />
                            <span>Deixar de seguir</span>
                          </div>
                        </button>
                      ) : friend.isFollowing && friend.isFollowingBack ? (
                        <button 
                          onClick={() => handleFollowToggle(friend.id)}
                          className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <UserCheck size={16} />
                            <span>Amigo</span>
                          </div>
                        </button>
                      ) : !friend.isFollowing ? (
                        <button 
                          onClick={() => handleFollowToggle(friend.id)}
                          className="bg-vibe-blue text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-vibe-blue-dark transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <UserPlus size={16} />
                            <span>Seguir de volta</span>
                          </div>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleFollowToggle(friend.id)}
                          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <UserCheck size={16} />
                            <span>Seguindo</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default FriendsList
