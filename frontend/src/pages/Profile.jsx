import React, { useState } from 'react'
import { 
  Settings, Grid, Bookmark, UserPlus, MessageCircle, Eye, MoreHorizontal, 
  Camera, Users, ChevronDown, ChevronUp, EyeOff, Lock, Unlock 
} from 'lucide-react'
import FriendsList from '../components/FriendsList'
import ProfileVisitors from '../components/ProfileVisitors'

const Profile = () => {
  const [activeTab, setActiveTab] = useState('posts')
  const [showFriends, setShowFriends] = useState(false)
  const [showVisitors, setShowVisitors] = useState(false)
  const [visitorsExpanded, setVisitorsExpanded] = useState(false)
  const [friendsExpanded, setFriendsExpanded] = useState(false)
  const [privacySettings, setPrivacySettings] = useState({
    showVisitors: false,
    showFriends: true,
    profileVisibility: 'public'
  })

  const profileData = {
    username: 'maria.silva',
    name: 'Maria Silva',
    bio: 'Fotógrafa & Designer ✨\n📍 São Paulo, Brasil\n🎨 Criando memórias através das lentes\n📧 contato@mariasilva.com',
    isVerified: true,
    followers: '2.847',
    following: '892',
    posts: '156',
    profileViews: '127',
    friends: '42'
  }

  const recentVisitors = [
    { 
      id: 1, 
      username: 'ana_costa', 
      name: 'Ana Costa', 
      avatar: 'https://picsum.photos/50/50?random=visitor1', 
      time: '2h',
      hasStory: true 
    },
    { 
      id: 2, 
      username: 'joao_silva', 
      name: 'João Silva', 
      avatar: 'https://picsum.photos/50/50?random=visitor2', 
      time: '4h',
      hasStory: false 
    },
    { 
      id: 3, 
      username: 'pedro_oliveira', 
      name: 'Pedro Oliveira', 
      avatar: 'https://picsum.photos/50/50?random=visitor3', 
      time: '1d',
      hasStory: true 
    },
    { 
      id: 4, 
      username: 'sofia_lima', 
      name: 'Sofia Lima', 
      avatar: 'https://picsum.photos/50/50?random=visitor4', 
      time: '2h',
      hasStory: false 
    },
    { 
      id: 5, 
      username: 'carlos_pereira', 
      name: 'Carlos Pereira', 
      avatar: 'https://picsum.photos/50/50?random=visitor5', 
      time: '5h',
      hasStory: true 
    },
  ]

  const recentFriends = [
    { 
      id: 1, 
      username: 'sofia_lima', 
      name: 'Sofia Lima', 
      avatar: 'https://picsum.photos/50/50?random=friend1', 
      mutualFriends: 8,
      hasStory: true 
    },
    { 
      id: 2, 
      username: 'carlos_pereira', 
      name: 'Carlos Pereira', 
      avatar: 'https://picsum.photos/50/50?random=friend2', 
      mutualFriends: 12,
      hasStory: false 
    },
    { 
      id: 3, 
      username: 'lucia_martins', 
      name: 'Lucia Martins', 
      avatar: 'https://picsum.photos/50/50?random=friend3', 
      mutualFriends: 5,
      hasStory: true 
    },
    { 
      id: 4, 
      username: 'ana_costa', 
      name: 'Ana Costa', 
      avatar: 'https://picsum.photos/50/50?random=friend4', 
      mutualFriends: 15,
      hasStory: true 
    },
    { 
      id: 5, 
      username: 'joao_silva', 
      name: 'João Silva', 
      avatar: 'https://picsum.photos/50/50?random=friend5', 
      mutualFriends: 3,
      hasStory: false 
    },
  ]

  const posts = Array(12).fill(null).map((_, index) => ({
    id: index,
    type: index % 5 === 0 ? 'video' : 'image',
    likes: Math.floor(Math.random() * 500) + 50,
    comments: Math.floor(Math.random() * 50) + 5,
    thumbnail: `https://picsum.photos/400/400?random=${index}`
  }))

  const stories = [
    { id: 1, title: 'Highlights', image: 'https://picsum.photos/100/100?random=story1' },
    { id: 2, title: 'Viagem', image: 'https://picsum.photos/100/100?random=story2' },
    { id: 3, title: 'Trabalho', image: 'https://picsum.photos/100/100?random=story3' },
    { id: 4, title: 'Casa', image: 'https://picsum.photos/100/100?random=story4' },
  ]

  const toggleVisitorsPrivacy = () => {
    setPrivacySettings(prev => ({
      ...prev,
      showVisitors: !prev.showVisitors
    }))
  }

  const AvatarWithStory = ({ user, size = 'md', className = '' }) => {
    const sizeClasses = {
      sm: 'w-12 h-12',
      md: 'w-14 h-14',
      lg: 'w-16 h-16'
    }
    
    return (
      <div className={`flex flex-col items-center space-y-1 ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full p-0.5 ${
          user.hasStory 
            ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' 
            : 'bg-gray-300'
        }`}>
          <div className="w-full h-full rounded-full border-2 border-white bg-white p-0.5">
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>
        <span className="text-xs text-gray-600 max-w-[60px] truncate text-center">
          {user.name.split(' ')[0]}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-xl font-bold">{profileData.username}</h2>
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal size={24} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Settings size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Capa do Perfil */}
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-vibe-blue via-vibe-blue-light to-purple-300 relative">
          <img 
            src="https://picsum.photos/400/200?random=cover" 
            alt="Capa do perfil"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Botão de trocar capa */}
          <button className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all">
            <Camera size={20} />
          </button>
        </div>
        
        {/* Avatar centralizado sobrepondo a capa */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white p-1">
              <img
                src="https://picsum.photos/200/200?random=avatar"
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-vibe-blue rounded-full flex items-center justify-center border-2 border-white hover:bg-vibe-blue-dark transition-colors">
              <Camera size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Informações do Perfil */}
      <div className="pt-16 px-4 relative z-0">
        {/* Nome e verificação */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <h1 className="text-xl font-bold">{profileData.name}</h1>
            {profileData.isVerified && (
              <div className="w-5 h-5 bg-vibe-blue rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">@{profileData.username}</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center space-x-6 mb-6">
          <div className="text-center min-w-[60px]">
            <p className="font-bold text-lg">{profileData.posts}</p>
            <p className="text-gray-600 text-sm">Posts</p>
          </div>
          <button
            onClick={() => setShowFriends(true)}
            className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors min-w-[80px]"
          >
            <p className="font-bold text-lg">{profileData.followers}</p>
            <p className="text-gray-600 text-sm">Seguidores</p>
          </button>
          <button
            onClick={() => setShowFriends(true)}
            className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors min-w-[70px]"
          >
            <p className="font-bold text-lg">{profileData.following}</p>
            <p className="text-gray-600 text-sm">Seguindo</p>
          </button>
        </div>

        {/* Bio */}
        <div className="text-center mb-6">
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
            {profileData.bio}
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex space-x-2 mb-6">
          <button className="btn-primary flex-1">
            Editar Perfil
          </button>
          <button 
            onClick={() => setShowFriends(true)}
            className="btn-secondary px-4"
          >
            <Users size={20} />
          </button>
          <button className="btn-secondary px-4">
            <MessageCircle size={20} />
          </button>
        </div>

        {/* Seção de Visitantes do Perfil */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg">
            <div className="w-full p-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye size={20} className="text-vibe-blue" />
                <span className="font-medium">Quem visualizou meu perfil</span>
                <button
                  onClick={toggleVisitorsPrivacy}
                  className="p-1 hover:bg-white rounded-full"
                  title={privacySettings.showVisitors ? "Ocultar visitantes" : "Mostrar visitantes"}
                >
                  {privacySettings.showVisitors ? (
                    <Eye size={16} className="text-vibe-blue" />
                  ) : (
                    <EyeOff size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setVisitorsExpanded(!visitorsExpanded)}
                className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <span className="text-vibe-blue font-semibold">{profileData.profileViews} pessoas</span>
                {visitorsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            
            {visitorsExpanded && privacySettings.showVisitors && (
              <div className="px-3 pb-3">
                {/* Avatares dos visitantes lado a lado */}
                <div className="flex space-x-3 overflow-x-auto pb-2 mb-3">
                  {recentVisitors.map((visitor) => (
                    <AvatarWithStory 
                      key={visitor.id} 
                      user={visitor} 
                      size="sm"
                      className="flex-shrink-0"
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setShowVisitors(true)}
                  className="w-full text-center text-vibe-blue text-sm font-medium py-2 hover:bg-white rounded-lg"
                >
                  Ver todos os visitantes
                </button>
              </div>
            )}
            
            {visitorsExpanded && !privacySettings.showVisitors && (
              <div className="px-3 pb-3 text-center">
                <div className="py-4">
                  <Lock size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Visitantes do perfil estão ocultos</p>
                  <p className="text-gray-400 text-xs">Clique no ícone acima para mostrar</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Amigos */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg">
            <button 
              onClick={() => setFriendsExpanded(!friendsExpanded)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users size={20} className="text-vibe-blue" />
                <span className="font-medium">Amigos</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-vibe-blue font-semibold">{profileData.friends} amigos</span>
                {friendsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {friendsExpanded && (
              <div className="px-3 pb-3">
                {/* Avatares dos amigos lado a lado */}
                <div className="flex space-x-3 overflow-x-auto pb-2 mb-3">
                  {recentFriends.map((friend) => (
                    <AvatarWithStory 
                      key={friend.id} 
                      user={friend} 
                      size="sm"
                      className="flex-shrink-0"
                    />
                  ))}
                </div>
                <button 
                  onClick={() => setShowFriends(true)}
                  className="w-full text-center text-vibe-blue text-sm font-medium py-2 hover:bg-white rounded-lg"
                >
                  Ver todos os amigos
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stories/Highlights */}
        <div className="mb-6">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {/* Adicionar novo story */}
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center">
                <span className="text-gray-400 text-2xl">+</span>
              </div>
              <span className="text-xs text-gray-600">Novo</span>
            </div>
            
            {/* Stories salvos */}
            {stories.map((story) => (
              <div key={story.id} className="flex flex-col items-center space-y-2 flex-shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-gray-300 p-0.5">
                  <img 
                    src={story.image} 
                    alt={story.title}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="text-xs text-gray-600 max-w-[60px] truncate">
                  {story.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 p-3 flex items-center justify-center ${
            activeTab === 'posts' 
              ? 'border-b-2 border-gray-900 text-gray-900' 
              : 'text-gray-500'
          }`}
        >
          <Grid size={20} />
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 p-3 flex items-center justify-center ${
            activeTab === 'saved' 
              ? 'border-b-2 border-gray-900 text-gray-900' 
              : 'text-gray-500'
          }`}
        >
          <Bookmark size={20} />
        </button>
      </div>

      {/* Grid de Posts */}
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <div key={post.id} className="relative aspect-square">
            <img 
              src={post.thumbnail} 
              alt={`Post ${post.id}`}
              className="w-full h-full object-cover"
            />
            {post.type === 'video' && (
              <div className="absolute top-2 right-2">
                <div className="bg-black bg-opacity-60 rounded px-1.5 py-0.5">
                  <span className="text-white text-xs">▶</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex items-center space-x-4 text-white">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">❤️</span>
                  <span className="text-sm font-semibold">{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">💬</span>
                  <span className="text-sm font-semibold">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showFriends && (
        <FriendsList 
          onClose={() => setShowFriends(false)}
        />
      )}
      
      {showVisitors && (
        <ProfileVisitors 
          onClose={() => setShowVisitors(false)}
        />
      )}
    </div>
  )
}

export default Profile
