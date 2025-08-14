import React from 'react'
import { getReactionEmoji, REACTION_TYPES } from '../constants/reactions'

const ReactionDisplay = ({ reactionCounts = {}, userReaction, className = "" }) => {
  // Filtrar apenas reações que têm count > 0
  const activeReactions = Object.entries(reactionCounts).filter(([_, count]) => count > 0)
  
  if (activeReactions.length === 0) {
    return null
  }

  // Ordenar pelas reações mais populares
  activeReactions.sort((a, b) => b[1] - a[1])

  const totalReactions = activeReactions.reduce((sum, [_, count]) => sum + count, 0)

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Mostrar até 3 emojis das reações mais populares */}
      <div className="flex -space-x-1">
        {activeReactions.slice(0, 3).map(([reactionType, count]) => (
          <div
            key={reactionType}
            className={`
              w-6 h-6 bg-white rounded-full border-2 border-white flex items-center justify-center text-sm
              ${userReaction === reactionType ? 'ring-2 ring-blue-500' : ''}
            `}
            style={{ backgroundColor: '#f8fafc' }}
          >
            {getReactionEmoji(reactionType)}
          </div>
        ))}
      </div>
      
      {/* Contador total */}
      {totalReactions > 0 && (
        <span className="text-sm text-gray-600 ml-1">
          {totalReactions}
        </span>
      )}
    </div>
  )
}

export default ReactionDisplay
