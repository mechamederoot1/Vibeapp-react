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
    xs: 'w-12 h-12 text-sm',
    sm: 'w-16 h-16 text-base',
    md: 'w-20 h-20 text-lg',
    lg: 'w-28 h-28 text-2xl',
    xl: 'w-36 h-36 text-3xl'
  }

  if (circular) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className={`rounded-full bg-gradient-to-br from-vibe-blue to-vibe-blue-dark shadow-lg flex items-center justify-center ${circularSizes[size]}`}>
          {showText && (
            <h1 className={`font-bold tracking-tight text-white ${sizeClasses[size]}`}>
              V
            </h1>
          )}
        </div>
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

export default VibeLogoSimple
