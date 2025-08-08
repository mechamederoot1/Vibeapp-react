import React from 'react'
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from 'lucide-react'

const Post = ({ user, avatar, image, caption, likes, comments, time, isLiked = false, type = 'image' }) => (
  <div className="bg-white mb-3">
    {/* Header do Post */}
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center space-x-3">
        <img 
          src={avatar} 
          alt={user}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-sm">{user}</p>
          <p className="text-gray-500 text-xs">{time}</p>
        </div>
      </div>
      <button className="p-1">
        <MoreHorizontal size={20} className="text-gray-600" />
      </button>
    </div>
    
    {/* Conteúdo do Post */}
    {type === 'text' ? (
      <div className="mx-3 mb-3">
        <div className="bg-gradient-to-br from-vibe-blue-light to-vibe-blue rounded-lg p-6 min-h-[200px] flex items-center justify-center">
          <p className="text-white text-xl font-medium text-center leading-relaxed">
            {caption}
          </p>
        </div>
      </div>
    ) : (
      <div className="w-full">
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
          <button className="hover:scale-110 transition-transform">
            <Heart 
              size={24} 
              className={isLiked ? "text-red-500 fill-current" : "text-gray-700"}
            />
          </button>
          <button className="hover:scale-110 transition-transform">
            <MessageCircle size={24} className="text-gray-700" />
          </button>
          <button className="hover:scale-110 transition-transform">
            <Share size={24} className="text-gray-700" />
          </button>
        </div>
        <button className="hover:scale-110 transition-transform">
          <Bookmark size={24} className="text-gray-700" />
        </button>
      </div>
      
      <p className="font-semibold text-sm mb-1">{likes.toLocaleString()} curtidas</p>
      {type !== 'text' && (
        <p className="text-sm mb-2">
          <span className="font-semibold">{user}</span> {caption}
        </p>
      )}
      {comments > 0 && (
        <button className="text-gray-500 text-sm mb-2">
          Ver todos os {comments} comentários
        </button>
      )}
      <p className="text-gray-400 text-xs uppercase tracking-wide">{time}</p>
    </div>
  </div>
)

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
    <span className="text-xs text-gray-600 max-w-[60px] truncate">
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
    <div className="bg-white border-b border-gray-100 p-4">
      <div className="flex space-x-3 overflow-x-auto">
        {stories.map((story, index) => (
          <Story key={index} {...story} />
        ))}
      </div>
    </div>
  )
}

const Feed = () => {
  const posts = [
    {
      user: 'ana_costa',
      avatar: 'https://picsum.photos/100/100?random=user1',
      image: 'https://picsum.photos/400/500?random=1',
      caption: 'Aproveitando este lindo fim de semana na praia! 🌊☀️ Nada melhor que o som das ondas para relaxar.',
      likes: 1247,
      comments: 89,
      time: '2 horas',
      isLiked: true,
      type: 'image'
    },
    {
      user: 'pedro_oliveira',
      avatar: 'https://picsum.photos/100/100?random=user4',
      caption: 'A vida é feita de pequenos momentos que se tornam grandes memórias. Hoje estou grato por cada experiência vivida! ✨',
      likes: 892,
      comments: 156,
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
      time: '4 horas',
      isLiked: false,
      type: 'image'
    },
    {
      user: 'sofia_lima',
      avatar: 'https://picsum.photos/100/100?random=user5',
      caption: 'Às vezes a felicidade está nos detalhes mais simples. Um café quente, um livro bom e a companhia certa fazem toda a diferença! ☕📚',
      likes: 2156,
      comments: 203,
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
      time: '6 horas',
      isLiked: true,
      type: 'image'
    },
    {
      user: 'carlos_pereira',
      avatar: 'https://picsum.photos/100/100?random=user6',
      caption: 'O segredo do sucesso não está em nunca falhar, mas em nunca desistir de tentar. Cada obstáculo é uma oportunidade de crescimento! 💪',
      likes: 445,
      comments: 67,
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
      time: '12 horas',
      isLiked: true,
      type: 'image'
    }
  ]

  return (
    <div className="bg-gray-50 min-h-full">
      <Stories />
      <div className="pb-safe">
        {posts.map((post, index) => (
          <Post key={index} {...post} />
        ))}
      </div>
    </div>
  )
}

export default Feed
