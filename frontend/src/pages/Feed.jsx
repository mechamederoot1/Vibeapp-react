import React, { useState, useEffect } from 'react'
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Repeat2, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI, storiesAPI } from '../services/api'
import PostModal from '../components/PostModal'
import CreateTestUsers from '../components/CreateTestUsers'
import StoryCreator from '../components/StoryCreator'
import DatabaseMigration from '../components/DatabaseMigration'
import ApiTester from '../components/ApiTester'

const Post = ({ post, onLike, onShare, onRepost }) => {
  const { user } = useAuth()
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleLike = async () => {
    try {
      await onLike(post.id)
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleShare = async () => {
    try {
      await onShare(post.id)
      setShowShareMenu(false)
    } catch (error) {
      console.error('Error sharing post:', error)
    }
  }

  const handleRepost = async () => {
    try {
      await onRepost(post.id)
      setShowShareMenu(false)
    } catch (error) {
      console.error('Error reposting post:', error)
    }
  }

  const timeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  return (
    <div className="bg-white mb-3 w-full max-w-full overflow-hidden relative">
      {/* Header do Post */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {post.author?.avatar ? (
            <img 
              src={post.author.avatar} 
              alt={post.author.fullName}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-vibe-blue to-vibe-blue-dark flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {post.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-sm truncate">{post.author?.fullName || 'Usuário'}</p>
              {post.author?.isVerified && (
                <div className="w-4 h-4 bg-vibe-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-gray-500 text-xs">@{post.author?.username} • {timeAgo(post.createdAt)}</p>
          </div>
        </div>
        <button className="p-1 flex-shrink-0 hover:bg-gray-100 rounded-full">
          <MoreHorizontal size={20} className="text-gray-600" />
        </button>
      </div>
      
      {/* Conteúdo do Post */}
      {post.type === 'profile_update' ? (
        <div className="mx-3 mb-3">
          <div className="bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              {post.author?.avatar ? (
                <img
                  src={post.author.avatar}
                  alt="Avatar"
                  className={`object-cover border-2 border-white ${
                    post.profileUpdateType === 'avatar' ? 'w-16 h-16 rounded-full' : 'w-20 h-12 rounded-lg'
                  }`}
                />
              ) : (
                <div className={`bg-white bg-opacity-20 flex items-center justify-center border-2 border-white ${
                  post.profileUpdateType === 'avatar' ? 'w-16 h-16 rounded-full' : 'w-20 h-12 rounded-lg'
                }`}>
                  <span className="text-white font-bold">
                    {post.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-white font-medium">
              {post.author?.fullName} {post.content}
            </p>
          </div>
        </div>
      ) : post.type === 'text' ? (
        <div className="mx-3 mb-3">
          {post.backgroundColor ? (
            <div className={`
              rounded-lg p-6 min-h-[200px] flex items-center justify-center
              ${post.backgroundColor === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                post.backgroundColor === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                post.backgroundColor === 'purple' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                post.backgroundColor === 'pink' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
                post.backgroundColor === 'orange' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                post.backgroundColor === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
                post.backgroundColor === 'vibe' ? 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' :
                post.backgroundColor === 'sunset' ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' :
                'bg-gradient-to-br from-vibe-blue-light to-vibe-blue'}
            `}>
              <p className="text-white text-xl font-medium text-center leading-relaxed break-words">
                {post.content}
              </p>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-gray-800 text-lg leading-relaxed break-words">
                {post.content}
              </p>
            </div>
          )}
        </div>
      ) : post.type === 'image' && post.imageUrl ? (
        <div className="w-full overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt="Post"
            className="w-full h-96 object-cover"
          />
        </div>
      ) : post.type === 'video' && post.videoUrl ? (
        <div className="w-full overflow-hidden">
          <video 
            src={post.videoUrl} 
            controls
            className="w-full h-96 object-cover"
          />
        </div>
      ) : null}
      
      {/* Caption para posts com mídia */}
      {post.content && post.type !== 'text' && (
        <div className="px-3 pb-3">
          <p className="text-gray-800 break-words">
            <span className="font-semibold">{post.author?.fullName}</span> {post.content}
          </p>
        </div>
      )}
      
      {/* Ações e Informações */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className="hover:scale-110 transition-transform flex items-center space-x-1"
            >
              <Heart 
                size={24} 
                className={post.isLiked ? "text-red-500 fill-current" : "text-gray-700 hover:text-red-400"}
              />
            </button>
            <button className="hover:scale-110 transition-transform flex items-center space-x-1">
              <MessageCircle size={24} className="text-gray-700 hover:text-vibe-blue" />
            </button>
            <button 
              onClick={handleRepost}
              className="hover:scale-110 transition-transform flex items-center space-x-1"
            >
              <Repeat2 size={24} className="text-gray-700 hover:text-green-500" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="hover:scale-110 transition-transform flex items-center space-x-1"
              >
                <Share size={24} className="text-gray-700 hover:text-vibe-blue" />
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[160px]">
                  <button 
                    onClick={handleShare}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Share size={16} />
                    <span>Compartilhar</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2">
                    <MessageCircle size={16} />
                    <span>Enviar por DM</span>
                  </button>
                  <button 
                    onClick={handleRepost}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Repeat2 size={16} />
                    <span>Repostar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <button className="hover:scale-110 transition-transform">
            <Bookmark size={24} className="text-gray-700 hover:text-vibe-blue" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4 mb-2">
          <p className="font-semibold text-sm">{post.likesCount.toLocaleString()} curtidas</p>
          {post.commentsCount > 0 && (
            <p className="text-gray-600 text-sm">{post.commentsCount} comentários</p>
          )}
          {post.sharesCount > 0 && (
            <p className="text-gray-600 text-sm">{post.sharesCount} compartilhamentos</p>
          )}
          {post.repostsCount > 0 && (
            <p className="text-gray-600 text-sm">{post.repostsCount} reposts</p>
          )}
        </div>
        
        {post.commentsCount > 0 && (
          <button className="text-gray-500 text-sm mb-2 hover:text-gray-700">
            Ver todos os {post.commentsCount} comentários
          </button>
        )}
      </div>
      
      {/* Overlay para fechar menu de compartilhamento */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  )
}

const Story = ({ user, hasStory = false, hasUnviewed = false, storiesCount = 0 }) => (
  <div className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform">
    <div className={`w-16 h-16 rounded-full p-0.5 ${
      hasUnviewed
        ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
        : hasStory
        ? 'bg-gradient-to-tr from-gray-300 to-gray-400'
        : 'bg-gray-300'
    }`}>
      <div className="w-full h-full rounded-full border-2 border-white bg-white p-0.5">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-r from-vibe-blue to-vibe-blue-dark flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
      </div>
    </div>
    <span className="text-xs text-gray-600 max-w-[60px] truncate text-center">
      {user?.firstName || 'Usuário'}
    </span>
    {storiesCount > 1 && (
      <span className="text-xs text-gray-400">
        {storiesCount} stories
      </span>
    )}
  </div>
)

const Stories = ({ onOpenStoryCreator }) => {
  const { user } = useAuth()
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStories = async () => {
      try {
        const response = await storiesAPI.getStories()
        setStories(response.data.storiesByAuthor || [])
      } catch (error) {
        console.error('Error loading stories:', error)
        // Falhar silenciosamente e continuar sem stories
        setStories([])
      } finally {
        setLoading(false)
      }
    }

    loadStories()
  }, [])

  return (
    <div className="bg-white border-b border-gray-100 w-full max-w-full overflow-hidden relative">
      <div className="p-4 w-full max-w-full overflow-hidden">
        <div className="flex space-x-3 stories-scroll pb-1 w-max max-w-none" style={{overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {/* Create story button */}
          <div className="flex flex-col items-center space-y-1 flex-shrink-0">
            <button
              onClick={onOpenStoryCreator}
              className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              <div className="w-full h-full rounded-full border-2 border-white bg-white p-0.5">
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+</span>
                </div>
              </div>
            </button>
            <span className="text-xs text-gray-600 max-w-[60px] truncate text-center">
              Criar story
            </span>
          </div>

          {/* User stories */}
          {stories.map((storyGroup, index) => (
            <Story
              key={index}
              user={storyGroup.author}
              hasStory={true}
              hasUnviewed={storyGroup.hasUnviewed}
              storiesCount={storyGroup.stories.length}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const Feed = ({ isPostModalOpen, onClosePostModal, onOpenPostModal }) => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [showStoryCreator, setShowStoryCreator] = useState(false)

  const loadFeed = async () => {
    try {
      setLoading(true)
      const response = await postsAPI.getFeed(page)
      setPosts(response.data.posts || [])
    } catch (error) {
      console.error('Error loading feed:', error)
      setError('Erro ao carregar feed')
    } finally {
      setLoading(false)
    }
  }

  const handleLikePost = async (postId) => {
    try {
      const response = await postsAPI.likePost(postId)
      // Update post in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: response.data.isLiked,
                likesCount: response.data.likesCount
              }
            : post
        )
      )
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleSharePost = async (postId) => {
    try {
      const response = await postsAPI.sharePost(postId)
      // Update post in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, sharesCount: response.data.sharesCount }
            : post
        )
      )
    } catch (error) {
      console.error('Error sharing post:', error)
    }
  }

  const handleRepostPost = async (postId) => {
    try {
      const response = await postsAPI.repostPost(postId)
      // Update post in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, repostsCount: response.data.repostsCount }
            : post
        )
      )
    } catch (error) {
      console.error('Error reposting post:', error)
    }
  }

  const handleAddPost = (newPost) => {
    setPosts([newPost, ...posts])
  }

  const handleStoryCreate = async (storyData) => {
    try {
      await storiesAPI.createStory(storyData)
      // Refresh stories would happen here
      console.log('Story created successfully')
    } catch (error) {
      console.error('Error creating story:', error)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [page])

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-full w-full max-w-full overflow-x-hidden relative">
        <Stories onOpenStoryCreator={() => setShowStoryCreator(true)} />
        <div className="flex justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-vibe-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando posts...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    // Verificar se é erro de coluna não encontrada (precisa migração)
    const needsMigration = error.includes('no such column') || error.includes('background_color') || error.includes('profile_update_type')
    // Verificar se é erro de rede/conectividade
    const isNetworkError = error.includes('Network Error') || error.includes('ERR_NETWORK') || error.includes('CORS')

    return (
      <div className="bg-gray-50 min-h-full w-full max-w-full overflow-x-hidden relative">
        <div className="flex justify-center py-8">
          <div className="space-y-6 max-w-md w-full px-4">
            {needsMigration ? (
              <>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Atualização do Banco Necessária
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    O banco de dados precisa ser atualizado com as novas funcionalidades.
                  </p>
                </div>
                <DatabaseMigration />
              </>
            ) : isNetworkError ? (
              <>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Problema de Conectividade
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Não foi possível conectar com o servidor backend.
                  </p>
                </div>
                <ApiTester />
              </>
            ) : (
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadFeed}
                  className="bg-vibe-blue text-white px-4 py-2 rounded-lg hover:bg-vibe-blue-dark"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gray-50 min-h-full w-full max-w-full overflow-x-hidden relative">
        <Stories onOpenStoryCreator={() => setShowStoryCreator(true)} />
        <div className="pb-safe w-full max-w-full">
          {posts.length === 0 ? (
            <div className="space-y-8 p-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum post ainda</h3>
                <p className="text-gray-500 mb-4">
                  Seja o primeiro a compartilhar algo! Clique no botão + para criar seu primeiro post.
                </p>
                <button
                  onClick={onOpenPostModal}
                  className="bg-vibe-blue text-white px-6 py-2 rounded-lg hover:bg-vibe-blue-dark"
                >
                  Criar primeiro post
                </button>
              </div>

              {/* Componente para criar usuários teste */}
              <div className="border-t border-gray-200 pt-8">
                <CreateTestUsers />
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <Post 
                key={post.id} 
                post={post}
                onLike={handleLikePost}
                onShare={handleSharePost}
                onRepost={handleRepostPost}
              />
            ))
          )}
        </div>
      </div>

      <PostModal
        isOpen={isPostModalOpen}
        onClose={onClosePostModal}
        onPost={handleAddPost}
      />

      <StoryCreator
        isOpen={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
        onStoryCreate={handleStoryCreate}
      />
    </>
  )
}

export default Feed
