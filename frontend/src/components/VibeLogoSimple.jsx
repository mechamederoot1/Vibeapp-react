import React from 'react'

const VibeLogoSimple = ({ size = 'md', className = '', showText = true, textColor = '' }) => {
  const sizeClasses = {
    xs: 'text-lg',
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  return (
    <div className={`${className}`}>
      {showText && (
        <h1 className={`font-bold tracking-tight ${sizeClasses[size]} ${textColor || 'bg-gradient-to-r from-vibe-blue to-vibe-blue-dark bg-clip-text text-transparent'}`}>
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
