import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Settings, Grid, Bookmark, UserPlus, MessageCircle, Eye, MoreHorizontal,
  Camera, Users, ChevronDown, ChevronUp, EyeOff, Lock, Unlock, List, Heart,
  MessageCircle as MessageCircleIcon, Share, Repeat2, MapPin, Briefcase,
  GraduationCap, Globe, Calendar, Heart as HeartIcon, Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI, postsAPI, uploadsAPI, personalInfoAPI, highlightsAPI, storiesAPI } from '../services/api'
import FriendsList from '../components/FriendsList'
import ProfileVisitors from '../components/ProfileVisitors'
import ProfileEditModal from '../components/ProfileEditModal'
import ImageUpload from '../components/ImageUpload'
import AvatarEditor from '../components/AvatarEditor'
import CoverEditor from '../components/CoverEditor'
import AvatarDropdown from '../components/AvatarDropdown'
import PhotoModal from '../components/PhotoModal'
import CoverDropdown from '../components/CoverDropdown'
import CoverModal from '../components/CoverModal'
import CoverViewer from '../components/CoverViewer'
import PostViewModal from '../components/PostViewModal'
import ConnectionsModal from '../components/ConnectionsModal'
import PersonalInfoEditModal from '../components/PersonalInfoEditModal'
import CreateHighlightModalV2 from '../components/CreateHighlightModalV2'
import AddToHighlightModal from '../components/AddToHighlightModal'

const AvatarWithStory = ({ user, userStories, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-16 h-16'
  }

  const hasStory = user.hasStory || (userStories && userStories.length > 0)

  return (
    <div className={`flex flex-col items-center space-y-1 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full p-0.5 ${
        hasStory
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

const Profile = () => {
  const { user, setUser } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('posts')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Estados para perfil de outros usuários
  const [profileUser, setProfileUser] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [showConnections, setShowConnections] = useState(false)
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
  const [uploadSuccess, setUploadSuccess] = useState(null)

  // Estados para modais avançados
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [showCoverEditor, setShowCoverEditor] = useState(false)
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showCoverDropdown, setShowCoverDropdown] = useState(false)
  const [showCoverModal, setShowCoverModal] = useState(false)
  const [showCoverViewer, setShowCoverViewer] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)

  // Estados para informações pessoais
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false)
  const [personalInfo, setPersonalInfo] = useState(null)
  const [personalInfoLoading, setPersonalInfoLoading] = useState(false)

  // Estados para destaques
  const [highlights, setHighlights] = useState([])
  const [showCreateHighlightModal, setShowCreateHighlightModal] = useState(false)
  const [highlightsLoading, setHighlightsLoading] = useState(false)

  // Real data from backend
  const [userStats, setUserStats] = useState({
    friendsCount: 0,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    profileViewsCount: 0
  })
  const [userPosts, setUserPosts] = useState([])
  const [userStories, setUserStories] = useState([])
  const [profileVisitors, setProfileVisitors] = useState([])
  const [loading, setLoading] = useState(true)

  const [privacySettings, setPrivacySettings] = useState({
    showVisitors: true,
    showFriends: true,
    profileVisibility: 'public'
  })
  const [viewAsVisitor, setViewAsVisitor] = useState(false)

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return

      // Determinar se é perfil próprio ou de outro usuário
      const isOwnProfile = !userId || userId === user.id.toString()
      setIsOwnProfile(isOwnProfile)

      if (!isOwnProfile) {
        // Carregar perfil de outro usuário
        setProfileLoading(true)
        try {
          const response = await usersAPI.getUserById(userId)
          setProfileUser(response.data)
        } catch (error) {
          console.error('Erro ao carregar perfil do usuário:', error)
          // Redirecionar para 404 ou mostrar erro
          navigate('/feed')
          return
        } finally {
          setProfileLoading(false)
        }
      }

      // Modo offline/demo - não fazer chamadas de API
      if (false) {
        console.log('🔧 Modo demo - usando dados mock para visualização do perfil')

        // Mock user stats
        setUserStats({
          followersCount: 1524,
          followingCount: 247,
          postsCount: 89,
          profileViewsCount: 3420,
          friendsCount: 156
        })

        // Mock profile data enhancement
        setProfileData(prev => ({
          ...prev,
          name: 'Marina Santos',
          username: 'marina_santos',
          bio: '✨ UX Designer apaixonada por criar experiências incríveis\n🎨 Formada em Design Digital pela UFPE\n����� Atualmente trabalhando na @TechCorp\n📍 Recife, PE | 🇧🇷\n💕 Em um relacionamento com João Silva\n🎯 "Design is not just what it looks like - design is how it works"',
          isVerified: true,
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
          coverPhoto: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=1200&h=400&fit=crop',
          location: 'Recife, Pernambuco, Brasil',
          website: 'marina-santos.design',
          work: 'UX Designer na TechCorp',
          education: 'Design Digital - UFPE',
          relationship: 'Em um relacionamento com João Silva',
          currentCity: 'Recife, PE'
        }))

        // Mock posts with variety
        const mockPosts = [
          {
            id: '1',
            author: {
              id: user?.id || '1',
              username: 'marina_santos',
              name: 'Marina Santos',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
              isVerified: true
            },
            content: 'Finalizando mais um projeto incrível! 🎨 Esse dashboard foi um desafio e tanto, mas o resultado ficou lindo. Obrigada ao time por toda colaboração! 💜',
            imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&h=400&fit=crop',
            createdAt: '2024-01-15T10:30:00Z',
            likes: 89,
            comments: 12,
            shares: 5,
            isLiked: true,
            type: 'image'
          },
          {
            id: '2',
            author: {
              id: user?.id || '1',
              username: 'marina_santos',
              name: 'Marina Santos',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
              isVerified: true
            },
            content: 'Sessão de fotos em família no fim de semana! ❤️ Momentos especiais assim que fazem a vida valer a pena. #família #momentos #gratidão',
            imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop',
            createdAt: '2024-01-14T16:45:00Z',
            likes: 156,
            comments: 24,
            shares: 8,
            isLiked: false,
            type: 'image'
          },
          {
            id: '3',
            author: {
              id: user?.id || '1',
              username: 'marina_santos',
              name: 'Marina Santos',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
              isVerified: true
            },
            content: 'Reflexão da semana: Como designer, sempre busco entender não apenas o que o usuário precisa, mas também o que ele sente. Empatia é a base de um bom design! 💭��',
            createdAt: '2024-01-13T09:15:00Z',
            likes: 73,
            comments: 18,
            shares: 12,
            isLiked: true,
            type: 'text'
          },
          {
            id: '4',
            author: {
              id: user?.id || '1',
              username: 'marina_santos',
              name: 'Marina Santos',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
              isVerified: true
            },
            content: 'Workshop de Design Thinking hoje foi incrível! 🚀 Compartilhar conhecimento com outros designers me energiza muito. Próximo evento já está sendo planejado!',
            imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
            createdAt: '2024-01-12T14:20:00Z',
            likes: 234,
            comments: 31,
            shares: 19,
            isLiked: true,
            type: 'image'
          },
          {
            id: '5',
            author: {
              id: user?.id || '1',
              username: 'marina_santos',
              name: 'Marina Santos',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
              isVerified: true
            },
            content: 'Alguém mais viciado em café? ☕ Essa cafeteria nova no centro virou meu escritório favorito para trabalhar remotamente!',
            imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop',
            createdAt: '2024-01-11T11:30:00Z',
            likes: 92,
            comments: 15,
            shares: 3,
            isLiked: false,
            type: 'image'
          },
          {
            id: '6',
            author: {
              id: user?.id || '1',
              username: 'marina_santos',
              name: 'Marina Santos',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
              isVerified: true
            },
            content: 'Aproveitando o sábado para relaxar na praia! 🏖️ Às vezes precisamos desacelerar para voltar com mais criatividade na segunda. #vibes #weekend',
            imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
            createdAt: '2024-01-10T17:00:00Z',
            likes: 187,
            comments: 22,
            shares: 6,
            isLiked: true,
            type: 'image'
          }
        ]

        setUserPosts(mockPosts)

        // Mock stories/highlights
        const mockStories = [
          {
            id: '1',
            title: 'Trabalho',
            imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=100&h=100&fit=crop&crop=face',
            createdAt: '2024-01-14T10:00:00Z'
          },
          {
            id: '2',
            title: 'Viagens',
            imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop',
            createdAt: '2024-01-13T15:30:00Z'
          },
          {
            id: '3',
            title: 'Momentos',
            imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=100&h=100&fit=crop&crop=face',
            createdAt: '2024-01-12T18:45:00Z'
          },
          {
            id: '4',
            title: 'Eventos',
            imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop',
            createdAt: '2024-01-11T12:20:00Z'
          }
        ]

        setUserStories(mockStories)

        // Mock profile visitors
        const mockVisitors = [
          {
            id: '1',
            username: 'joao_silva',
            name: 'João Silva',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            visitTime: '2024-01-15T10:30:00Z',
            isFriend: true,
            isMutualFriend: false
          },
          {
            id: '2',
            username: 'ana_costa',
            name: 'Ana Costa',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            visitTime: '2024-01-15T09:15:00Z',
            isFriend: false,
            isMutualFriend: true
          },
          {
            id: '3',
            username: 'carlos_dev',
            name: 'Carlos Developer',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            visitTime: '2024-01-14T16:45:00Z',
            isFriend: true,
            isMutualFriend: false
          }
        ]

        setProfileVisitors(mockVisitors)

        // Mock personal info
        const mockPersonalInfo = {
          work: {
            company: 'TechCorp',
            position: 'UX Designer',
            description: 'Responsável pelo design de experiência do usuário em produtos digitais',
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            displayText: 'UX Designer na TechCorp'
          },
          education: {
            institution: 'UFPE',
            degree: 'Design Digital',
            field: 'Design e Tecnologia',
            startDate: '2018-03-01',
            endDate: '2021-12-15',
            isCurrent: false,
            displayText: 'Design Digital - UFPE'
          },
          location: {
            currentCity: 'Recife, PE',
            hometown: 'São Paulo, SP',
            country: 'Brasil',
            displayText: 'Recife, PE'
          },
          relationship: {
            status: 'in_relationship',
            partnerName: 'João Silva',
            anniversary: '2020-02-14',
            displayText: 'Em um relacionamento com João Silva'
          },
          contact: {
            websitePersonal: 'marina-santos.design',
            websiteProfessional: null,
            phoneMobile: null,
            phoneWork: null
          },
          additional: {
            languages: 'Português, Inglês, Espanhol',
            interests: 'Design, Tecnologia, Fotografia, Viagens',
            aboutMe: 'Apaixonada por criar experiências digitais que fazem a diferença na vida das pessoas.'
          },
          privacy: {
            showWorkInfo: true,
            showEducationInfo: true,
            showLocationInfo: true,
            showRelationshipInfo: true,
            showContactInfo: false
          }
        }

        setPersonalInfo(mockPersonalInfo)

        // Mock highlights
        const mockHighlights = [
          {
            id: 1,
            title: 'Trabalho',
            coverImageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=100&h=100&fit=crop',
            storiesCount: 8,
            orderIndex: 0
          },
          {
            id: 2,
            title: 'Viagens',
            coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop',
            storiesCount: 15,
            orderIndex: 1
          },
          {
            id: 3,
            title: 'Momentos',
            coverImageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=100&h=100&fit=crop',
            storiesCount: 12,
            orderIndex: 2
          },
          {
            id: 4,
            title: 'Eventos',
            coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop',
            storiesCount: 5,
            orderIndex: 3
          }
        ]

        setHighlights(mockHighlights)
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Load user stats
        try {
          const statsResponse = await usersAPI.getUserStats(user.id)
          setUserStats(statsResponse.data)
        } catch (error) {
          console.error('Error loading user stats:', error)
          // Use default stats
          setUserStats({
            followersCount: 0,
            followingCount: 0,
            postsCount: 0,
            profileViewsCount: 0,
            friendsCount: 0
          })
        }

        // Load user posts
        try {
          const postsResponse = await postsAPI.getUserPosts(user.id)
          setUserPosts(postsResponse.data.posts || [])
        } catch (error) {
          console.error('Error loading user posts:', error)
          setUserPosts([])
        }
// Load user stories
        try {
          const storiesResponse = await storiesAPI.getUserStories(user.id)
          setUserStories(storiesResponse.data.stories || [])
          // Set hasStory flag for avatar ring
          setProfileData(prev => ({ 
            ...prev, 
            hasStory: (storiesResponse.data.total || 0) > 0 
          }))
        } catch (error) {
          console.error('Error loading user stories:', error)
          setUserStories([])
        }

        // Load profile visitors (only if user wants to show them)
        if (privacySettings.showVisitors) {
          try {
            const visitorsResponse = await usersAPI.getProfileVisitors(user.id)
            setProfileVisitors(visitorsResponse.data || [])
          } catch (error) {
            // User might not have permission to see visitors
            console.log('Could not load visitors:', error.response?.data?.detail)
            setProfileVisitors([])
          }
        }

        // Load personal info
        try {
          const personalInfoResponse = await personalInfoAPI.get()
          setPersonalInfo(personalInfoResponse.data.personalInfo || null)
        } catch (error) {
          console.error('Error loading personal info:', error)
          setPersonalInfo(null)
        }

        // Load highlights
        try {
          const highlightsResponse = await highlightsAPI.get()
          setHighlights(highlightsResponse.data.highlights || [])
        } catch (error) {
          console.error('Error loading highlights:', error)
          setHighlights([])
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
  const [profileData, setProfileData] = useState({
    username: user?.username || (user?.email ? user.email.split('@')[0] : 'usuario'),
    name: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuário',
    bio: user?.bio || 'Olá! Bem-vindo ao meu perfil no Vibe Social! ��',
    isVerified: user?.isVerified || false,
    followers: '0',
    following: '0',
    posts: '0',
    profileViews: '0',
    friends: '0',
    avatar: user?.avatar,
    coverPhoto: user?.coverPhoto,
    location: user?.location,
    website: user?.website
  })

  // Update profileData when user data changes
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        username: user.username || (user.email ? user.email.split('@')[0] : 'usuario'),
        name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuário',
        bio: user.bio || 'Olá! Bem-vindo ao meu perfil no Vibe Social! ✨',
        isVerified: user.isVerified || false,
        avatar: user.avatar,
        coverPhoto: user.coverPhoto,
        location: user.location,
        website: user.website
      }))
    }
  }, [user, userId, navigate])

  // Update profileData when userStats changes
  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      followers: (userStats.followersCount || 0).toString(),
      following: (userStats.followingCount || 0).toString(),
      posts: (userStats.postsCount || 0).toString(),
      profileViews: (userStats.profileViewsCount || 0).toString(),
      friends: (userStats.friendsCount || 0).toString()
    }))
  }, [userStats])

  // Real data is now loaded from backend via useEffect

  // Função para obter dados do perfil corretos (próprio ou de outro usuário)
  const getProfileData = () => {
    if (isOwnProfile) {
      return profileData
    } else {
      return {
        ...profileUser,
        username: profileUser?.username || 'usuario',
        name: profileUser?.fullName || profileUser?.name || 'Usuário',
        avatar: profileUser?.avatar || profileUser?.avatar_url,
        coverPhoto: profileUser?.coverPhoto,
        bio: profileUser?.bio || '',
        isVerified: profileUser?.isVerified || false,
        posts: 0, // TODO: carregar via API
        followers: 0, // TODO: carregar via API
        following: 0, // TODO: carregar via API
        profileViews: 0 // TODO: carregar via API
      }
    }
  }

  const currentProfileData = getProfileData()

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
    setUploadSuccess(null)

    try {
      const response = await uploadsAPI.uploadAvatar(file)

      // Atualizar usuário com dados mais recentes
      const updatedUser = response.data.user
      setUser(updatedUser)

      // Atualizar dados do perfil localmente
      setProfileData(prev => ({
        ...prev,
        avatar: updatedUser.avatar
      }))

      // Mostrar mensagem de sucesso
      setUploadSuccess('Foto de perfil atualizada com sucesso!')

      // Fechar o modal do editor
      setShowAvatarEditor(false)

      // Limpar mensagem após um tempo
      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)

      console.log('Avatar uploaded successfully:', response.data.message)

      // Criar post automático no feed
      try {
        await postsAPI.createPost({
          content: 'atualizou a foto do perfil',
          type: 'profile_update',
          profileUpdateType: 'avatar',
          imageUrl: updatedUser.avatar
        })
      } catch (postError) {
        console.log('Erro ao criar post de atualização:', postError)
      }
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
    setUploadSuccess(null)

    try {
      const response = await uploadsAPI.uploadCover(file)

      // Atualizar usuário com dados mais recentes
      const updatedUser = response.data.user
      setUser(updatedUser)

      // Atualizar dados do perfil localmente
      setProfileData(prev => ({
        ...prev,
        coverPhoto: updatedUser.coverPhoto
      }))

      // Mostrar mensagem de sucesso
      setUploadSuccess('Foto de capa atualizada com sucesso!')

      // Fechar o modal do editor
      setShowCoverEditor(false)

      // Limpar mensagem após um tempo
      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)

      console.log('Cover uploaded successfully:', response.data.message)

      // Criar post autom��tico no feed
      try {
        await postsAPI.createPost({
          content: 'atualizou a foto de capa',
          type: 'profile_update',
          profileUpdateType: 'cover',
          imageUrl: updatedUser.coverPhoto
        })
      } catch (postError) {
        console.log('Erro ao criar post de atualização:', postError)
      }
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

  // Funções para informações pessoais
  const handlePersonalInfoSave = async (data) => {
    setPersonalInfoLoading(true)
    try {
      const response = await personalInfoAPI.update(data)
      setPersonalInfo(response.data.personalInfo)
      setUploadSuccess('Informações pessoais atualizadas com sucesso!')

      // Limpar mensagem após um tempo
      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)
    } catch (error) {
      console.error('Erro ao salvar informações pessoais:', error)
      setUploadError('Erro ao salvar informações pessoais. Tente novamente.')
    } finally {
      setPersonalInfoLoading(false)
    }
  }

  const openPersonalInfoEditor = () => {
    setShowPersonalInfoModal(true)
  }

  // Funções para destaques
  const handleCreateHighlight = async (highlightData) => {
    setHighlightsLoading(true)
    try {
      const response = await highlightsAPI.create(highlightData)
      setHighlights(prev => [...prev, response.data.highlight])
      setUploadSuccess('Destaque criado com sucesso!')

      // Limpar mensagem após um tempo
      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)
    } catch (error) {
      console.error('Erro ao criar destaque:', error)
      setUploadError('Erro ao criar destaque. Tente novamente.')
    } finally {
      setHighlightsLoading(false)
    }
  }

  const handleAddToHighlight = async (highlightId, storyId) => {
    try {
      await highlightsAPI.addStory(highlightId, storyId)
      // Reload highlights to get updated counts
      const highlightsResponse = await highlightsAPI.get()
      setHighlights(highlightsResponse.data.highlights || [])
      setUploadSuccess('Story adicionado ao destaque!')

      setTimeout(() => {
        setUploadSuccess(null)
      }, 3000)
    } catch (error) {
      console.error('Erro ao adicionar story ao destaque:', error)
      setUploadError('Erro ao adicionar story ao destaque.')
    }
  }

  const openCreateHighlight = () => {
    setShowCreateHighlightModal(true)
  }


  // Funções para controlar os novos modais
  const handleAvatarClick = () => {
    console.log('�� Botão do avatar clicado, dropdown atual:', showAvatarDropdown)
    setShowAvatarDropdown(!showAvatarDropdown)
  }

  const handleCameraButtonClick = (e) => {
    e.stopPropagation()
    console.log('📷 Botão da câmera clicado')

    // Se usuário não tem avatar, abrir editor diretamente
    if (!profileData.avatar) {
      setShowAvatarEditor(true)
    } else {
      // Se tem avatar, abrir dropdown com opções
      setShowAvatarDropdown(!showAvatarDropdown)
    }
  }

  const handleEditAvatarFromDropdown = () => {
    setShowAvatarDropdown(false)
    setShowAvatarEditor(true)
  }

  const handleViewPhoto = () => {
    setShowAvatarDropdown(false)
    setShowPhotoModal(true)
  }

  const handleViewStory = () => {
    // TODO: implementar visualização de story
    console.log('Visualizar story do usuário')
    setShowAvatarDropdown(false)
  }

  const handleCoverClick = () => {
    console.log('Botão da capa clicado')
    // Se não há capa, abre diretamente o editor
    if (!profileData.coverPhoto) {
      setShowCoverEditor(true)
    } else {
      // Se há capa, mostra o dropdown
      setShowCoverDropdown(!showCoverDropdown)
    }
  }

  const handleEditCoverFromDropdown = () => {
    setShowCoverDropdown(false)
    setShowCoverEditor(true)
  }

  const handleViewCover = () => {
    setShowCoverDropdown(false)
    setShowCoverModal(true)
  }


  const handleEditCoverFromViewer = () => {
    setShowCoverViewer(false)
    setShowCoverEditor(true)
  }

  const handlePostClick = (post) => {
    setSelectedPost(post)
    setShowPostModal(true)
  }

  const handleClosePostModal = () => {
    setShowPostModal(false)
    setSelectedPost(null)
  }

  const handlePostUpdate = (updatedPost) => {
    setUserPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    )
  }


  return (
    <div className="bg-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-xl font-bold">{profileData.username}</h2>
        <div className="flex items-center justify-center flex-1">
          <button
            onClick={() => setViewAsVisitor(!viewAsVisitor)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              viewAsVisitor
                ? 'bg-vibe-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Eye size={16} className="inline mr-1" />
            Ver como
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal size={24} className="text-gray-600" />
          </button>
          <button
            onClick={() => {
              console.log('🔧 Botão configurações clicado')
              navigate('/settings')
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Settings size={24} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Capa do Perfil */}
      <div className="relative">
        <div 
          className="w-full h-48 relative cursor-pointer group"
          onClick={() => !uploading.cover && !viewAsVisitor && handleCoverClick()}
        >
          {profileData.coverPhoto ? (
            <>
              <img
                src={profileData.coverPhoto}
                alt="Capa do perfil"
                className="w-full h-full object-cover"
              />
              {/* Overlay para hover quando há imagem */}
              {!viewAsVisitor && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-center">
                    <Camera size={24} className="mx-auto mb-1" />
                    <p className="text-sm font-medium">Alterar capa</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              {!viewAsVisitor ? (
                <div className="text-center text-gray-600 group-hover:text-gray-800 transition-colors">
                  <Camera size={32} className="mx-auto mb-2" />
                  <p className="text-lg font-medium">Adicionar capa</p>
                  <p className="text-sm text-gray-500">Clique para escolher uma foto</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Camera size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-lg">Sem foto de capa</p>
                </div>
              )}
            </div>
          )}

          {/* Botão de opções da capa - s�� aparece se houver foto */}
          {profileData.coverPhoto && !viewAsVisitor && (
            <div className="absolute top-4 right-4">
              <button
                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all disabled:opacity-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCoverClick()
                }}
                disabled={uploading.cover}
                title={uploading.cover ? "Fazendo upload..." : "Opcoes da capa"}
              >
                <Camera size={20} />
              </button>

              <CoverDropdown
                isOpen={showCoverDropdown}
                onClose={() => setShowCoverDropdown(false)}
                user={profileData}
                onEditCover={handleEditCoverFromDropdown}
                onViewCover={handleViewCover}
              />
            </div>
          )}

          {uploading.cover && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Fazendo upload...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex justify-center px-4 -mt-12 mb-4 relative z-10">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full border-4 border-white bg-white p-1 cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg"
            onClick={handleAvatarClick}
          >
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-2xl font-bold">
                  {profileData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Botão de câmera com melhor posicionamento */}
          {!viewAsVisitor && (
            <div className="absolute bottom-1 right-1 z-20">
              <button
                className="w-8 h-8 bg-vibe-blue rounded-full flex items-center justify-center border-3 border-white hover:bg-vibe-blue-dark transition-colors shadow-lg"
                onClick={handleCameraButtonClick}
                disabled={uploading.avatar}
                title={uploading.avatar ? "Fazendo upload..." : profileData.avatar ? "Alterar foto do perfil" : "Adicionar foto do perfil"}
              >
                <Camera size={16} className="text-white" />
              </button>
            </div>
          )}

          {/* Dropdown posicionado corretamente */}
          <div className="absolute bottom-0 right-0 z-30">
            <AvatarDropdown
              isOpen={showAvatarDropdown}
              onClose={() => setShowAvatarDropdown(false)}
              user={profileData}
              hasRecentStory={false}
              onEditPhoto={handleEditAvatarFromDropdown}
              onViewStory={handleViewStory}
              onViewPhoto={handleViewPhoto}
            />
          </div>

          {uploading.avatar && (
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center z-10">
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
        <div className="flex justify-center items-center space-x-6 mb-6">
          <div className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors min-w-[80px] flex flex-col items-center">
            <p className="font-bold text-lg">{profileData.posts}</p>
            <p className="text-gray-600 text-sm">Posts</p>
          </div>
          <button
            onClick={() => setShowConnections(true)}
            className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors min-w-[80px] flex flex-col items-center"
          >
            <p className="font-bold text-lg">{profileData.followers}</p>
            <p className="text-gray-600 text-sm">Seguidores</p>
          </button>
          <button
            onClick={() => setShowConnections(true)}
            className="text-center hover:bg-gray-50 rounded-lg p-2 transition-colors min-w-[80px] flex flex-col items-center"
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
          {viewAsVisitor ? (
            /* Botões para visitante */
            <>
              <button className="btn-primary flex-1">
                <UserPlus size={20} className="mr-2" />
                Adicionar
              </button>
              <button className="btn-secondary px-4">
                <MessageCircle size={20} />
              </button>
            </>
          ) : (
            /* Botões para dono do perfil - sem mensagem */
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="btn-primary flex-1"
              >
                Editar Perfil
              </button>
              <button
                onClick={() => setShowConnections(true)}
                className="btn-secondary px-4 flex items-center space-x-2"
              >
                <Users size={20} />
                <span className="hidden sm:inline">Conexões</span>
              </button>
            </>
          )}
        </div>

        {/* Informações Pessoais */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Users size={18} className="mr-2" />
              Informações Pessoais
            </h3>
            {!viewAsVisitor && (
              <button
                onClick={openPersonalInfoEditor}
                className="text-vibe-blue hover:text-vibe-blue-dark text-sm font-medium transition-colors"
              >
                Editar
              </button>
            )}
          </div>
          <div className="space-y-3">
            {/* Experiência de trabalho - primeira das múltiplas ou campo simples */}
            {personalInfo?.workExperiences && personalInfo.workExperiences.length > 0 && personalInfo.privacy?.showWorkInfo ? (
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase size={16} className="mr-3 text-gray-500" />
                <span>{personalInfo.workExperiences[0].displayText}</span>
                {personalInfo.workExperiences.length > 1 && (
                  <span className="ml-2 text-xs text-gray-400">
                    +{personalInfo.workExperiences.length - 1} mais
                  </span>
                )}
              </div>
            ) : personalInfo?.work?.displayText && personalInfo.privacy?.showWorkInfo && (
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase size={16} className="mr-3 text-gray-500" />
                <span>{personalInfo.work.displayText}</span>
              </div>
            )}

            {/* Formação acadêmica - primeira das múltiplas ou campo simples */}
            {personalInfo?.educationEntries && personalInfo.educationEntries.length > 0 && personalInfo.privacy?.showEducationInfo ? (
              <div className="flex items-center text-sm text-gray-600">
                <GraduationCap size={16} className="mr-3 text-gray-500" />
                <span>{personalInfo.educationEntries[0].displayText}</span>
                {personalInfo.educationEntries.length > 1 && (
                  <span className="ml-2 text-xs text-gray-400">
                    +{personalInfo.educationEntries.length - 1} mais
                  </span>
                )}
              </div>
            ) : personalInfo?.education?.displayText && personalInfo.privacy?.showEducationInfo && (
              <div className="flex items-center text-sm text-gray-600">
                <GraduationCap size={16} className="mr-3 text-gray-500" />
                <span>{personalInfo.education.displayText}</span>
              </div>
            )}

            {personalInfo?.location?.displayText && personalInfo.privacy?.showLocationInfo && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={16} className="mr-3 text-gray-500" />
                <span>{personalInfo.location.displayText}</span>
              </div>
            )}
            {personalInfo?.relationship?.displayText && personalInfo.privacy?.showRelationshipInfo && (
              <div className="flex items-center text-sm text-gray-600">
                <HeartIcon size={16} className="mr-3 text-gray-500" />
                <span>{personalInfo.relationship.displayText}</span>
              </div>
            )}
            {personalInfo?.contact?.websitePersonal && personalInfo.privacy?.showContactInfo && (
              <div className="flex items-center text-sm text-gray-600">
                <Globe size={16} className="mr-3 text-gray-500" />
                <a
                  href={personalInfo.contact.websitePersonal.startsWith('http')
                    ? personalInfo.contact.websitePersonal
                    : `https://${personalInfo.contact.websitePersonal}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vibe-blue hover:underline"
                >
                  {personalInfo.contact.websitePersonal}
                </a>
              </div>
            )}

            {/* Se não há informações para mostrar */}
            {(!personalInfo ||
              ((!personalInfo.work?.displayText && (!personalInfo.workExperiences || personalInfo.workExperiences.length === 0)) || !personalInfo.privacy?.showWorkInfo) &&
              ((!personalInfo.education?.displayText && (!personalInfo.educationEntries || personalInfo.educationEntries.length === 0)) || !personalInfo.privacy?.showEducationInfo) &&
              (!personalInfo.location?.displayText || !personalInfo.privacy?.showLocationInfo) &&
              (!personalInfo.relationship?.displayText || !personalInfo.privacy?.showRelationshipInfo) &&
              (!personalInfo.contact?.websitePersonal || !personalInfo.privacy?.showContactInfo)
            ) && (
              <div className="text-center py-3">
                <p className="text-gray-500 text-sm">
                  {!viewAsVisitor ? 'Adicione suas informações pessoais para que outros usuários possam conhecê-lo melhor.' : 'Nenhuma informação dispon��vel.'}
                </p>
                {!viewAsVisitor && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="text-vibe-blue hover:text-vibe-blue-dark text-sm font-medium mt-2 transition-colors"
                  >
                    Adicionar informações
                  </button>
                )}
              </div>
            )}
          </div>
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

        {/* Sucesso de upload */}
        {uploadSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-green-600 text-sm text-center">{uploadSuccess}</p>
            <button
              onClick={() => setUploadSuccess(null)}
              className="text-green-500 text-xs underline block mx-auto mt-1"
            >
              Fechar
            </button>
          </div>
        )}



        {/* Seção de Visitas Recentes - só aparece para o dono do perfil */}
        {!viewAsVisitor && (
          <div className="mb-6">
          <div className="bg-gray-50 rounded-lg">
            <button
              onClick={() => setVisitorsExpanded(!visitorsExpanded)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Eye size={20} className="text-vibe-blue" />
                <span className="font-medium">Visitas Recentes</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleVisitorsPrivacy()
                  }}
                  className="p-1 hover:bg-white rounded-full cursor-pointer"
                  title={privacySettings.showVisitors ? "Ocultar visitantes" : "Mostrar visitantes"}
                >
                  {privacySettings.showVisitors ? (
                    <Eye size={16} className="text-vibe-blue" />
                  ) : (
                    <EyeOff size={16} className="text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-vibe-blue font-semibold">{profileData.profileViews} pessoas</span>
                {visitorsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>

            {visitorsExpanded && (
              <div className="px-3 pb-3">
                {profileVisitors.length > 0 ? (
                  <div className="flex space-x-3 overflow-x-auto pb-2">
                    {profileVisitors.slice(0, 8).map((visitor) => {
                      // Calcular tempo relativo
                      const now = new Date()
                      const visitTime = new Date(visitor.visitTime)
                      const diffInMinutes = Math.floor((now - visitTime) / (1000 * 60))

                      let timeText = ''
                      if (diffInMinutes < 1) {
                        timeText = 'agora'
                      } else if (diffInMinutes < 60) {
                        timeText = `há ${diffInMinutes}min`
                      } else if (diffInMinutes < 1440) { // menos que 24 horas
                        const hours = Math.floor(diffInMinutes / 60)
                        timeText = `há ${hours}h`
                      } else {
                        const days = Math.floor(diffInMinutes / 1440)
                        timeText = `há ${days}d`
                      }

                      return (
                        <div key={visitor.id} className="flex-shrink-0 w-20 text-center">
                          <div className="w-16 h-16 rounded-full border-2 border-gray-200 p-0.5 mb-2 mx-auto hover:border-vibe-blue transition-colors cursor-pointer">
                            {visitor.avatar ? (
                              <img
                                src={visitor.avatar}
                                alt={visitor.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 text-sm font-semibold">
                                  {visitor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-600 block truncate mb-1">{visitor.name.split(' ')[0]}</span>
                          <span className="text-xs text-gray-400 block">{timeText}</span>
                        </div>
                      )
                    })}
                    {profileVisitors.length > 8 && (
                      <div className="flex-shrink-0 w-20 text-center">
                        <button
                          onClick={() => setShowVisitors(true)}
                          className="w-16 h-16 rounded-full border-2 border-gray-300 border-dashed flex flex-col items-center justify-center hover:border-vibe-blue hover:bg-gray-50 transition-colors cursor-pointer mb-2 mx-auto"
                        >
                          <span className="text-gray-400 text-sm font-semibold">+{profileVisitors.length - 8}</span>
                        </button>
                        <span className="text-xs text-gray-600">Ver mais</span>
                      </div>
                    )}
                  </div>
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
        )}

        {/* Stories/Highlights */}
        <div className="mb-6">
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Adicionar novo destaque */}
            {!viewAsVisitor && (
              <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                <button
                  onClick={openCreateHighlight}
                  className="w-16 h-16 rounded-full border-2 border-gray-300 border-dashed flex items-center justify-center hover:border-vibe-blue hover:bg-gray-50 transition-colors cursor-pointer"
                  disabled={highlightsLoading}
                >
                  <span className="text-gray-400 text-2xl">+</span>
                </button>
                <span className="text-xs text-gray-600">Novo</span>
              </div>
            )}

            {/* Destaques existentes */}
            {highlights && highlights.length > 0 ? (
              highlights.map((highlight) => (
                <div key={highlight.id} className="flex-shrink-0 w-20 text-center">
                  <button className="w-16 h-16 rounded-full border-2 border-gray-300 p-0.5 mb-2 mx-auto hover:border-vibe-blue transition-colors cursor-pointer">
                    {highlight.coverImageUrl ? (
                      <img
                        src={highlight.coverImageUrl}
                        alt={highlight.title}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-bold">
                          {highlight.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>
                  <span className="text-xs text-gray-600 truncate block">{highlight.title}</span>
                  <span className="text-xs text-gray-400">{highlight.storiesCount} stories</span>
                </div>
              ))
            ) : !viewAsVisitor ? (
              <div className="flex-1 flex items-center justify-center py-4">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Nenhum destaque ainda.</p>
                  <button
                    onClick={openCreateHighlight}
                    className="text-vibe-blue hover:text-vibe-blue-dark text-sm font-medium transition-colors"
                  >
                    Criar seu primeiro destaque
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-4">
                <p className="text-gray-500 text-sm">Este usuário não possui destaques.</p>
              </div>
            )}
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
            <div
              key={post.id}
              className="relative aspect-square cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => handlePostClick(post)}
            >
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
                    <span className="text-sm">��</span>
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
                  <p className="text-gray-500 text-sm">@{profileData.username} ��� {new Date(post.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-full">
                  <MoreHorizontal size={16} className="text-gray-500" />
                </button>
              </div>

              {/* Conte��do do Post */}
              {post.content && (
                <div className="px-4 pb-3">
                  <p className="text-gray-800">{post.content}</p>
                </div>
              )}

              {/* Mídia do Post */}
              {post.type === 'image' && post.imageUrl && (
                <div className="relative cursor-pointer" onClick={() => handlePostClick(post)}>
                  <img
                    src={post.imageUrl}
                    alt={`Post ${post.id}`}
                    className="w-full h-64 object-cover hover:opacity-95 transition-opacity"
                  />
                </div>
              )}

              {post.type === 'video' && post.videoUrl && (
                <div className="relative cursor-pointer" onClick={() => handlePostClick(post)}>
                  <video
                    src={post.videoUrl}
                    controls
                    className="w-full h-64 object-cover"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity pointer-events-none" />
                </div>
              )}

              {/* Posts com fotos de perfil/capa */}
              {post.type === 'profile_update' && post.imageUrl && (
                <div className="relative cursor-pointer" onClick={() => handlePostClick(post)}>
                  <img
                    src={post.imageUrl}
                    alt={`Atualização de ${post.profileUpdateType === 'avatar' ? 'perfil' : 'capa'}`}
                    className={`w-full object-cover hover:opacity-95 transition-opacity ${
                      post.profileUpdateType === 'avatar' ? 'h-[400px] md:h-[600px]' : 'h-64 md:h-80'
                    }`}
                  />
                </div>
              )}

              {/* Posts de texto com fundo colorido */}
              {post.type === 'text' && !post.imageUrl && (
                <div className="relative cursor-pointer" onClick={() => handlePostClick(post)}>
                  <div className={`
                    w-full h-64 flex items-center justify-center p-6
                    ${post.backgroundColor === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      post.backgroundColor === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                      post.backgroundColor === 'purple' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                      post.backgroundColor === 'pink' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                      post.backgroundColor === 'orange' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      post.backgroundColor === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                      post.backgroundColor === 'vibe' ? 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' :
                      post.backgroundColor === 'sunset' ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' :
                      'bg-gray-100'}
                    hover:opacity-95 transition-opacity
                  `}>
                    <p className={`
                      text-lg text-center font-medium leading-relaxed
                      ${post.backgroundColor ? 'text-white' : 'text-gray-800'}
                    `}>
                      {post.content}
                    </p>
                  </div>
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

      {showConnections && (
        <ConnectionsModal
          isOpen={showConnections}
          onClose={() => setShowConnections(false)}
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

      {/* Modal de Informações Pessoais */}
      <PersonalInfoEditModal
        isOpen={showPersonalInfoModal}
        onClose={() => setShowPersonalInfoModal(false)}
        personalInfo={personalInfo}
        onSave={handlePersonalInfoSave}
      />


      {/* Modal de Criar Destaque */}
      <CreateHighlightModalV2
        isOpen={showCreateHighlightModal}
        onClose={() => setShowCreateHighlightModal(false)}
        onSave={handleCreateHighlight}
        userStories={userStories}
      />

      {/* Novos modais avançados */}
      <AvatarEditor
        isOpen={showAvatarEditor}
        onClose={() => setShowAvatarEditor(false)}
        onSave={handleAvatarUpload}
        currentImage={profileData.avatar}
      />

      <CoverEditor
        isOpen={showCoverEditor}
        onClose={() => setShowCoverEditor(false)}
        onSave={handleCoverUpload}
        currentImage={profileData.coverPhoto}
      />

      <PhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        user={profileData}
      />

      <CoverModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        user={profileData}
      />

      <CoverViewer
        isOpen={showCoverViewer}
        onClose={() => setShowCoverViewer(false)}
        onEditPhoto={handleEditCoverFromViewer}
        user={user}
      />

      {/* Post View Modal */}
      <PostViewModal
        isOpen={showPostModal}
        onClose={handleClosePostModal}
        post={selectedPost}
        onPostUpdate={handlePostUpdate}
      />

    </div>
  )
}

export default Profile
