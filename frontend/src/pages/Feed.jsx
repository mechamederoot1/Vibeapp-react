import React, { useState } from 'react'
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Repeat2, UserPlus, Eye } from 'lucide-react'
import PostModal from '../components/PostModal'

const Post = ({ user, avatar, image, caption, likes, comments, shares = 0, reposts = 0, time, isLiked = false, isBookmarked = false, type = 'image', originalPost = null }) => {
  const [currentIsLiked, setCurrentIsLiked] = useState(isLiked)
  const [currentIsBookmarked, setCurrentIsBookmarked] = useState(isBookmarked)
  const [currentLikes, setCurrentLikes] = useState(likes)
  const [currentShares, setCurrentShares] = useState(shares)
  const [currentReposts, setCurrentReposts] = useState(reposts)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleLike = () => {
    setCurrentIsLiked(!currentIsLiked)
    setCurrentLikes(prev => currentIsLiked ? prev - 1 : prev + 1)
  }

  const handleBookmark = () => {
    setCurrentIsBookmarked(!currentIsBookmarked)
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
  }

  const handleRepost = () => {
    setCurrentReposts(prev => prev + 1)
    setShowShareMenu(false)
  }

  return (
    <div className="bg-white mb-3 w-full max-w-full overflow-hidden relative">
      {/* Header do Post */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <img 
            src={avatar} 
            alt={user}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-semibold text-sm truncate">{user}</p>
              {Math.random() > 0.5 && (
                <div className="w-4 h-4 bg-vibe-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-gray-500 text-xs">{time}</p>
          </div>
        </div>
        <button className="p-1 flex-shrink-0 hover:bg-gray-100 rounded-full">
          <MoreHorizontal size={20} className="text-gray-600" />
        </button>
      </div>
      
      {/* Repost indicator */}
      {originalPost && (
        <div className="px-3 pb-2">
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <Repeat2 size={14} />
            <span>{user} repostou</span>
          </div>
        </div>
      )}
      
      {/* Conteúdo do Post */}
      {type === 'text' ? (
        <div className="mx-3 mb-3">
          <div className="bg-gradient-to-br from-vibe-blue-light to-vibe-blue rounded-lg p-6 min-h-[200px] flex items-center justify-center">
            <p className="text-white text-xl font-medium text-center leading-relaxed break-words">
              {caption}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <img 
            src={image} 
            alt="Post"
            className="w-full h-96 object-cover"
          />
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
                className={currentIsLiked ? "text-red-500 fill-current" : "text-gray-700 hover:text-red-400"}
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
                onClick={handleShare}
                className="hover:scale-110 transition-transform flex items-center space-x-1"
              >
                <Share size={24} className="text-gray-700 hover:text-vibe-blue" />
              </button>
              {showShareMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[160px]">
                  <button 
                    onClick={() => {
                      setCurrentShares(prev => prev + 1)
                      setShowShareMenu(false)
                    }}
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
          <button 
            onClick={handleBookmark}
            className="hover:scale-110 transition-transform"
          >
            <Bookmark 
              size={24} 
              className={currentIsBookmarked ? "text-vibe-blue fill-current" : "text-gray-700 hover:text-vibe-blue"}
            />
          </button>
        </div>
        
        <div className="flex items-center space-x-4 mb-2">
          <p className="font-semibold text-sm">{currentLikes.toLocaleString()} curtidas</p>
          {comments > 0 && (
            <p className="text-gray-600 text-sm">{comments} comentários</p>
          )}
          {currentShares > 0 && (
            <p className="text-gray-600 text-sm">{currentShares} compartilhamentos</p>
          )}
          {currentReposts > 0 && (
            <p className="text-gray-600 text-sm">{currentReposts} reposts</p>
          )}
        </div>
        
        {type !== 'text' && (
          <p className="text-sm mb-2 break-words">
            <span className="font-semibold">{user}</span> {caption}
          </p>
        )}
        {comments > 0 && (
          <button className="text-gray-500 text-sm mb-2 hover:text-gray-700">
            Ver todos os {comments} comentários
          </button>
        )}
        <p className="text-gray-400 text-xs uppercase tracking-wide">{time}</p>
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

const Story = ({ user, avatar, isOwn = false, hasNew = true }) => (
  <div className="flex flex-col items-center space-y-1 flex-shrink-0">
    <div className={`w-16 h-16 rounded-full p-0.5 ${
      hasNew ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 'bg-gray-300'
    }`}>
      <div className="w-full h-full rounded-full border-2 border-white bg-white p-0.5">
        {isOwn ? (
          <div className="w-full h-full bg-gradient-to-br from-vibe-blue to-vibe-blue-dark rounded-full flex items-center justify-center relative">
            <span className="text-white font-bold text-lg">+</span>
          </div>
        ) : (
          <img 
            src={avatar} 
            alt={user}
            className="w-full h-full rounded-full object-cover"
          />
        )}
      </div>
    </div>
    <span className="text-xs text-gray-600 max-w-[60px] truncate text-center">
      {isOwn ? 'Seu story' : user}
    </span>
  </div>
)

const Stories = () => {
  const stories = [
    { user: 'Seu story', avatar: '', isOwn: true, hasNew: false },
    { user: 'ana_costa', avatar: 'https://picsum.photos/100/100?random=1', hasNew: true },
    { user: 'joao_silva', avatar: 'https://picsum.photos/100/100?random=2', hasNew: true },
    { user: 'maria_santos', avatar: 'https://picsum.photos/100/100?random=3', hasNew: true },
    { user: 'pedro_oliveira', avatar: 'https://picsum.photos/100/100?random=4', hasNew: false },
    { user: 'sofia_lima', avatar: 'https://picsum.photos/100/100?random=5', hasNew: true },
    { user: 'carlos_pereira', avatar: 'https://picsum.photos/100/100?random=6', hasNew: false },
    { user: 'lucia_martins', avatar: 'https://picsum.photos/100/100?random=7', hasNew: true },
  ]

  return (
    <div className="bg-white border-b border-gray-100 w-full max-w-full overflow-hidden relative">
      <div className="p-4 w-full max-w-full overflow-hidden">
        <div className="flex space-x-3 stories-scroll pb-1 w-max max-w-none" style={{overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {stories.map((story, index) => (
            <Story key={index} {...story} />
          ))}
        </div>
      </div>
    </div>
  )
}

const Feed = ({ isPostModalOpen, onClosePostModal, onOpenPostModal }) => {
  const [posts, setPosts] = useState([
    {
      user: 'ana_costa',
      avatar: 'https://picsum.photos/100/100?random=user1',
      image: 'https://picsum.photos/400/500?random=1',
      caption: 'Aproveitando este lindo fim de semana na praia! 🌊���️ Nada melhor que o som das ondas para relaxar.',
      likes: 1247,
      comments: 89,
      shares: 23,
      reposts: 12,
      time: '2 horas',
      isLiked: true,
      type: 'image'
    },
    {
      user: 'pedro_oliveira',
      avatar: 'https://picsum.photos/100/100?random=user4',
      caption: 'A vida é feita de pequenos momentos que se tornam grandes memórias. Hoje estou grato por cada experiência vivida! ✨ #gratidão #momentos #vida',
      likes: 892,
      comments: 156,
      shares: 45,
      reposts: 67,
      time: '3 horas',
      isLiked: false,
      type: 'text'
    },
    {
      user: 'joao_silva',
      avatar: 'https://picsum.photos/100/100?random=user2',
      image: 'https://picsum.photos/400/600?random=2',
      caption: 'Pôr do sol incrível hoje! 🌅 São Paulo sempre surpreende com essas vistas.',
      likes: 567,
      comments: 56,
      shares: 18,
      reposts: 9,
      time: '4 horas',
      isLiked: false,
      type: 'image'
    },
    {
      user: 'sofia_lima',
      avatar: 'https://picsum.photos/100/100?random=user5',
      caption: 'Às vezes a felicidade está nos detalhes mais simples. Um café quente, um livro bom e a companhia certa fazem toda a diferença! ☕📚 #simplicidade #felicidade',
      likes: 2156,
      comments: 203,
      shares: 89,
      reposts: 134,
      time: '5 horas',
      isLiked: true,
      type: 'text'
    },
    {
      user: 'maria_santos',
      avatar: 'https://picsum.photos/100/100?random=user3',
      image: 'https://picsum.photos/400/400?random=3',
      caption: 'Jantar especial em casa hoje! 🍝✨ Receita da vó sempre funciona.',
      likes: 1834,
      comments: 124,
      shares: 34,
      reposts: 21,
      time: '6 horas',
      isLiked: true,
      type: 'image'
    },
    {
      user: 'carlos_pereira',
      avatar: 'https://picsum.photos/100/100?random=user6',
      caption: 'O segredo do sucesso não está em nunca falhar, mas em nunca desistir de tentar. Cada obstáculo é uma oportunidade de crescimento! 💪 #motivação #sucesso #crescimento',
      likes: 445,
      comments: 67,
      shares: 156,
      reposts: 89,
      time: '8 horas',
      isLiked: false,
      type: 'text'
    },
    {
      user: 'lucia_martins',
      avatar: 'https://picsum.photos/100/100?random=user7',
      image: 'https://picsum.photos/400/500?random=7',
      caption: 'Arte urbana que encontrei caminhando pela cidade 🎨 A criatividade não tem limites!',
      likes: 923,
      comments: 92,
      shares: 27,
      reposts: 15,
      time: '12 horas',
      isLiked: true,
      type: 'image'
    },
    {
      user: 'rodrigo_santos',
      avatar: 'https://picsum.photos/100/100?random=user8',
      caption: 'Quarta-feira de reflexão: Não importa quão devagar você vá, desde que não pare. Cada passo conta na jornada! 🚶‍♂️✨ #quarta #motivação #jornada #perseverança',
      likes: 678,
      comments: 112,
      shares: 78,
      reposts: 45,
      time: '14 horas',
      isLiked: false,
      type: 'text'
    }
  ])

  const handleAddPost = (newPost) => {
    setPosts([newPost, ...posts])
  }

  return (
    <>
      <div className="bg-gray-50 min-h-full w-full max-w-full overflow-x-hidden relative">
        <Stories />
        <div className="pb-safe w-full max-w-full">
          {posts.map((post, index) => (
            <Post key={index} {...post} />
          ))}
        </div>
      </div>

      <PostModal
        isOpen={isPostModalOpen}
        onClose={onClosePostModal}
        onPost={handleAddPost}
      />
    </>
  )
}

export default Feed
