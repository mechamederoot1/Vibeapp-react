import React, { useState, useRef, useEffect } from 'react'
import { Heart } from 'lucide-react'

const ReactionPicker = ({ 
  onReaction, 
  isLiked = false, 
  currentReaction = null,
  likesCount = 0,
  reactionCounts = {},
  className = "",
  disabled = false 
}) => {
  const [showReactions, setShowReactions] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [touchStartTime, setTouchStartTime] = useState(null)
  const [isLongPressing, setIsLongPressing] = useState(false)
  const buttonRef = useRef(null)
  const reactionsRef = useRef(null)

  // Definir as reações disponíveis
  const reactions = [
    { type: 'like', emoji: '❤️', color: '#e91e63', label: 'Curtir' },
    { type: 'love', emoji: '😍', color: '#e91e63', label: 'Amei' },
    { type: 'wow', emoji: '😮', color: '#f57c00', label: 'Uau' },
    { type: 'laugh', emoji: '😂', color: '#f57c00', label: 'Haha' },
    { type: 'sad', emoji: '😢', color: '#2196f3', label: 'Triste' },
    { type: 'angry', emoji: '😡', color: '#f44336', label: 'Grr' }
  ]

  // Fechar reações quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reactionsRef.current && !reactionsRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowReactions(false)
      }
    }

    if (showReactions) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showReactions])

  // Limpar timer quando componente for desmontado
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  const handleMouseDown = (e) => {
    if (disabled) return

    console.log('🖱️ Mouse down - iniciando long press timer')
    setIsLongPressing(true)

    const timer = setTimeout(() => {
      console.log('⏰ Long press detectado - mostrando reações')
      setShowReactions(true)
      setIsLongPressing(false)
    }, 300) // Reduzindo para 300ms para melhor resposta

    setLongPressTimer(timer)
  }

  const handleMouseUp = (e) => {
    console.log('🖱️ Mouse up - timer atual:', !!longPressTimer, 'reações visíveis:', showReactions)

    setIsLongPressing(false)

    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    // Se não mostrou as reações, é um click normal
    if (!showReactions) {
      console.log('👆 Click rápido - executando reação normal')
      handleQuickReaction()
    }
  }

  const handleTouchStart = (e) => {
    if (disabled) return

    console.log('📱 Touch start - iniciando long press timer')
    setTouchStartTime(Date.now())
    setIsLongPressing(true)

    const timer = setTimeout(() => {
      console.log('⏰ Long press touch detectado - mostrando reações')
      setShowReactions(true)
      setIsLongPressing(false)
      // Prevenir o comportamento padrão do toque longo
      e.preventDefault()
    }, 300) // Reduzindo para 300ms

    setLongPressTimer(timer)
  }

  const handleTouchEnd = (e) => {
    console.log('📱 Touch end - timer atual:', !!longPressTimer, 'reações visíveis:', showReactions)

    setIsLongPressing(false)

    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }

    const touchDuration = Date.now() - (touchStartTime || 0)
    console.log('📏 Duração do toque:', touchDuration, 'ms')

    // Se foi um toque rápido (menos que 300ms) e não mostrou reações
    if (touchDuration < 300 && !showReactions) {
      console.log('👆 Touch rápido - executando reação normal')
      handleQuickReaction()
    }
  }

  const handleQuickReaction = () => {
    if (disabled) return
    
    if (currentReaction) {
      // Se já tem reação, remover
      onReaction(null)
    } else {
      // Se não tem reação, adicionar like
      onReaction('like')
    }
  }

  const handleReactionSelect = (reactionType) => {
    if (disabled) return
    
    if (currentReaction === reactionType) {
      // Se clicou na mesma reação, remover
      onReaction(null)
    } else {
      // Adicionar/trocar reação
      onReaction(reactionType)
    }
    setShowReactions(false)
  }

  // Obter a reação atual do usuário
  const getUserReaction = () => {
    if (currentReaction) {
      return reactions.find(r => r.type === currentReaction)
    }
    return null
  }

  const userReaction = getUserReaction()
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className={`relative ${className}`}>
      {/* Botão principal */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()} // Prevenir menu de contexto
        disabled={disabled}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'manipulation'
        }}
        className={`
          hover:scale-110 transition-all duration-200 flex items-center space-x-1
          select-none outline-none focus:outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${userReaction ? 'text-red-500' : 'text-gray-700 hover:text-red-500'}
          ${isLongPressing ? 'scale-125 animate-pulse' : ''}
        `}
      >
        {userReaction ? (
          <span className="text-lg">{userReaction.emoji}</span>
        ) : (
          <Heart 
            size={24} 
            className={currentReaction || isLiked ? 'fill-current' : ''} 
          />
        )}
        {(totalReactions > 0 || likesCount > 0) && (
          <span className="text-sm font-medium">
            {totalReactions > 0 ? totalReactions : likesCount}
          </span>
        )}
      </button>

      {/* Picker de reações */}
      {showReactions && (
        <div
          ref={reactionsRef}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[9999] animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-full shadow-xl border border-gray-200 px-3 py-3 flex space-x-2">
            {reactions.map((reaction, index) => (
              <button
                key={reaction.type}
                onClick={() => handleReactionSelect(reaction.type)}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-2xl
                  hover:scale-125 transform transition-all duration-150
                  hover:bg-gray-100 relative group active:scale-95
                  ${currentReaction === reaction.type ? 'scale-110 bg-gray-100 ring-2 ring-blue-200' : ''}
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'bounceIn 0.3s ease-out forwards'
                }}
                title={reaction.label}
              >
                <span className="select-none">{reaction.emoji}</span>

                {/* Tooltip melhorado */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                              opacity-0 group-hover:opacity-100 transition-opacity duration-200
                              bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap
                              pointer-events-none z-[10000]">
                  {reaction.label}
                  {reactionCounts[reaction.type] > 0 && (
                    <span className="ml-1 font-semibold">({reactionCounts[reaction.type]})</span>
                  )}
                  {/* Seta do tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Seta apontando para baixo */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45 shadow-sm"></div>
          </div>
        </div>
      )}

      {/* Overlay para detectar cliques fora em mobile */}
      {showReactions && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onTouchStart={() => setShowReactions(false)}
        />
      )}
    </div>
  )
}

export default ReactionPicker
