import React, { useState, useEffect } from 'react'
import {
  Settings, Grid, Bookmark, UserPlus, MessageCircle, Eye, MoreHorizontal,
  Camera, Users, ChevronDown, ChevronUp, EyeOff, Lock, Unlock, List, Heart,
  MessageCircle as MessageCircleIcon, Share, Repeat2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI, postsAPI, uploadsAPI } from '../services/api'
import FriendsList from '../components/FriendsList'
import ProfileVisitors from '../components/ProfileVisitors'
import ProfileEditModal from '../components/ProfileEditModal'
import ImageUpload from '../components/ImageUpload'

const Profile = () => {
  const { user, setUser } = useAuth()
  const [activeTab, setActiveTab] = useState('posts')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showFriends, setShowFriends] = useState(false)
  const [showVisitors, setShowVisitors] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [visitorsExpanded, setVisitorsExpanded] = useState(false)
  const [friendsExpanded, setFriendsExpanded] = useState(false)

  // Estados para upload
  const [uploading, setUploading] = useState({
    avatar: false,
    cover: false
  })
  const [uploadError, setUploadError] = useState(null)

  // Real data from backend
  const [userStats, setUserStats] = useState({
    friendsCount: 0,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    profileViewsCount: 0
  })
  const [userPosts, setUserPosts] = useState([])
  const [profileVisitors, setProfileVisitors] = useState([])
  const [loading, setLoading] = useState(true)

  const [privacySettings, setPrivacySettings] = useState({
    showVisitors: false,
    showFriends: true,
    profileVisibility: 'public'
  })

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)

        // Load user stats
        const statsResponse = await usersAPI.getUserStats(user.id)
        setUserStats(statsResponse.data)

        // Load user posts
        const postsResponse = await postsAPI.getUserPosts(user.id)
        setUserPosts(postsResponse.data.posts || [])

        // Load profile visitors (only if user wants to show them)
        if (privacySettings.showVisitors) {
          try {
            const visitorsResponse = await usersAPI.getProfileVisitors(user.id)
            setProfileVisitors(visitorsResponse.data || [])
          } catch (error) {
            // User might not have permission to see visitors
            console.log('Could not load visitors:', error.response?.data?.detail)
          }
        }

      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user?.id, privacySettings.showVisitors])

  // Use real user data from auth context, fallback to defaults
  const profileData = {
    username: user?.username || user?.email?.split('@')[0] || 'usuario',
    name: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuário',
    bio: user?.bio || 'Olá! Bem-vindo ao meu perfil no Vibe Social! ✨',
    isVerified: user?.isVerified || false,
    followers: userStats.followersCount.toString(),
    following: userStats.followingCount.toString(),
    posts: userStats.postsCount.toString(),
    profileViews: userStats.profileViewsCount.toString(),
    friends: userStats.friendsCount.toString(),
    avatar: user?.avatar,
    coverPhoto: user?.coverPhoto,
    location: user?.location,
    website: user?.website
  }

  // Real data is now loaded from backend via useEffect

  const toggleVisitorsPrivacy = () => {
    setPrivacySettings(prev => ({
      ...prev,
      showVisitors: !prev.showVisitors
    }))
  }

  // Funções de upload
  const handleAvatarUpload = async (file) => {
    setUploading(prev => ({ ...prev, avatar: true }))
    setUploadError(null)

    try {
      const response = await uploadsAPI.uploadAvatar(file)
      setUser(response.data.user)
      console.log('Avatar uploaded successfully:', response.data.message)
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error)
      setUploadError('Erro ao fazer upload do avatar. Tente novamente.')
    } finally {
      setUploading(prev => ({ ...prev, avatar: false }))
    }
  }

  const handleCoverUpload = async (file) => {
    setUploading(prev => ({ ...prev, cover: true }))
    setUploadError(null)

    try {
      const response = await uploadsAPI.uploadCover(file)
      setUser(response.data.user)
      console.log('Cover uploaded successfully:', response.data.message)
    } catch (error) {
      console.error('Erro ao fazer upload da capa:', error)
      setUploadError('Erro ao fazer upload da capa. Tente novamente.')
    } finally {
      setUploading(prev => ({ ...prev, cover: false }))
    }
  }

  const handleAvatarRemove = async () => {
    setUploading(prev => ({ ...prev, avatar: true }))
    setUploadError(null)

    try {
      const response = await uploadsAPI.removeAvatar()
      setUser(response.data.user)
      console.log('Avatar removed successfully')
    } catch (error) {
      console.error('Erro ao remover avatar:', error)
      setUploadError('Erro ao remover avatar. Tente novamente.')
    } finally {
      setUploading(prev => ({ ...prev, avatar: false }))
    }
  }

  const handleCoverRemove = async () => {
    setUploading(prev => ({ ...prev, cover: true }))
    setUploadError(null)

    try {
      const response = await uploadsAPI.removeCover()
      setUser(response.data.user)
      console.log('Cover removed successfully')
    } catch (error) {
      console.error('Erro ao remover capa:', error)
      setUploadError('Erro ao remover capa. Tente novamente.')
    } finally {
      setUploading(prev => ({ ...prev, cover: false }))
    }
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
        <ImageUpload
          type="cover"
          currentImage={profileData.coverPhoto}
          onImageSelect={handleCoverUpload}
          onImageRemove={handleCoverRemove}
          disabled={uploading.cover}
        />
        {uploading.cover && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Fazendo upload...</p>
            </div>
          </div>
        )}
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center px-4 -mt-12 mb-4 relative z-10">
        <div className="relative">
          <ImageUpload
            type="avatar"
            currentImage={profileData.avatar}
            onImageSelect={handleAvatarUpload}
            onImageRemove={handleAvatarRemove}
            disabled={uploading.avatar}
          />
          {uploading.avatar && (
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Informações do Perfil */}
      <div className="px-4">
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

        {/* Erro de upload */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm text-center">{uploadError}</p>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-500 text-xs underline block mx-auto mt-1"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setShowEditModal(true)}
            className="btn-primary flex-1"
          >
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
            <button
              onClick={() => setVisitorsExpanded(!visitorsExpanded)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Eye size={20} className="text-vibe-blue" />
                <span className="font-medium">Quem visualizou meu perfil</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVisitorsPrivacy()
                  }}
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
              <div className="flex items-center space-x-2">
                <span className="text-vibe-blue font-semibold">{profileData.profileViews} pessoas</span>
                {visitorsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {visitorsExpanded && privacySettings.showVisitors && (
              <div className="px-3 pb-3">
                {profileVisitors.length > 0 ? (
                  <>
                    {/* Avatares dos visitantes lado a lado */}
                    <div className="flex space-x-3 overflow-x-auto pb-2 mb-3">
                      {profileVisitors.slice(0, 5).map((visitorData, index) => (
                        <AvatarWithStory
                          key={index}
                          user={{
                            id: visitorData.user.id,
                            name: visitorData.user.fullName,
                            username: visitorData.user.username,
                            avatar: visitorData.user.avatar,
                            hasStory: false // Real stories would come from another API
                          }}
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
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Eye size={24} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum visitante ainda</p>
                  </div>
                )}
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

        {/* Divisor entre seções */}
        <div className="border-t border-gray-200 my-6"></div>

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
                <div className="text-center py-4">
                  <Users size={24} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Sistema de amizades em desenvolvimento</p>
                  <p className="text-gray-400 text-xs">Em breve você poderá conectar-se com outros usuários!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stories/Highlights */}
        <div className="mb-6">
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {/* Adicionar novo destaque */}
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center hover:border-vibe-blue hover:bg-gray-50 transition-colors cursor-pointer">
                <span className="text-gray-400 text-2xl">+</span>
              </div>
              <span className="text-xs text-gray-600">Novo</span>
            </div>

            {/* Mensagem quando não há destaques */}
            <div className="flex-1 flex items-center justify-center py-4">
              <p className="text-gray-500 text-sm">Nenhum destaque ainda. Crie stories para adicioná-los aqui!</p>
            </div>
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

        {/* View Mode Toggle */}
        {activeTab === 'posts' && (
          <div className="flex items-center px-3 space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Visualização em grade"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Visualização em lista"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Posts Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-vibe-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando posts...</p>
          </div>
        </div>
      ) : userPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Grid size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum post ainda</h3>
          <p className="text-gray-500">
            Compartilhe seus primeiros momentos no Vibe Social!
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid de Posts */
        <div className="grid grid-cols-3 gap-1">
          {userPosts.map((post) => (
            <div key={post.id} className="relative aspect-square">
              {post.type === 'text' ? (
                <div className={`
                  w-full h-full flex items-center justify-center p-4
                  ${post.backgroundColor === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                    post.backgroundColor === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                    post.backgroundColor === 'purple' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                    post.backgroundColor === 'pink' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                    post.backgroundColor === 'orange' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    post.backgroundColor === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                    post.backgroundColor === 'vibe' ? 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' :
                    post.backgroundColor === 'sunset' ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' :
                    post.backgroundColor ? 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' :
                    'bg-gray-100 border-2 border-gray-200'}
                `}>
                  <p className={`
                    text-sm text-center font-medium line-clamp-4
                    ${post.backgroundColor ? 'text-white' : 'text-gray-800'}
                  `}>
                    {post.content}
                  </p>
                </div>
              ) : post.type === 'image' && post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt={`Post ${post.id}`}
                  className="w-full h-full object-cover"
                />
              ) : post.type === 'video' && post.videoUrl ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-xl">▶</span>
                    </div>
                    <span className="text-xs">Vídeo</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Post</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex items-center space-x-4 text-white">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">❤️</span>
                    <span className="text-sm font-semibold">{post.likesCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">💬</span>
                    <span className="text-sm font-semibold">{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Lista de Posts */
        <div className="space-y-6">
          {userPosts.map((post) => (
            <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Header do Post */}
              <div className="flex items-center p-4 pb-3">
                {profileData.avatar ? (
                  <div className="w-10 h-10 rounded-full border-2 border-vibe-blue p-0.5">
                    <img
                      src={profileData.avatar}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-vibe-blue bg-vibe-blue flex items-center justify-center">
                    <span className="text-white font-bold">
                      {profileData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="ml-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{profileData.name}</h4>
                    {profileData.isVerified && (
                      <div className="w-4 h-4 bg-vibe-blue rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">@{profileData.username} • {new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Conteúdo do Post */}
              {post.content && (
                <div className="px-4 pb-3">
                  <p className="text-gray-800">{post.content}</p>
                </div>
              )}

              {/* Mídia do Post */}
              {post.type === 'image' && post.imageUrl && (
                <div className="relative">
                  <img
                    src={post.imageUrl}
                    alt={`Post ${post.id}`}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {post.type === 'video' && post.videoUrl && (
                <div className="relative">
                  <video
                    src={post.videoUrl}
                    controls
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Ações do Post */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button className={`flex items-center space-x-2 transition-colors ${
                      post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}>
                      <Heart size={18} className={post.isLiked ? 'fill-current' : ''} />
                      <span className="text-sm font-medium">{post.likesCount}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-vibe-blue transition-colors">
                      <MessageCircleIcon size={18} />
                      <span className="text-sm font-medium">{post.commentsCount}</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                      <Repeat2 size={18} />
                      <span className="text-sm font-medium">{post.repostsCount}</span>
                    </button>
                  </div>
                  <button className="text-gray-500 hover:text-vibe-blue transition-colors">
                    <Share size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {showEditModal && (
        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

export default Profile
