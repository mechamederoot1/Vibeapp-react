import React, { useState, useRef } from 'react'
import { X, Send, Type, Palette } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { uploadsAPI, storiesAPI } from '../services/api'
import { validateImageDimensions, presetOptions } from '../utils/imageValidation'

const SimpleStoryCreator = ({ isOpen, onClose, onStoryCreate }) => {
  const { user } = useAuth()
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'image' or 'video'
  const [textOverlay, setTextOverlay] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [loading, setLoading] = useState(false)
  
  const fileInputRef = useRef(null)

  // Cores para texto
  const textColors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
  ]

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      alert('Selecione apenas imagens ou vídeos.')
      return
    }

    if (isImage) {
      const v = await validateImageDimensions(file, { ...presetOptions('story'), maxBytes: 10 * 1024 * 1024 })
      if (!v.ok) { alert(v.error || 'Imagem inválida'); return }
    } else if (file.size > 50 * 1024 * 1024) {
      alert('Vídeo muito grande. Máximo 50MB.')
      return
    }

    setMediaFile(file)
    setMediaType(isImage ? 'image' : 'video')

    const reader = new FileReader()
    reader.onload = (event) => {
      setMediaPreview(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handlePublish = async () => {
    if (!mediaFile) {
      alert('Selecione uma mídia primeiro')
      return
    }

    setLoading(true)
    try {
      // Upload da mídia
      const uploadResponse = await uploadsAPI.uploadStoryMedia(mediaFile)

      // Criar story
      const storyData = {
        type: mediaType,
        mediaUrl: uploadResponse.data.url,
        content: textOverlay || null,
        privacy: 'public',
        duration: 24
      }

      const response = await storiesAPI.createStory(storyData)
      
      console.log('Story criado:', response.data)
      onStoryCreate?.(response.data)
      handleClose()
    } catch (error) {
      console.error('Erro ao criar story:', error)
      alert('Erro ao publicar story. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    setTextOverlay('')
    setTextColor('#ffffff')
    onClose()
  }

  // Abrir galeria automaticamente quando o modal abre
  React.useEffect(() => {
    if (isOpen && !mediaFile) {
      setTimeout(() => {
        fileInputRef.current?.click()
      }, 100)
    }
  }, [isOpen, mediaFile])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-full">
          <X size={24} />
        </button>
        <h1 className="text-lg font-semibold">Criar Story</h1>
        <div className="w-10 h-10"></div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col">
        {!mediaPreview ? (
          // Estado inicial - aguardando seleção
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-white space-y-6">
              <h2 className="text-xl font-semibold">Selecione uma mídia</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-medium"
              >
                Escolher da Galeria
              </button>
            </div>
          </div>
        ) : (
          // Edição da mídia
          <div className="flex-1 relative">
            {/* Mídia de fundo */}
            <div className="absolute inset-0">
              {mediaType === 'image' ? (
                <img 
                  src={mediaPreview} 
                  alt="Story preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video 
                  src={mediaPreview} 
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  loop
                />
              )}
            </div>

            {/* Texto sobreposto */}
            {textOverlay && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="text-center font-bold text-2xl max-w-80 px-4"
                  style={{ 
                    color: textColor,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {textOverlay}
                </div>
              </div>
            )}

            {/* Controles de edição */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 space-y-4">
              {/* Editor de texto */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Type size={20} className="text-white" />
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder="Adicionar texto..."
                    className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg placeholder-gray-400"
                    maxLength={100}
                  />
                </div>

                {/* Cores do texto */}
                {textOverlay && (
                  <div className="flex items-center space-x-2">
                    <Palette size={16} className="text-white" />
                    <div className="flex space-x-2">
                      {textColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          className={`w-6 h-6 rounded-full border-2 ${
                            textColor === color ? 'border-white' : 'border-gray-600'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Trocar Mídia
                </button>
                
                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center space-x-2 font-medium"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  <span>{loading ? 'Publicando...' : 'Publicar'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default SimpleStoryCreator
