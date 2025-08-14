import React, { useState } from 'react'
import { REACTION_OPTIONS, getReactionEmoji, getReactionLabel } from '../constants/reactions'

const ReactionSelector = ({ 
  onReactionSelect, 
  currentReaction, 
  isVisible = false,
  onClose,
  className = ""
}) => {
  const [hoveredReaction, setHoveredReaction] = useState(null)

  const handleReactionClick = (reactionType) => {
    onReactionSelect(reactionType)
    onClose()
  }

  if (!isVisible) return null

  return (
    <div 
      className={`absolute bottom-full mb-2 left-0 bg-white rounded-full shadow-lg border border-gray-200 p-2 flex gap-1 z-50 animate-in fade-in duration-200 ${className}`}
      onMouseLeave={() => setHoveredReaction(null)}
    >
      {REACTION_OPTIONS.map((reaction) => (
        <button
          key={reaction.id}
          onClick={() => handleReactionClick(reaction.id)}
          onMouseEnter={() => setHoveredReaction(reaction.id)}
          className={`
            w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:scale-125 hover:bg-gray-50
            ${currentReaction === reaction.id ? 'scale-110 bg-gray-100' : ''}
          `}
          title={reaction.label}
        >
          <span className="text-xl select-none">
            {reaction.emoji}
          </span>
        </button>
      ))}
      
      {/* Tooltip */}
      {hoveredReaction && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {getReactionLabel(hoveredReaction)}
        </div>
      )}
    </div>
  )
}

export default ReactionSelector
