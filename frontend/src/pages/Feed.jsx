import React, { useState, useEffect, useRef } from 'react'
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Repeat2, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import useWebSocket from '../hooks/useWebSocket'
import { useNavigate } from 'react-router-dom'
import { postsAPI, storiesAPI, highlightsAPI } from '../services/api'
import { isDemoMode } from '../utils/backendStatus'
import { generateDemoPosts, generateDemoStories } from '../mocks/demoData'
import PostModal from '../components/PostModal'
import SimpleStoryCreator from '../components/SimpleStoryCreator'
import StoryViewer from '../components/StoryViewer'
import ShareAsStoryModal from '../components/ShareAsStoryModal'
import ReactionPicker from '../components/ReactionPicker'
import ReactionSummary from '../components/ReactionSummary'
import ShareModal from '../components/ShareModal'

const Post = ({ post, onLike, onShare, onStoryShare, onReaction, onAvatarClick, onUpdatePost, onDeletePost }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showShareAsStory, setShowShareAsStory] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleLike = async () => {
    try {
      await onLike(post.id)
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleReaction = async (reactionType) => {
    try {
      if (onReaction) {
        await onReaction(post.id, reactionType)
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
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

  const handleAdvancedShare = async (shareData) => {
    try {
      await onShare(post.id, shareData)
      setShowShareModal(false)
    } catch (error) {
      console.error('Error sharing post:', error)
    }
  }


  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Se for hoje, mostra apenas a hora
    if (postDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Se for ontem
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (postDate.getTime() === yesterday.getTime()) {
      return `ontem às ${date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })}`
    }

    // Para datas mais antigas, mostra data e hora
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white mb-3 w-full max-w-full overflow-hidden relative">
      {/* Header do Post */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {post.author?.avatar ? (
            <button onClick={() => onAvatarClick?.(post.author)} className="flex-shrink-0">
              <img
                src={post.author.avatar}
                alt={post.author.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            </button>
          ) : (
            <button onClick={() => onAvatarClick?.(post.author)} className="w-8 h-8 rounded-full bg-gradient-to-r from-vibe-blue to-vibe-blue-dark flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {post.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <button
                onClick={() => {
                  const u = post.author || {}
                  const publicId = u.publicProfileId || u.public_profile_id
                  if (publicId) navigate(`/profile/id/${publicId}`)
                  else if (u.id) navigate(`/profile/id/${u.id}`)
                  else if (u.username) navigate(`/profile/id/${u.username}`)
                }}
                className="font-semibold text-sm truncate hover:text-vibe-blue"
              >
                {post.author?.fullName || 'Usuário'}
              </button>
              {post.author?.isVerified && (
                <div className="w-4 h-4 bg-vibe-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              <span className="text-gray-500 text-xs">
                {' - '}
                {formatDateTime(post.createdAt)}
                {post.type === 'profile_update' && (
                  <> ({post.profileUpdateType === 'avatar' ? 'atualizou a foto de perfil' : 'atualizou a foto de capa'})</>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowOptions(v => !v)}
            className="p-1 flex-shrink-0 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal size={20} className="text-gray-600" />
          </button>
          {showOptions && (
            <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[160px]">
              {user?.id === post?.author?.id && (
                <>
                  <button
                    onClick={async () => {
                      const current = post.content || ''
                      const next = window.prompt('Editar legenda do post', current)
                      if (next == null) return
                      try {
                        await onUpdatePost?.(post.id, { content: next })
                        setShowOptions(false)
                      } catch (e) {
                        console.error('Erro ao editar post:', e)
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    Editar post
                  </button>
                  <button
                    onClick={async () => {
                      if (!window.confirm('Deseja excluir este post?')) return
                      try {
                        await onDeletePost?.(post.id)
                        setShowOptions(false)
                      } catch (e) {
                        console.error('Erro ao excluir post:', e)
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Excluir post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Conteúdo do Post */}
      {post.type === 'profile_update' ? (
        <>
          {/* Legenda antes da mídia (sem repetir o nome) */}
          {post.content && (
            <div className="px-3 pb-2">
              <p className="text-gray-800 break-words">{post.content}</p>
            </div>
          )}
          <div className="px-3 pb-3">
            {/* Renderizar foto de perfil sem moldura, 828x828 (responsivo até esse limite), clicável */}
            {post.profileUpdateType === 'avatar' ? (
              post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt="Foto de perfil atualizada"
                  className="w-full max-w-[828px] aspect-square object-contain"
                  onClick={() => {
                    const m = (post.imageUrl || '').match(/\/profile\/photo\/id\/([^?&#]+)/)
                    if (m && m[1]) navigate(`/profile/photo/id/${m[1]}`)
                    else navigate(`/photo/id/${post.publicId}`)
                  }}
                />
              ) : (
                <div className="w-full max-w-[828px] aspect-square bg-gray-200" />
              )
            ) : (
              // Foto de capa - manter retangular sem moldura extra
              post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt="Foto de capa atualizada"
                  className="w-full object-contain"
                  onClick={() => {
                    const m = (post.imageUrl || '').match(/\/profile\/cover\/id\/([^?&#]+)/)
                    if (m && m[1]) navigate(`/profile/cover/id/${m[1]}`)
                    else navigate(`/photo/id/${post.publicId}`)
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-200" />
              )
            )}
          </div>
        </>
      ) : post.type === 'text' ? (
        <div
          className="mx-3 mb-3 cursor-pointer"
          onClick={() => post.publicId && navigate(`/posts/id/${post.publicId}`)}
        >
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
                ''}
            `}>
              <p className={`text-xl font-medium text-center leading-relaxed break-words ${
                post.backgroundColor ? 'text-white' : 'text-gray-800'
              }`}>
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
        <ImageClickable post={post} />
      ) : post.type === 'video' && post.videoUrl ? (
        <VideoClickable post={post} />
      ) : null}
      
      {/* Caption para posts com mídia (após a mídia para posts comuns) */}
      {post.content && post.type !== 'text' && post.type !== 'profile_update' && (
        <div className="px-3 pb-3">
          <p className="text-gray-800 break-words">{post.content}</p>
        </div>
      )}
      
      {/* Ações e Informações */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <ReactionPicker
              onReaction={handleReaction}
              isLiked={post.isLiked}
              currentReaction={post.userReaction}
              likesCount={post.likesCount}
              reactionCounts={post.reactionCounts || {}}
            />
            <button className="hover:scale-110 transition-transform flex items-center space-x-1">
              <MessageCircle size={24} className="text-gray-700 hover:text-vibe-blue" />
              {post.commentsCount > 0 && (
                <span className="text-sm text-gray-600">{post.commentsCount}</span>
              )}
            </button>
            <button
              onClick={() => setShowShareAsStory(true)}
              className="hover:scale-110 transition-transform flex items-center space-x-1"
              title="Compartilhar como Story"
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
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[180px]">
                  <button
                    onClick={() => {
                      setShowShareModal(true)
                      setShowShareMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Share size={16} />
                    <span>Compartilhar no Feed</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Repeat2 size={16} />
                    <span>Compartilhar Rápido</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowShareAsStory(true)
                      setShowShareMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Eye size={16} />
                    <span>Compartilhar como Story</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2">
                    <MessageCircle size={16} />
                    <span>Enviar por DM</span>
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
          <ReactionSummary
            reactionCounts={post.reactionCounts || {}}
            likesCount={post.likesCount}
          />
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

      {/* Share as Story Modal */}
      <ShareAsStoryModal
        isOpen={showShareAsStory}
        onClose={() => setShowShareAsStory(false)}
        post={post}
        onStoryCreate={onStoryShare}
      />

      {/* Advanced Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        onShare={handleAdvancedShare}
        currentUser={user}
      />

      {showOptions && (
        <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
      )}
    </div>
  )
}

const Story = ({ storyGroup, hasUnviewed = false, onClick }) => {
  const user = storyGroup?.author
  const stories = storyGroup?.stories || []
  // Choose a media thumbnail from published stories
  const imageStory = stories.find(s => s.type === 'image' && s.mediaUrl)
  const videoStory = stories.find(s => s.type === 'video' && s.mediaUrl)
  const hasStory = stories.length > 0
  const thumbnailUrl = imageStory?.mediaUrl || null
  const navigate = useNavigate()
  const goToProfile = () => {
    const publicId = user?.publicProfileId || user?.public_profile_id
    if (publicId) navigate(`/profile/id/${publicId}`)
    else if (user?.id) navigate(`/profile/id/${user.id}`)
    else if (user?.username) navigate(`/profile/id/${user.username}`)
  }

  return (
    <div className="flex flex-col items-center space-y-1 flex-shrink-0">
      <button
        className="w-16 h-16 rounded-full p-0.5 cursor-pointer hover:scale-105 transition-transform"
        onClick={onClick}
        aria-label="Abrir stories"
      >
        <div className={`w-full h-full rounded-full ${
          hasUnviewed
            ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
            : hasStory
            ? 'bg-gradient-to-tr from-gray-300 to-gray-400'
            : 'bg-gray-300'
        }`}>
          <div className="w-full h-full rounded-full border-2 border-white bg-white p-0.5 overflow-hidden">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={user?.fullName || 'Story'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : videoStory ? (
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-sm">▶</span>
              </div>
            ) : hasStory ? (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-vibe-blue to-vibe-blue-dark flex items-center justify-center px-1 text-center">
                <span className="text-white text-[10px] font-semibold line-clamp-2">
                  {(stories[0]?.content || 'Story')}
                </span>
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-r from-vibe-blue to-vibe-blue-dark flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
      <button
        onClick={goToProfile}
        className="text-xs text-gray-600 max-w-[60px] truncate text-center hover:text-vibe-blue"
        aria-label="Ver perfil"
      >
        {user?.firstName || 'Usuário'}
      </button>
      {stories.length > 1 && (
        <span className="text-xs text-gray-400">
          {stories.length} stories
        </span>
      )}
    </div>
  )
}

const Stories = ({ onOpenStoryCreator, stories = [], onStoryClick }) => {
  const { user } = useAuth()

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
              storyGroup={storyGroup}
              hasUnviewed={storyGroup.hasUnviewed}
              onClick={() => onStoryClick(storyGroup, 0)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const ImageClickable = ({ post }) => {
  const navigate = useNavigate()
  return (
    <div className="w-full overflow-hidden" onClick={() => navigate(`/photo/id/${post.publicId}`)}>
      <img
        src={post.imageUrl}
        alt="Post"
        className="w-full h-96 object-cover cursor-pointer"
      />
    </div>
  )
}

const VideoClickable = ({ post }) => {
  const navigate = useNavigate()
  return (
    <div className="w-full overflow-hidden" onClick={() => navigate(`/video/id/${post.publicId}`)}>
      <video
        src={post.videoUrl}
        controls
        className="w-full h-96 object-cover cursor-pointer"
      />
    </div>
  )
}

const Feed = ({ isPostModalOpen, onClosePostModal, onOpenPostModal }) => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { lastMessage } = useWebSocket()
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const endRef = useRef(null)
  const FEED_PAGE_SIZE = 10
  const [showStoryCreator, setShowStoryCreator] = useState(false)

  // Story viewer states
  const [showStoryViewer, setShowStoryViewer] = useState(false)
  const [currentUserStories, setCurrentUserStories] = useState([])
  const [stories, setStories] = useState([])
  const [initialStoryIndex, setInitialStoryIndex] = useState(0)
  const [highlights, setHighlights] = useState([])

  const loadFeed = async () => {
    if (import.meta.env.VITE_DEMO === 'true' || isDemoMode()) {
      const demo = generateDemoPosts(page, FEED_PAGE_SIZE)
      setPosts(prev => page === 1 ? demo : [...prev, ...demo])
      setLoading(false)
      setHasMore(demo.length === FEED_PAGE_SIZE)
      return
    }

    try {
      if (page === 1) setLoading(true)
      else setIsFetchingMore(true)

      const response = await postsAPI.getFeed(page, FEED_PAGE_SIZE)
      const fetched = response.data.posts || []
      setHasMore(fetched.length === FEED_PAGE_SIZE)

      if (page === 1) {
        if (user?.id) {
          try {
            const mineRes = await postsAPI.getUserPosts(user.id, 1, 20)
            const mine = mineRes.data?.posts || []
            const seen = new Set()
            const merged = [...mine, ...fetched].filter(p => {
              const key = p?.id || p?.publicId || `${p?.authorId}:${p?.createdAt}`
              if (!key || seen.has(key)) return false
              seen.add(key)
              return true
            })
            setPosts(merged)
          } catch (e) {
            setPosts(fetched)
          }
        } else {
          setPosts(fetched)
        }
      } else {
        setPosts(prev => {
          const seen = new Set(prev.map(p => p.id || p.publicId))
          const toAdd = fetched.filter(p => {
            const key = p?.id || p?.publicId
            if (!key || seen.has(key)) return false
            seen.add(key)
            return true
          })
          return [...prev, ...toAdd]
        })
      }
    } catch (error) {
      console.error('Error loading feed:', error)
      // Fallback to demo if network/backend issue
      const networkFail = !error.response
      if (networkFail) {
        const demo = generateDemoPosts(page, FEED_PAGE_SIZE)
        setPosts(prev => page === 1 ? demo : [...prev, ...demo])
        setError('')
        setHasMore(demo.length === FEED_PAGE_SIZE)
      } else {
        setError('Erro ao carregar feed')
        if (page === 1) setPosts([])
      }
    } finally {
      if (page === 1) setLoading(false)
      setIsFetchingMore(false)
    }
  }

  const loadStories = async () => {
    try {
      if (isDemoMode()) {
        setStories(generateDemoStories())
        return
      }
      const response = await storiesAPI.getStories()
      let groups = response.data.storiesByAuthor || []

      // Excluir stories que foram adicionados a Destaques do usuário atual
      try {
        if (user) {
          const hlRes = await highlightsAPI.get()
          const userHighlights = (hlRes.data?.highlights || []).map(h => ({
            ...h,
            coverImageUrl: h.coverImageUrl || h.cover_image_url || h.coverImage || h.cover_image || h.cover
          }))
          setHighlights(userHighlights)
          if (userHighlights.length > 0) {
            const idsArrays = await Promise.all(
              userHighlights.map(h => highlightsAPI.getStories(h.id).then(r => (r.data?.stories || []).map(s => s.id)).catch(() => []))
            )
            const exclude = new Set(idsArrays.flat())
            groups = groups
              .map(g => g.author?.id === user.id ? { ...g, stories: (g.stories || []).filter(s => !exclude.has(s.id)) } : g)
              .filter(g => (g.stories || []).length > 0)
          }
        }
      } catch (e) {
        console.warn('Não foi possível filtrar stories por destaques:', e)
      }

      setStories(groups)
    } catch (error) {
      console.error('Error loading stories:', error)
      setStories([])
    }
  }

  const handleLikePost = async (postId) => {
    // Optimistic toggle
    let prev
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id !== postId) return post
      prev = { isLiked: post.isLiked, likesCount: post.likesCount }
      const nextLiked = !post.isLiked
      return { ...post, isLiked: nextLiked, likesCount: post.likesCount + (nextLiked ? 1 : -1) }
    }))
    try {
      const response = await postsAPI.likePost(postId)
      setPosts(prevPosts => prevPosts.map(post => (
        post.id === postId ? { ...post, isLiked: response.data.isLiked, likesCount: response.data.likesCount } : post
      )))
    } catch (error) {
      console.error('Error liking post:', error)
      // rollback
      if (prev) {
        setPosts(prevPosts => prevPosts.map(post => (
          post.id === postId ? { ...post, ...prev } : post
        )))
      }
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

  const handleUpdatePost = async (postId, data) => {
    try {
      const res = await postsAPI.updatePost(postId, data)
      const updated = res.data
      setPosts(prev => prev.map(p => (p.id === postId ? updated : p)))
      return updated
    } catch (e) {
      console.error('Erro ao atualizar post:', e)
      throw e
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      await postsAPI.deletePost(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (e) {
      console.error('Erro ao excluir post:', e)
      throw e
    }
  }

  const handleStoryShare = async (storyData) => {
    try {
      // Story was created, reload stories
      await loadStories()
      console.log('Post compartilhado como story:', storyData)
    } catch (error) {
      console.error('Error sharing as story:', error)
    }
  }

  const handleReaction = async (postId, reactionType) => {
    // Optimistic update counts and current reaction
    let prev
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id !== postId) return post
      const current = post.userReaction
      prev = { userReaction: current, reactionCounts: { ...(post.reactionCounts || {}) } }
      const nextCounts = { ...(post.reactionCounts || {}) }
      if (current) nextCounts[current] = Math.max(0, (nextCounts[current] || 0) - 1)
      if (reactionType) nextCounts[reactionType] = (nextCounts[reactionType] || 0) + 1
      return { ...post, userReaction: reactionType || null, reactionCounts: nextCounts }
    }))
    try {
      if (reactionType) {
        await reactionsAPI.addPostReaction(postId, reactionType)
      } else {
        await reactionsAPI.removePostReaction(postId)
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
      // rollback
      if (prev) {
        setPosts(prevPosts => prevPosts.map(post => (
          post.id === postId ? { ...post, userReaction: prev.userReaction || null, reactionCounts: prev.reactionCounts } : post
        )))
      }
    }
  }

  const handleAddPost = (newPost) => {
    setPosts([newPost, ...posts])
  }

  const handleOpenStories = (storyGroup, startIndex = 0) => {
    setCurrentUserStories(storyGroup.stories || [])
    setInitialStoryIndex(startIndex)
    setShowStoryViewer(true)
  }

  const handleStoryCreate = async (created) => {
    try {
      // Após criar via SimpleStoryCreator, apenas recarregar carrossel
      await loadStories()
      console.log('Story created successfully')
    } catch (error) {
      console.error('Error creating story:', error)
    }
  }

  // Live reaction updates from WebSocket
  useEffect(() => {
    if (!lastMessage) return
    if (lastMessage.type === 'new_reaction' && lastMessage.data?.type === 'post_reaction') {
      const { postId, reactionType, user } = lastMessage.data
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p
        const nextCounts = { ...(p.reactionCounts || {}) }
        nextCounts[reactionType] = (nextCounts[reactionType] || 0) + 1
        return { ...p, reactionCounts: nextCounts }
      }))
    }
  }, [lastMessage])

  const handleAddToHighlight = async (highlightId, storyId) => {
    try {
      await highlightsAPI.addStory(highlightId, storyId)
      console.log('Story adicionado ao destaque!')
    } catch (error) {
      console.error('Erro ao adicionar story ao destaque:', error)
    }
  }

  const handleCreateHighlight = async (highlightData) => {
    try {
      const response = await highlightsAPI.create(highlightData)
      setHighlights(prev => [...prev, response.data.highlight])
      console.log('Destaque criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar destaque:', error)
    }
  }

  useEffect(() => {
    loadFeed()
    loadStories()
  }, [page])

  useEffect(() => {
    if (loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && hasMore && !isFetchingMore) {
          setPage((p) => p + 1)
        }
      },
      { root: null, rootMargin: '300px', threshold: 0 }
    )
    const el = endRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isFetchingMore, loading])

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-full w-full max-w-full overflow-x-hidden relative">
        <Stories
          onOpenStoryCreator={() => setShowStoryCreator(true)}
          stories={stories}
          onStoryClick={handleOpenStories}
        />
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
    // Verificar se é erro de rede/conectividade
    const isNetworkError = error.includes('Network Error') || error.includes('ERR_NETWORK') || error.includes('CORS') || error.includes('conectar')

    return (
      <div className="bg-gray-50 min-h-full w-full max-w-full overflow-x-hidden relative">
        <div className="flex justify-center py-8">
          <div className="space-y-6 max-w-md w-full px-4">
            {isNetworkError ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Problema de Conectividade
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Não foi possível conectar com o servidor. Tente novamente.
                </p>
                <button
                  onClick={loadFeed}
                  className="bg-vibe-blue text-white px-4 py-2 rounded-lg hover:bg-vibe-blue-dark"
                >
                  Tentar novamente
                </button>
              </div>
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
        <Stories
          onOpenStoryCreator={() => setShowStoryCreator(true)}
          stories={stories}
          onStoryClick={handleOpenStories}
        />
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

            </div>
          ) : (
            <>
              {posts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  onLike={handleLikePost}
                  onShare={handleSharePost}
                  onStoryShare={handleStoryShare}
                  onReaction={handleReaction}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                  onAvatarClick={async (author) => {
                    try {
                      const group = stories.find(g => g.author?.id === author?.id)
                      if (group && (group.stories || []).length > 0) {
                        handleOpenStories(group, 0)
                      } else if (author?.id) {
                        const res = await storiesAPI.getUserStories(author.id)
                        const userGroup = { author: res.data?.author, stories: res.data?.stories || [] }
                        if ((userGroup.stories || []).length > 0) {
                          setCurrentUserStories(userGroup.stories)
                          setInitialStoryIndex(0)
                          setShowStoryViewer(true)
                        }
                      }
                    } catch (e) {
                      console.error('Erro ao abrir stories do usuário:', e)
                    }
                  }}
                />
              ))}
              <div ref={endRef} />
              {isFetchingMore && (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-4 border-vibe-blue border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <PostModal
        isOpen={isPostModalOpen}
        onClose={onClosePostModal}
        onPost={handleAddPost}
      />

      <SimpleStoryCreator
        isOpen={showStoryCreator}
        onClose={() => setShowStoryCreator(false)}
        onStoryCreate={handleStoryCreate}
      />

      {/* Story Viewer */}
      <StoryViewer
        isOpen={showStoryViewer}
        onClose={() => setShowStoryViewer(false)}
        stories={currentUserStories}
        initialStoryIndex={initialStoryIndex}
        currentUser={user}
        highlights={highlights}
        onAddToHighlight={handleAddToHighlight}
        onCreateHighlight={handleCreateHighlight}
      />
    </>
  )
}

export default Feed
