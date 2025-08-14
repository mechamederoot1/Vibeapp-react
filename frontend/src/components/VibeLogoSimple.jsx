import React from 'react'

const VibeLogoSimple = ({ size = 'md', className = '', showText = true, textColor = '', circular = false }) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  const circularSizes = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  if (circular) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`rounded-full bg-gradient-to-br from-vibe-blue to-vibe-blue-dark shadow-lg flex items-center justify-center ${circularSizes[size]}`}>
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        {showText && (
          <h1 className={`font-bold tracking-tight text-gray-800 ${textSizes[size]}`}>
            Vibe
          </h1>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {showText && (
        <h1 className={`font-bold tracking-tight text-center ${sizeClasses[size]} ${textColor || 'bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent'}`}>
          Vibe
        </h1>
      )}
    </div>
  )
}

// Versão só com o arco (sem texto)
export const VibeArc = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple 
      size={size} 
      className={className} 
      showText={false} 
    />
  )
}

// Versão com texto branco (para fundos escuros)
export const VibeLogoWhite = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple
      size={size}
      className={className}
      textColor="text-white"
    />
  )
}

// Versão circular com fundo azul
export const VibeLogoCircular = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple
      size={size}
      className={className}
      circular={true}
    />
  )
}

// Versão circular apenas com o círculo (sem texto)
export const VibeCircleOnly = ({ size = 'md', className = '' }) => {
  return (
    <VibeLogoSimple
      size={size}
      className={className}
      circular={true}
      showText={false}
    />
  )
}

export default VibeLogoSimple
