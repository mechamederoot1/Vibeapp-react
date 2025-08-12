import React, { useState } from 'react'

const ReactionSummary = ({ 
  reactionCounts = {}, 
  likesCount = 0, 
  onShowReactors,
  className = "" 
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

  // Mapeamento de reações para emojis
  const reactionEmojis = {
    like: '❤️',
    love: '😍',
    wow: '😮',
    laugh: '😂',
    sad: '😢',
    angry: '😡'
  }

  // Calcular total de reações
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)
  const totalEngagement = totalReactions + likesCount

  // Se não há reações, não mostrar nada
  if (totalEngagement === 0) {
    return null
  }

  // Ordenar reações por contagem (mais populares primeiro)
  const sortedReactions = Object.entries(reactionCounts)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3) // Mostrar no máximo 3 tipos de reação

  // Criar texto do tooltip
  const getTooltipText = () => {
    const parts = []
    
    if (likesCount > 0) {
      parts.push(`${likesCount} curtidas`)
    }
    
    sortedReactions.forEach(([type, count]) => {
      const labels = {
        like: 'curtidas',
        love: 'amei',
        wow: 'uau',
        laugh: 'haha',
        sad: 'triste', 
        angry: 'grr'
      }
      parts.push(`${count} ${labels[type] || type}`)
    })
    
    return parts.join(', ')
  }

  const handleClick = () => {
    if (onShowReactors) {
      onShowReactors()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          flex items-center space-x-1 text-gray-600 hover:text-gray-800 
          transition-colors duration-200 text-sm
          ${onShowReactors ? 'cursor-pointer hover:underline' : 'cursor-default'}
        `}
      >
        {/* Mostrar emojis das reações mais populares */}
        {sortedReactions.length > 0 && (
          <div className="flex -space-x-1">
            {sortedReactions.map(([type], index) => (
              <span
                key={type}
                className="inline-block w-5 h-5 text-xs bg-white rounded-full border border-gray-200 
                          flex items-center justify-center"
                style={{ zIndex: 10 - index }}
              >
                {reactionEmojis[type]}
              </span>
            ))}
          </div>
        )}

        {/* Contador total */}
        <span className="font-medium">
          {totalEngagement > 1000 
            ? `${(totalEngagement / 1000).toFixed(1)}k` 
            : totalEngagement
          }
        </span>

        {/* Texto descritivo */}
        <span className="hidden sm:inline">
          {totalEngagement === 1 ? 'reação' : 'reações'}
        </span>
      </button>

      {/* Tooltip com detalhes */}
      {showTooltip && onShowReactors && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            {getTooltipText()}
            <div className="absolute top-full left-4 -mt-1">
              <div className="w-2 h-2 bg-gray-800 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReactionSummary
