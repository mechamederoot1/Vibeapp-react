import React, { useState, useEffect, useRef } from 'react'
import { X, Image, Video, Type, Send, Palette, Mic, BarChart3, Calendar, MapPin, Users, Smile, Plus, Globe, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { postsAPI } from '../services/api'

const PostModal = ({ isOpen, onClose, onPost }) => {
  const { user } = useAuth()
  const [postType, setPostType] = useState('text')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [showMediaFullscreen, setShowMediaFullscreen] = useState(false)
  const [fullscreenType, setFullscreenType] = useState(null)
  const [mediaAppear, setMediaAppear] = useState(false)
  const [reachedBottom, setReachedBottom] = useState(false)
  const [fsAnim, setFsAnim] = useState(false)
  const contentRef = useRef(null)

  const [privacy, setPrivacy] = useState('public')
  const privacyOptions = [
    { value: 'public', label: 'Público' },
    { value: 'friends', label: 'Amigos' },
    { value: 'private', label: 'Apenas eu' }
  ]

  const [backgroundColor, setBackgroundColor] = useState(null)
  const [showColorPicker, setShowColorPicker] = useState(false)


  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return }
    const url = URL.createObjectURL(imageFile)
    setImagePreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  useEffect(() => {
    if (!videoFile) { setVideoPreviewUrl(null); return }
    const url = URL.createObjectURL(videoFile)
    setVideoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [videoFile])

  useEffect(() => {
    if (!audioFile) { setAudioPreviewUrl(null); return }
    const url = URL.createObjectURL(audioFile)
    setAudioPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [audioFile])

  const colorOptions = [
    { name: 'Sem cor', value: null, gradient: 'bg-white border-2 border-gray-300' },
    { name: 'Azul', value: 'blue', gradient: 'bg-gradient-to-br from-blue-400 to-blue-600' },
    { name: 'Verde', value: 'green', gradient: 'bg-gradient-to-br from-green-400 to-green-600' },
    { name: 'Roxo', value: 'purple', gradient: 'bg-gradient-to-br from-purple-400 to-purple-600' },
    { name: 'Rosa', value: 'pink', gradient: 'bg-gradient-to-br from-pink-400 to-pink-600' },
    { name: 'Laranja', value: 'orange', gradient: 'bg-gradient-to-br from-orange-400 to-orange-600' },
    { name: 'Vermelho', value: 'red', gradient: 'bg-gradient-to-br from-red-400 to-red-600' },
    { name: 'Vibe', value: 'vibe', gradient: 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' },
    { name: 'Sunset', value: 'sunset', gradient: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' }
  ]

  const handleFileUpload = (file, type) => {
    if (type === 'image') {
      setImageFile(file)
      setVideoFile(null)
      setAudioFile(null)
      setPostType('image')
    } else if (type === 'video') {
      setVideoFile(file)
      setImageFile(null)
      setAudioFile(null)
      setPostType('video')
    } else if (type === 'audio') {
      setAudioFile(file)
      setImageFile(null)
      setVideoFile(null)
      setPostType('audio')
    }
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim() && !imageFile && !videoFile && !audioFile) {
      setError('Por favor, adicione conteúdo ao seu post')
      return
    }

    setLoading(true)
    setError('')

    try {
      let postData = {
        content: content.trim(),
        type: postType,
        backgroundColor: postType === 'text' ? backgroundColor : null,
        privacy
      }

      if (imageFile) {
        const imageBase64 = await convertFileToBase64(imageFile)
        postData.imageUrl = imageBase64
        postData.type = 'image'
      }

      if (videoFile) {
        const videoBase64 = await convertFileToBase64(videoFile)
        postData.videoUrl = videoBase64
        postData.type = 'video'
      }

      if (audioFile) {
        const audioBase64 = await convertFileToBase64(audioFile)
        postData.audioUrl = audioBase64
        postData.type = 'audio'
      }

      const response = await postsAPI.createPost(postData)
      const created = response.data
      onPost?.(created)

      resetAndClose()
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error.response?.data?.detail || 'Erro ao criar post')
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = () => {
    setContent('')
    setImageFile(null)
    setVideoFile(null)
    setAudioFile(null)
    setPostType('text')
    setBackgroundColor(null)
    setShowColorPicker(false)
    setError('')
    setPrivacy('public')
    setShowOptions(false)
    setShowImageFullscreen(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <button onClick={resetAndClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Criar post</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !imageFile && !videoFile && !audioFile)}
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
              <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-vibe-blue flex items-center justify-center">
                <span className="text-white font-bold text-lg">{user?.firstName?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{user?.fullName || 'Usuário'}</p>
              <div className="flex items-center space-x-2">
                <Globe size={14} className="text-gray-500" />
                <div className="relative">
                  <select
                    value={privacy}
                    onChange={(e) => setPrivacy(e.target.value)}
                    className="text-sm text-gray-600 bg-gray-100 border-none rounded-full px-3 pr-8 py-1 focus:outline-none focus:ring-2 focus:ring-vibe-blue min-w-[140px] appearance-none"
                  >
                    {privacyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Image preview first when present */}
          {imageFile && (
            <div className="mb-4 relative flex items-center justify-center">
              <img
                src={imagePreviewUrl || ''}
                alt="Imagem"
                className="max-h-80 w-auto object-contain rounded-lg cursor-pointer mx-auto"
                onClick={() => setShowImageFullscreen(true)}
              />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Video preview */}
          {videoFile && (
            <div className="mb-4 relative flex items-center justify-center">
              <video src={videoPreviewUrl || ''} controls className="max-h-80 w-auto object-contain rounded-lg" />
              <button type="button" onClick={() => setVideoFile(null)} className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Audio preview */}
          {audioFile && (
            <div className="mb-4 relative">
              <audio src={audioPreviewUrl || ''} controls className="w-full" />
              <button type="button" onClick={() => setAudioFile(null)} className="absolute -top-3 right-0 p-1 text-gray-600 hover:text-gray-900">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Text background preview */}
          {postType === 'text' && backgroundColor && content.trim() && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className={`p-6 rounded-lg ${colorOptions.find(c => c.value === backgroundColor)?.gradient} min-h-[120px] flex items-center justify-center`}>
                <p className="text-white text-center font-medium text-lg leading-relaxed">{content}</p>
              </div>
            </div>
          )}

          {/* Editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está acontecendo?"
            className={`w-full ${imageFile || videoFile ? 'h-24' : 'h-32'} text-lg placeholder-gray-400 border-none resize-none focus:outline-none`}
            maxLength={500}
          />

          <div className="flex justify-end mb-4">
            <span className="text-sm text-gray-500">{content.length}/500</span>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-1">
              <label className="p-3 hover:bg-blue-50 rounded-full cursor-pointer group" title="Adicionar foto">
                <Image size={24} className="text-blue-500 group-hover:text-blue-600" />
                <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'image')} className="hidden" />
              </label>
              <label className="p-3 hover:bg-green-50 rounded-full cursor-pointer group" title="Adicionar vídeo">
                <Video size={24} className="text-green-500 group-hover:text-green-600" />
                <input type="file" accept="video/*" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'video')} className="hidden" />
              </label>
              <label className="p-3 hover:bg-purple-50 rounded-full cursor-pointer group" title="Adicionar áudio">
                <Mic size={24} className="text-purple-500 group-hover:text-purple-600" />
                <input type="file" accept="audio/*" onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'audio')} className="hidden" />
              </label>
              <button type="button" className="p-3 hover:bg-orange-50 rounded-full transition-colors group" title="Criar enquete">
                <BarChart3 size={24} className="text-orange-500 group-hover:text-orange-600" />
              </button>
              <button type="button" className="p-3 hover:bg-red-50 rounded-full transition-colors group" title="Criar evento">
                <Calendar size={24} className="text-red-500 group-hover:text-red-600" />
              </button>
              <button type="button" onClick={() => setShowOptions(!showOptions)} className="p-3 hover:bg-gray-50 rounded-full transition-colors" title="Mais opções">
                <Plus size={24} className="text-gray-600" />
              </button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe size={16} />
              <span>Todos podem responder</span>
            </div>
          </div>

          {showOptions && (
            <div className="border-t border-gray-50 p-4 space-y-3">
              <button type="button" className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <MapPin size={20} className="text-gray-500" />
                <span className="text-gray-700">Adicionar localização</span>
              </button>
              <button type="button" className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Users size={20} className="text-gray-500" />
                <span className="text-gray-700">Marcar pessoas</span>
              </button>
              <button type="button" className="flex items-center space-x-3 w-full p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Smile size={20} className="text-gray-500" />
                <span className="text-gray-700">Adicionar emojis</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {showImageFullscreen && imageFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <img src={imagePreviewUrl || ''} alt="Imagem" className="max-w-[90vw] max-h-[90vh] object-contain" />
          <button
            onClick={() => setShowImageFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full"
            aria-label="Fechar"
          >
            <X size={24} className="text-white" />
          </button>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

export default PostModal
