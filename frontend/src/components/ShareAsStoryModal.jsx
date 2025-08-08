import React, { useState, useRef } from 'react'
import { X, Send, Type, Palette, Image as ImageIcon, Video } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { storiesAPI } from '../services/api'

const ShareAsStoryModal = ({ isOpen, onClose, post, onStoryCreate }) => {
  const { user } = useAuth()
  const [textOverlay, setTextOverlay] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [backgroundColor, setBackgroundColor] = useState('vibe')
  const [loading, setLoading] = useState(false)

  // Cores para texto
  const textColors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ]

  // Cores de fundo
  const backgroundOptions = [
    { name: 'Vibe', value: 'vibe', gradient: 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' },
    { name: 'Azul', value: 'blue', gradient: 'bg-gradient-to-br from-blue-400 to-blue-600' },
    { name: 'Verde', value: 'green', gradient: 'bg-gradient-to-br from-green-400 to-green-600' },
    { name: 'Roxo', value: 'purple', gradient: 'bg-gradient-to-br from-purple-400 to-purple-600' },
    { name: 'Rosa', value: 'pink', gradient: 'bg-gradient-to-br from-pink-400 to-pink-600' },
    { name: 'Laranja', value: 'orange', gradient: 'bg-gradient-to-br from-orange-400 to-orange-600' },
    { name: 'Vermelho', value: 'red', gradient: 'bg-gradient-to-br from-red-400 to-red-600' },
    { name: 'Sunset', value: 'sunset', gradient: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' }
  ]

  const handlePublish = async () => {
    if (!post) return

    setLoading(true)
    try {
      // Preparar conteúdo baseado no tipo de post
      let storyContent = ''
      let storyType = 'text'
      let mediaUrl = null

      if (post.type === 'text') {
        storyContent = `${post.content}${textOverlay ? `\n\n${textOverlay}` : ''}`
        storyType = 'text'
      } else if (post.type === 'image') {
        storyContent = textOverlay || post.content || ''
        storyType = 'image'
        mediaUrl = post.imageUrl
      } else if (post.type === 'video') {
        storyContent = textOverlay || post.content || ''
        storyType = 'video'
        mediaUrl = post.videoUrl
      }

      // Criar story
      const storyData = {
        type: storyType,
        content: storyContent,
        mediaUrl: mediaUrl,
        backgroundGradient: storyType === 'text' ? backgroundColor : null,
        privacy: 'public',
        duration: 24
      }

      const response = await storiesAPI.createStory(storyData)
      
      console.log('Story compartilhado:', response.data)
      onStoryCreate?.(response.data)
      handleClose()
    } catch (error) {
      console.error('Erro ao compartilhar como story:', error)
      alert('Erro ao compartilhar como story. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTextOverlay('')
    setTextColor('#ffffff')
    setBackgroundColor('vibe')
    onClose()
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Compartilhar como Story</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Preview */}
          <div className="relative">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
            <div className="relative aspect-[9/16] max-h-80 mx-auto bg-gray-100 rounded-lg overflow-hidden">
              {post.type === 'text' ? (
                <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
                  backgroundOptions.find(bg => bg.value === backgroundColor)?.gradient || 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark'
                }`}>
                  <p className="text-white text-center font-medium text-sm mb-4">
                    {post.content}
                  </p>
                  {textOverlay && (
                    <p 
                      className="text-center font-medium text-sm"
                      style={{ color: textColor }}
                    >
                      {textOverlay}
                    </p>
                  )}
                </div>
              ) : post.type === 'image' ? (
                <div className="relative w-full h-full">
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  {textOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p 
                        className="text-center font-medium text-lg bg-black bg-opacity-50 rounded-lg p-3"
                        style={{ color: textColor }}
                      >
                        {textOverlay}
                      </p>
                    </div>
                  )}
                </div>
              ) : post.type === 'video' ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <Video size={48} className="text-white opacity-50" />
                  <div className="absolute bottom-4 left-4 right-4">
                    {textOverlay && (
                      <p 
                        className="text-center font-medium text-sm bg-black bg-opacity-50 rounded-lg p-2"
                        style={{ color: textColor }}
                      >
                        {textOverlay}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}
              
              {/* Author info overlay */}
              <div className="absolute top-4 left-4 flex items-center space-x-2">
                {post.author?.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.fullName}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-vibe-blue border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {post.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                  @{post.author?.username || 'usuario'}
                </span>
              </div>
            </div>
          </div>

          {/* Text Overlay Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Type size={16} className="inline mr-2" />
              Adicionar texto
            </label>
            <input
              type="text"
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="Digite algo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{textOverlay.length}/100</p>
          </div>

          {/* Text Color Picker */}
          {textOverlay && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette size={16} className="inline mr-2" />
                Cor do texto
              </label>
              <div className="flex flex-wrap gap-2">
                {textColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      textColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Background Color (only for text posts) */}
          {post.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor de fundo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {backgroundOptions.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => setBackgroundColor(bg.value)}
                    className={`h-12 rounded-lg ${bg.gradient} border-2 ${
                      backgroundColor === bg.value ? 'border-gray-800' : 'border-gray-300'
                    } flex items-center justify-center`}
                  >
                    <span className="text-white text-xs font-medium">{bg.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark disabled:opacity-50"
            >
              <Send size={16} />
              <span>{loading ? 'Compartilhando...' : 'Compartilhar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareAsStoryModal
