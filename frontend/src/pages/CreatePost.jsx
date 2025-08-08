import React, { useState } from 'react'
import { ArrowLeft, Camera as CameraIcon, Image, MapPin, Users, Smile, Video, Type, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Camera from '../components/Camera'
import { useLocation } from '../hooks/useLocation'

const CreatePost = () => {
  const navigate = useNavigate()
  const [postType, setPostType] = useState('photo') // 'photo', 'video', 'text'
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [caption, setCaption] = useState('')
  const [isLocationEnabled, setIsLocationEnabled] = useState(false)
  
  const { location, getCurrentLocation, loading: locationLoading } = useLocation()

  const handleImageCapture = (imageData) => {
    setCapturedImage(imageData)
    setShowCamera(false)
  }

  const handleLocationToggle = () => {
    if (!isLocationEnabled) {
      getCurrentLocation()
    }
    setIsLocationEnabled(!isLocationEnabled)
  }

  const handlePost = () => {
    console.log('Posting:', {
      type: postType,
      image: capturedImage,
      caption,
      location: isLocationEnabled ? location : null
    })
    
    navigate('/')
  }

  const PostTypeSelector = () => (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={() => setPostType('photo')}
        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
          postType === 'photo' ? 'bg-vibe-blue text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <CameraIcon size={20} />
        <span>Foto</span>
      </button>
      <button
        onClick={() => setPostType('video')}
        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
          postType === 'video' ? 'bg-vibe-blue text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <Video size={20} />
        <span>Vídeo</span>
      </button>
      <button
        onClick={() => setPostType('text')}
        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
          postType === 'text' ? 'bg-vibe-blue text-white' : 'bg-gray-100 text-gray-700'
        }`}
      >
        <FileText size={20} />
        <span>Texto</span>
      </button>
    </div>
  )

  const canPost = () => {
    if (postType === 'text') {
      return caption.trim().length > 0
    }
    return capturedImage && caption.trim().length > 0
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 safe-area-top">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold">Novo Post</h1>
        <button
          onClick={handlePost}
          disabled={!canPost()}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            canPost()
              ? 'bg-vibe-blue text-white hover:bg-vibe-blue-dark'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          Publicar
        </button>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Seletor de tipo de post */}
        <PostTypeSelector />

        {/* Conteúdo baseado no tipo */}
        {postType !== 'text' && (
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
            {capturedImage ? (
              <>
                <img
                  src={capturedImage}
                  alt="Conteúdo capturado"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setShowCamera(true)}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full"
                >
                  <CameraIcon size={20} />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                {postType === 'photo' ? (
                  <CameraIcon size={48} className="text-gray-400" />
                ) : (
                  <Video size={48} className="text-gray-400" />
                )}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <CameraIcon size={20} />
                    <span>Abrir Câmera</span>
                  </button>
                  <button className="btn-secondary flex items-center space-x-2">
                    <Image size={20} />
                    <span>Galeria</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text Post Design */}
        {postType === 'text' && (
          <div className="bg-gradient-to-br from-vibe-blue-light to-vibe-blue rounded-lg p-6 min-h-[300px] flex items-center justify-center">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="O que você está pensando?"
              className="w-full h-full bg-transparent text-white placeholder-blue-100 text-xl font-medium text-center resize-none focus:outline-none"
              maxLength={500}
            />
          </div>
        )}

        {/* Caption */}
        {postType !== 'text' && (
          <div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva uma legenda..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
              rows="3"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
                <Smile size={20} />
                <span>Adicionar emoji</span>
              </button>
              <span className="text-sm text-gray-500">
                {caption.length}/500
              </span>
            </div>
          </div>
        )}

        {/* Opções */}
        <div className="space-y-3">
          {/* Localização */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <MapPin size={20} className="text-gray-600" />
              <div>
                <p className="font-medium">Adicionar localização</p>
                {location && isLocationEnabled && (
                  <p className="text-sm text-gray-500">
                    Lat: {location.latitude.toFixed(4)}, 
                    Lng: {location.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLocationToggle}
              disabled={locationLoading}
              className={`w-12 h-6 rounded-full transition-colors ${
                isLocationEnabled ? 'bg-vibe-blue' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  isLocationEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Marcar Pessoas */}
          <button className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg w-full hover:bg-gray-50">
            <Users size={20} className="text-gray-600" />
            <span className="font-medium">Marcar pessoas</span>
          </button>

          {/* Configurações de Privacidade */}
          <div className="p-3 border border-gray-200 rounded-lg">
            <h3 className="font-medium mb-3">Configurações de privacidade</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  defaultChecked
                  className="text-vibe-blue"
                />
                <span>Público</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="privacy"
                  value="friends"
                  className="text-vibe-blue"
                />
                <span>Apenas amigos</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  className="text-vibe-blue"
                />
                <span>Privado</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de Câmera */}
      <Camera
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleImageCapture}
      />
    </div>
  )
}

export default CreatePost
