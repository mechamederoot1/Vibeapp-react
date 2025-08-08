import React, { useState, useRef } from 'react'
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react'

const ImageUpload = ({ 
  currentImage, 
  onImageSelect, 
  onImageRemove, 
  type = 'avatar', // 'avatar' ou 'cover'
  className = '',
  disabled = false 
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const fileInputRef = useRef(null)

  const isAvatar = type === 'avatar'
  const maxSize = 5 * 1024 * 1024 // 5MB
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']

  const validateFile = (file) => {
    if (!file) return false

    // Verificar tipo
    if (!acceptedTypes.includes(file.type)) {
      alert('Formato não suportado. Use JPEG, PNG ou WebP.')
      return false
    }

    // Verificar tamanho
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo 5MB.')
      return false
    }

    return true
  }

  const handleFileSelect = (file) => {
    if (!validateFile(file)) return

    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target.result)
    }
    reader.readAsDataURL(file)

    // Callback com o arquivo
    onImageSelect?.(file)
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setPreviewImage(null)
    onImageRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const imageToShow = previewImage || currentImage
  const hasImage = !!imageToShow

  if (isAvatar) {
    return (
      <div className={`relative ${className}`}>
        <div 
          className={`
            w-24 h-24 rounded-full border-4 border-white bg-white p-1 cursor-pointer
            transition-all duration-200 relative overflow-hidden group
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
            ${isDragOver ? 'scale-105 shadow-lg' : ''}
          `}
          onClick={openFileDialog}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {hasImage ? (
            <img
              src={imageToShow}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
              <ImageIcon size={24} className="text-gray-400" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-full flex items-center justify-center">
            <Camera 
              size={20} 
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
            />
          </div>
        </div>

        {/* Botão de câmera */}
        <button 
          className="absolute bottom-0 right-0 w-7 h-7 bg-vibe-blue rounded-full flex items-center justify-center border-2 border-white hover:bg-vibe-blue-dark transition-colors"
          onClick={openFileDialog}
          disabled={disabled}
        >
          <Camera size={14} className="text-white" />
        </button>

        {/* Botão de remover */}
        {hasImage && (
          <button 
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-red-600 transition-colors"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X size={12} className="text-white" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    )
  }

  // Cover photo layout
  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          w-full h-48 relative cursor-pointer transition-all duration-200 group overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
          ${isDragOver ? 'brightness-110 scale-[1.02]' : ''}
        `}
        onClick={openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {hasImage ? (
          <img
            src={imageToShow}
            alt="Capa do perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-vibe-blue via-vibe-blue-light to-purple-300 flex items-center justify-center">
            <div className="text-center text-white">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium">Adicionar foto de capa</p>
            </div>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
            <Camera size={32} className="mx-auto mb-2" />
            <p className="text-sm font-medium">
              {hasImage ? 'Trocar foto de capa' : 'Adicionar foto de capa'}
            </p>
          </div>
        </div>
      </div>

      {/* Botão de upload */}
      <button 
        className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
        onClick={openFileDialog}
        disabled={disabled}
      >
        <Camera size={20} />
      </button>

      {/* Botão de remover */}
      {hasImage && (
        <button 
          className="absolute top-4 left-4 bg-red-500 bg-opacity-80 text-white p-2 rounded-full hover:bg-opacity-100 transition-all"
          onClick={handleRemove}
          disabled={disabled}
        >
          <X size={20} />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}

export default ImageUpload
