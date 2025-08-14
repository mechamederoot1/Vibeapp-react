// Configuração dos tipos de reação
export const REACTION_TYPES = {
  like: {
    id: 'like',
    emoji: '❤️',
    label: 'Curtir',
    color: 'text-red-500'
  },
  laugh: {
    id: 'laugh', 
    emoji: '😂',
    label: 'Haha',
    color: 'text-yellow-500'
  },
  wow: {
    id: 'wow',
    emoji: '😮',
    label: 'Uau',
    color: 'text-blue-500'
  },
  sad: {
    id: 'sad',
    emoji: '😢',
    label: 'Triste',
    color: 'text-blue-600'
  },
  angry: {
    id: 'angry',
    emoji: '😡',
    label: 'Grr',
    color: 'text-red-600'
  },
  love: {
    id: 'love',
    emoji: '🤢',
    label: 'Nojinho',
    color: 'text-green-600'
  }
}

export const getReactionEmoji = (reactionType) => {
  return REACTION_TYPES[reactionType]?.emoji || '❤️'
}

export const getReactionLabel = (reactionType) => {
  return REACTION_TYPES[reactionType]?.label || 'Curtir'
}

export const getReactionColor = (reactionType) => {
  return REACTION_TYPES[reactionType]?.color || 'text-gray-600'
}

// Array ordenado para mostrar na UI
export const REACTION_OPTIONS = [
  REACTION_TYPES.like,
  REACTION_TYPES.laugh,
  REACTION_TYPES.wow,
  REACTION_TYPES.sad,
  REACTION_TYPES.angry,
  REACTION_TYPES.love
]
