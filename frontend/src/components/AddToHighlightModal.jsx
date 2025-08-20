import React, { useState, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'

const AddToHighlightModal = ({ isOpen, onClose, onAddToHighlight, onCreateHighlight, highlights = [], storyId }) => {
  const [selectedHighlights, setSelectedHighlights] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [newHighlightName, setNewHighlightName] = useState('')

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedHighlights(new Set())
      setShowCreateNew(false)
      setNewHighlightName('')
    }
  }, [isOpen])

  const handleHighlightToggle = (highlightId) => {
    setSelectedHighlights(prev => {
      const newSet = new Set(prev)
      if (newSet.has(highlightId)) {
        newSet.delete(highlightId)
      } else {
        newSet.add(highlightId)
      }
      return newSet
    })
  }

  const handleAddToHighlights = async () => {
    if (selectedHighlights.size === 0) return

    setLoading(true)
    try {
      // Add story to selected highlights
      for (const highlightId of selectedHighlights) {
        await onAddToHighlight(highlightId, storyId)
      }
      onClose()
    } catch (error) {
      console.error('Erro ao adicionar story aos destaques:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewHighlight = async () => {
    if (!newHighlightName.trim()) return

    setLoading(true)
    try {
      await onCreateHighlight({
        title: newHighlightName.trim(),
        coverStoryId: storyId
      })
      onClose()
    } catch (error) {
      console.error('Erro ao criar novo destaque:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Adicionar aos Destaques</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto">
          {/* Create New Highlight */}
          <div className="p-4 border-b border-gray-100">
            {!showCreateNew ? (
              <button
                onClick={() => setShowCreateNew(true)}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Plus size={20} className="text-gray-400" />
                </div>
                <span className="text-sm font-medium text-gray-700">Criar novo destaque</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full border-2 border-vibe-blue flex items-center justify-center bg-vibe-blue/10">
                    <Plus size={20} className="text-vibe-blue" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newHighlightName}
                      onChange={(e) => setNewHighlightName(e.target.value)}
                      placeholder="Nome do destaque"
                      maxLength={50}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vibe-blue focus:border-transparent text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowCreateNew(false)
                      setNewHighlightName('')
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNewHighlight}
                    disabled={!newHighlightName.trim() || loading}
                    className="px-3 py-1 text-sm bg-vibe-blue text-white rounded-md hover:bg-vibe-blue-dark transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Criando...' : 'Criar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Highlights */}
          {highlights.length > 0 ? (
            <div className="p-4 space-y-2">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Destaques existentes</h3>
              {highlights.map((highlight) => (
                <button
                  key={highlight.id}
                  onClick={() => handleHighlightToggle(highlight.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    selectedHighlights.has(highlight.id)
                      ? 'bg-vibe-blue/10 border border-vibe-blue'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                  disabled={loading}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {highlight.coverImageUrl ? (
                      <img
                        src={highlight.coverImageUrl}
                        alt={highlight.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-bold">
                          {highlight.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{highlight.title}</p>
                    <p className="text-xs text-gray-500">{highlight.storiesCount} stories</p>
                  </div>
                  {selectedHighlights.has(highlight.id) && (
                    <Check size={16} className="text-vibe-blue" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Plus size={24} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">Nenhum destaque criado ainda</p>
              <p className="text-xs text-gray-500">Crie seu primeiro destaque para organizar seus stories</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {highlights.length > 0 && selectedHighlights.size > 0 && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleAddToHighlights}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>
                {loading 
                  ? 'Adicionando...' 
                  : `Adicionar a ${selectedHighlights.size} destaque${selectedHighlights.size > 1 ? 's' : ''}`
                }
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddToHighlightModal
