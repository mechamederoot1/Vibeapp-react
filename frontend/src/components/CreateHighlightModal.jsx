import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Image, Upload, Plus, ChevronLeft, ChevronRight, Check, Camera } from 'lucide-react'
import { validateImageDimensions, presetOptions } from '../utils/imageValidation'

const CreateHighlightModal = ({ isOpen, onClose, onSave, userStories = [], coverStoryId = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverStoryId: coverStoryId,
    coverType: coverStoryId ? 'story' : 'none' // 'none', 'story', 'upload', 'collection'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState(null)

  // Photos collection (files + previews)
  const [photos, setPhotos] = useState([]) // {id, file, src}
  const [coverIndex, setCoverIndex] = useState(0)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

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
      setPhotos([])
      setCoverIndex(0)
    }
  }, [isOpen, coverStoryId])

  // Update preview when cover story changes
  useEffect(() => {
    if (formData.coverType === 'story' && formData.coverStoryId) {
      const selectedStory = userStories.find(story => story.id === parseInt(formData.coverStoryId))
      if (selectedStory) {
        setCoverImagePreview(selectedStory.mediaUrl || selectedStory.imageUrl)
      }
    } else if (formData.coverType === 'upload' && coverImage) {
      // preview already set on file read
    } else if (formData.coverType === 'collection' && photos.length > 0) {
      setCoverImagePreview(photos[coverIndex]?.src || null)
    } else {
      setCoverImagePreview(null)
    }
  }, [formData.coverStoryId, formData.coverType, userStories, coverImage, photos, coverIndex])

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
      coverStoryId: type === 'story' ? (userStories[0]?.id || null) : prev.coverStoryId
    }))

    if (type !== 'upload') setCoverImage(null)
  }

  const handleCoverFileSelect = async (event) => {
    const file = event.target.files[0]
    if (file) {
      const v = await validateImageDimensions(file, { ...presetOptions('highlight'), allowedTypes: ['image/jpeg','image/png','image/webp'], maxBytes: 6 * 1024 * 1024 })
      if (!v.ok) { setError(v.error || 'Imagem inválida'); return }
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setCoverImagePreview(e.target.result)
      reader.readAsDataURL(file)
      setFormData(prev => ({ ...prev, coverType: 'upload' }))
      setError(null)
    }
  }

  const handleAddPhotos = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx]
      if (!file.type.startsWith('image/')) continue
      const v = await validateImageDimensions(file, { ...presetOptions('highlight'), allowedTypes: ['image/jpeg','image/png','image/webp'], maxBytes: 6 * 1024 * 1024 })
      if (!v.ok) { setError(v.error || 'Imagem inválida'); continue }
      const id = Date.now() + Math.random() + idx
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => [...prev, { id, file, src: e.target.result }])
      }
      reader.readAsDataURL(file)
    }

    event.target.value = null
    setFormData(prev => ({ ...prev, coverType: 'collection' }))
  }

  // Drag and drop handlers for reordering
  const handleDragStart = (index) => (e) => {
    dragItem.current = index
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragEnter = (index) => (e) => {
    dragOverItem.current = index
    e.preventDefault()
  }
  const handleDragOver = (index) => (e) => {
    e.preventDefault()
  }
  const handleDrop = () => {
    const from = dragItem.current
    const to = dragOverItem.current
    if (from === null || to === null || from === to) return
    setPhotos(prev => {
      const temp = [...prev]
      const [moved] = temp.splice(from, 1)
      temp.splice(to, 0, moved)
      return temp
    })
    // adjust coverIndex if needed
    if (from === coverIndex) setCoverIndex(to)
    else if (from < coverIndex && to >= coverIndex) setCoverIndex(coverIndex - 1)
    else if (from > coverIndex && to <= coverIndex) setCoverIndex(coverIndex + 1)
    dragItem.current = null
    dragOverItem.current = null
  }

  // Move photo by explicit position selection
  const movePhotoTo = (index, position) => {
    setPhotos(prev => {
      const temp = [...prev]
      const [item] = temp.splice(index, 1)
      const insertAt = Math.max(0, Math.min(position, temp.length))
      temp.splice(insertAt, 0, item)
      return temp
    })
    if (index === coverIndex) setCoverIndex(position)
  }

  const handleRemovePhoto = (index) => () => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    if (index === coverIndex) setCoverIndex(0)
  }

  const handleSelectCoverFromCollection = (index) => () => {
    setCoverIndex(index)
    setFormData(prev => ({ ...prev, coverType: 'collection' }))
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
    // Allow creating a highlight without auto-publishing stories or uploads

    setLoading(true)
    setError(null)

    try {
      const highlightData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        coverStoryId: formData.coverType === 'story' ? formData.coverStoryId : null,
        coverImage: formData.coverType === 'upload' ? coverImage : null,
        coverFromCollection: formData.coverType === 'collection' ? (photos[coverIndex]?.file || null) : null,
        photos: photos.map(p => p.file)
      }

      await onSave(highlightData)
      onClose()
    } catch (err) {
      console.error('Erro ao criar destaque:', err)
      setError(err.message || 'Erro ao criar destaque. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center sm:items-center p-0">
      <div className="bg-white w-full h-full sm:rounded-xl sm:shadow-xl sm:w-[720px] sm:h-auto max-h-full overflow-hidden flex flex-col">
        {/* Header: back style like screenshot but using app color */}
        <div className="flex items-center px-3 py-3" style={{ backgroundColor: 'var(--vibe-blue, #0ea5a0)', color: 'white' }}>
          <button onClick={onClose} aria-label="Voltar" className="p-2 mr-2">
            <ChevronLeft size={22} className="text-white" />
          </button>
          <h3 className="text-lg font-semibold">{formData.title ? 'Editar destaque' : 'Novo destaque'}</h3>
        </div>

        {/* Body */}
        <div className="overflow-auto p-4 flex-1">
          <div className="space-y-6">
            {/* Cover area */}
            <div className="flex flex-col items-center">
              <div className="w-36 h-64 rounded-md overflow-hidden bg-gray-100 border border-gray-200 relative">
                {coverImagePreview ? (
                  <img src={coverImagePreview} alt="Capa" className="w-full h-full object-cover" />
                ) : photos[coverIndex]?.src ? (
                  <img src={photos[coverIndex].src} alt="Capa" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><Image size={48} /></div>
                )}

                <label htmlFor="cover-upload" className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-full shadow-md cursor-pointer">
                  <Camera size={18} className="text-gray-700" />
                </label>
                <input id="cover-upload" type="file" accept="image/*" onChange={handleCoverFileSelect} className="hidden" />
              </div>
              <div className="mt-2 text-sm text-gray-600">Capa</div>
            </div>

            {/* Title input styled like screenshot */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Título"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-vibe-blue focus:border-transparent"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  ✎
                </div>
              </div>
            </div>

            {/* Collection horizontal scroller */}
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">Coleção</div>
              <div className="flex items-center space-x-3 overflow-x-auto py-2">
                {/* Add tile */}
                <div className="shrink-0 w-28 h-36 rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer">
                  <label htmlFor="add-photos" className="flex flex-col items-center justify-center cursor-pointer">
                    <Plus size={28} className="text-gray-500" />
                    <div className="text-xs text-gray-500 mt-2">Adicionar</div>
                  </label>
                  <input id="add-photos" type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
                </div>

                {photos.map((p, idx) => (
                  <div key={p.id} draggable onDragStart={handleDragStart(idx)} onDragEnter={handleDragEnter(idx)} onDragOver={handleDragOver(idx)} onDrop={handleDrop} className="shrink-0 w-28 h-36 rounded-md overflow-hidden relative border border-gray-200">
                    <img src={p.src} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" onClick={handleSelectCoverFromCollection(idx)} />

                    <div className="absolute top-2 left-2 bg-white bg-opacity-80 rounded-full p-1">
                      <button onClick={handleRemovePhoto(idx)} className="text-red-600 text-sm">✕</button>
                    </div>

                    <div className="absolute bottom-2 right-2">
                      <button onClick={() => movePhotoTo(idx, 0)} title="Mover para primeiro" className="bg-white bg-opacity-80 p-1 rounded mr-1"><ChevronLeft size={14} /></button>
                      <button onClick={() => movePhotoTo(idx, photos.length - 1)} title="Mover para último" className="bg-white bg-opacity-80 p-1 rounded"><ChevronRight size={14} /></button>
                    </div>

                    {/* Selected cover indicator */}
                    {coverIndex === idx && (
                      <div className="absolute top-2 right-2 bg-vibe-blue text-white rounded-full p-1">
                        <Check size={14} />
                      </div>
                    )}

                    {/* position selector */}
                    <div className="absolute left-2 bottom-2 bg-white bg-opacity-90 rounded px-1 text-xs">
                      <select value={idx + 1} onChange={(e) => movePhotoTo(idx, Number(e.target.value) - 1)} className="bg-transparent text-xs">
                        {photos.map((__, i) => (<option key={i} value={i + 1}>{i + 1}</option>))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !formData.title.trim()} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            <span>{loading ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateHighlightModal
