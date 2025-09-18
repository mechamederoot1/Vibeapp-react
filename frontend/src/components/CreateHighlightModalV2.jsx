import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Image, Upload, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const CreateHighlightModalV2 = ({ isOpen, onClose, onSave, userStories = [] }) => {
  const [formData, setFormData] = useState({ title: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [coverImage, setCoverImage] = useState(null)
  const [coverImagePreview, setCoverImagePreview] = useState(null)

  const [photos, setPhotos] = useState([])
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', description: '' })
      setCoverImage(null)
      setCoverImagePreview(null)
      setPhotos([])
      setError(null)
    }
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleCoverFileSelect = (event) => {
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
      reader.onload = (e) => setCoverImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleAddPhotos = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    files.forEach((file, idx) => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 10 * 1024 * 1024) return
      const id = Date.now() + Math.random() + idx
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotos(prev => [...prev, { id, file, src: e.target.result }])
      }
      reader.readAsDataURL(file)
    })
    event.target.value = null
  }

  const handleDragStart = (index) => (e) => { dragItem.current = index; e.dataTransfer.effectAllowed = 'move' }
  const handleDragEnter = (index) => (e) => { dragOverItem.current = index; e.preventDefault() }
  const handleDragOver = (index) => (e) => { e.preventDefault() }
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
    dragItem.current = null
    dragOverItem.current = null
  }

  const movePhotoTo = (index, position) => {
    setPhotos(prev => {
      const temp = [...prev]
      const [item] = temp.splice(index, 1)
      const insertAt = Math.max(0, Math.min(position, temp.length))
      temp.splice(insertAt, 0, item)
      return temp
    })
  }

  const handleRemovePhoto = (index) => () => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
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
    if (photos.length === 0 && !coverImage) {
      setError('Adicione pelo menos uma foto ou uma capa')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const highlightData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        coverImage: coverImage || null,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center sm:items-center p-0">
      <div className="bg-white w-full h-full sm:rounded-xl sm:shadow-xl sm:w-[720px] sm:h-auto max-h-full overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Novo Destaque</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Fechar" disabled={loading}><X size={18} className="text-gray-600" /></button>
        </div>

        <div className="overflow-auto p-4 flex-1">
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-28 h-28 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                {coverImagePreview ? <img src={coverImagePreview} alt="Capa" className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-gray-400"><Image size={28} /><span className="text-xs mt-1">Capa</span></div>}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do destaque *</label>
                <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent" placeholder="Ex: Viagens, Trabalho..." value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} maxLength={50} />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/50 caracteres</p>

                <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">Descrição (opcional)</label>
                <textarea className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent resize-none" rows={3} placeholder="Descrição do destaque..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} maxLength={200} />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200 caracteres</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fazer upload de capa</label>
                <div>
                  <input id="cover-upload-v2" type="file" accept="image/*" onChange={handleCoverFileSelect} className="hidden" />
                  <label htmlFor="cover-upload-v2" className="inline-flex items-center px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer"><Upload size={16} className="mr-2 text-gray-600" /> <span className="text-sm text-gray-700">Clique para selecionar uma capa</span></label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coleção de fotos</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
                  <input id="add-photos-v2" type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
                  <label htmlFor="add-photos-v2" className="flex flex-col items-center justify-center cursor-pointer">
                    <div className="w-full h-24 bg-gray-50 rounded-md flex items-center justify-center border border-gray-200">
                      <div className="flex flex-col items-center text-gray-500"><Plus size={28} /><div className="text-sm">Adicionar fotos à coleção</div></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Arraste para reordenar ou use as opções</p>
                  </label>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {photos.map((p, idx) => (
                      <div key={p.id} draggable onDragStart={handleDragStart(idx)} onDragEnter={handleDragEnter(idx)} onDragOver={handleDragOver(idx)} onDrop={handleDrop} className="relative bg-gray-50 rounded-md overflow-hidden w-full h-24 border border-gray-200">
                        <img src={p.src} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 right-1 flex space-x-1">
                          <button onClick={() => movePhotoTo(idx, 0)} title="Mover para primeiro" className="bg-white bg-opacity-70 p-1 rounded text-gray-700 hover:bg-opacity-100"><ChevronLeft size={14} /></button>
                          <button onClick={handleRemovePhoto(idx)} title="Remover" className="bg-white bg-opacity-70 p-1 rounded text-red-600 hover:bg-opacity-100">✕</button>
                          <button onClick={() => movePhotoTo(idx, photos.length - 1)} title="Mover para último" className="bg-white bg-opacity-70 p-1 rounded text-gray-700 hover:bg-opacity-100"><ChevronRight size={14} /></button>
                        </div>
                        <div className="absolute left-1 bottom-1 bg-white bg-opacity-80 rounded px-1 text-xs">
                          <select value={idx + 1} onChange={(e) => movePhotoTo(idx, Number(e.target.value) - 1)} className="bg-transparent text-xs">
                            {photos.map((__, i) => (<option key={i} value={i+1}>{i+1}</option>))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && (<div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-600 text-sm">{error}</p></div>)}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !formData.title.trim()} className="btn-primary flex items-center space-x-2 disabled:opacity-50">{loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}<span>{loading ? 'Criando...' : 'Criar Destaque'}</span></button>
        </div>
      </div>
    </div>
  )
}

export default CreateHighlightModalV2
