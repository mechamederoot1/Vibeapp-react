import React, { useState } from 'react'
import { X, Camera, Type, Image as ImageIcon, MapPin, Users, Globe } from 'lucide-react'

const PostModal = ({ isOpen, onClose, onPost }) => {
  const [postType, setPostType] = useState('text')
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [privacy, setPrivacy] = useState('public')
  const [location, setLocation] = useState('')

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!content.trim() && !image) return
    
    const newPost = {
      user: 'Você',
      avatar: 'https://picsum.photos/100/100?random=user0',
      type: postType,
      caption: content,
      image: imagePreview,
      likes: 0,
      comments: 0,
      time: 'agora',
      isLiked: false
    }
    
    onPost(newPost)
    
    // Reset form
    setContent('')
    setImage(null)
    setImagePreview(null)
    setPostType('text')
    onClose()
  }

  const gradientBgs = [
    'from-blue-400 to-purple-500',
    'from-pink-400 to-red-500',
    'from-green-400 to-blue-500',
    'from-yellow-400 to-orange-500',
    'from-purple-400 to-pink-500',
    'from-indigo-400 to-purple-500'
  ]

  const [selectedGradient, setSelectedGradient] = useState(gradientBgs[0])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen">
      {/* Modal */}
      <div className="relative bg-white w-full h-full overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Criar post</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Post Type Selector */}
          <div className="flex space-x-2">
            <button
              onClick={() => setPostType('text')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                postType === 'text' 
                  ? 'bg-vibe-blue text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Type size={18} />
              <span className="text-sm font-medium">Texto</span>
            </button>
            <button
              onClick={() => setPostType('image')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                postType === 'image' 
                  ? 'bg-vibe-blue text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ImageIcon size={18} />
              <span className="text-sm font-medium">Imagem</span>
            </button>
          </div>

          {/* Text Post */}
          {postType === 'text' && (
            <div className="space-y-4">
              {/* Gradient Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fundo:</label>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {gradientBgs.map((gradient, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedGradient(gradient)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex-shrink-0 border-2 ${
                        selectedGradient === gradient ? 'border-gray-800' : 'border-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Text Preview */}
              <div className={`bg-gradient-to-br ${selectedGradient} rounded-lg p-6 min-h-[200px] flex items-center justify-center`}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="O que você está pensando?"
                  className="w-full h-full bg-transparent text-white text-xl font-medium text-center placeholder-white placeholder-opacity-80 border-none outline-none resize-none"
                  maxLength={280}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">{content.length}/280</p>
            </div>
          )}

          {/* Image Post */}
          {postType === 'image' && (
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Imagem:</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 text-sm mb-2">Adicione uma foto</p>
                      <label className="btn-primary cursor-pointer inline-block">
                        Escolher arquivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Legenda:</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva uma legenda..."
                  className="input-field h-20 resize-none"
                  maxLength={280}
                />
                <p className="text-xs text-gray-500 text-right">{content.length}/280</p>
              </div>
            </div>
          )}

          {/* Privacy & Location */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {/* Privacy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe size={18} className="text-gray-600" />
                <span className="text-sm text-gray-700">Privacidade:</span>
              </div>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="public">Público</option>
                <option value="friends">Amigos</option>
                <option value="private">Só eu</option>
              </select>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2">
              <MapPin size={18} className="text-gray-600" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Adicionar localização"
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && !image}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              (!content.trim() && !image)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-vibe-blue hover:bg-vibe-blue-dark text-white'
            }`}
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  )
}

export default PostModal
