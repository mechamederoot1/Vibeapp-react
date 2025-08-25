import React, { useState, useRef } from 'react'
import { X, Save, Image, Camera, Upload, FileImage } from 'lucide-react'

const CreateHighlightModalV2 = ({ isOpen, onClose, onSave, userStories = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  // Auto-open gallery when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Reset form
      setFormData({ title: '', description: '' })
      setCoverImage(null)
      setCoverImagePreview(null)
      setError(null)
      
      // Open gallery after modal is rendered
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click()
        }
      }, 300)
    }
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }

      setCoverImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleSelectAnother = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('O nome do destaque é obrigatório')
      return
    }

    if (formData.title.length > 50) {
      setError('O nome do destaque deve ter no máximo 50 caracteres')
      return
    }

    if (!coverImage) {
      setError('Por favor, selecione uma imagem para o destaque')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const highlightData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        coverImage: coverImage
      }

      await onSave(highlightData)
      onClose()
    } catch (error) {
      console.error('Erro ao criar destaque:', error)
      setError(error.message || 'Erro ao criar destaque. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Novo Destaque</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Preview Area */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
              {coverImagePreview ? (
                <img
                  src={coverImagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image size={32} className="text-gray-400" />
              )}
            </div>
            
            {coverImagePreview ? (
              <button
                type="button"
                onClick={handleSelectAnother}
                className="text-vibe-blue hover:text-vibe-blue-dark text-sm font-medium"
              >
                Selecionar outra imagem
              </button>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                Selecione uma imagem da galeria
              </p>
            )}
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do destaque *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Viagens, Trabalho, Momentos..."
              maxLength={50}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/50 caracteres
            </p>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição do destaque..."
              rows={2}
              maxLength={200}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/200 caracteres
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !formData.title.trim() || !coverImage}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            <span>{loading ? 'Criando...' : 'Criar Destaque'}</span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default CreateHighlightModalV2
