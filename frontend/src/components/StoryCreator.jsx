import React, { useState, useRef, useCallback, useEffect } from 'react'
import { 
  X, Type, Image, Video, Palette, Smile, Eye, EyeOff, 
  Users, Globe, Lock, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, RotateCw, Move, ZoomIn, ZoomOut,
  Send, Camera, Upload
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StoryPhotoEditor from './StoryPhotoEditor'

const StoryCreator = ({ isOpen, onClose, onStoryCreate }) => {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState('select') // select, camera, edit, privacy
  const [showCamera, setShowCamera] = useState(false)
  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  const [storyType, setStoryType] = useState('text') // text, image, video
  const [loading, setLoading] = useState(false)
  
  // Estados do conteúdo
  const [backgroundGradient, setBackgroundGradient] = useState('gradient-1')
  const [textContent, setTextContent] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  
  // Estados do texto
  const [textElements, setTextElements] = useState([])
  const [selectedTextId, setSelectedTextId] = useState(null)
  const [showTextEditor, setShowTextEditor] = useState(false)
  
  // Estados de privacidade
  const [privacy, setPrivacy] = useState('public') // public, friends, close_friends
  const [duration, setDuration] = useState(24) // horas
  
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  
  // Gradientes predefinidos
  const backgroundGradients = [
    { id: 'gradient-1', name: 'Oceano', class: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600' },
    { id: 'gradient-2', name: 'Sunset', class: 'bg-gradient-to-br from-orange-400 via-pink-500 to-red-500' },
    { id: 'gradient-3', name: 'Floresta', class: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600' },
    { id: 'gradient-4', name: 'Violeta', class: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600' },
    { id: 'gradient-5', name: 'Rosa', class: 'bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600' },
    { id: 'gradient-6', name: 'Dourado', class: 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400' },
    { id: 'gradient-7', name: 'Ciano', class: 'bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-400' },
    { id: 'gradient-8', name: 'Escuro', class: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black' },
    { id: 'gradient-9', name: 'Aurora', class: 'bg-gradient-to-br from-green-300 via-blue-500 to-purple-600' },
    { id: 'gradient-10', name: 'Fogo', class: 'bg-gradient-to-br from-red-400 via-orange-500 to-yellow-400' }
  ]
  
  // Fontes predefinidas
  const fontOptions = [
    { id: 'font-1', name: 'Clássica', class: 'font-serif' },
    { id: 'font-2', name: 'Moderna', class: 'font-sans' },
    { id: 'font-3', name: 'Mono', class: 'font-mono' },
    { id: 'font-4', name: 'Cursiva', class: 'font-serif italic' },
    { id: 'font-5', name: 'Bold', class: 'font-sans font-bold' }
  ]

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar arquivo
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    
    if (!isImage && !isVideo) {
      alert('Selecione apenas imagens ou vídeos.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB.')
      return
    }

    setMediaFile(file)
    setStoryType(isImage ? 'image' : 'video')
    
    // Criar preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setMediaPreview(event.target.result)
      if (isImage) {
        setShowPhotoEditor(true)
      } else {
        setCurrentStep('edit')
      }
    }
    reader.readAsDataURL(file)
  }

  const addTextElement = () => {
    const newText = {
      id: Date.now(),
      content: 'Seu texto aqui',
      x: 50,
      y: 50,
      font: 'font-sans',
      size: 'text-xl',
      color: 'text-white',
      align: 'center',
      style: []
    }
    setTextElements([...textElements, newText])
    setSelectedTextId(newText.id)
    setShowTextEditor(true)
  }

  const updateTextElement = (id, updates) => {
    setTextElements(elements => 
      elements.map(el => el.id === id ? { ...el, ...updates } : el)
    )
  }

  const removeTextElement = (id) => {
    setTextElements(elements => elements.filter(el => el.id !== id))
    setSelectedTextId(null)
    setShowTextEditor(false)
  }

  const handleTextDrag = (id, newX, newY) => {
    updateTextElement(id, { x: newX, y: newY })
  }

  const selectedText = textElements.find(el => el.id === selectedTextId)

  const getCurrentBackground = () => {
    const gradient = backgroundGradients.find(g => g.id === backgroundGradient)
    return gradient?.class || backgroundGradients[0].class
  }

  const handleCreateStory = async () => {
    setLoading(true)
    try {
      // Upload media file if exists
      let mediaUrl = null
      if (mediaFile) {
        const formData = new FormData()
        formData.append('file', mediaFile)

        const uploadResponse = await axios.post('/api/uploads/story-media', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        mediaUrl = uploadResponse.data.url
      }

      // Prepare story data for API
      const storyData = {
        type: storyType,
        content: storyType === 'text' ? textContent : null,
        mediaUrl: mediaUrl,
        backgroundGradient: storyType === 'text' ? backgroundGradient : null,
        textElements: textElements,
        privacy: privacy,
        duration: duration
      }

      // Create story via API
      const response = await axios.post('/api/stories/', storyData)

      console.log('Story created successfully:', response.data)
      onStoryCreate?.(response.data)
      handleClose()
    } catch (error) {
      console.error('Erro ao criar story:', error)
      alert('Erro ao publicar story. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentStep('select')
    setStoryType('text')
    setBackgroundGradient('gradient-1')
    setTextContent('')
    setTextElements([])
    setSelectedTextId(null)
    setShowTextEditor(false)
    setMediaFile(null)
    setMediaPreview(null)
    setPrivacy('public')
    setDuration(24)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-full">
          <X size={24} />
        </button>
        <h1 className="text-lg font-semibold">
          {currentStep === 'select' && 'Criar Story'}
          {currentStep === 'camera' && 'Câmera'}
          {currentStep === 'edit' && 'Editar Story'}
          {currentStep === 'privacy' && 'Privacidade'}
        </h1>
        <div className="w-10 h-10"></div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex">
        {currentStep === 'select' && (
          <div className="w-full flex flex-col items-center justify-center p-8 space-y-8">
            <h2 className="text-2xl font-bold text-white text-center">
              Como você quer criar seu story?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl">
              {/* Texto */}
              <button
                onClick={() => {
                  setStoryType('text')
                  setCurrentStep('edit')
                }}
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform"
              >
                <Type size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Texto</h3>
                <p className="text-sm opacity-90">Crie com cores e tipografia</p>
              </button>

              {/* Foto */}
              <button
                onClick={() => setCurrentStep('camera')}
                className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform"
              >
                <Camera size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Câmera</h3>
                <p className="text-sm opacity-90">Tirar foto ou escolher da galeria</p>
              </button>

              {/* Vídeo */}
              <button
                onClick={() => setCurrentStep('camera')}
                className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-8 text-white text-center hover:scale-105 transition-transform"
              >
                <Video size={48} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Vídeo</h3>
                <p className="text-sm opacity-90">Gravar ou selecionar vídeo</p>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {currentStep === 'camera' && (
          <div className="w-full h-full bg-black flex flex-col">
            {/* Camera Controls */}
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-8">
                <h2 className="text-2xl font-bold text-white">Escolha uma opção</h2>

                <div className="flex flex-col space-y-4">
                  <button
                    onClick={() => {
                      // For now, simulate camera by opening file picker
                      fileInputRef.current?.click()
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <Camera size={24} />
                    <span>Abrir Câmera</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-lg flex items-center justify-center space-x-2"
                  >
                    <Upload size={24} />
                    <span>Escolher da Galeria</span>
                  </button>

                  <button
                    onClick={() => setCurrentStep('select')}
                    className="text-white hover:text-gray-300 px-8 py-2"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'edit' && (
          <div className="w-full flex">
            {/* Preview */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative w-80 h-[600px] rounded-3xl overflow-hidden shadow-2xl">
                {/* Background ou Mídia */}
                {storyType === 'text' ? (
                  <div className={`w-full h-full ${getCurrentBackground()} relative`}>
                    {/* Elementos de texto */}
                    {textElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute cursor-move ${element.font} ${element.size} ${element.color} ${element.align === 'center' ? 'text-center' : element.align === 'right' ? 'text-right' : 'text-left'} select-none`}
                        style={{
                          left: `${element.x}%`,
                          top: `${element.y}%`,
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '80%',
                          fontWeight: element.style.includes('bold') ? 'bold' : 'normal',
                          fontStyle: element.style.includes('italic') ? 'italic' : 'normal',
                          textDecoration: element.style.includes('underline') ? 'underline' : 'none',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                        }}
                        onClick={() => {
                          setSelectedTextId(element.id)
                          setShowTextEditor(true)
                        }}
                      >
                        {element.content}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full bg-black relative">
                    {mediaPreview && (
                      storyType === 'image' ? (
                        <img 
                          src={mediaPreview} 
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={mediaPreview} 
                          className="w-full h-full object-cover"
                          controls
                        />
                      )
                    )}
                    
                    {/* Elementos de texto sobre mídia */}
                    {textElements.map((element) => (
                      <div
                        key={element.id}
                        className={`absolute cursor-move ${element.font} ${element.size} ${element.color} ${element.align === 'center' ? 'text-center' : element.align === 'right' ? 'text-right' : 'text-left'} select-none`}
                        style={{
                          left: `${element.x}%`,
                          top: `${element.y}%`,
                          transform: 'translate(-50%, -50%)',
                          maxWidth: '80%',
                          fontWeight: element.style.includes('bold') ? 'bold' : 'normal',
                          fontStyle: element.style.includes('italic') ? 'italic' : 'normal',
                          textDecoration: element.style.includes('underline') ? 'underline' : 'none',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                        }}
                        onClick={() => {
                          setSelectedTextId(element.id)
                          setShowTextEditor(true)
                        }}
                      >
                        {element.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ferramentas */}
            <div className="w-80 bg-gray-900 text-white p-4 space-y-6 overflow-y-auto">
              {/* Cores de fundo (apenas para texto) */}
              {storyType === 'text' && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Palette size={18} className="mr-2" />
                    Fundo
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {backgroundGradients.map((gradient) => (
                      <button
                        key={gradient.id}
                        onClick={() => setBackgroundGradient(gradient.id)}
                        className={`w-full h-12 rounded-lg ${gradient.class} border-2 ${
                          backgroundGradient === gradient.id ? 'border-white' : 'border-transparent'
                        }`}
                        title={gradient.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar texto */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center">
                  <Type size={18} className="mr-2" />
                  Texto
                </h3>
                <button
                  onClick={addTextElement}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Adicionar Texto
                </button>
              </div>

              {/* Editor de texto */}
              {showTextEditor && selectedText && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Editar Texto</h4>
                    <button
                      onClick={() => removeTextElement(selectedTextId)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Conteúdo */}
                  <textarea
                    value={selectedText.content}
                    onChange={(e) => updateTextElement(selectedTextId, { content: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded text-white resize-none"
                    rows={3}
                    placeholder="Digite seu texto..."
                  />

                  {/* Fonte */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Fonte</label>
                    <select
                      value={selectedText.font}
                      onChange={(e) => updateTextElement(selectedTextId, { font: e.target.value })}
                      className="w-full p-2 bg-gray-700 rounded text-white"
                    >
                      {fontOptions.map(font => (
                        <option key={font.id} value={font.class}>{font.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tamanho */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Tamanho</label>
                    <select
                      value={selectedText.size}
                      onChange={(e) => updateTextElement(selectedTextId, { size: e.target.value })}
                      className="w-full p-2 bg-gray-700 rounded text-white"
                    >
                      <option value="text-sm">Pequeno</option>
                      <option value="text-lg">Médio</option>
                      <option value="text-xl">Grande</option>
                      <option value="text-2xl">Muito Grande</option>
                      <option value="text-4xl">Gigante</option>
                    </select>
                  </div>

                  {/* Cor */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Cor</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['text-white', 'text-black', 'text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-purple-400', 'text-pink-400'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateTextElement(selectedTextId, { color })}
                          className={`w-8 h-8 rounded-full border-2 ${
                            color === 'text-white' ? 'bg-white' :
                            color === 'text-black' ? 'bg-black' :
                            color === 'text-red-400' ? 'bg-red-400' :
                            color === 'text-blue-400' ? 'bg-blue-400' :
                            color === 'text-green-400' ? 'bg-green-400' :
                            color === 'text-yellow-400' ? 'bg-yellow-400' :
                            color === 'text-purple-400' ? 'bg-purple-400' :
                            'bg-pink-400'
                          } ${selectedText.color === color ? 'border-white' : 'border-gray-600'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Alinhamento */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Alinhamento</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateTextElement(selectedTextId, { align: 'left' })}
                        className={`p-2 rounded ${selectedText.align === 'left' ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <AlignLeft size={16} />
                      </button>
                      <button
                        onClick={() => updateTextElement(selectedTextId, { align: 'center' })}
                        className={`p-2 rounded ${selectedText.align === 'center' ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <AlignCenter size={16} />
                      </button>
                      <button
                        onClick={() => updateTextElement(selectedTextId, { align: 'right' })}
                        className={`p-2 rounded ${selectedText.align === 'right' ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Estilos */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Estilo</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const styles = selectedText.style.includes('bold') 
                            ? selectedText.style.filter(s => s !== 'bold')
                            : [...selectedText.style, 'bold']
                          updateTextElement(selectedTextId, { style: styles })
                        }}
                        className={`p-2 rounded ${selectedText.style.includes('bold') ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const styles = selectedText.style.includes('italic') 
                            ? selectedText.style.filter(s => s !== 'italic')
                            : [...selectedText.style, 'italic']
                          updateTextElement(selectedTextId, { style: styles })
                        }}
                        className={`p-2 rounded ${selectedText.style.includes('italic') ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <Italic size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const styles = selectedText.style.includes('underline') 
                            ? selectedText.style.filter(s => s !== 'underline')
                            : [...selectedText.style, 'underline']
                          updateTextElement(selectedTextId, { style: styles })
                        }}
                        className={`p-2 rounded ${selectedText.style.includes('underline') ? 'bg-blue-600' : 'bg-gray-600'}`}
                      >
                        <Underline size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep('privacy')}
                  className="w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center justify-center"
                >
                  <Eye size={18} className="mr-2" />
                  Continuar
                </button>
                <button
                  onClick={() => setCurrentStep('select')}
                  className="w-full p-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'privacy' && (
          <div className="w-full flex items-center justify-center p-8">
            <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-white space-y-6">
              <h2 className="text-2xl font-bold text-center">Configurações de Privacidade</h2>

              {/* Quem pode ver */}
              <div>
                <h3 className="font-semibold mb-3">Quem pode ver seu story?</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="text-blue-600"
                    />
                    <Globe size={20} />
                    <div>
                      <p className="font-medium">Público</p>
                      <p className="text-sm text-gray-400">Qualquer pessoa pode ver</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="friends"
                      checked={privacy === 'friends'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="text-blue-600"
                    />
                    <Users size={20} />
                    <div>
                      <p className="font-medium">Amigos</p>
                      <p className="text-sm text-gray-400">Apenas seus amigos</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="close_friends"
                      checked={privacy === 'close_friends'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="text-blue-600"
                    />
                    <Lock size={20} />
                    <div>
                      <p className="font-medium">Amigos Próximos</p>
                      <p className="text-sm text-gray-400">Apenas seus melhores amigos</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Duração */}
              <div>
                <h3 className="font-semibold mb-3">Duração do story</h3>
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full p-3 bg-gray-800 rounded-lg text-white"
                >
                  <option value={1}>1 hora</option>
                  <option value={6}>6 horas</option>
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={48}>2 dias</option>
                  <option value={72}>3 dias</option>
                </select>
              </div>

              {/* Botões */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleCreateStory}
                  disabled={loading}
                  className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Send size={18} className="mr-2" />
                  )}
                  {loading ? 'Publicando...' : 'Publicar Story'}
                </button>
                
                <button
                  onClick={() => setCurrentStep('edit')}
                  className="w-full p-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium"
                >
                  Voltar para Edição
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Editor */}
      <StoryPhotoEditor
        imageUrl={mediaPreview}
        isOpen={showPhotoEditor}
        onClose={() => {
          setShowPhotoEditor(false)
          setCurrentStep('select')
          setMediaFile(null)
          setMediaPreview(null)
        }}
        onPublish={() => {
          setShowPhotoEditor(false)
          setCurrentStep('privacy')
        }}
        textElements={textElements}
        onUpdateTextElements={setTextElements}
      />
    </div>
  )
}

export default StoryCreator
