import React, { useState } from 'react'
import { Heart, MessageCircle, UserPlus, Users } from 'lucide-react'

const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all')

  const notifications = [
    {
      id: 1,
      type: 'like',
      user: 'ana_silva',
      action: 'curtiu sua foto',
      time: '2 min',
      isNew: true,
      avatar: 'A'
    },
    {
      id: 2,
      type: 'comment',
      user: 'joao_santos',
      action: 'comentou: "Que foto incrível! 😍"',
      time: '5 min',
      isNew: true,
      avatar: 'J'
    },
    {
      id: 3,
      type: 'follow',
      user: 'maria_costa',
      action: 'começou a seguir você',
      time: '10 min',
      isNew: true,
      avatar: 'M'
    },
    {
      id: 4,
      type: 'like',
      user: 'pedro_oliveira',
      action: 'curtiu sua foto',
      time: '15 min',
      isNew: false,
      avatar: 'P'
    },
    {
      id: 5,
      type: 'comment',
      user: 'sofia_lima',
      action: 'comentou: "Adorei! 🔥"',
      time: '30 min',
      isNew: false,
      avatar: 'S'
    },
    {
      id: 6,
      type: 'follow',
      user: 'carlos_pereira',
      action: 'começou a seguir você',
      time: '1h',
      isNew: false,
      avatar: 'C'
    },
    {
      id: 7,
      type: 'friend_suggestion',
      user: 'lucas_rodrigues',
      action: 'está nas suas sugestões de amizade',
      time: '2h',
      isNew: false,
      avatar: 'L'
    }
  ]

  const getIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="text-red-500 fill-current" />
      case 'comment':
        return <MessageCircle size={20} className="text-blue-500" />
      case 'follow':
        return <UserPlus size={20} className="text-vibe-blue" />
      case 'friend_suggestion':
        return <Users size={20} className="text-purple-500" />
      default:
        return <Heart size={20} className="text-gray-500" />
    }
  }

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.isNew)

  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold">Notificações</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 p-3 text-center font-medium ${
            activeTab === 'all'
              ? 'border-b-2 border-vibe-blue text-vibe-blue'
              : 'text-gray-500'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 p-3 text-center font-medium ${
            activeTab === 'new'
              ? 'border-b-2 border-vibe-blue text-vibe-blue'
              : 'text-gray-500'
          }`}
        >
          Não lidas
        </button>
      </div>

      {/* Lista de Notificações */}
      <div className="divide-y divide-gray-100">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
              notification.isNew ? 'bg-blue-50' : ''
            }`}
          >
            {/* Ícone */}
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold">
                {notification.avatar}
              </span>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{notification.user}</span>
                {' '}
                <span className="text-gray-600">{notification.action}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.time}
              </p>
            </div>

            {/* Indicador de não lida */}
            {notification.isNew && (
              <div className="w-2 h-2 bg-vibe-blue rounded-full flex-shrink-0"></div>
            )}

            {/* Botão de ação (para follows) */}
            {notification.type === 'follow' && (
              <button className="btn-primary text-sm px-3 py-1">
                Seguir de volta
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Mensagem quando não há notificações */}
      {filteredNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Heart size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhuma notificação nova
          </h3>
          <p className="text-gray-500 text-center">
            Quando alguém curtir ou comentar em suas fotos, você verá aqui.
          </p>
        </div>
      )}
    </div>
  )
}

export default Notifications
