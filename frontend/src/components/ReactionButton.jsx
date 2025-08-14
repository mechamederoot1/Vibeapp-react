import React, { useState, useRef, useEffect } from 'react'
import { Heart } from 'lucide-react'
import ReactionSelector from './ReactionSelector'
import { getReactionEmoji, getReactionColor } from '../constants/reactions'

const ReactionButton = ({ 
  onReactionSelect, 
  onReactionRemove,
  currentReaction = null,
  disabled = false,
  className = ""
}) => {
  const [showSelector, setShowSelector] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSelector(false)
      }
    }

    if (showSelector) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSelector])

  const handleMouseDown = () => {
    if (disabled) return
    
    const timer = setTimeout(() => {
      setShowSelector(true)
    }, 500) // 500ms para long press
    
    setLongPressTimer(timer)
  }

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleClick = () => {
    if (disabled) return
    
    // Se já tem uma reação, remove ou troca
    if (currentReaction) {
      // Click rápido remove a reação atual
      if (!showSelector) {
        onReactionRemove()
      }
    } else {
      // Sem reação atual, adiciona "like" padrão
      onReactionSelect('like')
    }
  }

  const handleReactionSelect = (reactionType) => {
    onReactionSelect(reactionType)
    setShowSelector(false)
  }

  const isReacted = !!currentReaction

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
          ${isReacted 
            ? `${getReactionColor(currentReaction)} bg-red-50 hover:bg-red-100` 
            : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {isReacted ? (
          <span className="text-lg select-none">
            {getReactionEmoji(currentReaction)}
          </span>
        ) : (
          <Heart 
            className={`w-5 h-5 transition-all duration-200 ${
              isReacted ? 'fill-current' : ''
            }`}
          />
        )}
        
        <span className="text-sm font-medium">
          {isReacted ? 'Curtido' : 'Curtir'}
        </span>
      </button>

      <ReactionSelector
        isVisible={showSelector}
        onReactionSelect={handleReactionSelect}
        onClose={() => setShowSelector(false)}
        currentReaction={currentReaction}
      />
    </div>
  )
}

export default ReactionButton
