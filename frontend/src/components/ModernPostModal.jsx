import React, { useState, useRef } from 'react'
import { X, Image, Video, Camera, Mic, BarChart3, Calendar, MapPin, Users, Smile, Send, Plus, FileText, Globe } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI } from '../services/api'

const ModernPostModal = ({ isOpen, onClose, onPost }) => {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [mediaFiles, setMediaFiles] = useState([])
  const [postType, setPostType] = useState('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  
  const fileInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const audioInputRef = useRef(null)

  const [postOptions, setPostOptions] = useState({
    location: false,
    tagPeople: false,
    privacy: 'public',
    poll: null,
    event: null
  })

  const privacyOptions = [
    { value: 'public', label: 'Público', icon: Globe },
    { value: 'friends', label: 'Amigos', icon: Users },
    { value: 'private', label: 'Apenas eu', icon: X }
  ]

  const handleFileUpload = (files, type) => {
    const newFiles = Array.from(files).map(file => ({
      file,
      type,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }))
    
    setMediaFiles(prev => [...prev, ...newFiles])
    setPostType(type)
  }

  const removeFile = (fileId) => {
    setMediaFiles(prev => prev.filter(f => f.id !== fileId))
    if (mediaFiles.length === 1) {
      setPostType('text')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && mediaFiles.length === 0) {
      setError('Por favor, adicione conteúdo ao seu post')
      return
    }

    setLoading(true)
    setError('')

    try {
      let postData = {
        content: content.trim(),
        type: postType,
        privacy: postOptions.privacy
      }

      // Handle media files (simplified - in production use proper file upload)
      if (mediaFiles.length > 0) {
        const firstFile = mediaFiles[0]
        if (firstFile.type === 'image') {
          postData.imageUrl = firstFile.preview
          postData.type = 'image'
        } else if (firstFile.type === 'video') {
          postData.videoUrl = firstFile.preview
          postData.type = 'video'
        }
      }

      const response = await postsAPI.createPost(postData)
      
      if (onPost) {
        onPost(response.data)
      }

      // Reset form
      handleClose()

    } catch (error) {
      console.error('Error creating post:', error)
      setError(error.response?.data?.detail || 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setContent('')
    setMediaFiles([])
    setPostType('text')
    setError('')
    setShowOptions(false)
    setPostOptions({
      location: false,
      tagPeople: false,
      privacy: 'public',
      poll: null,
      event: null
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Criar post</h1>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && mediaFiles.length === 0)}
          className="flex items-center space-x-2 bg-vibe-blue text-white px-6 py-2 rounded-full hover:bg-vibe-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send size={18} />
          <span>{loading ? 'Publicando...' : 'Publicar'}</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* User Info */}
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center space-x-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-vibe-blue flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{user?.fullName || 'Usuário'}</p>
              <div className="flex items-center space-x-2">
                <select
                  value={postOptions.privacy}
                  onChange={(e) => setPostOptions(prev => ({...prev, privacy: e.target.value}))}
                  className="text-sm text-gray-600 bg-gray-100 border-none rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-vibe-blue"
                >
                  {privacyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está acontecendo?"
            className="w-full h-32 text-lg placeholder-gray-400 border-none resize-none focus:outline-none"
            maxLength={500}
          />

          {/* Character Count */}
          <div className="flex justify-end mb-4">
            <span className="text-sm text-gray-500">
              {content.length}/500
            </span>
          </div>

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2">
                {mediaFiles.map((file) => (
                  <div key={file.id} className="relative">
                    {file.type === 'image' ? (
                      <img
                        src={file.preview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : file.type === 'video' ? (
                      <video
                        src={file.preview}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Mic size={24} className="text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-100 bg-white">
          {/* Main Action Row */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-1">
              {/* Camera */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 hover:bg-blue-50 rounded-full transition-colors group"
                title="Adicionar foto"
              >
                <Camera size={24} className="text-blue-500 group-hover:text-blue-600" />
              </button>

              {/* Video */}
              <button
                onClick={() => videoInputRef.current?.click()}
                className="p-3 hover:bg-green-50 rounded-full transition-colors group"
                title="Adicionar vídeo"
              >
                <Video size={24} className="text-green-500 group-hover:text-green-600" />
              </button>

              {/* Audio */}
              <button
                onClick={() => audioInputRef.current?.click()}
                className="p-3 hover:bg-purple-50 rounded-full transition-colors group"
                title="Adicionar áudio"
              >
                <Mic size={24} className="text-purple-500 group-hover:text-purple-600" />
              </button>

              {/* Poll */}
              <button
                className="p-3 hover:bg-orange-50 rounded-full transition-colors group"
                title="Criar enquete"
              >
                <BarChart3 size={24} className="text-orange-500 group-hover:text-orange-600" />
              </button>

              {/* Event */}
              <button
                className="p-3 hover:bg-red-50 rounded-full transition-colors group"
                title="Criar evento"
              >
                <Calendar size={24} className="text-red-500 group-hover:text-red-600" />
              </button>

              {/* More Options */}
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-3 hover:bg-gray-50 rounded-full transition-colors"
                title="Mais opções"
              >
                <Plus size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Privacy Indicator */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe size={16} />
              <span>Todos podem responder</span>
            </div>
          </div>

          {/* Extended Options */}
          {showOptions && (
            <div className="border-t border-gray-50 p-4 space-y-3">
              <button className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <MapPin size={20} className="text-gray-500" />
                <span className="text-gray-700">Adicionar localização</span>
              </button>
              
              <button className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Users size={20} className="text-gray-500" />
                <span className="text-gray-700">Marcar pessoas</span>
              </button>
              
              <button className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Smile size={20} className="text-gray-500" />
                <span className="text-gray-700">Adicionar emojis</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileUpload(e.target.files, 'image')}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileUpload(e.target.files, 'video')}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileUpload(e.target.files, 'audio')}
        className="hidden"
      />
    </div>
  )
}

export default ModernPostModal
