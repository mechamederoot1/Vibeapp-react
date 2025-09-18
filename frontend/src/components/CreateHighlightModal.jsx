import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Image, Upload, Plus, GripVertical, Trash2 } from 'lucide-react'

const CreateHighlightModal = ({ isOpen, onClose, onSave, userStories = [], coverStoryId = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverStoryId: coverStoryId,
    coverType: coverStoryId ? 'story' : 'none' // 'none', 'story', 'upload'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState(null)
  const [additionalImages, setAdditionalImages] = useState([])
  const [additionalPreviews, setAdditionalPreviews] = useState([])
  const additionalInputRef = useRef(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        coverStoryId: coverStoryId,
        coverType: coverStoryId ? 'story' : 'none'
      })
      setCoverImage(null)
      setCoverImagePreview(null)
      setError(null)
    }
  }, [isOpen, coverStoryId])

  // Update preview when cover story changes
  useEffect(() => {
    if (formData.coverType === 'story' && formData.coverStoryId) {
      const selectedStory = userStories.find(story => story.id === parseInt(formData.coverStoryId))
      if (selectedStory) {
        setCoverImagePreview(selectedStory.mediaUrl || selectedStory.imageUrl)
      }
    } else {
      setCoverImagePreview(null)
    }
  }, [formData.coverStoryId, formData.coverType, userStories])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleCoverTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      coverType: type,
      coverStoryId: type === 'story' ? (userStories[0]?.id || null) : null
    }))
    setCoverImage(null)
    setCoverImagePreview(null)
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB')
        return
      }
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const handleAdditionalSelect = (event) => {
    const files = Array.from(event.target.files || [])
    const valid = []
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue
      if (f.size > 5 * 1024 * 1024) continue
      valid.push(f)
    }
    if (valid.length) {
      valid.forEach((f) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAdditionalPreviews(prev => [...prev, e.target.result])
        }
        reader.readAsDataURL(f)
      })
      setAdditionalImages(prev => [...prev, ...valid])
    }
    // reset value to allow re-selecting same files
    event.target.value = ''
  }

  const removeAdditionalAt = (idx) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== idx))
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('O nome do destaque é obrigatório')
      return
    }
    if (formData.title.length > 50) {
      setError('O nome do destaque deve ter no máximo 50 caracteres')
      return
    }
    if (formData.coverType === 'none' && additionalImages.length === 0) {
      setError('Selecione uma capa ou adicione pelo menos uma foto para o destaque')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const highlightData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        coverStoryId: formData.coverType === 'story' ? formData.coverStoryId : null,
        coverImage: formData.coverType === 'upload' ? coverImage : null,
        additionalImages: additionalImages
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
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50">
      <div className="w-full h-full bg-white md:rounded-xl md:max-w-md md:mx-auto md:my-8 overflow-hidden flex flex-col">
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
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Preview Area */}
          <div className="flex flex-col items-center space-y-3">
            <div className="w-20 h-20 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
              {coverImagePreview ? (
                <img
                  src={coverImagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image size={24} className="text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-600 text-center">
              Preview do destaque
            </p>
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

          {/* Cover Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Foto de capa
            </label>
            
            <div className="space-y-3">
              {/* No Cover Option */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="coverType"
                  value="none"
                  checked={formData.coverType === 'none'}
                  onChange={() => handleCoverTypeChange('none')}
                  className="h-4 w-4 text-vibe-blue border-gray-300 focus:ring-vibe-blue"
                />
                <span className="text-sm text-gray-700">Sem capa (usar primeira foto do destaque)</span>
              </label>

              {/* Story Cover Option */}
              {userStories.length > 0 && (
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-2">
                    <input
                      type="radio"
                      name="coverType"
                      value="story"
                      checked={formData.coverType === 'story'}
                      onChange={() => handleCoverTypeChange('story')}
                      className="h-4 w-4 text-vibe-blue border-gray-300 focus:ring-vibe-blue"
                    />
                    <span className="text-sm text-gray-700">Escolher de um story</span>
                  </label>
                  
                  {formData.coverType === 'story' && (
                    <div className="ml-7">
                      <select
                        value={formData.coverStoryId || ''}
                        onChange={(e) => handleInputChange('coverStoryId', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent text-sm"
                      >
                        <option value="">Selecione um story</option>
                        {userStories.map((story) => (
                          <option key={story.id} value={story.id}>
                            {story.content || `Story ${story.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Cover Option */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer mb-2">
                  <input
                    type="radio"
                    name="coverType"
                    value="upload"
                    checked={formData.coverType === 'upload'}
                    onChange={() => handleCoverTypeChange('upload')}
                    className="h-4 w-4 text-vibe-blue border-gray-300 focus:ring-vibe-blue"
                  />
                  <span className="text-sm text-gray-700">Fazer upload de imagem</span>
                </label>
                
                {formData.coverType === 'upload' && (
                  <div className="ml-7">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-vibe-blue transition-colors cursor-pointer">
                        <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {coverImage ? coverImage.name : 'Clique para selecionar uma imagem'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG até 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fotos do destaque</label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => additionalInputRef.current?.click()}
                  className="px-4 py-2 bg-vibe-blue text-white rounded-lg hover:bg-vibe-blue-dark"
                >
                  Adicionar fotos
                </button>
                <span className="text-sm text-gray-500">{additionalImages.length} selecionada(s)</span>
              </div>

              <input
                ref={additionalInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalSelect}
                className="hidden"
              />

              {additionalPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {additionalPreviews.map((src, idx) => (
                    <div key={idx} className="relative w-full pt-[100%] bg-gray-100 rounded-lg overflow-hidden">
                      <img src={src} alt={`Foto ${idx+1}`} className="absolute inset-0 w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAdditionalAt(idx)}
                        className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full p-1"
                        aria-label="Remover"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            disabled={loading || !formData.title.trim()}
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
      </div>
    </div>
  )
}

export default CreateHighlightModal
