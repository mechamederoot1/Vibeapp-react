import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Eye, Heart, Send, Star, Plus } from 'lucide-react'
import { storiesAPI } from '../services/api'
import AddToHighlightModal from './AddToHighlightModal'

const StoryViewer = ({ isOpen, onClose, stories, initialStoryIndex = 0, currentUser, highlights = [], onAddToHighlight, onCreateHighlight }) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setPaused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showHighlightModal, setShowHighlightModal] = useState(false)

  const currentStory = stories[currentIndex]
  const STORY_DURATION = 5000 // 5 segundos por story

  // Sincronizar currentIndex com initialStoryIndex quando abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialStoryIndex || 0)
      setPaused(false) // garante que o viewer comece despausado
      setProgress(0)
    }
  }, [isOpen, initialStoryIndex])

  // Proteger currentIndex quando stories mudar
  useEffect(() => {
    if (!stories || stories.length === 0) return
    if (currentIndex >= stories.length) {
      setCurrentIndex(0)
    }
  }, [stories])

  // Setar loading quando trocar de story
  useEffect(() => {
    if (isOpen && currentStory) {
      setLoading(true)
    }
  }, [currentIndex, stories, isOpen])

  useEffect(() => {
    if (!isOpen || isPaused || !currentStory) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Avançar para próximo story
          handleNext()
          return 0
        }
        return prev + (100 / (STORY_DURATION / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen, isPaused, currentIndex, currentStory])

  useEffect(() => {
    setProgress(0)
  }, [currentIndex])

  useEffect(() => {
    if (isOpen && currentStory && !currentStory.isViewed) {
      // Marcar story como visualizado
      markAsViewed(currentStory.id)
    }
  }, [isOpen, currentStory])

  const markAsViewed = async (storyId) => {
    try {
      await storiesAPI.getStory(storyId)
    } catch (error) {
      console.error('Erro ao marcar story como visualizado:', error)
    }
  }

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleClose = () => {
    setCurrentIndex(0)
    setProgress(0)
    setShowHighlightModal(false)
    setPaused(false) // resetar paused ao fechar
    onClose()
  }

  const handleAddToHighlight = () => {
    setPaused(true)
    setShowHighlightModal(true)
  }

  const handleHighlightModalClose = () => {
    setShowHighlightModal(false)
    setPaused(false)
  }

  // Check if this is the current user's story
  const isOwnStory = currentUser && currentStory?.author?.id === currentUser.id

  if (!isOpen || !currentStory) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          {currentStory.author?.avatar ? (
            <img
              src={currentStory.author.avatar}
              alt={currentStory.author.fullName}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-white flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {currentStory.author?.firstName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-sm">
              {currentStory.author?.fullName || 'Usuário'}
            </p>
            <p className="text-gray-300 text-xs">
              {new Date(currentStory.createdAt).toLocaleString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isOwnStory && (
            <button
              onClick={handleAddToHighlight}
              className="text-white p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
              title="Adicionar aos destaques"
            >
              <Star size={20} />
            </button>
          )}
          <button onClick={handleClose} className="text-white p-2">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Story content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Navigation areas */}
        <div
          className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
          onClick={handlePrevious}
        />
        <div
          className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
          onClick={handleNext}
        />

        {/* Content */}
        {currentStory.type === 'image' && currentStory.mediaUrl ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
          />
        ) : currentStory.type === 'video' && currentStory.mediaUrl ? (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            muted
            className="max-w-full max-h-full object-contain"
            onLoadedData={() => setLoading(false)}
          />
        ) : currentStory.type === 'text' ? (
          <div className={`
            w-full max-w-sm mx-4 p-8 rounded-2xl flex items-center justify-center min-h-[400px]
            ${currentStory.backgroundGradient === 'blue' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
              currentStory.backgroundGradient === 'green' ? 'bg-gradient-to-br from-green-400 to-green-600' :
              currentStory.backgroundGradient === 'purple' ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
              currentStory.backgroundGradient === 'pink' ? 'bg-gradient-to-br from-pink-400 to-pink-600' :
              currentStory.backgroundGradient === 'orange' ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
              currentStory.backgroundGradient === 'red' ? 'bg-gradient-to-br from-red-400 to-red-600' :
              currentStory.backgroundGradient === 'vibe' ? 'bg-gradient-to-br from-vibe-blue to-vibe-blue-dark' :
              currentStory.backgroundGradient === 'sunset' ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600' :
              'bg-gradient-to-br from-gray-800 to-gray-900'}
          `}>
            <p className="text-white text-xl font-medium text-center leading-relaxed break-words">
              {currentStory.content}
            </p>
          </div>
        ) : null}

        {/* Text overlay for media stories */}
        {currentStory.content && (currentStory.type === 'image' || currentStory.type === 'video') && (
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-lg font-medium text-center bg-black bg-opacity-50 rounded-lg p-3">
              {currentStory.content}
            </p>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-4 text-white">
          <div className="flex items-center space-x-1">
            <Eye size={20} />
            <span className="text-sm">{currentStory.viewsCount}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="text-white p-2 bg-black bg-opacity-50 rounded-full"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              onClick={handleNext}
              className="text-white p-2 bg-black bg-opacity-50 rounded-full"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Add to Highlight Modal */}
      <AddToHighlightModal
        isOpen={showHighlightModal}
        onClose={handleHighlightModalClose}
        onAddToHighlight={onAddToHighlight}
        onCreateHighlight={onCreateHighlight}
        highlights={highlights}
        storyId={currentStory?.id}
      />
    </div>
  )
}

export default StoryViewer
