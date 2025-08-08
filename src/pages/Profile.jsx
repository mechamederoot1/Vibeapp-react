import React, { useState } from 'react'
import { Settings, Grid, Bookmark, UserPlus, MessageCircle, Eye } from 'lucide-react'

const Profile = () => {
  const [activeTab, setActiveTab] = useState('posts')

  const stats = [
    { label: 'Posts', value: '127' },
    { label: 'Seguidores', value: '2.5k' },
    { label: 'Seguindo', value: '456' },
  ]

  const posts = Array(12).fill(null).map((_, index) => ({
    id: index,
    image: `Post ${index + 1}`,
    likes: Math.floor(Math.random() * 200) + 20
  }))

  return (
    <div className="bg-white min-h-full">
      {/* Header do Perfil */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">meu_perfil</h2>
          <Settings size={24} className="text-gray-600" />
        </div>

        {/* Foto de Perfil e Stats */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-r from-vibe-blue to-vibe-blue-dark rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-around">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="font-bold text-lg">{stat.value}</p>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="mb-4">
          <h3 className="font-semibold">Vibe User</h3>
          <p className="text-gray-600 text-sm">
            Vivendo a vida com estilo ✨<br/>
            📍 São Paulo, Brasil<br/>
            🌟 Compartilhando momentos especiais
          </p>
        </div>

        {/* Capa do Perfil */}
        <div className="mb-4">
          <div className="w-full h-32 bg-gradient-to-r from-vibe-blue-light to-vibe-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold">Capa do Perfil</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex space-x-2 mb-4">
          <button className="btn-primary flex-1">
            Editar Perfil
          </button>
          <button className="btn-secondary px-4">
            <UserPlus size={20} />
          </button>
          <button className="btn-secondary px-4">
            <MessageCircle size={20} />
          </button>
        </div>

        {/* Quem Visualizou */}
        <button className="w-full p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye size={20} className="text-vibe-blue" />
            <span className="font-medium">Quem visualizou meu perfil</span>
          </div>
          <span className="text-vibe-blue font-semibold">23 pessoas</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 p-3 flex items-center justify-center ${
            activeTab === 'posts' 
              ? 'border-b-2 border-vibe-blue text-vibe-blue' 
              : 'text-gray-500'
          }`}
        >
          <Grid size={20} />
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 p-3 flex items-center justify-center ${
            activeTab === 'saved' 
              ? 'border-b-2 border-vibe-blue text-vibe-blue' 
              : 'text-gray-500'
          }`}
        >
          <Bookmark size={20} />
        </button>
      </div>

      {/* Grid de Posts */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {posts.map((post) => (
          <div key={post.id} className="aspect-square bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-xs">📸</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Profile
