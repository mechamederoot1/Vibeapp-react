import React from 'react'
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal } from 'lucide-react'

const Post = ({ user, image, caption, likes, time }) => (
  <div className="card mb-4 mx-4">
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">{user[0]}</span>
        </div>
        <div>
          <p className="font-semibold text-sm">{user}</p>
          <p className="text-gray-500 text-xs">{time}</p>
        </div>
      </div>
      <button className="p-1">
        <MoreHorizontal size={20} className="text-gray-600" />
      </button>
    </div>
    
    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
      <span className="text-gray-400">📸 {image}</span>
    </div>
    
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4">
          <button className="hover:scale-110 transition-transform">
            <Heart size={24} className="text-gray-700" />
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
      
      <p className="font-semibold text-sm mb-1">{likes} curtidas</p>
      <p className="text-sm">
        <span className="font-semibold">{user}</span> {caption}
      </p>
      <button className="text-gray-500 text-sm mt-1">
        Ver todos os comentários
      </button>
    </div>
  </div>
)

const Stories = () => (
  <div className="flex space-x-3 p-4 overflow-x-auto">
    <div className="flex flex-col items-center space-y-1 flex-shrink-0">
      <div className="w-16 h-16 bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-full flex items-center justify-center border-2 border-white">
        <span className="text-white font-bold text-lg">+</span>
      </div>
      <span className="text-xs text-gray-600">Seu story</span>
    </div>
    {['Ana', 'João', 'Maria', 'Pedro', 'Sofia'].map((name, index) => (
      <div key={index} className="flex flex-col items-center space-y-1 flex-shrink-0">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center border-2 border-white">
          <span className="text-white font-bold">{name[0]}</span>
        </div>
        <span className="text-xs text-gray-600">{name}</span>
      </div>
    ))}
  </div>
)

const Feed = () => {
  const posts = [
    {
      user: 'ana_silva',
      image: 'Foto na praia',
      caption: 'Aproveitando o fim de semana! 🌊☀️',
      likes: '124',
      time: '2h'
    },
    {
      user: 'joao_santos',
      image: 'Pôr do sol',
      caption: 'Que vista incrível da minha janela hoje! 🌅',
      likes: '89',
      time: '4h'
    },
    {
      user: 'maria_costa',
      image: 'Comida deliciosa',
      caption: 'Jantar especial em casa! 🍝✨',
      likes: '156',
      time: '6h'
    }
  ]

  return (
    <div className="bg-gray-50 min-h-full">
      <Stories />
      <div className="pb-4">
        {posts.map((post, index) => (
          <Post key={index} {...post} />
        ))}
      </div>
    </div>
  )
}

export default Feed
