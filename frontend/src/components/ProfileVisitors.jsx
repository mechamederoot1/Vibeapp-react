import React, { useState } from 'react'
import { X, Eye, MessageCircle, UserPlus, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ProfileVisitors = ({ onClose }) => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // all, today, week, month

  const mockVisitors = [
    {
      id: 1,
      username: 'ana_costa',
      name: 'Ana Costa',
      avatar: 'https://picsum.photos/100/100?random=visitor1',
      visitTime: 'há 2 horas',
      isFriend: false,
      isMutualFriend: false
    },
    {
      id: 2,
      username: 'joao_silva',
      name: 'João Silva',
      avatar: 'https://picsum.photos/100/100?random=visitor2',
      visitTime: 'há 4 horas',
      isFriend: true,
      isMutualFriend: true
    },
    {
      id: 3,
      username: 'maria_santos',
      name: 'Maria Santos',
      avatar: 'https://picsum.photos/100/100?random=visitor3',
      visitTime: 'há 6 horas',
      isFriend: false,
      isMutualFriend: false
    },
    {
      id: 4,
      username: 'pedro_oliveira',
      name: 'Pedro Oliveira',
      avatar: 'https://picsum.photos/100/100?random=visitor4',
      visitTime: 'há 1 dia',
      isFriend: false,
      isMutualFriend: false
    },
    {
      id: 5,
      username: 'sofia_lima',
      name: 'Sofia Lima',
      avatar: 'https://picsum.photos/100/100?random=visitor5',
      visitTime: 'há 2 dias',
      isFriend: true,
      isMutualFriend: false
    },
    {
      id: 6,
      username: 'carlos_pereira',
      name: 'Carlos Pereira',
      avatar: 'https://picsum.photos/100/100?random=visitor6',
      visitTime: 'há 3 dias',
      isFriend: false,
      isMutualFriend: false
    },
    {
      id: 7,
      username: 'lucia_martins',
      name: 'Lúcia Martins',
      avatar: 'https://picsum.photos/100/100?random=visitor7',
      visitTime: 'há 1 semana',
      isFriend: true,
      isMutualFriend: true
    }
  ]

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mês' }
  ]

  const getFilteredVisitors = () => {
    // Aqui você implementaria a lógica real de filtro
    // Por agora, retorna todos os visitantes
    return mockVisitors
  }

  const handleProfileClick = (username) => {
    navigate(`/profile/${username}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold">Visitantes do Perfil</h2>
            <p className="text-gray-500 text-sm">{mockVisitors.length} pessoas visualizaram</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-2 overflow-x-auto">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === option.value
                    ? 'bg-vibe-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Visitantes */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          {getFilteredVisitors().map((visitor) => (
            <div key={visitor.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="relative">
                    <img
                      src={visitor.avatar}
                      alt={visitor.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {visitor.isMutualFriend && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-vibe-blue rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleProfileClick(visitor.username)}
                        className="font-semibold truncate hover:text-vibe-blue transition-colors text-left"
                      >
                        {visitor.name}
                      </button>
                      {visitor.isMutualFriend && (
                        <span className="text-vibe-blue text-xs bg-vibe-blue/10 px-2 py-1 rounded-full">
                          Amigos
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">@{visitor.username}</p>
                    <div className="flex items-center space-x-1 text-gray-500 text-xs mt-1">
                      <Clock size={12} />
                      <span>{visitor.visitTime}</span>
                    </div>
                  </div>
                </div>
                
                {/* Botões de Ação */}
                <div className="flex items-center space-x-2 ml-3">
                  <button className="p-2 text-vibe-blue hover:bg-vibe-blue hover:text-white rounded-full transition-colors">
                    <MessageCircle size={18} />
                  </button>
                  
                  {!visitor.isFriend ? (
                    <button className="bg-vibe-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-vibe-blue-dark transition-colors">
                      <div className="flex items-center space-x-1">
                        <UserPlus size={16} />
                        <span>Adicionar</span>
                      </div>
                    </button>
                  ) : (
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      Amigos
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Configurações de Privacidade */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Configurações de Privacidade</p>
              <p className="text-gray-500 text-xs">Controle quem pode ver seus visitantes</p>
            </div>
            <button className="text-vibe-blue text-sm font-medium">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileVisitors
